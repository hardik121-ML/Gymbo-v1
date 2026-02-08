import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExportOptionsPage } from '@/components/ExportOptionsPage'

export default async function AllClientsExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ExportOptionsPage mode="all" />
}
