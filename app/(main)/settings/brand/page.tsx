'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MobileLayout } from '@/components/MobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormSkeleton } from '@/components/LoadingSkeletons'

interface FormData {
  brand_name: string
  brand_address: string
  brand_phone: string
  brand_email: string
}

interface ValidationErrors {
  brand_name?: string
  brand_address?: string
  brand_phone?: string
  brand_email?: string
}

export default function BrandSettingsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    brand_name: '',
    brand_address: '',
    brand_phone: '',
    brand_email: '',
  })
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  // Fetch current trainer data on mount
  useEffect(() => {
    async function fetchTrainer() {
      try {
        const response = await fetch('/api/trainers')
        if (!response.ok) {
          throw new Error('Failed to fetch trainer data')
        }
        const { trainer } = await response.json()
        setFormData({
          brand_name: trainer.brand_name || '',
          brand_address: trainer.brand_address || '',
          brand_phone: trainer.brand_phone || '',
          brand_email: trainer.brand_email || '',
        })
      } catch (err) {
        setError('Failed to load settings. Please try again.')
        console.error('Error fetching trainer:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTrainer()
  }, [])

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {}

    // Business name: min 2 chars
    if (!formData.brand_name.trim() || formData.brand_name.trim().length < 2) {
      errors.brand_name = 'Business name must be at least 2 characters'
    }

    // Business address: min 5 chars
    if (!formData.brand_address.trim() || formData.brand_address.trim().length < 5) {
      errors.brand_address = 'Business address must be at least 5 characters'
    }

    // Business phone: 10 digits, starts with 6-9
    const phoneRegex = /^[6-9]\d{9}$/
    if (!formData.brand_phone.trim() || !phoneRegex.test(formData.brand_phone.trim())) {
      errors.brand_phone = 'Phone must be 10 digits starting with 6-9'
    }

    // Business email: optional, but must be valid if provided
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.brand_email.trim() && !emailRegex.test(formData.brand_email.trim())) {
      errors.brand_email = 'Invalid email format'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/trainers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.errors) {
          setValidationErrors(data.errors)
          return
        }
        throw new Error(data.error || 'Failed to save settings')
      }

      // Success - redirect to clients page
      router.push('/clients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      console.error('Error saving brand settings:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MobileLayout title="Brand Settings" showBackButton={true} backHref="/clients">
        <FormSkeleton />
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Brand Settings" showBackButton={true} backHref="/clients">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form-level error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info alert */}
            <Alert>
              <AlertDescription>
                These details will appear on client statements and exported documents.
              </AlertDescription>
            </Alert>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="brand_name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand_name"
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="e.g., FitZone Personal Training"
                disabled={isSubmitting}
                className={validationErrors.brand_name ? 'border-destructive' : ''}
              />
              {validationErrors.brand_name && (
                <p className="text-sm text-destructive">{validationErrors.brand_name}</p>
              )}
            </div>

            {/* Business Address */}
            <div className="space-y-2">
              <Label htmlFor="brand_address">
                Business Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand_address"
                type="text"
                value={formData.brand_address}
                onChange={(e) => setFormData({ ...formData, brand_address: e.target.value })}
                placeholder="e.g., 123 Main Street, Mumbai 400001"
                disabled={isSubmitting}
                className={validationErrors.brand_address ? 'border-destructive' : ''}
              />
              {validationErrors.brand_address && (
                <p className="text-sm text-destructive">{validationErrors.brand_address}</p>
              )}
            </div>

            {/* Business Phone */}
            <div className="space-y-2">
              <Label htmlFor="brand_phone">
                Business Phone <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">+91</span>
                <Input
                  id="brand_phone"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.brand_phone}
                  onChange={(e) => setFormData({ ...formData, brand_phone: e.target.value })}
                  placeholder="9876543210"
                  disabled={isSubmitting}
                  className={validationErrors.brand_phone ? 'border-destructive' : ''}
                />
              </div>
              {validationErrors.brand_phone && (
                <p className="text-sm text-destructive">{validationErrors.brand_phone}</p>
              )}
            </div>

            {/* Business Email */}
            <div className="space-y-2">
              <Label htmlFor="brand_email">Business Email</Label>
              <Input
                id="brand_email"
                type="email"
                inputMode="email"
                value={formData.brand_email}
                onChange={(e) => setFormData({ ...formData, brand_email: e.target.value })}
                placeholder="contact@fitzone.com"
                disabled={isSubmitting}
                className={validationErrors.brand_email ? 'border-destructive' : ''}
              />
              {validationErrors.brand_email && (
                <p className="text-sm text-destructive">{validationErrors.brand_email}</p>
              )}
            </div>

            {/* Preview link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewDialog(true)}
                className="text-sm text-primary underline hover:no-underline"
              >
                Preview how this appears on statements...
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push('/clients')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Statement Preview</DialogTitle>
            <DialogDescription>
              PDF export feature is currently under development. Your brand settings will appear on
              client statements once this feature is implemented.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button onClick={() => setShowPreviewDialog(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  )
}
