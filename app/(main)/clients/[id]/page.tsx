import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { BalanceIndicator } from '@/components/BalanceIndicator'
import { PunchClassButton } from '@/components/PunchClassButton'
import { LogPaymentButton } from '@/components/LogPaymentButton'
import { PunchListItem } from '@/components/PunchListItem'

interface PageProps {
  params: Promise<{ id: string }>
}

function getBalanceStatusText(balance: number): string {
  if (balance < 0) {
    const classes = Math.abs(balance)
    return `${classes} ${classes === 1 ? 'class' : 'classes'} on credit`
  }
  if (balance === 0) {
    return 'No classes remaining'
  }
  return `${balance} ${balance === 1 ? 'class' : 'classes'} remaining`
}

function getBalanceColor(balance: number): string {
  if (balance < 0) return 'text-red-600'
  if (balance <= 3) return 'text-yellow-600'
  return 'text-green-600'
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BalanceIndicator balance={client.balance} size="lg" />
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Balance
            </p>
          </div>
          <div className={`text-6xl font-bold mb-2 ${getBalanceColor(client.balance)}`}>
            {client.balance}
          </div>
          <p className="text-lg text-gray-600 mb-4">
            {getBalanceStatusText(client.balance)}
          </p>
          <p className="text-sm text-gray-500">
            Rate: ₹{(client.current_rate / 100).toFixed(0)} per class
          </p>
        </div>

        {/* Recent Punches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Classes
          </h2>
          {punches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No classes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {punches.map((punch: any) => (
                <PunchListItem
                  key={punch.id}
                  id={punch.id}
                  punchDate={punch.punch_date}
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
          />
          <button
            disabled
            className="bg-gray-100 text-gray-400 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
          >
            📜 View History
          </button>
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
