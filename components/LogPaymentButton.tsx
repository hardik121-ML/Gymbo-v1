'use client'

// ============================================================================
// Log Payment Button Component
// ============================================================================
// Button to open payment form modal for logging client payments
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils/currency'
import { SuccessOverlay } from '@/components/SuccessOverlay'

interface LogPaymentButtonProps {
  clientId: string
  clientName: string
  currentBalance: number
  currentRate: number // Rate in paise
  currentCredit: number // Credit balance in paise
}

export function LogPaymentButton({
  clientId,
  clientName,
  currentBalance,
  currentRate,
  currentCredit
}: LogPaymentButtonProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [classesAddedFromResponse, setClassesAddedFromResponse] = useState<number | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [classesAdded, setClassesAdded] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [isManualClasses, setIsManualClasses] = useState(false)
  const [useCredit, setUseCredit] = useState(false)

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Auto-calculate classes when amount or useCredit changes
  useEffect(() => {
    if (!isManualClasses && amount) {
      const amountNum = parseFloat(amount)
      if (!isNaN(amountNum) && amountNum > 0) {
        const rateInRupees = currentRate / 100
        const amountInPaise = Math.round(amountNum * 100)

        // Add credit if checkbox is checked
        const totalAmount = useCredit ? amountInPaise + currentCredit : amountInPaise
        const totalInRupees = totalAmount / 100

        const calculatedClasses = Math.floor(totalInRupees / rateInRupees)
        setClassesAdded(calculatedClasses.toString())
      } else {
        setClassesAdded('')
      }
    }
  }, [amount, currentRate, isManualClasses, useCredit, currentCredit])

  // Calculate new balance preview
  const getNewBalance = () => {
    const classes = parseInt(classesAdded)
    if (!isNaN(classes)) {
      return currentBalance + classes
    }
    return currentBalance
  }

  // Calculate how much credit will be used
  const getCreditUsed = () => {
    if (!useCredit) return 0
    const amountNum = parseFloat(amount)
    const classesNum = parseInt(classesAdded)
    if (!isNaN(amountNum) && !isNaN(classesNum) && amountNum > 0 && classesNum > 0) {
      const amountInPaise = Math.round(amountNum * 100)
      const totalCostOfClasses = classesNum * currentRate
      const creditNeeded = totalCostOfClasses - amountInPaise
      // Use credit up to what's available and what's needed
      return Math.max(0, Math.min(creditNeeded, currentCredit))
    }
    return 0
  }

  // Calculate credit remainder (new credit from this payment)
  const getCreditRemainder = () => {
    const amountNum = parseFloat(amount)
    const classesNum = parseInt(classesAdded)
    if (!isNaN(amountNum) && !isNaN(classesNum) && amountNum > 0 && classesNum >= 0) {
      const amountInPaise = Math.round(amountNum * 100)
      const creditUsed = getCreditUsed()
      const totalPaid = amountInPaise + creditUsed
      const totalCostOfClasses = classesNum * currentRate
      const remainder = totalPaid - totalCostOfClasses
      return remainder
    }
    return 0
  }

  // Calculate new credit total
  const getNewCredit = () => {
    return currentCredit - getCreditUsed() + getCreditRemainder()
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setPaymentDate(getTodayDate())
    setAmount('')
    setClassesAdded('')
    setIsManualClasses(false)
    setUseCredit(false)
    setError(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate amount
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      return
    }

    // Validate classes
    const classesNum = parseInt(classesAdded)
    if (isNaN(classesNum) || classesNum < 0) {
      setError('Classes added cannot be negative')
      return
    }

    // Validate date
    if (!paymentDate) {
      setError('Please select a payment date')
      return
    }

    setIsSubmitting(true)

    try {
      // Convert amount to paise
      const amountInPaise = Math.round(amountNum * 100)
      const creditUsed = getCreditUsed()

      const response = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          classesAdded: classesNum,
          date: paymentDate,
          creditUsed: creditUsed,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to record payment')
        setIsSubmitting(false)
        return
      }

      // Store classes added from response
      setClassesAddedFromResponse(data.payment.classes_added)

      // Show success feedback
      setShowSuccess(true)
      setShowModal(false)

      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Auto-dismiss is handled by SuccessOverlay (2s)
      // Just need to refresh after overlay dismisses
      setIsSubmitting(false)
    } catch (err) {
      console.error('Error logging payment:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const handleSuccessDismiss = () => {
    setShowSuccess(false)
    setClassesAddedFromResponse(null)
    router.refresh()
  }

  const rateInRupees = currentRate / 100

  return (
    <>
      {/* Payment Button */}
      <Button
        variant="outline"
        onClick={handleOpenModal}
        data-log-payment-button
        className="w-full"
      >
        💰 Log Payment
      </Button>

      {/* Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Payment for {clientName}</DialogTitle>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount Received (₹)
              </Label>
              <Input
                type="number"
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                placeholder="e.g., 8000"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Use Credit Balance Checkbox */}
            {currentCredit > 0 && (
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="use-credit"
                    checked={useCredit}
                    onChange={(e) => setUseCredit(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="use-credit" className="flex-1 text-sm font-medium cursor-pointer">
                    Use Credit Balance ({formatCurrency(currentCredit)} available)
                  </label>
                </div>
              </Alert>
            )}

            {/* Classes Added */}
            <div className="space-y-2">
              <Label htmlFor="classes">
                Classes Added
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  id="classes"
                  inputMode="numeric"
                  value={classesAdded}
                  onChange={(e) => {
                    setClassesAdded(e.target.value)
                    setIsManualClasses(true)
                  }}
                  className="text-lg pr-10"
                  placeholder="Auto-calculated"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsManualClasses(false)
                    // Trigger recalculation
                    const amountNum = parseFloat(amount)
                    if (!isNaN(amountNum) && amountNum > 0) {
                      const calculatedClasses = Math.floor(amountNum / rateInRupees)
                      setClassesAdded(calculatedClasses.toString())
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Reset to auto-calculated value"
                >
                  ✎
                </button>
              </div>
              {amount && classesAdded && !useCredit && (
                <p className="text-sm text-muted-foreground">
                  ₹{parseFloat(amount).toLocaleString('en-IN')} ÷ {formatCurrency(currentRate)} = {classesAdded} classes
                </p>
              )}
              {amount && classesAdded && useCredit && getCreditUsed() > 0 && (
                <p className="text-sm text-muted-foreground">
                  (₹{parseFloat(amount).toLocaleString('en-IN')} + {formatCurrency(getCreditUsed())} credit) ÷ {formatCurrency(currentRate)} = {classesAdded} classes
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">
                Payment Date
              </Label>
              <Input
                type="date"
                id="payment-date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                max={getTodayDate()}
                className="text-lg [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
                required
              />
            </div>

            {/* Balance Preview */}
            {classesAdded !== '' && (
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <AlertDescription>
                  <p className="text-sm font-medium mb-2">
                    Payment Summary
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      Balance: {currentBalance} + {classesAdded} = <strong>{getNewBalance()}</strong> classes
                    </p>
                    {useCredit && getCreditUsed() > 0 && (
                      <p className="text-sm">
                        Credit Used: {formatCurrency(getCreditUsed())}
                      </p>
                    )}
                    <p className="text-sm">
                      Credit: {formatCurrency(currentCredit)} {useCredit && getCreditUsed() > 0 ? `- ${formatCurrency(getCreditUsed())}` : ''} {getCreditRemainder() > 0 ? `+ ${formatCurrency(getCreditRemainder())}` : ''} = <strong>{formatCurrency(getNewCredit())}</strong>
                    </p>
                    {useCredit && getCreditUsed() > 0 && (
                      <p className="text-xs text-blue-400 mt-2">
                        ✅ Using {formatCurrency(getCreditUsed())} credit to complete this payment
                      </p>
                    )}
                    {classesAdded === '0' && getCreditRemainder() > 0 && (
                      <p className="text-xs text-blue-400 mt-2">
                        💰 Full amount of {formatCurrency(getCreditRemainder())} will be added as credit
                      </p>
                    )}
                    {classesAdded !== '0' && !useCredit && getCreditRemainder() > 0 && (
                      <p className="text-xs text-blue-400 mt-2">
                        💡 Remainder of {formatCurrency(getCreditRemainder())} will be added as credit
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || !amount || classesAdded === '' || !paymentDate}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Overlay */}
      {showSuccess && classesAddedFromResponse !== null && (
        <SuccessOverlay
          primaryText="payment recorded!"
          secondaryText={`+${classesAddedFromResponse} ${classesAddedFromResponse === 1 ? 'class' : 'classes'} added`}
          onDismiss={handleSuccessDismiss}
        />
      )}
    </>
  )
}
