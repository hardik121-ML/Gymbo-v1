'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { NumericKeypad } from '@/components/NumericKeypad'
import { ArrowRight, ArrowLeft, Grab } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleNumPress = (digit: string) => {
    if (step === 'phone') {
      if (phone.length < 10) setPhone((prev) => prev + digit)
    } else {
      if (otp.length < 6) {
        const newOtp = otp + digit
        setOtp(newOtp)
        if (newOtp.length === 6) {
          handleVerifyOTP(newOtp)
        }
      }
    }
  }

  const handleDelete = () => {
    if (step === 'phone') setPhone((prev) => prev.slice(0, -1))
    else setOtp((prev) => prev.slice(0, -1))
  }

  const handleSendOTP = async () => {
    setError('')
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'failed to send otp')
      setStep('otp')
      setError('')
      setResendCooldown(30)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to send otp')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = useCallback(async () => {
    if (resendCooldown > 0 || isLoading) return
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'failed to resend otp')
      setOtp('')
      setResendCooldown(30)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to resend otp')
    } finally {
      setIsLoading(false)
    }
  }, [phone, resendCooldown, isLoading])

  const handleVerifyOTP = async (otpValue: string) => {
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp: otpValue }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'invalid otp')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to verify otp')
      setOtp('')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('phone')
    setOtp('')
    setError('')
  }

  return (
    <div className="flex-1 flex flex-col items-center relative w-full px-6 pt-safe-top pb-safe-bottom h-dvh">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-2">
        {/* Logo */}
        <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mb-4 border border-foreground text-background">
          <Grab size={32} strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-tight lowercase">
            trainer access
          </h1>
          <p className="text-foreground/60 text-xs tracking-[0.2em] lowercase">
            {step === 'phone' ? 'enter mobile number' : 'enter passcode'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-foreground/80 bg-foreground/10 px-4 py-2 rounded-full mt-2">
            {error}
          </p>
        )}

        {/* Input Display */}
        <div className="h-16 flex items-center justify-center my-4">
          {step === 'phone' ? (
            <div className="text-2xl font-mono tracking-wider font-bold border-b-2 border-foreground/20 px-4 py-2">
              {phone || (
                <span className="opacity-30">000-000-0000</span>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-3 h-3 rounded-full border-2 border-foreground transition-all duration-200',
                    otp.length > i
                      ? 'bg-foreground scale-100 opacity-100'
                      : 'bg-transparent scale-75 opacity-30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mode Toggle / Back */}
        {step === 'phone' ? (
          <a
            href="/signup"
            className="text-[10px] font-mono lowercase underline decoration-dashed underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            new to gymbo? sign up
          </a>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-[10px] font-mono lowercase opacity-60 hover:opacity-100 transition-opacity"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              back
            </button>
            <button
              onClick={handleResendOTP}
              disabled={resendCooldown > 0 || isLoading}
              className="text-[10px] font-mono lowercase opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `resend in ${resendCooldown}s` : 'resend code'}
            </button>
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full pb-8">
        <NumericKeypad onPress={handleNumPress} onDelete={handleDelete} />

        {/* Continue Button (Phone Step Only) */}
        {step === 'phone' && (
          <div className="mt-8 px-8">
            <button
              onClick={handleSendOTP}
              disabled={isLoading || phone.length < 10}
              className={cn(
                'w-full h-14 bg-foreground text-background rounded-full font-bold lowercase tracking-wider flex items-center justify-center gap-2 transition-all text-sm',
                phone.length < 10
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 shadow-xl'
              )}
            >
              {isLoading ? 'sending...' : 'continue'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
