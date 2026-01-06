'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneInput } from '@/components/auth/PhoneInput'
import { PinInput } from '@/components/auth/PinInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl mb-2">Gymbo</CardTitle>
          <CardDescription className="text-lg">
            {step === 'phone' && 'Create your account'}
            {step === 'create-pin' && 'Secure your account'}
            {step === 'confirm-pin' && 'Confirm your PIN'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2">
            <div className={`h-2 w-16 rounded-full ${step === 'phone' ? 'bg-primary' : 'bg-primary'}`} />
            <div className={`h-2 w-16 rounded-full ${step === 'create-pin' || step === 'confirm-pin' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-16 rounded-full ${step === 'confirm-pin' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Phone Step */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <PhoneInput
                value={phone}
                onChange={setPhone}
                required
              />

              <Button
                type="submit"
                disabled={phone.replace(/\D/g, '').length !== 10}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline font-medium">
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
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={pin.length !== 4}
                  size="lg"
                  className="flex-1"
                >
                  Continue
                </Button>
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
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={confirmPin.length !== 4 || isLoading}
                  size="lg"
                  className="flex-1"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
