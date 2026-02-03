'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')

  // Phone step state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // OTP step state
  const [otp, setOtp] = useState('')

  // UI state
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 10 digits
    return digits.slice(0, 10)
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate name
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    // Validate phone (10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)

    try {
      // Add +91 country code for E.164 format
      const formattedPhone = `+91${phone}`

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: formattedPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      // Move to OTP verification step
      setStep('otp')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate OTP (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)

    try {
      const formattedPhone = `+91${phone}`

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formattedPhone,
          otp,
          name: name.trim(), // Include name for signup
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP')
      }

      // Redirect to main app
      router.push('/clients')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setIsLoading(true)

    try {
      const formattedPhone = `+91${phone}`

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: formattedPhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP')
      }

      setError('')
      // You could show a success toast here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl mb-2">Gymbo</CardTitle>
          <CardDescription className="text-lg">
            {step === 'phone' ? 'Create your account' : 'Enter verification code'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Phone Number Entry */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 border border-input rounded-md bg-muted text-muted-foreground">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  10-digit mobile number (starts with 6-9)
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !name || phone.length !== 10}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <a href="/login" className="text-primary hover:underline font-medium">
                  Log in
                </a>
              </p>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* Info Text */}
              <div className="text-center text-sm text-muted-foreground mb-4">
                We sent a 6-digit code to<br />
                <strong className="text-foreground">+91 {phone}</strong>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="ml-2 text-primary hover:underline"
                >
                  Change
                </button>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  className="text-center text-2xl tracking-widest"
                  required
                  autoFocus
                />
              </div>

              {/* Verify Button */}
              <Button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline"
                >
                  Didn&apos;t receive code? Resend
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
