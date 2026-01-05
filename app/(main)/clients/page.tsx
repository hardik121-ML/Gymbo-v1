import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientList } from '@/components/ClientList'
import { LogoutButton } from '@/components/LogoutButton'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  balance: number
  current_rate: number
  updated_at: string
}

export default async function ClientsPage() {
  // Get current session
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch clients for this trainer
  const supabase = createAdminClient()
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, balance, current_rate, updated_at')
    .eq('trainer_id', session.trainerId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
  }

  const clientList = (clients as Client[]) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gymbo</h1>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Add Client Button */}
        <div className="mb-6">
          <Link
            href="/clients/new"
            className="w-full block bg-blue-600 text-white text-center font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Client
          </Link>
        </div>

        {/* Client List or Empty State */}
        {clientList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No clients yet
            </h2>
            <p className="text-gray-600 mb-6">
              Add your first client to start tracking classes and payments
            </p>
            <Link
              href="/clients/new"
              className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Client
            </Link>
          </div>
        ) : (
          <ClientList clients={clientList} />
        )}
      </main>
    </div>
  )
}
