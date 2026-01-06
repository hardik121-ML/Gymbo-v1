'use client'

// ============================================================================
// Log Payment Button Component
// ============================================================================
// Button to open payment form modal for logging client payments
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    if (!isNaN(amountNum) && !isNaN(classesNum) && amountNum > 0 && classesNum > 0) {
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
    if (isNaN(classesNum) || classesNum <= 0) {
      setError('Classes added must be at least 1')
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

      // Show success feedback
      setShowSuccess(true)
      setShowModal(false)

      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Wait for animation then refresh
      setTimeout(() => {
        router.refresh()
        setShowSuccess(false)
        setIsSubmitting(false)
      }, 1500)
    } catch (err) {
      console.error('Error logging payment:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  const rateInRupees = currentRate / 100

  return (
    <>
      {/* Payment Button */}
      <button
        onClick={handleOpenModal}
        data-log-payment-button
        className="bg-white text-gray-700 border border-gray-300 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        💰 Log Payment
      </button>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl md:rounded-2xl rounded-t-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Log Payment for {clientName}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 8000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Use Credit Balance Checkbox */}
              {currentCredit > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <input
                    type="checkbox"
                    id="use-credit"
                    checked={useCredit}
                    onChange={(e) => setUseCredit(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="use-credit" className="flex-1 text-sm font-medium text-gray-900 cursor-pointer">
                    Use Credit Balance (₹{(currentCredit / 100).toFixed(0)} available)
                  </label>
                </div>
              )}

              {/* Classes Added */}
              <div>
                <label htmlFor="classes" className="block text-sm font-medium text-gray-700 mb-2">
                  Classes Added
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="classes"
                    inputMode="numeric"
                    value={classesAdded}
                    onChange={(e) => {
                      setClassesAdded(e.target.value)
                      setIsManualClasses(true)
                    }}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Auto-calculated"
                    min="1"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Reset to auto-calculated value"
                  >
                    ✎
                  </button>
                </div>
                {amount && classesAdded && !useCredit && (
                  <p className="mt-2 text-sm text-gray-600">
                    ₹{amount} ÷ ₹{rateInRupees.toFixed(0)} = {classesAdded} classes
                  </p>
                )}
                {amount && classesAdded && useCredit && getCreditUsed() > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    (₹{amount} + ₹{(getCreditUsed() / 100).toFixed(0)} credit) ÷ ₹{rateInRupees.toFixed(0)} = {classesAdded} classes
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  id="payment-date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={getTodayDate()}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Balance Preview */}
              {classesAdded && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Payment Summary
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-800">
                      Balance: {currentBalance} + {classesAdded} = <strong>{getNewBalance()}</strong> classes
                    </p>
                    {useCredit && getCreditUsed() > 0 && (
                      <p className="text-sm text-blue-800">
                        Credit Used: ₹{(getCreditUsed() / 100).toFixed(0)}
                      </p>
                    )}
                    <p className="text-sm text-blue-800">
                      Credit: ₹{(currentCredit / 100).toFixed(0)} {useCredit && getCreditUsed() > 0 ? `- ₹${(getCreditUsed() / 100).toFixed(0)}` : ''} {getCreditRemainder() > 0 ? `+ ₹${(getCreditRemainder() / 100).toFixed(0)}` : ''} = <strong>₹{(getNewCredit() / 100).toFixed(0)}</strong>
                    </p>
                    {useCredit && getCreditUsed() > 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        ✅ Using ₹{(getCreditUsed() / 100).toFixed(0)} credit to complete this payment
                      </p>
                    )}
                    {!useCredit && getCreditRemainder() > 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        💡 Remainder of ₹{(getCreditRemainder() / 100).toFixed(0)} will be added as credit
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || !classesAdded || !paymentDate}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Feedback */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-scale-in">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Recorded!
            </h3>
            <p className="text-gray-600">
              Balance updated successfully
            </p>
          </div>
        </div>
      )}

      {/* Add animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
