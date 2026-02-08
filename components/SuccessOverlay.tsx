'use client'

// ============================================================================
// Success Overlay Component
// ============================================================================
// Full-screen success confirmation overlay for punch and payment actions
// Auto-dismisses after 2s or tap to dismiss immediately
// ============================================================================

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

interface SuccessOverlayProps {
  primaryText: string
  secondaryText: string
  onDismiss: () => void
}

export function SuccessOverlay({
  primaryText,
  secondaryText,
  onDismiss
}: SuccessOverlayProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = () => {
    // Start fade-out animation
    setIsExiting(true)

    // Wait for animation to complete before actually dismissing
    setTimeout(() => {
      onDismiss()
    }, 200) // 200ms fade-out duration
  }

  // Auto-dismiss after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, 2000)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClick = () => {
    handleDismiss()
  }

  return (
    <div
      className={`success-overlay fixed inset-0 z-50 flex items-center justify-center ${isExiting ? 'animate-fade-out' : 'animate-fade-in'}`}
      style={{
        backgroundColor: 'rgba(45, 45, 45, 0.95)',
      }}
      onClick={handleClick}
      role="dialog"
      aria-live="polite"
      aria-label="Success notification"
    >
      <div className="flex flex-col items-center justify-center px-6">
        {/* Success Icon Circle */}
        <div
          className="success-icon-circle flex items-center justify-center rounded-full mb-6 animate-celebration-pulse"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: 'var(--status-healthy)',
          }}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>

        {/* Primary Text */}
        <h2
          className="text-2xl font-bold text-white mb-2 text-center"
          style={{
            fontSize: '24px',
          }}
        >
          {primaryText}
        </h2>

        {/* Secondary Text */}
        <p
          className="text-sm text-muted-foreground text-center"
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          {secondaryText}
        </p>
      </div>
    </div>
  )
}
