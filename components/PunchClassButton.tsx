'use client'

// ============================================================================
// Punch Class Button Component
// ============================================================================
// Primary action button to record a class for a client
// ============================================================================

import { useState } from 'react'
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
      <Button
        onClick={handlePunchClick}
        disabled={showDatePicker || showSuccess}
        size="lg"
        className="w-full text-xl py-6"
      >
        👊 PUNCH CLASS
      </Button>

      {/* Date Picker Modal */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Class for {clientName}</DialogTitle>
            <DialogDescription>
              Select the date when the class took place. You can record classes up to 3 months back.
            </DialogDescription>
          </DialogHeader>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date Input */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="punch-date">
              Class Date
            </Label>
            <Input
              type="date"
              id="punch-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getTodayDate()}
              className="text-lg cursor-pointer [color-scheme:dark]"
              style={{
                colorScheme: 'dark'
              }}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Can record classes up to 3 months back
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              disabled={isPunching}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleConfirmPunch}
              disabled={isPunching || !selectedDate}
              className="flex-1"
            >
              {isPunching ? 'Recording...' : 'Confirm Punch'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Feedback */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl p-8 text-center animate-scale-in border shadow-lg">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2">
              Class Recorded!
            </h3>
            <p className="text-muted-foreground">
              Balance updated successfully
            </p>
          </div>
        </div>
      )}

      {/* Add animations */}
      <style jsx>{`
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
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
