import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { PunchClassButton } from '@/components/PunchClassButton'
import { PunchListItem } from '@/components/PunchListItem'
import { ClientDetailActions } from '@/components/ClientDetailActions'
import { ClientBalanceCard } from '@/components/ClientBalanceCard'
import { LogPaymentButton } from '@/components/LogPaymentButton'

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

  // Fetch recent punches (last 10)
  const { data: punchesData } = await supabase
    .from('punches')
    .select('id, punch_date')
    .eq('client_id', id)
    .eq('is_deleted', false)
    .order('punch_date', { ascending: false })
    .limit(10)

  const punches = (punchesData as any[]) || []

  // Fetch audit logs to check which punches were paid with credit
  const punchIds = punches.map(p => p.id)
  const { data: punchAuditData } = await supabase
    .from('audit_log')
    .select('details')
    .eq('action', 'PUNCH_ADD')
    .in('details->>punch_id', punchIds)

  // Create map of punch_id to paid_with_credit
  const paidWithCreditMap = new Map()
  if (punchAuditData) {
    for (const audit of punchAuditData as any[]) {
      if (audit.details?.punch_id && audit.details?.paid_with_credit) {
        paidWithCreditMap.set(audit.details.punch_id, true)
      }
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="text-gray-600 hover:text-gray-900 text-xl"
            >
              ←
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              💳 Recent Credit Activity
            </h3>
            <div className="space-y-2">
              {formattedCreditActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800">
                    {activity.type === 'added' ? '+' : '-'}₹{(activity.amount / 100).toFixed(0)} {activity.description}
                  </span>
                  <span className="text-blue-600 text-xs">
                    {new Date(activity.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Balance Alert */}
        <ClientDetailActions
          clientId={client.id}
          balance={client.balance}
          rate={client.current_rate}
        />

        {/* Recent Punches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Classes
          </h2>
          {enrichedPunches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No classes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrichedPunches.map((punch: any) => (
                <PunchListItem
                  key={punch.id}
                  id={punch.id}
                  punchDate={punch.punch_date}
                  paidWithCredit={punch.paid_with_credit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <LogPaymentButton
            clientId={client.id}
            clientName={client.name}
            currentBalance={client.balance}
            currentRate={client.current_rate}
            currentCredit={client.credit_balance || 0}
          />
          <Link
            href={`/clients/${id}/history`}
            className="bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-center"
          >
            📜 View History
          </Link>
          <button
            disabled
            className="bg-gray-100 text-gray-400 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
          >
            📄 Export PDF
          </button>
          <button
            disabled
            className="bg-gray-100 text-gray-400 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
          >
            ✏️ Edit Client
          </button>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <PunchClassButton clientId={client.id} clientName={client.name} />
        </div>
      </div>
    </div>
  )
}
