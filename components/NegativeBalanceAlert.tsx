'use client'

interface NegativeBalanceAlertProps {
  balance: number
  rate: number
  clientId: string
  onLogPaymentClick: () => void
}

export function NegativeBalanceAlert({
  balance,
  rate,
  onLogPaymentClick,
}: NegativeBalanceAlertProps) {
  // Only show if balance is negative
  if (balance >= 0) {
    return null
  }

  const classesOnCredit = Math.abs(balance)
  const amountOwed = classesOnCredit * rate

  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-red-900 font-semibold mb-1">
            {classesOnCredit} {classesOnCredit === 1 ? 'class' : 'classes'} on credit
          </h3>
          <p className="text-red-700 text-sm mb-3">
            Amount due: {formatCurrency(amountOwed)}
          </p>
          <button
            onClick={onLogPaymentClick}
            className="bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Log Payment
          </button>
        </div>
      </div>
    </div>
  )
}
