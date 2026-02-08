'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PunchListItemProps {
  id: string
  punchDate: string
  paidWithCredit?: boolean
}

export function PunchListItem({ id, punchDate, paidWithCredit = false }: PunchListItemProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [showUndo, setShowUndo] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [isEditing, setIsEditing] = useState(false)
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

  const handleEditClick = () => {
    // Set the current date as default
    setEditDate(punchDate)
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editDate) return

    setIsEditing(true)

    try {
      const response = await fetch(`/api/punches/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: editDate }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update punch')
      }

      // Success
      triggerHaptic()
      setShowEditModal(false)
      setIsEditing(false)

      // Refresh to show updated date
      router.refresh()
    } catch (error) {
      console.error('Error updating punch:', error)
      alert(error instanceof Error ? error.message : 'Failed to update punch')
      setIsEditing(false)
    }
  }

  const getMaxDate = () => {
    // Today
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    // 3 months ago
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return threeMonthsAgo.toISOString().split('T')[0]
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
      <div className="flex items-center justify-center py-2 border-b last:border-0 bg-status-healthy/10 animate-pulse">
        <span className="text-status-healthy font-medium">✓ Punch removed</span>
      </div>
    )
  }

  return (
    <>
      <div
        className={`flex items-center justify-between py-2 border-b last:border-0 transition-all duration-300 ${
          isStrikethrough ? 'opacity-50 line-through' : ''
        }`}
      >
        <div className="flex-1">
          <span>{formatDate(punchDate)}</span>
          <span className="text-muted-foreground text-sm ml-3">{formatWeekday(punchDate)}</span>
          {paidWithCredit && (
            <span className="text-primary text-xs ml-3 font-medium">
              💳 Paid from credit
            </span>
          )}
        </div>
        {!isStrikethrough && (
          <div className="flex gap-2">
            <button
              onClick={handleEditClick}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded p-2 transition-colors"
              aria-label="Edit punch date"
            >
              ✎
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded p-2 transition-colors"
              aria-label="Delete punch"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove punch?</DialogTitle>
            <DialogDescription>
              Remove punch from {formatDate(punchDate)}? This will restore 1 class to the balance.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="flex-1"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Date Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Punch Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mb-4">
            <Label htmlFor="edit-date">
              Date
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              disabled={isEditing}
              className="[color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-xs text-muted-foreground">
              Must be within last 3 months
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditDate('')
              }}
              disabled={isEditing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isEditing || !editDate}
              className="flex-1"
            >
              {isEditing ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo Snackbar */}
      {showUndo && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-[slide-up_0.3s_ease-out]">
          <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center justify-between max-w-md mx-auto">
            <span className="text-sm">
              Punch removed ({countdown}s)
            </span>
            <Button
              size="sm"
              onClick={handleUndo}
              variant="secondary"
            >
              UNDO
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
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
