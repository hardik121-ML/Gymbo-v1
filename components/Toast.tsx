'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ToastProps {
  message: string
  onUndo?: () => void
  onClose: () => void
  duration?: number // Duration in milliseconds
}

export function Toast({ message, onUndo, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-card border border-border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 min-w-[300px]">
        <span className="flex-1 text-sm font-medium">{message}</span>
        {onUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="text-xs px-3 py-1 h-7"
          >
            Undo
          </Button>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translate(-50%, 100px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
