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
import { SuccessOverlay } from '@/components/SuccessOverlay'
import { HandMetal } from 'lucide-react'

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
  const [newBalance, setNewBalance] = useState<number | null>(null)

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

      // Store the new balance from API response
      setNewBalance(data.newBalance)

      // Show success feedback
      setShowSuccess(true)
      setShowDatePicker(false)

      // Vibrate if supported (haptic feedback)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Auto-dismiss is handled by SuccessOverlay (2s)
      // Just need to refresh after overlay dismisses
      setIsPunching(false)
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

  const handleSuccessDismiss = () => {
    setShowSuccess(false)
    setNewBalance(null)
    router.refresh()
  }

  return (
    <>
      {/* Main Punch Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handlePunchClick}
          disabled={showDatePicker || showSuccess}
          className="w-full h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity shadow-xl"
        >
          <HandMetal size={18} strokeWidth={1.5} />
          punch class
        </button>
      </div>

      {/* Date Picker Modal */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="lowercase">record class for {clientName.toLowerCase()}</DialogTitle>
            <DialogDescription className="lowercase">
              select the date when the class took place
            </DialogDescription>
          </DialogHeader>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-full mb-4">
              {error}
            </p>
          )}

          <div className="space-y-2 mb-6">
            <Label htmlFor="punch-date">class date</Label>
            <Input
              type="date"
              id="punch-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getTodayDate()}
              className="text-lg cursor-pointer"
              autoFocus
            />
            <p className="text-xs font-mono text-muted-foreground lowercase">
              up to 3 months back
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              disabled={isPunching}
              className="flex-1 lowercase"
            >
              cancel
            </Button>
            <button
              onClick={handleConfirmPunch}
              disabled={isPunching || !selectedDate}
              className="flex-1 h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider disabled:opacity-30 transition-opacity"
            >
              {isPunching ? 'recording...' : 'confirm punch'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Overlay */}
      {showSuccess && newBalance !== null && (
        <SuccessOverlay
          primaryText="class punched!"
          secondaryText={`balance: ${newBalance} ${newBalance === 1 ? 'class' : 'classes'}`}
          onDismiss={handleSuccessDismiss}
        />
      )}
    </>
  )
}
