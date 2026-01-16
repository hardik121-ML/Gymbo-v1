import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileLayout } from '@/components/MobileLayout'
import { AuditTimeline } from '@/components/AuditTimeline'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientAuditPage({ params }: PageProps) {
  const { id: clientId } = await params

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch client to verify ownership and get name
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, name, trainer_id')
    .eq('id', clientId)
    .eq('trainer_id', user.id)
    .single()

  if (clientError || !client) {
    redirect('/clients')
  }

  // Fetch all audit log entries for this client
  const { data: auditLogs, error: auditError } = await supabase
    .from('audit_log')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (auditError) {
    console.error('Error fetching audit logs:', auditError)
  }

  const logs = auditLogs || []

  return (
    <MobileLayout
      title="History"
      showBackButton={true}
      backHref={`/clients/${clientId}`}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{client.name}</h2>
        <p className="text-sm text-muted-foreground">Complete activity timeline</p>
      </div>

      <AuditTimeline logs={logs} />
    </MobileLayout>
  )
}
