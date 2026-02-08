import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientList } from '@/components/ClientList'
import { ClientsPageShell } from './ClientsPageShell'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface Client {
  id: string
  name: string
  balance: number
  current_rate: number
  updated_at: string
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, balance, current_rate, updated_at')
    .eq('trainer_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
  }

  const clientList = (clients as Client[]) || []

  return (
    <ClientsPageShell>
      {clientList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm lowercase mb-4">
            no clients yet
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider"
          >
            <Plus size={16} strokeWidth={1.5} />
            add your first client
          </Link>
        </div>
      ) : (
        <ClientList clients={clientList} />
      )}
    </ClientsPageShell>
  )
}
