'use client'

// ============================================================================
// Add Client Page
// ============================================================================
// Form to add a new client with name, phone, and rate
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MobileLayout } from '@/components/MobileLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NewClientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rate: '',
  })

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    phone: '',
    rate: '',
  })

  const validateForm = (): boolean => {
    const errors = {
      name: '',
      phone: '',
      rate: '',
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

    setValidationErrors(errors)
    return !errors.name && !errors.phone && !errors.rate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          rate: parseInt(formData.rate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create client')
        setIsSubmitting(false)
        return
      }

      // Success! Navigate to client detail page or back to list
      router.push(`/clients/${data.client.id}`)
    } catch (err) {
      console.error('Error creating client:', err)
      setError('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <MobileLayout
      title="Add Client"
      showBackButton={true}
      backHref="/clients"
    >
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="e.g., 800"
                  className="text-lg"
                  min="100"
                  max="10000"
                  required
                />
                {validationErrors.rate && (
                  <p className="text-sm text-destructive">{validationErrors.rate}</p>
                )}
                <p className="text-sm text-muted-foreground">Between ₹100 and ₹10,000</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href="/clients" className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Adding...' : 'Add Client'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </MobileLayout>
  )
}
