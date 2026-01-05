'use client'

// ============================================================================
// Punch Class Button Component
// ============================================================================
// Primary action button to record a class for a client
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PunchClassButtonProps {
  clientId: string
  clientName: string
}

export function PunchClassButton({ clientId, clientName }: PunchClassButtonProps) {
  const router = useRouter()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [isPunching, setIsPunching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get date 3 months ago in YYYY-MM-DD format
  const getMinDate = () => {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return threeMonthsAgo.toISOString().split('T')[0]
  }

  const handlePunchClick = () => {
    setSelectedDate(getTodayDate())
    setShowDatePicker(true)
    setError(null)
  }

  const handleConfirmPunch = async () => {
    if (!selectedDate) {
      setError('Please select a date')
      return
    }

    setIsPunching(true)
    setError(null)

    try {
      const response = await fetch(`/api/clients/${clientId}/punches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to record class')
        setIsPunching(false)
        return
      }

      // Show success feedback
      setShowSuccess(true)
      setShowDatePicker(false)

      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Wait for animation then refresh
      setTimeout(() => {
        router.refresh()
        setShowSuccess(false)
        setIsPunching(false)
      }, 1500)
    } catch (err) {
      console.error('Error punching class:', err)
      setError('An unexpected error occurred')
      setIsPunching(false)
    }
  }

  const handleCancel = () => {
    setShowDatePicker(false)
    setError(null)
    setSelectedDate('')
  }

  return (
    <>
      {/* Main Punch Button */}
      <button
        onClick={handlePunchClick}
        disabled={showDatePicker || showSuccess}
        className="w-full bg-blue-600 text-white text-xl font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        👊 PUNCH CLASS
      </button>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-t-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Record Class for {clientName}
            </h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Date Input */}
            <div className="mb-6">
              <label htmlFor="punch-date" className="block text-sm font-medium text-gray-700 mb-2">
                Class Date
              </label>
              <input
                type="date"
                id="punch-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getTodayDate()}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Can record classes up to 3 months back
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isPunching}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPunch}
                disabled={isPunching || !selectedDate}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPunching ? 'Recording...' : 'Confirm Punch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Feedback */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-scale-in">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Class Recorded!
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
