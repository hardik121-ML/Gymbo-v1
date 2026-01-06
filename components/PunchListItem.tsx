'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PunchListItemProps {
  id: string
  punchDate: string
}

export function PunchListItem({ id, punchDate }: PunchListItemProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [showSuccess, setShowSuccess] = useState(false)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatWeekday = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
    })
  }

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  const handleConfirmDelete = () => {
    setShowConfirm(false)
    setIsStrikethrough(true)
    setShowUndo(true)
    setCountdown(5)
    triggerHaptic()

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Execute delete after 5 seconds
    undoTimeoutRef.current = setTimeout(() => {
      executeDelete()
    }, 5000)
  }

  const handleUndo = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setIsStrikethrough(false)
    setShowUndo(false)
    setCountdown(5)
    triggerHaptic()
  }

  const executeDelete = async () => {
    try {
      const response = await fetch(`/api/punches/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete punch')
      }

      // Show success animation
      setShowUndo(false)
      setShowSuccess(true)
      triggerHaptic()

      // Wait for animation, then refresh
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error('Error deleting punch:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete punch')
      setIsStrikethrough(false)
      setShowUndo(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center py-2 border-b border-gray-100 last:border-0 bg-green-50 animate-pulse">
        <span className="text-green-600 font-medium">✓ Punch removed</span>
      </div>
    )
  }

  return (
    <>
      <div
        className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 transition-all duration-300 ${
          isStrikethrough ? 'opacity-50 line-through' : ''
        }`}
      >
        <div className="flex-1">
          <span className="text-gray-700">{formatDate(punchDate)}</span>
          <span className="text-gray-500 text-sm ml-3">{formatWeekday(punchDate)}</span>
        </div>
        {!isStrikethrough && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-2 transition-colors"
            aria-label="Delete punch"
          >
            ✕
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 animate-[scale-in_0.2s_ease-out]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Remove punch?
            </h3>
            <p className="text-gray-600 mb-6">
              Remove punch from {formatDate(punchDate)}? This will restore 1 class to the balance.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Snackbar */}
      {showUndo && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-[slide-up_0.3s_ease-out]">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-4 flex items-center justify-between max-w-md mx-auto">
            <span className="text-sm">
              Punch removed ({countdown}s)
            </span>
            <button
              onClick={handleUndo}
              className="bg-white text-gray-900 font-medium px-4 py-1 rounded text-sm hover:bg-gray-100 transition-colors"
            >
              UNDO
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
