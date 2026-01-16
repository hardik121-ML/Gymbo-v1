'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'

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

  return (
    <Alert variant="destructive" className="mb-6 border-2">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <AlertDescription className="flex-1">
          <h3 className="font-semibold mb-1">
            {classesOnCredit} {classesOnCredit === 1 ? 'class' : 'classes'} on credit
          </h3>
          <p className="text-sm mb-3">
            Amount due: {formatCurrency(amountOwed)}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={onLogPaymentClick}
          >
            Log Payment
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  )
}
