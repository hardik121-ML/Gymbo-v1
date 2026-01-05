'use client'

import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  label?: string
  confirmMode?: boolean
}

export function PinInput({
  value,
  onChange,
  error,
  disabled = false,
  label = 'PIN',
  confirmMode = false
}: PinInputProps) {
  const [showPin, setShowPin] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Split the PIN into individual digits
  const digits = value.padEnd(4, ' ').split('').slice(0, 4)

  const handleChange = (index: number, newValue: string) => {
    // Only allow single digit
    const digit = newValue.replace(/\D/g, '').slice(-1)

    // Update the PIN
    const newDigits = [...digits]
    newDigits[index] = digit || ' '
    const newPin = newDigits.join('').trim()
    onChange(newPin)

    // Auto-advance to next input if digit was entered
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !digits[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Move to next on right arrow
    if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Move to previous on left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 4)
    onChange(digits)

    // Focus the last filled input or the first empty one
    const nextIndex = Math.min(digits.length, 3)
    inputRefs.current[nextIndex]?.focus()
  }

  const isComplete = value.length === 4
  const hasError = !!error

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {confirmMode ? 'Confirm PIN' : label} <span className="text-red-500">*</span>
        </label>

        {/* Show/Hide PIN Toggle */}
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          disabled={disabled}
        >
          {showPin ? 'Hide' : 'Show'} PIN
        </button>
      </div>

      {/* PIN Input Boxes */}
      <div className="flex gap-3 mb-2">
        {[0, 1, 2, 3].map((index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type={showPin ? 'tel' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index].trim()}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-14 h-14 text-center text-2xl font-semibold
              border-2 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              transition-colors
              ${hasError
                ? 'border-red-500 focus:ring-red-500'
                : isComplete
                  ? 'border-green-500'
                  : 'border-gray-300'
              }
            `}
            aria-label={`PIN digit ${index + 1}`}
            aria-invalid={hasError}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}

      {/* Helper Text */}
      {!error && (
        <p className="text-sm text-gray-500 mt-1">
          {confirmMode
            ? 'Re-enter your 4-digit PIN'
            : 'Enter a 4-digit PIN to secure your account'
          }
        </p>
      )}
    </div>
  )
}
