'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/Toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SwipeToDeleteProps {
  clientId: string
  clientName: string
  children: ReactNode
  onDelete?: (clientId: string) => void
}

export function SwipeToDelete({
  clientId,
  clientName,
  children,
  onDelete,
}: SwipeToDeleteProps) {
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

  const SWIPE_THRESHOLD = 80
  const DELETE_BUTTON_WIDTH = 80

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    currentTranslateX.current = translateX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const diff = e.touches[0].clientX - touchStartX.current
    const newTranslateX = currentTranslateX.current + diff
    if (newTranslateX < 0) {
      setTranslateX(Math.max(newTranslateX, -DELETE_BUTTON_WIDTH))
    }
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      setTranslateX(-DELETE_BUTTON_WIDTH)
      setShowDeleteButton(true)
    } else {
      setTranslateX(0)
      setShowDeleteButton(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX
    currentTranslateX.current = translateX
    setIsSwiping(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return
    const diff = e.clientX - touchStartX.current
    const newTranslateX = currentTranslateX.current + diff
    if (newTranslateX < 0) {
      setTranslateX(Math.max(newTranslateX, -DELETE_BUTTON_WIDTH))
    }
  }

  const handleMouseUp = () => {
    if (!isSwiping) return
    setIsSwiping(false)
    if (Math.abs(translateX) >= SWIPE_THRESHOLD) {
      setTranslateX(-DELETE_BUTTON_WIDTH)
      setShowDeleteButton(true)
    } else {
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
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }
      onDelete?.(clientId)
      setShowConfirmDialog(false)
      setDeletedClientId(clientId)
      setShowToast(true)
      router.refresh()
    } catch (error) {
      console.error('Error deleting client:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUndo = async () => {
    if (!deletedClientId) return
    try {
      const response = await fetch(`/api/clients/${deletedClientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_deleted: false }),
      })
      if (!response.ok) throw new Error('Failed to undo delete')
      setShowToast(false)
      setDeletedClientId(null)
      router.refresh()
    } catch (error) {
      console.error('Error undoing delete:', error)
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setTranslateX(0)
    setShowDeleteButton(false)
  }

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
      <div ref={containerRef} className="relative overflow-hidden rounded-xl">
        {/* Delete Button Behind */}
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive rounded-r-xl"
          style={{ width: `${DELETE_BUTTON_WIDTH}px` }}
        >
          <button
            onClick={handleDeleteClick}
            className="w-full h-full flex items-center justify-center text-destructive-foreground font-bold text-xs lowercase tracking-wider"
          >
            delete
          </button>
        </div>

        {/* Swipeable Content */}
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
            userSelect: 'none',
          }}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>delete client</DialogTitle>
            <DialogDescription>
              delete {clientName}? this action can be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'deleting...' : 'delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo Toast */}
      {showToast && (
        <Toast
          message="client deleted"
          onUndo={handleUndo}
          onClose={() => { setShowToast(false); setDeletedClientId(null) }}
          duration={4000}
        />
      )}
    </>
  )
}
