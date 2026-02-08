'use client'

// ============================================================================
// Edit Client Page
// ============================================================================
// Form to edit client name, phone, and rate
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MobileLayout } from '@/components/MobileLayout'
import { FormSkeleton } from '@/components/LoadingSkeletons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatRate } from '@/lib/utils/currency'

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

  // Unwrap params and fetch client data
  useEffect(() => {
    const loadClient = async () => {
      const resolvedParams = await params
      setClientId(resolvedParams.id)

      try {
        // Fetch client data
        const response = await fetch(`/api/clients/${resolvedParams.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch client')
        }

        const data = await response.json()
        const client = data.client

        if (!client) {
          setError('Client not found')
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
        setError('Failed to load client data')
        setIsLoading(false)
      }
    }

    loadClient()
  }, [params])

  const validateForm = (): boolean => {
    const errors = {
      name: '',
      phone: '',
      rate: '',
      effectiveDate: '',
    }

    // Validate name
    if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    // Validate phone if provided
    if (formData.phone.trim().length > 0) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = 'Enter valid 10-digit mobile number starting with 6-9'
      }
    }

    // Validate rate
    const rateNum = parseInt(formData.rate)
    if (isNaN(rateNum) || rateNum < 100 || rateNum > 10000) {
      errors.rate = 'Rate must be between ₹100 and ₹10,000'
    }

    // Validate effective date (only if rate changed)
    const rateChanged = rateNum !== initialRate
    if (rateChanged && !formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required when changing rate'
    }

    setValidationErrors(errors)
    return !errors.name && !errors.phone && !errors.rate && !errors.effectiveDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Check if rate changed
      const rateNum = parseInt(formData.rate)
      const rateChanged = rateNum !== initialRate

      // Update client info (name, phone)
      const clientResponse = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      })

      const clientData = await clientResponse.json()

      if (!clientResponse.ok) {
        setError(clientData.error || 'Failed to update client')
        setIsSubmitting(false)
        return
      }

      // Update rate if changed
      if (rateChanged) {
        const rateResponse = await fetch(`/api/clients/${clientId}/rate`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rate: rateNum,
            effectiveDate: formData.effectiveDate,
          }),
        })

        const rateData = await rateResponse.json()

        if (!rateResponse.ok) {
          setError(rateData.error || 'Failed to update rate')
          setIsSubmitting(false)
          return
        }

        setSuccessMessage('Client updated successfully with new rate')
      } else {
        setSuccessMessage('Client updated successfully')
      }

      // Navigate back after brief delay
      setTimeout(() => {
        router.push(`/clients/${clientId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating client:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MobileLayout title="Edit Client" showBackButton={true} backHref="/clients">
        <FormSkeleton />
      </MobileLayout>
    )
  }

  if (error && !formData.name) {
    return (
      <MobileLayout title="Edit Client" showBackButton={true} backHref="/clients">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout
      title="Edit Client"
      showBackButton={true}
      backHref={`/clients/${clientId}`}
    >
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <Alert className="bg-green-500/10 border-green-500/50 text-green-500">
                  <AlertDescription>
                    ✓ {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter client name"
                  className="text-lg"
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  type="tel"
                  id="phone"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="text-lg"
                  maxLength={10}
                  disabled={isSubmitting}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive">{validationErrors.phone}</p>
                )}
              </div>

              {/* Rate Field */}
              <div className="space-y-2">
                <Label htmlFor="rate">
                  Rate per Class (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  id="rate"
                  inputMode="numeric"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="text-lg"
                  placeholder="e.g., 1000"
                  min="100"
                  max="10000"
                  required
                  disabled={isSubmitting}
                />
                {validationErrors.rate && (
                  <p className="text-sm text-destructive">{validationErrors.rate}</p>
                )}
                {initialRate > 0 && parseInt(formData.rate) !== initialRate && (
                  <p className="text-sm text-yellow-500">
                    Current: {formatRate(initialRate * 100)} → New: {formatRate(parseInt(formData.rate) * 100)}
                  </p>
                )}
              </div>

              {/* Effective Date Field (shown only when rate changes) */}
              {parseInt(formData.rate) !== initialRate && (
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">
                    Effective Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="text-lg [color-scheme:dark]"
                    style={{ colorScheme: 'dark' }}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.effectiveDate && (
                    <p className="text-sm text-destructive">{validationErrors.effectiveDate}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    The date from which the new rate will apply
                  </p>
                </div>
              )}

              {/* Info Message */}
              {parseInt(formData.rate) !== initialRate && (
                <Alert>
                  <AlertDescription className="text-sm">
                    💡 The new rate will apply to <strong>new payments only</strong>. Existing payment history will retain their original rates.
                  </AlertDescription>
                </Alert>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href={`/clients/${clientId}`} className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !!successMessage}
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </MobileLayout>
  )
}
