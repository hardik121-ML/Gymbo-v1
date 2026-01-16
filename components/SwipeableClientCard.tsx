'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientCard } from './ClientCard'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SwipeableClientCardProps {
  id: string
  name: string
  balance: number
  rate: number
  credit?: number
  onDelete?: (clientId: string) => void
}

export function SwipeableClientCard({
  id,
  name,
  balance,
  rate,
  credit,
  onDelete,
}: SwipeableClientCardProps) {
  const router = useRouter()
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [deletedClientId, setDeletedClientId] = useState<string | null>(null)

  const touchStartX = useRef(0)
  const currentTranslateX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 80 // 80px to reveal delete button
  const DELETE_BUTTON_WIDTH = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    currentTranslateX.current = translateX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return

    const currentX = e.touches[0].clientX
    const diff = currentX - touchStartX.current
    const newTranslateX = currentTranslateX.current + diff

    // Only allow left swipe (negative values)
    if (newTranslateX < 0) {
      setTranslateX(Math.max(newTranslateX, -DELETE_BUTTON_WIDTH))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)

    // If swiped beyond threshold, show delete button
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      setTranslateX(-DELETE_BUTTON_WIDTH)
      setShowDeleteButton(true)
    } else {
      // Snap back
      setTranslateX(0)
      setShowDeleteButton(false)
    }
  }

  // Mouse event handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
    currentTranslateX.current = translateX
    setIsSwiping(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return

    const currentX = e.clientX
    const diff = currentX - touchStartX.current
    const newTranslateX = currentTranslateX.current + diff

    // Only allow left swipe (negative values)
    if (newTranslateX < 0) {
      setTranslateX(Math.max(newTranslateX, -DELETE_BUTTON_WIDTH))
    }
  }

  const handleMouseUp = () => {
    if (!isSwiping) return

    setIsSwiping(false)

    // If swiped beyond threshold, show delete button
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      setTranslateX(-DELETE_BUTTON_WIDTH)
      setShowDeleteButton(true)
    } else {
      // Snap back
      setTranslateX(0)
      setShowDeleteButton(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirmDialog(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }

      // Call onDelete callback if provided
      onDelete?.(id)

      // Close dialog
      setShowConfirmDialog(false)

      // Store deleted client ID for undo
      setDeletedClientId(id)

      // Show toast with undo
      setShowToast(true)

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUndo = async () => {
    if (!deletedClientId) return

    try {
      // Restore the client by setting is_deleted = false
      const response = await fetch(`/api/clients/${deletedClientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_deleted: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to undo delete')
      }

      // Close toast
      setShowToast(false)
      setDeletedClientId(null)

      // Refresh the page to show the restored client
      router.refresh()
    } catch (error) {
      console.error('Error undoing delete:', error)
      alert('Failed to undo deletion. Please try again.')
    }
  }

  const handleToastClose = () => {
    setShowToast(false)
    setDeletedClientId(null)
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    // Snap back
    setTranslateX(0)
    setShowDeleteButton(false)
  }

  // Close delete button when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showDeleteButton &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setTranslateX(0)
        setShowDeleteButton(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteButton])

  return (
    <>
      <div ref={containerRef} className="relative overflow-hidden">
        {/* Delete Button Behind */}
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive"
          style={{ width: `${DELETE_BUTTON_WIDTH}px` }}
        >
          <button
            onClick={handleDeleteClick}
            className="w-full h-full flex items-center justify-center text-white font-semibold"
          >
            Delete
          </button>
        </div>

        {/* Client Card (Swipeable) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <ClientCard
            id={id}
            name={name}
            balance={balance}
            rate={rate}
            credit={credit}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Delete {name}? This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification with Undo */}
      {showToast && (
        <Toast
          message="Client deleted"
          onUndo={handleUndo}
          onClose={handleToastClose}
          duration={4000}
        />
      )}
    </>
  )
}
