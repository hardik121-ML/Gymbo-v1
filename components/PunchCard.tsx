'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface PunchCardProps {
  balance: number
  clientId: string
  className?: string
}

export function PunchCard({ balance, clientId, className = '' }: PunchCardProps) {
  const [animatingDot, setAnimatingDot] = useState<number | null>(null)
  const [previousBalance, setPreviousBalance] = useState(balance)

  const totalDots = 20
  let filledDots: number
  let emptyDots: number
  let overflowCount = 0

  if (balance >= 0) {
    emptyDots = Math.min(balance, totalDots)
    filledDots = totalDots - emptyDots
  } else {
    filledDots = totalDots
    emptyDots = 0
    overflowCount = Math.abs(balance)
  }

  useEffect(() => {
    if (balance !== previousBalance) {
      if (balance < previousBalance && filledDots > 0 && filledDots <= totalDots) {
        setAnimatingDot(filledDots - 1)
        setTimeout(() => setAnimatingDot(null), 600)
      }
      setPreviousBalance(balance)
    }
  }, [balance, previousBalance, filledDots, totalDots])

  const dots = Array.from({ length: totalDots }, (_, index) => {
    const isFilled = index < filledDots
    const isAnimating = index === animatingDot
    return { isFilled, isAnimating }
  })

  return (
    <div className={className}>
      {/* High contrast punch card: bg-foreground, text-background */}
      <div className="w-full aspect-[2/1] bg-foreground text-background rounded-xl relative overflow-hidden flex flex-col p-6 shadow-2xl">
        {/* Dot Grid */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="grid grid-cols-10 gap-2 w-full">
            {dots.map((dot, i) => (
              <div
                key={i}
                className={cn(
                  'aspect-square rounded-full transition-all duration-300',
                  dot.isAnimating && 'animate-punch-bounce',
                  dot.isFilled
                    ? 'bg-background'
                    : 'bg-transparent border border-background/20'
                )}
              />
            ))}
          </div>
        </div>

        {/* Overflow indicator */}
        {overflowCount > 0 && (
          <div className="text-center mt-2">
            <span className="text-xs font-mono opacity-60">
              +{overflowCount} on credit
            </span>
          </div>
        )}

        {/* Card Footer */}
        <div className="absolute bottom-4 right-4 text-[10px] font-mono opacity-30 lowercase tracking-widest">
          id: {clientId.slice(0, 8)}
        </div>
      </div>
    </div>
  )
}
