import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

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

  const client = clientData as any

  // Fetch all payments for this client
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id, amount, classes_added, rate_at_payment, payment_date, created_at')
    .eq('client_id', id)
    .order('payment_date', { ascending: false })

  const payments = (paymentsData as any[]) || []

  // Fetch audit logs for these payments to get credit usage info
  const paymentIds = payments.map(p => p.id)
  const { data: auditData } = await supabase
    .from('audit_log')
    .select('details')
    .eq('action', 'PAYMENT_ADD')
    .in('details->>payment_id', paymentIds)

  // Create a map of payment_id to credit_used
  const creditUsedMap = new Map()
  if (auditData) {
    for (const audit of auditData as any[]) {
      if (audit.details?.payment_id && audit.details?.credit_used) {
        creditUsedMap.set(audit.details.payment_id, audit.details.credit_used)
      }
    }
  }

  // Enrich payments with credit_used info
  const enrichedPayments = payments.map(p => ({
    ...p,
    credit_used: creditUsedMap.get(p.id) || 0
  }))

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${id}`}
              className="text-gray-600 hover:text-gray-900 text-xl"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payment History</h1>
              <p className="text-sm text-gray-500">{client.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {enrichedPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No payments recorded
            </h3>
            <p className="text-gray-500 mb-6">
              Payment history will appear here once you log the first payment
            </p>
            <Link
              href={`/clients/${id}`}
              className="inline-block bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Client
            </Link>
          </div>
        ) : (
          <>
            {/* Payments List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Classes</div>
                  <div className="text-right">Rate</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {enrichedPayments.map((payment: any) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-gray-900">
                        {formatDate(payment.payment_date)}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.credit_used > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            +{formatCurrency(payment.credit_used)} credit
                          </div>
                        )}
                      </div>
                      <div className="text-right text-gray-700">
                        {payment.classes_added}
                      </div>
                      <div className="text-right text-gray-500 text-sm">
                        {formatCurrency(payment.rate_at_payment)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Footer */}
              <div className="bg-blue-50 border-t-2 border-blue-200 px-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="font-semibold text-gray-900">
                    Total
                  </div>
                  <div className="text-right font-bold text-blue-900 text-lg">
                    {formatCurrency(totalAmount)}
                  </div>
                  <div className="text-right font-bold text-blue-900 text-lg">
                    {totalClasses} {totalClasses === 1 ? 'class' : 'classes'}
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
