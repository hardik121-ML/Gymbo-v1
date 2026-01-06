import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { MobileLayout } from '@/components/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentHistoryPage({ params }: PageProps) {
  const { id } = await params

  // Get current session
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // Fetch client details
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .eq('trainer_id', session.trainerId)
    .single()

  if (clientError || !clientData) {
    redirect('/clients')
  }

  const client = clientData

  // Fetch all payments for this client
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id, amount, classes_added, rate_at_payment, payment_date, created_at')
    .eq('client_id', id)
    .order('payment_date', { ascending: false })

  const payments = paymentsData || []

  // Fetch audit logs for these payments to get credit usage info
  const paymentIds = payments.map(p => p.id)
  const { data: auditData } = await supabase
    .from('audit_log')
    .select('details')
    .eq('action', 'PAYMENT_ADD')
    .in('details->>payment_id', paymentIds)

  // Create maps for credit_used and credit_added
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

  // Enrich payments with credit info
  const enrichedPayments = payments.map(p => {
    // Get credit_used from audit log
    const creditUsed = creditUsedMap.get(p.id) || 0

    // Get credit_added from audit log, or calculate it from payment data
    let creditAdded = creditAddedMap.get(p.id)
    if (creditAdded === undefined) {
      // For old payments without audit logs, calculate remainder
      const totalPaid = p.amount + creditUsed
      const totalCost = p.classes_added * p.rate_at_payment
      creditAdded = totalPaid - totalCost
    }

    return {
      ...p,
      credit_used: creditUsed,
      credit_added: creditAdded
    }
  })

  // Calculate totals
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalClasses = payments.reduce((sum, payment) => sum + payment.classes_added, 0)

  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <MobileLayout
      title="Payment History"
      showBackButton={true}
      backHref={`/clients/${id}`}
    >
        {enrichedPayments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">
                No payments recorded
              </h3>
              <p className="text-muted-foreground mb-6">
                Payment history will appear here once you log the first payment
              </p>
              <Link href={`/clients/${id}`}>
                <Button>Back to Client</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Payments List */}
            <Card className="overflow-hidden mb-6">
              {/* Table Header */}
              <div className="bg-muted/50 border-b px-6 py-3">
                <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Classes</div>
                  <div className="text-right">Rate</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {enrichedPayments.map((payment: any) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        {formatDate(payment.payment_date)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.credit_used > 0 && (
                          <div className="text-xs text-blue-500 mt-1">
                            +{formatCurrency(payment.credit_used)} credit used
                          </div>
                        )}
                        {payment.credit_added > 0 && (
                          <div className="text-xs text-green-500 mt-1">
                            +{formatCurrency(payment.credit_added)} credit added
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {payment.classes_added}
                      </div>
                      <div className="text-right text-muted-foreground text-sm">
                        {formatCurrency(payment.rate_at_payment)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              <div className="bg-primary/10 border-t-2 border-primary/20 px-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="font-semibold">
                    Total
                  </div>
                  <div className="text-right font-bold text-lg">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-right font-bold text-lg">
                    {totalClasses} {totalClasses === 1 ? 'class' : 'classes'}
                  </div>
                  <div></div>
                </div>
              </div>
            </Card>
          </>
        )}
    </MobileLayout>
  )
}
