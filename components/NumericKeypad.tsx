'use client'

import { Delete } from 'lucide-react'

interface NumericKeypadProps {
  onPress: (digit: string) => void
  onDelete: () => void
  showDecimal?: boolean
}

export function NumericKeypad({ onPress, onDelete, showDecimal = false }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-y-4 gap-x-8 max-w-[280px] mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onPress(num.toString())}
          className="h-16 w-16 rounded-full flex items-center justify-center text-2xl leading-none font-medium hover:bg-foreground/5 transition-colors active:scale-95"
        >
          {num}
        </button>
      ))}

      {/* Bottom Row */}
      <div className="flex items-center justify-center">
        {showDecimal ? (
          <button
            type="button"
            onClick={() => onPress('.')}
            className="h-16 w-16 rounded-full flex items-center justify-center text-2xl leading-none font-medium hover:bg-foreground/5 transition-colors active:scale-95"
          >
            .
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onPress('0')}
        className="h-16 w-16 rounded-full flex items-center justify-center text-2xl leading-none font-medium hover:bg-foreground/5 transition-colors active:scale-95"
      >
        0
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="h-16 w-16 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors active:scale-95"
      >
        <Delete strokeWidth={1.5} size={24} />
      </button>
    </div>
  )
}
