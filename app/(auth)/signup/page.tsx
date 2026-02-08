'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NumericKeypad } from '@/components/NumericKeypad'
import { ArrowRight, ArrowLeft, Grab } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'phone' | 'otp'>('name')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleNumPress = (digit: string) => {
    if (step === 'phone') {
      if (phone.length < 10) setPhone((prev) => prev + digit)
    } else if (step === 'otp') {
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
    else if (step === 'otp') setOtp((prev) => prev.slice(0, -1))
  }

  const handleNameSubmit = () => {
    if (name.trim().length < 2) {
      setError('name must be at least 2 characters')
      return
    }
    setError('')
    setStep('phone')
  }

  const handleSendOTP = async () => {
    setError('')
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('please enter a valid 10-digit mobile number')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: `+91${phone}` }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'failed to send otp')
      setStep('otp')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to send otp')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (otpValue: string) => {
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `+91${phone}`,
          otp: otpValue,
          name: name.trim(),
        }),
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
    setError('')
    if (step === 'otp') {
      setOtp('')
      setStep('phone')
    } else if (step === 'phone') {
      setStep('name')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center relative w-full px-6 pt-safe-top pb-safe-bottom min-h-screen">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-2">
        {/* Logo */}
        <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mb-4 border border-foreground text-background">
          <Grab size={32} strokeWidth={1.5} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-tight lowercase">
            create account
          </h1>
          <p className="text-foreground/60 text-xs tracking-[0.2em] lowercase">
            {step === 'name' && 'enter your name'}
            {step === 'phone' && 'enter mobile number'}
            {step === 'otp' && 'enter passcode'}
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
          {step === 'name' ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              autoFocus
              className="text-2xl font-bold text-center bg-transparent border-b-2 border-foreground/20 focus:border-foreground outline-none px-4 py-2 placeholder:opacity-30 placeholder:font-normal transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit()
              }}
            />
          ) : step === 'phone' ? (
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
        {step === 'name' ? (
          <a
            href="/login"
            className="text-[10px] font-mono lowercase underline decoration-dashed underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            already have an account? login
          </a>
        ) : (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[10px] font-mono lowercase opacity-60 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
            back
          </button>
        )}
      </div>

      {/* Keypad / Name Continue */}
      <div className="w-full pb-8">
        {step === 'name' ? (
          <div className="px-8">
            <button
              onClick={handleNameSubmit}
              disabled={name.trim().length < 2}
              className={cn(
                'w-full h-14 bg-foreground text-background rounded-full font-bold lowercase tracking-wider flex items-center justify-center gap-2 transition-all text-sm',
                name.trim().length < 2
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-90 shadow-xl'
              )}
            >
              continue
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <NumericKeypad onPress={handleNumPress} onDelete={handleDelete} />

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
          </>
        )}
      </div>
    </div>
  )
}
