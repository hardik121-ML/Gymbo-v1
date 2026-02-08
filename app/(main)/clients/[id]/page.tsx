import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailContent } from './ClientDetailContent'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()

  if (error || !data) {
    redirect('/clients')
  }

  const client = data

  // Fetch initial punches
  const initialLimit = 20
  const { data: punchesData } = await supabase
    .from('punches')
    .select('id, punch_date')
    .eq('client_id', id)
    .eq('is_deleted', false)
    .order('punch_date', { ascending: false })
    .limit(initialLimit)

  const punches = punchesData || []

  const { count: totalPunches } = await supabase
    .from('punches')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
    .eq('is_deleted', false)

  // Fetch audit logs to check which punches were paid with credit
  const punchIds = punches.map(p => p.id)
  let punchAuditData: Array<{ details: unknown }> = []

  if (punchIds.length > 0) {
    const { data } = await supabase
      .from('audit_log')
      .select('details')
      .eq('action', 'PUNCH_ADD')
      .in('details->>punch_id', punchIds)

    punchAuditData = data || []
  }

  const paidWithCreditMap = new Map<string, boolean>()
  for (const audit of punchAuditData) {
    const details = audit.details as Record<string, unknown>
    if (details?.punch_id && details?.paid_with_credit) {
      paidWithCreditMap.set(details.punch_id as string, true)
    }
  }

  const enrichedPunches = punches.map(p => ({
    ...p,
    paid_with_credit: paidWithCreditMap.get(p.id) || false
  }))

  // Fetch recent credit activity
  const { data: creditActivityData } = await supabase
    .from('audit_log')
    .select('action, details, created_at')
    .eq('client_id', id)
    .in('action', ['PAYMENT_ADD', 'PUNCH_ADD'])
    .order('created_at', { ascending: false })
    .limit(5)

  const creditActivity = creditActivityData || []

  const formattedCreditActivity = creditActivity
    .map((activity) => {
      const details = activity.details as Record<string, unknown>
      if (activity.action === 'PAYMENT_ADD' && details?.credit_added && typeof details.credit_added === 'number' && details.credit_added > 0) {
        return {
          type: 'added' as const,
          amount: details.credit_added,
          date: activity.created_at,
          description: 'from payment'
        }
      }
      if (activity.action === 'PUNCH_ADD' && details?.paid_with_credit) {
        return {
          type: 'used' as const,
          amount: client.current_rate,
          date: activity.created_at,
          description: 'for class'
        }
      }
      return null
    })
    .filter(Boolean)
    .slice(0, 5)

  return (
    <ClientDetailContent
      client={client}
      enrichedPunches={enrichedPunches}
      totalPunches={totalPunches || 0}
      creditActivity={formattedCreditActivity}
    />
  )
}
