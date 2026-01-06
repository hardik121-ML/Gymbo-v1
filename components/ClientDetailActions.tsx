'use client'

import { NegativeBalanceAlert } from './NegativeBalanceAlert'

interface ClientDetailActionsProps {
  clientId: string
  balance: number
  rate: number
}

export function ClientDetailActions({
  clientId,
  balance,
  rate,
}: ClientDetailActionsProps) {
  const handleLogPaymentClick = () => {
    // Scroll to the payment button and trigger it
    const paymentButton = document.querySelector('[data-log-payment-button]') as HTMLButtonElement
    if (paymentButton) {
      paymentButton.scrollIntoView({ behavior: 'smooth', block: 'center' })
      paymentButton.click()
    }
  }

  return (
    <NegativeBalanceAlert
      balance={balance}
      rate={rate}
      clientId={clientId}
      onLogPaymentClick={handleLogPaymentClick}
    />
  )
}
