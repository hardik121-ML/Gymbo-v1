import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsContent } from './SettingsContent'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: trainer } = await supabase
    .from('trainers')
    .select('name')
    .eq('id', user.id)
    .single()

  return <SettingsContent trainerName={trainer?.name || ''} />
}
