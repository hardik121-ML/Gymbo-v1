import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, balance, current_rate, credit_balance, updated_at')
    .eq('trainer_id', user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  const clientList = clients || []

  // Fetch monthly stats
  const now = new Date()
  // Use YYYY-MM-DD format for DATE columns
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const firstOfLastMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`

  const clientIds = clientList.map(c => c.id)

  // Only query if there are clients
  let monthlyPunchCount = 0
  let totalEarnings = 0
  let lastMonthEarnings = 0

  if (clientIds.length > 0) {
    const [punchesRes, paymentsRes, lastMonthRes] = await Promise.all([
      supabase
        .from('punches')
        .select('id', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .gte('punch_date', firstOfMonth)
        .in('client_id', clientIds),
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', firstOfMonth)
        .in('client_id', clientIds),
      supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', firstOfLastMonth)
        .lt('payment_date', firstOfMonth)
        .in('client_id', clientIds),
    ])

    monthlyPunchCount = punchesRes.count || 0
    totalEarnings = (paymentsRes.data || []).reduce((sum, p) => sum + p.amount, 0)
    lastMonthEarnings = (lastMonthRes.data || []).reduce((sum, p) => sum + p.amount, 0)
  }

  // Pending = total negative classes across all clients (absolute value)
  const pendingClasses = clientList
    .filter(c => c.balance < 0)
    .reduce((sum, c) => sum + Math.abs(c.balance), 0)

  // Earnings trend (percentage change vs last month)
  let trend: string | undefined
  let isPositive = true
  if (lastMonthEarnings > 0) {
    const change = ((totalEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
    isPositive = change >= 0
    trend = `${isPositive ? '+' : ''}${Math.round(change)}%`
  } else if (totalEarnings > 0) {
    // First month with earnings, or last month had nothing
    trend = '+100%'
    isPositive = true
  }

  return (
    <DashboardContent
      clients={clientList}
      classesDone={monthlyPunchCount}
      classesPending={pendingClasses}
      earnings={totalEarnings}
      trend={trend}
      isPositive={isPositive}
    />
  )
}
