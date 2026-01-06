import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClientList } from '@/components/ClientList'
import { MobileLayout } from '@/components/MobileLayout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
    <MobileLayout title="Gymbo" showLogout={true}>
      {/* Add Client Button */}
      <div className="mb-6">
        <Link href="/clients/new" className="block">
          <Button className="w-full" size="lg">
            + Add Client
          </Button>
        </Link>
      </div>

      {/* Client List or Empty State */}
      {clientList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-xl font-semibold mb-2">
              No clients yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Add your first client to start tracking classes and payments
            </p>
            <Link href="/clients/new">
              <Button size="lg">
                Add Your First Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ClientList clients={clientList} />
      )}
    </MobileLayout>
  )
}
