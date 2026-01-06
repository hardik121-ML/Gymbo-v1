'use client'

// ============================================================================
// Change Rate Page
// ============================================================================
// Form to change client rate with effective date tracking
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ChangeRatePage({ params }: PageProps) {
  const router = useRouter()
  const [clientId, setClientId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [clientData, setClientData] = useState<{
    name: string
    currentRate: number
  } | null>(null)

  const [formData, setFormData] = useState({
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0], // Today
  })

  const [validationErrors, setValidationErrors] = useState({
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

        setClientData({
          name: client.name,
          currentRate: client.current_rate / 100, // Convert paise to rupees
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
      rate: '',
      effectiveDate: '',
    }

    // Validate rate
    const rateNum = parseInt(formData.rate)
    if (isNaN(rateNum) || rateNum < 100 || rateNum > 10000) {
      errors.rate = 'Rate must be between ₹100 and ₹10,000'
    }

    // Validate effective date
    if (!formData.effectiveDate) {
      errors.effectiveDate = 'Effective date is required'
    }

    setValidationErrors(errors)
    return !errors.rate && !errors.effectiveDate
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
      const response = await fetch(`/api/clients/${clientId}/rate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rate: parseInt(formData.rate),
          effectiveDate: formData.effectiveDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update rate')
        setIsSubmitting(false)
        return
      }

      // Success!
      setSuccessMessage(data.message || 'Rate updated successfully')

      // Navigate back to client detail page after a brief delay
      setTimeout(() => {
        router.push(`/clients/${clientId}`)
      }, 1500)
    } catch (err) {
      console.error('Error updating rate:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error && !clientData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/clients"
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-bold">Change Rate</h1>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${clientId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold">Change Rate</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            {/* Client Info */}
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-lg font-semibold">{clientData?.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current Rate: <span className="font-medium">₹{clientData?.currentRate}/class</span>
              </p>
            </div>

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

            {/* New Rate Field */}
            <div className="space-y-2">
              <Label htmlFor="rate">
                New Rate (₹) <span className="text-destructive">*</span>
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
              <p className="text-sm text-muted-foreground">Between ₹100 and ₹10,000</p>
            </div>

            {/* Effective Date Field */}
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">
                Effective Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="effectiveDate"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="text-lg"
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

            {/* Info Message */}
            <Alert>
              <AlertDescription className="text-sm">
                💡 The new rate will apply to <strong>new payments only</strong>. Existing payment history will retain their original rates.
              </AlertDescription>
            </Alert>

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
                {isSubmitting ? 'Updating...' : 'Update Rate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </main>
    </div>
  )
}
