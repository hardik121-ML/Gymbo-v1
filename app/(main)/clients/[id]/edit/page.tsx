'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { FormSkeleton } from '@/components/LoadingSkeletons'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatRate } from '@/lib/utils/currency'
import { User, Clock, ChevronRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditClientPage({ params }: PageProps) {
  const router = useRouter()
  const [clientId, setClientId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [initialRate, setInitialRate] = useState<number>(0)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  })

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    phone: '',
    rate: '',
    effectiveDate: '',
  })

  useEffect(() => {
    const loadClient = async () => {
      const resolvedParams = await params
      setClientId(resolvedParams.id)

      try {
        const response = await fetch(`/api/clients/${resolvedParams.id}`)
        if (!response.ok) throw new Error('Failed to fetch client')

        const data = await response.json()
        const client = data.client

        if (!client) {
          setError('client not found')
          setIsLoading(false)
          return
        }

        const rateInRupees = client.current_rate / 100
        setInitialRate(rateInRupees)

        setFormData({
          name: client.name || '',
          phone: client.phone || '',
          rate: rateInRupees.toString(),
          effectiveDate: new Date().toISOString().split('T')[0],
        })
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching client:', err)
        setError('failed to load client data')
        setIsLoading(false)
      }
    }

    loadClient()
  }, [params])

  const validateForm = (): boolean => {
    const errors = { name: '', phone: '', rate: '', effectiveDate: '' }

    if (formData.name.trim().length < 2) {
      errors.name = 'name must be at least 2 characters'
    }

    if (formData.phone.trim().length > 0) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = 'enter valid 10-digit mobile number'
      }
    }

    const rateNum = parseInt(formData.rate)
    if (isNaN(rateNum) || rateNum < 100 || rateNum > 10000) {
      errors.rate = 'rate must be between ₹100 and ₹10,000'
    }

    const rateChanged = rateNum !== initialRate
    if (rateChanged && !formData.effectiveDate) {
      errors.effectiveDate = 'effective date is required when changing rate'
    }

    setValidationErrors(errors)
    return !errors.name && !errors.phone && !errors.rate && !errors.effectiveDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const rateNum = parseInt(formData.rate)
      const rateChanged = rateNum !== initialRate

      const clientResponse = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      })

      const clientData = await clientResponse.json()

      if (!clientResponse.ok) {
        setError(clientData.error || 'failed to update client')
        setIsSubmitting(false)
        return
      }

      if (rateChanged) {
        const rateResponse = await fetch(`/api/clients/${clientId}/rate`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rate: rateNum,
            effectiveDate: formData.effectiveDate,
          }),
        })

        const rateData = await rateResponse.json()

        if (!rateResponse.ok) {
          setError(rateData.error || 'failed to update rate')
          setIsSubmitting(false)
          return
        }

        setSuccessMessage('client updated with new rate')
      } else {
        setSuccessMessage('client updated')
      }

      setTimeout(() => {
        router.push(`/clients/${clientId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating client:', err)
      setError('an unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AppShell title="edit client" showBackButton={true} backHref="/clients">
        <FormSkeleton />
      </AppShell>
    )
  }

  if (error && !formData.name) {
    return (
      <AppShell title="edit client" showBackButton={true} backHref="/clients">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </AppShell>
    )
  }

  const rateChanged = parseInt(formData.rate) !== initialRate

  return (
    <AppShell
      title="edit client"
      showBackButton={true}
      backHref={`/clients/${clientId}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-[calc(100vh-10rem)]">
        {/* Avatar + ID */}
        <div className="flex flex-col items-center py-6 gap-2">
          <div className="w-24 h-24 bg-muted/10 rounded-full border border-foreground flex items-center justify-center text-foreground">
            <User size={48} strokeWidth={1} />
          </div>
          <p className="text-xs font-mono opacity-40 lowercase tracking-wider">
            id: {clientId.slice(0, 8)}
          </p>
        </div>

        {/* Success */}
        {successMessage && (
          <p className="text-xs text-status-healthy bg-status-healthy/10 px-4 py-2 rounded-full text-center mb-6">
            {successMessage}
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-full text-center mb-6">
            {error}
          </p>
        )}

        {/* Form Fields */}
        <div className="flex-1 space-y-8">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              full name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="enter client name"
              className="w-full bg-transparent border-0 border-b border-foreground/20 py-3 text-lg font-bold placeholder:opacity-30 placeholder:font-normal focus:border-foreground outline-none transition-colors"
              required
              disabled={isSubmitting}
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive">{validationErrors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              phone number
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="10-digit mobile number"
              className="w-full bg-transparent border-0 border-b border-foreground/20 py-3 text-lg font-bold placeholder:opacity-30 placeholder:font-normal focus:border-foreground outline-none transition-colors"
              maxLength={10}
              disabled={isSubmitting}
            />
            {validationErrors.phone && (
              <p className="text-xs text-destructive">{validationErrors.phone}</p>
            )}
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
                current rate
              </label>
              {rateChanged && (
                <span className="text-[10px] font-mono lowercase text-primary">
                  effective: {new Date(formData.effectiveDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase()}
                </span>
              )}
            </div>
            <div className="flex items-center border-b border-foreground/20 focus-within:border-foreground transition-colors">
              <span className="text-lg opacity-40 mr-1">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="e.g., 1000"
                className="flex-1 bg-transparent border-0 py-3 text-lg font-bold placeholder:opacity-30 placeholder:font-normal outline-none"
                min="100"
                max="10000"
                required
                disabled={isSubmitting}
              />
              <span className="text-sm font-mono opacity-40 lowercase">/ class</span>
            </div>
            {validationErrors.rate && (
              <p className="text-xs text-destructive">{validationErrors.rate}</p>
            )}
            {rateChanged && (
              <p className="text-xs text-status-warning">
                {formatRate(initialRate * 100)} → {formatRate(parseInt(formData.rate) * 100)}
              </p>
            )}
          </div>

          {/* Effective Date (shown only when rate changes) */}
          {rateChanged && (
            <div className="space-y-2">
              <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
                effective date
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full bg-transparent border-0 border-b border-foreground/20 py-3 text-lg font-bold focus:border-foreground outline-none transition-colors"
                required
                disabled={isSubmitting}
              />
              {validationErrors.effectiveDate && (
                <p className="text-xs text-destructive">{validationErrors.effectiveDate}</p>
              )}
            </div>
          )}

          {/* Audit Trail Link */}
          <Link
            href={`/clients/${clientId}/audit`}
            className="flex items-center justify-between p-4 border border-foreground/10 rounded-xl hover:bg-foreground/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Clock size={18} strokeWidth={1.5} className="opacity-50" />
              <span className="text-sm font-bold lowercase tracking-wider">view audit trail</span>
            </div>
            <ChevronRight size={16} strokeWidth={1.5} className="opacity-30 group-hover:opacity-60 transition-opacity" />
          </Link>
        </div>

        {/* Save Button */}
        <div className="pt-8 pb-4">
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity shadow-xl"
          >
            {isSubmitting ? 'saving...' : 'save changes'}
          </button>
        </div>
      </form>
    </AppShell>
  )
}
