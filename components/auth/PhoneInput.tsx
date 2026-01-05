'use client'

import { useState, ChangeEvent } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

export function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  required = true
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  // Format phone number as user types: 98765 43210
  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '')

    // Limit to 10 digits
    const limited = digits.slice(0, 10)

    // Format: XXXXX XXXXX
    if (limited.length > 5) {
      return `${limited.slice(0, 5)} ${limited.slice(5)}`
    }

    return limited
  }

  // Validate Indian mobile number
  const validatePhone = (phone: string): string | undefined => {
    const digits = phone.replace(/\D/g, '')

    if (!required && digits.length === 0) {
      return undefined
    }

    if (digits.length === 0) {
      return 'Phone number is required'
    }

    if (digits.length < 10) {
      return 'Phone number must be 10 digits'
    }

    // Indian mobile numbers start with 6, 7, 8, or 9
    if (!['6', '7', '8', '9'].includes(digits[0])) {
      return 'Please enter a valid Indian mobile number'
    }

    return undefined
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatPhoneNumber(input)
    onChange(formatted)
  }

  const validationError = error || (value && !isFocused ? validatePhone(value) : undefined)

  return (
    <div className="w-full">
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        {/* +91 Prefix */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-base font-medium">+91</span>
        </div>

        {/* Phone Input */}
        <input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="98765 43210"
          className={`
            block w-full pl-14 pr-3 py-3 text-base
            border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${validationError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300'
            }
          `}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'phone-error' : undefined}
        />
      </div>

      {/* Error Message */}
      {validationError && (
        <p id="phone-error" className="mt-1 text-sm text-red-600">
          {validationError}
        </p>
      )}

      {/* Helper Text */}
      {!validationError && !isFocused && (
        <p className="mt-1 text-sm text-gray-500">
          Enter your 10-digit mobile number
        </p>
      )}
    </div>
  )
}
