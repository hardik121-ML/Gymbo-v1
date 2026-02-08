import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils/currency'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentHistoryPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .eq('trainer_id', user.id)
    .single()

  if (clientError || !clientData) {
    redirect('/clients')
  }

  const client = clientData

  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id, amount, classes_added, rate_at_payment, payment_date, created_at')
    .eq('client_id', id)
    .order('payment_date', { ascending: false })

  const payments = paymentsData || []

  // Fetch audit logs for credit info
  const paymentIds = payments.map(p => p.id)
  const { data: auditData } = await supabase
    .from('audit_log')
    .select('details')
    .eq('action', 'PAYMENT_ADD')
    .in('details->>payment_id', paymentIds)

  const creditUsedMap = new Map<string, number>()
  const creditAddedMap = new Map<string, number>()
  if (auditData) {
    for (const audit of auditData) {
      const details = audit.details as Record<string, unknown>
      if (details?.payment_id && typeof details.payment_id === 'string') {
        if (details?.credit_used && typeof details.credit_used === 'number') {
          creditUsedMap.set(details.payment_id, details.credit_used)
        }
        if (details?.credit_added !== undefined && typeof details.credit_added === 'number') {
          creditAddedMap.set(details.payment_id, details.credit_added)
        }
      }
    }
  }

  const enrichedPayments = payments.map(p => {
    const creditUsed = creditUsedMap.get(p.id) || 0
    let creditAdded = creditAddedMap.get(p.id)
    if (creditAdded === undefined) {
      const totalPaid = p.amount + creditUsed
      const totalCost = p.classes_added * p.rate_at_payment
      creditAdded = totalPaid - totalCost
    }
    return { ...p, credit_used: creditUsed, credit_added: creditAdded }
  })

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalClasses = payments.reduce((sum, payment) => sum + payment.classes_added, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <AppShell
      title="payment history"
      showBackButton={true}
      backHref={`/clients/${id}`}
    >
      <div className="mb-6">
        <p className="text-xs font-mono lowercase opacity-50 tracking-wider">
          {client.name.toLowerCase()}
        </p>
      </div>

      {enrichedPayments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm lowercase">
            no payments recorded yet
          </p>
        </div>
      ) : (
        <>
          {/* Payment List */}
          <div className="space-y-0">
            {enrichedPayments.map((payment: typeof enrichedPayments[0], index: number) => (
              <div
                key={payment.id}
                className={`py-4 ${index !== enrichedPayments.length - 1 ? 'border-b border-foreground/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-sm">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs font-mono opacity-40 mt-1 lowercase">
                      +{payment.classes_added} {payment.classes_added === 1 ? 'class' : 'classes'} at {formatCurrency(payment.rate_at_payment)}
                    </p>
                    {payment.credit_used > 0 && (
                      <p className="text-xs text-primary mt-1 lowercase">
                        +{formatCurrency(payment.credit_used)} credit used
                      </p>
                    )}
                    {payment.credit_added > 0 && (
                      <p className="text-xs text-status-healthy mt-1 lowercase">
                        +{formatCurrency(payment.credit_added)} credit added
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-mono opacity-50 whitespace-nowrap">
                    {formatDate(payment.payment_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-foreground/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono lowercase opacity-50 tracking-wider">total</span>
              <div className="text-right">
                <p className="font-bold text-lg font-mono">{formatCurrency(totalAmount)}</p>
                <p className="text-xs font-mono opacity-40">{totalClasses} {totalClasses === 1 ? 'class' : 'classes'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
