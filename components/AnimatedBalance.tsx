'use client'

// ============================================================================
// Animated Balance Component
// ============================================================================
// Animates balance number changes with smooth count up/down effect
// ============================================================================

import { useEffect, useRef, useState } from 'react'

interface AnimatedBalanceProps {
  value: number
  className?: string
  duration?: number // Animation duration in milliseconds
}

export function AnimatedBalance({
  value,
  className = '',
  duration = 800
}: AnimatedBalanceProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const startValueRef = useRef(value)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // If value hasn't changed, don't animate
    if (value === displayValue) {
      return
    }

    setIsAnimating(true)
    startValueRef.current = displayValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out-cubic for smooth deceleration)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      const currentValue = Math.round(
        startValueRef.current + (value - startValueRef.current) * easeOutCubic
      )

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setDisplayValue(value)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [value, duration])

  return (
    <span
      className={`${className} ${isAnimating ? 'transition-transform scale-110' : ''}`}
      style={{
        display: 'inline-block',
        transition: isAnimating ? 'transform 0.2s ease-out' : 'none'
      }}
    >
      {displayValue}
    </span>
  )
}
