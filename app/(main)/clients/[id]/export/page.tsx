import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExportOptionsPage } from '@/components/ExportOptionsPage'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientExportPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()

  if (error || !client) {
    redirect('/clients')
  }

  return <ExportOptionsPage mode="single" clientId={client.id} clientName={client.name} />
}
