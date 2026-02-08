import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/AppShell'
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
    <AppShell
      title="audit trail"
      showBackButton={true}
      backHref={`/clients/${clientId}`}
    >
      <div className="mb-6">
        <p className="text-xs font-mono lowercase opacity-50 tracking-wider">
          client history: {client.name.toLowerCase()}
        </p>
      </div>

      <AuditTimeline logs={logs} />
    </AppShell>
  )
}
