'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneInput } from '@/components/auth/PhoneInput'
import { PinInput } from '@/components/auth/PinInput'

type SignupStep = 'phone' | 'create-pin' | 'confirm-pin'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>('phone')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate phone number
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    if (!['6', '7', '8', '9'].includes(digits[0])) {
      setError('Please enter a valid Indian mobile number')
      return
    }

    // Move to PIN creation step
    setStep('create-pin')
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate PIN
    if (pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }

    // Move to confirm PIN step
    setStep('confirm-pin')
  }

  const handleConfirmPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate PIN match
    if (pin !== confirmPin) {
      setError('PINs do not match')
      setConfirmPin('')
      return
    }

    // Submit signup
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+91${phone.replace(/\D/g, '')}`,
          pin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      // Redirect to main app (client list)
      router.push('/clients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setError('')
    if (step === 'confirm-pin') {
      setConfirmPin('')
      setStep('create-pin')
    } else if (step === 'create-pin') {
      setPin('')
      setStep('phone')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gymbo</h1>
          <p className="text-lg text-gray-600">
            {step === 'phone' && 'Create your account'}
            {step === 'create-pin' && 'Secure your account'}
            {step === 'confirm-pin' && 'Confirm your PIN'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2">
          <div className={`h-2 w-16 rounded-full ${step === 'phone' ? 'bg-blue-600' : 'bg-blue-600'}`} />
          <div className={`h-2 w-16 rounded-full ${step === 'create-pin' || step === 'confirm-pin' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`h-2 w-16 rounded-full ${step === 'confirm-pin' ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Phone Step */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              required
            />

            <button
              type="submit"
              disabled={phone.replace(/\D/g, '').length !== 10}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Log in
              </a>
            </p>
          </form>
        )}

        {/* Create PIN Step */}
        {step === 'create-pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <PinInput
              value={pin}
              onChange={setPin}
              label="Create PIN"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Confirm PIN Step */}
        {step === 'confirm-pin' && (
          <form onSubmit={handleConfirmPinSubmit} className="space-y-6">
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              error={error}
              confirmMode
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={confirmPin.length !== 4 || isLoading}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
