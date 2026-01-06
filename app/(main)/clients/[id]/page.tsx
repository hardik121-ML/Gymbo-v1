import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { PunchClassButton } from '@/components/PunchClassButton'
import { PunchesListGrouped } from '@/components/PunchesListGrouped'
import { ClientDetailActions } from '@/components/ClientDetailActions'
import { ClientBalanceCard } from '@/components/ClientBalanceCard'
import { LogPaymentButton } from '@/components/LogPaymentButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params

  // Get current session
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch client details
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', session.trainerId)
    .single()

  if (error || !data) {
    redirect('/clients')
  }

  // Type assertion workaround for Supabase types
  const client = data as any

  // Fetch initial punches (first 20 for initial load)
  const initialLimit = 20
  const { data: punchesData } = await supabase
    .from('punches')
    .select('id, punch_date')
    .eq('client_id', id)
    .eq('is_deleted', false)
    .order('punch_date', { ascending: false })
    .limit(initialLimit)

  const punches = (punchesData as any[]) || []

  // Get total count for pagination
  const { count: totalPunches } = await supabase
    .from('punches')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
    .eq('is_deleted', false)

  // Fetch audit logs to check which punches were paid with credit
  const punchIds = punches.map(p => p.id)
  let punchAuditData: any[] = []

  // Only query audit logs if there are punches
  if (punchIds.length > 0) {
    const { data } = await supabase
      .from('audit_log')
      .select('details')
      .eq('action', 'PUNCH_ADD')
      .in('details->>punch_id', punchIds)

    punchAuditData = data || []
  }

  // Create map of punch_id to paid_with_credit
  const paidWithCreditMap = new Map()
  for (const audit of punchAuditData as any[]) {
    if (audit.details?.punch_id && audit.details?.paid_with_credit) {
      paidWithCreditMap.set(audit.details.punch_id, true)
    }
  }

  // Enrich punches with credit info
  const enrichedPunches = punches.map(p => ({
    ...p,
    paid_with_credit: paidWithCreditMap.get(p.id) || false
  }))

  // Fetch recent credit activity (last 5 transactions)
  const { data: creditActivityData } = await supabase
    .from('audit_log')
    .select('action, details, created_at')
    .eq('client_id', id)
    .in('action', ['PAYMENT_ADD', 'PUNCH_ADD'])
    .order('created_at', { ascending: false })
    .limit(5)

  const creditActivity = (creditActivityData as any[]) || []

  // Filter and format credit activity
  const formattedCreditActivity = creditActivity
    .map((activity: any) => {
      if (activity.action === 'PAYMENT_ADD' && activity.details?.credit_added > 0) {
        return {
          type: 'added',
          amount: activity.details.credit_added,
          date: activity.created_at,
          description: 'from payment'
        }
      }
      if (activity.action === 'PUNCH_ADD' && activity.details?.paid_with_credit) {
        return {
          type: 'used',
          amount: client.current_rate, // Rate used for punch
          date: activity.created_at,
          description: 'for class'
        }
      }
      return null
    })
    .filter(Boolean)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="text-muted-foreground hover:text-foreground text-xl"
            >
              ←
            </Link>
            <h1 className="text-xl font-bold">{client.name}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {/* Balance Card */}
        <ClientBalanceCard
          balance={client.balance}
          rate={client.current_rate}
          creditBalance={client.credit_balance || 0}
        />

        {/* Credit Activity Summary */}
        {client.credit_balance > 0 && formattedCreditActivity.length > 0 && (
          <Alert className="mb-6">
            <AlertDescription>
              <h3 className="text-sm font-semibold mb-3">
                💳 Recent Credit Activity
              </h3>
              <div className="space-y-2">
                {formattedCreditActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>
                      {activity.type === 'added' ? '+' : '-'}₹{(activity.amount / 100).toFixed(0)} {activity.description}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(activity.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Negative Balance Alert */}
        <ClientDetailActions
          clientId={client.id}
          balance={client.balance}
          rate={client.current_rate}
        />

        {/* Recent Punches */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Classes History
            </h2>
            <PunchesListGrouped
              clientId={client.id}
              initialPunches={enrichedPunches}
              initialTotal={totalPunches || 0}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <LogPaymentButton
            clientId={client.id}
            clientName={client.name}
            currentBalance={client.balance}
            currentRate={client.current_rate}
            currentCredit={client.credit_balance || 0}
          />
          <Link href={`/clients/${id}/history`}>
            <Button variant="outline" className="w-full">
              📜 View History
            </Button>
          </Link>
          <Link href={`/clients/${id}/change-rate`}>
            <Button variant="outline" className="w-full">
              💰 Change Rate
            </Button>
          </Link>
          <Link href={`/clients/${id}/edit`}>
            <Button variant="outline" className="w-full">
              ✏️ Edit Client
            </Button>
          </Link>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <PunchClassButton clientId={client.id} clientName={client.name} />
        </div>
      </div>
    </div>
  )
}
