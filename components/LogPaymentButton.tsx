'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NumericKeypad } from '@/components/NumericKeypad'
import { formatCurrency } from '@/lib/utils/currency'
import { SuccessOverlay } from '@/components/SuccessOverlay'
import { CreditCard, Check, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [showDetails, setShowDetails] = useState(false)

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Auto-calculate classes when amount or useCredit changes
  useEffect(() => {
    if (!isManualClasses && amount) {
      const amountNum = parseFloat(amount)
      if (!isNaN(amountNum) && amountNum > 0) {
        const amountInPaise = Math.round(amountNum * 100)
        const totalPaise = useCredit ? amountInPaise + currentCredit : amountInPaise
        const calculatedClasses = Math.floor(totalPaise / currentRate)
        setClassesAdded(calculatedClasses.toString())
      } else {
        setClassesAdded('')
      }
    }
  }, [amount, currentRate, isManualClasses, useCredit, currentCredit])

  const getNewBalance = () => {
    const classes = parseInt(classesAdded)
    if (!isNaN(classes)) return currentBalance + classes
    return currentBalance
  }

  const getCreditUsed = () => {
    if (!useCredit) return 0
    const amountNum = parseFloat(amount)
    const classesNum = parseInt(classesAdded)
    if (!isNaN(amountNum) && !isNaN(classesNum) && amountNum > 0 && classesNum > 0) {
      const amountInPaise = Math.round(amountNum * 100)
      const totalCostOfClasses = classesNum * currentRate
      const creditNeeded = totalCostOfClasses - amountInPaise
      return Math.max(0, Math.min(creditNeeded, currentCredit))
    }
    return 0
  }

  const getCreditRemainder = () => {
    const amountNum = parseFloat(amount)
    const classesNum = parseInt(classesAdded)
    if (!isNaN(amountNum) && !isNaN(classesNum) && amountNum > 0 && classesNum >= 0) {
      const amountInPaise = Math.round(amountNum * 100)
      const creditUsed = getCreditUsed()
      const totalPaid = amountInPaise + creditUsed
      const totalCostOfClasses = classesNum * currentRate
      return totalPaid - totalCostOfClasses
    }
    return 0
  }

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
    setShowDetails(false)
    setError(null)
  }

  const handleKeyPress = (digit: string) => {
    if (digit === '.' && amount.includes('.')) return
    if (digit === '.' && amount === '') {
      setAmount('0.')
      return
    }
    // Limit decimal places to 2
    if (amount.includes('.')) {
      const decimalPart = amount.split('.')[1]
      if (decimalPart && decimalPart.length >= 2) return
    }
    setAmount(prev => prev + digit)
  }

  const handleKeyDelete = () => {
    setAmount(prev => prev.slice(0, -1))
  }

  const handleSubmit = async () => {
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('enter a valid amount')
      return
    }

    const classesNum = parseInt(classesAdded)
    if (isNaN(classesNum) || classesNum < 0) {
      setError('classes cannot be negative')
      return
    }

    if (!paymentDate) {
      setError('select a payment date')
      return
    }

    setIsSubmitting(true)

    try {
      const amountInPaise = Math.round(amountNum * 100)
      const creditUsed = getCreditUsed()

      const response = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          classesAdded: classesNum,
          date: paymentDate,
          creditUsed: creditUsed,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'failed to record payment')
        setIsSubmitting(false)
        return
      }

      setClassesAddedFromResponse(data.payment.classes_added)
      setShowSuccess(true)
      setShowModal(false)

      if (navigator.vibrate) navigator.vibrate(50)
      setIsSubmitting(false)
    } catch (err) {
      console.error('Error logging payment:', err)
      setError('an unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const handleSuccessDismiss = () => {
    setShowSuccess(false)
    setClassesAddedFromResponse(null)
    router.refresh()
  }

  const displayAmount = amount || '0'

  return (
    <>
      {/* Quick Action Button */}
      <button
        onClick={handleOpenModal}
        data-log-payment-button
        className="flex flex-col items-center gap-2 group"
      >
        <div className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
          <CreditCard size={24} strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-mono opacity-50 lowercase group-hover:opacity-100 transition-opacity">
          pay
        </span>
      </button>

      {/* Full-screen Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col screen-enter">
          {/* Header */}
          <div className="flex items-center justify-between px-6 h-16">
            <button
              onClick={() => setShowModal(false)}
              className="text-sm font-mono lowercase opacity-60 hover:opacity-100 transition-opacity"
            >
              cancel
            </button>
            <h1 className="text-sm font-bold tracking-[0.2em] lowercase text-foreground/80">
              record payment
            </h1>
            <div className="w-12" />
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center px-6 overflow-y-auto">
            {/* Amount Display */}
            <div className="mt-4 mb-2">
              <p className="text-[10px] font-mono lowercase opacity-40 tracking-wider text-center mb-2">
                total amount
              </p>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold font-mono opacity-40">₹</span>
                <span className="text-6xl font-bold font-mono">{displayAmount}</span>
              </div>
            </div>

            {/* Client Chip */}
            <div className="border border-foreground/20 rounded-full px-4 py-2 mb-4">
              <span className="text-xs font-mono lowercase tracking-wider opacity-60">
                client: {clientName.toLowerCase()}
              </span>
            </div>

            {/* Auto-calculated info */}
            {amount && classesAdded && (
              <p className="text-xs font-mono lowercase opacity-40 mb-2">
                = {classesAdded} {parseInt(classesAdded) === 1 ? 'class' : 'classes'} at {formatCurrency(currentRate)}/class
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-full mb-4">
                {error}
              </p>
            )}

            {/* Expandable Details */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-[10px] font-mono lowercase opacity-40 hover:opacity-70 transition-opacity mb-4"
            >
              details {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showDetails && (
              <div className="w-full max-w-[320px] space-y-4 mb-4">
                {/* Credit Toggle */}
                {currentCredit > 0 && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCredit}
                      onChange={(e) => setUseCredit(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-xs font-mono lowercase opacity-60">
                      use credit ({formatCurrency(currentCredit)})
                    </span>
                  </label>
                )}

                {/* Date */}
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="opacity-40" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={getTodayDate()}
                    className="bg-transparent border-b border-foreground/20 text-sm font-mono py-1 focus:border-foreground outline-none"
                  />
                </div>

                {/* Summary */}
                {classesAdded !== '' && (
                  <div className="text-xs font-mono lowercase opacity-50 space-y-1 border-t border-foreground/10 pt-3">
                    <p>balance: {currentBalance} + {classesAdded} = {getNewBalance()} classes</p>
                    {useCredit && getCreditUsed() > 0 && (
                      <p className="text-primary">credit used: {formatCurrency(getCreditUsed())}</p>
                    )}
                    <p>credit: {formatCurrency(getNewCredit())}</p>
                    {getCreditRemainder() > 0 && (
                      <p className="text-status-healthy">+{formatCurrency(getCreditRemainder())} credit added</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Keypad */}
            <div className="mt-auto mb-4">
              <NumericKeypad
                onPress={handleKeyPress}
                onDelete={handleKeyDelete}
                showDecimal={true}
              />
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || amount === '0' || classesAdded === ''}
              className="w-full max-w-[320px] h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider flex items-center justify-center gap-2 mb-8 disabled:opacity-30 transition-opacity"
            >
              <Check size={18} strokeWidth={2} />
              {isSubmitting ? 'saving...' : 'confirm payment'}
            </button>
          </div>
        </div>
      )}

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
