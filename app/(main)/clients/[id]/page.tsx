import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MobileLayout } from '@/components/MobileLayout'
import { PunchClassButton } from '@/components/PunchClassButton'
import { PunchesListGrouped } from '@/components/PunchesListGrouped'
import { ClientDetailActions } from '@/components/ClientDetailActions'
import { ClientBalanceCard } from '@/components/ClientBalanceCard'
import { PunchCard } from '@/components/PunchCard'
import { LogPaymentButton } from '@/components/LogPaymentButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params

  // Get current user from Supabase Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch client details (RLS automatically filters by user.id)
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()

  if (error || !data) {
    redirect('/clients')
  }

  const client = data

  // Fetch initial punches (first 20 for initial load)
  const initialLimit = 20
  const { data: punchesData } = await supabase
    .from('punches')
    .select('id, punch_date')
    .eq('client_id', id)
    .eq('is_deleted', false)
    .order('punch_date', { ascending: false })
    .limit(initialLimit)

  const punches = punchesData || []

  // Get total count for pagination
  const { count: totalPunches } = await supabase
    .from('punches')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
    .eq('is_deleted', false)

  // Fetch audit logs to check which punches were paid with credit
  const punchIds = punches.map(p => p.id)
  let punchAuditData: Array<{ details: unknown }> = []

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
  const paidWithCreditMap = new Map<string, boolean>()
  for (const audit of punchAuditData) {
    const details = audit.details as Record<string, unknown>
    if (details?.punch_id && details?.paid_with_credit) {
      paidWithCreditMap.set(details.punch_id as string, true)
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

  const creditActivity = creditActivityData || []

  // Filter and format credit activity
  const formattedCreditActivity = creditActivity
    .map((activity) => {
      const details = activity.details as Record<string, unknown>
      if (activity.action === 'PAYMENT_ADD' && details?.credit_added && typeof details.credit_added === 'number' && details.credit_added > 0) {
        return {
          type: 'added' as const,
          amount: details.credit_added,
          date: activity.created_at,
          description: 'from payment'
        }
      }
      if (activity.action === 'PUNCH_ADD' && details?.paid_with_credit) {
        return {
          type: 'used' as const,
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
    <>
      <MobileLayout
        title={client.name}
        showBackButton={true}
        backHref="/clients"
      >
        {/* Balance Card */}
        <ClientBalanceCard
          balance={client.balance}
          rate={client.current_rate}
          creditBalance={client.credit_balance || 0}
        />

        {/* Punch Card Visual */}
        <PunchCard
          balance={client.balance}
          clientId={client.id}
          className="mb-6"
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
              💳 Payments
            </Button>
          </Link>
          <Link href={`/clients/${id}/audit`}>
            <Button variant="outline" className="w-full">
              📜 Full History
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
      </MobileLayout>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg z-20">
        <div className="max-w-3xl mx-auto">
          <PunchClassButton clientId={client.id} clientName={client.name} />
        </div>
      </div>
    </>
  )
}
