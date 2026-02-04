'use client'

// ============================================================================
// Punch Card Component
// ============================================================================
// Visual punch card showing classes used/remaining as a dot grid
// Specs: 2 rows × 10 columns = 20 dots total
// ============================================================================

import { useEffect, useState } from 'react'

interface PunchCardProps {
  balance: number // Positive = classes remaining, Negative = classes on credit
  clientId: string
  className?: string
}

export function PunchCard({ balance, clientId, className = '' }: PunchCardProps) {
  const [animatingDot, setAnimatingDot] = useState<number | null>(null)
  const [previousBalance, setPreviousBalance] = useState(balance)

  // Calculate how many dots should be filled vs empty
  const totalDots = 20
  let filledDots: number
  let emptyDots: number
  let overflowCount = 0

  if (balance >= 0) {
    // Positive or zero balance: balance = classes remaining
    emptyDots = Math.min(balance, totalDots)
    filledDots = totalDots - emptyDots
  } else {
    // Negative balance: all dots filled + overflow
    filledDots = totalDots
    emptyDots = 0
    overflowCount = Math.abs(balance)
  }

  // Detect when balance changes to trigger animation
  useEffect(() => {
    if (balance !== previousBalance) {
      // Balance decreased (a class was punched) - animate the newly filled dot
      if (balance < previousBalance && filledDots > 0 && filledDots <= totalDots) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAnimatingDot(filledDots - 1) // Animate the last filled dot (0-indexed)
        setTimeout(() => setAnimatingDot(null), 600) // Clear after animation
      }
      setPreviousBalance(balance)
    }
  }, [balance, previousBalance, filledDots, totalDots])

  // Generate array of dots
  const dots = Array.from({ length: totalDots }, (_, index) => {
    const isFilled = index < filledDots
    const isAnimating = index === animatingDot
    return { isFilled, isAnimating }
  })

  return (
    <div className={`punch-card ${className}`}>
      {/* Container with cream background */}
      <div
        className="p-4 rounded-lg"
        style={{
          backgroundColor: '#ebebe6',
        }}
      >
        {/* Dot grid: 2 rows × 10 columns */}
        <div className="flex flex-col gap-2">
          {/* Row 1: dots 0-9 */}
          <div className="flex gap-2 justify-center">
            {dots.slice(0, 10).map((dot, index) => (
              <PunchDot
                key={`row1-${index}`}
                filled={dot.isFilled}
                animating={dot.isAnimating}
              />
            ))}
          </div>

          {/* Row 2: dots 10-19 */}
          <div className="flex gap-2 justify-center">
            {dots.slice(10, 20).map((dot, index) => (
              <PunchDot
                key={`row2-${index}`}
                filled={dot.isFilled}
                animating={dot.isAnimating}
              />
            ))}
          </div>
        </div>

        {/* Overflow indicator for negative balance */}
        {overflowCount > 0 && (
          <div className="mt-3 text-center">
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{
                backgroundColor: 'rgba(26, 26, 26, 0.1)',
                color: '#1a1a1a',
              }}
            >
              +{overflowCount} on credit
            </span>
          </div>
        )}

        {/* Client ID label */}
        <div className="mt-3 text-right">
          <span
            className="text-xs"
            style={{
              color: 'rgba(26, 26, 26, 0.5)',
            }}
          >
            id: {clientId.slice(0, 8)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Individual Punch Dot Component
// ============================================================================

interface PunchDotProps {
  filled: boolean
  animating: boolean
}

function PunchDot({ filled, animating }: PunchDotProps) {
  return (
    <div
      className={`punch-dot ${filled ? 'filled' : 'empty'} ${animating ? 'animate-punch-bounce' : ''}`}
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: filled ? '#1a1a1a' : 'transparent',
        border: filled ? 'none' : '2px solid rgba(26, 26, 26, 0.2)',
        transition: 'all 0.3s ease',
      }}
    />
  )
}
