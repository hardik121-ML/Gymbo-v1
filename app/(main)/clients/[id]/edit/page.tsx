'use client'

// ============================================================================
// Edit Client Page
// ============================================================================
// Form to edit client name and phone (rate editing is separate)
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

export default function EditClientPage({ params }: PageProps) {
  const router = useRouter()
  const [clientId, setClientId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    phone: '',
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

        setFormData({
          name: client.name || '',
          phone: client.phone || '',
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

    setValidationErrors(errors)
    return !errors.name && !errors.phone
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
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update client')
        setIsSubmitting(false)
        return
      }

      // Success! Navigate back to client detail page
      router.push(`/clients/${clientId}`)
    } catch (err) {
      console.error('Error updating client:', err)
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

  if (error && !formData.name) {
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
              <h1 className="text-xl font-bold">Edit Client</h1>
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
            <h1 className="text-xl font-bold">Edit Client</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
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

              {/* Info Message */}
              <Alert>
                <AlertDescription className="text-sm">
                  💡 To change the rate, use the "Change Rate" option (coming soon). Rate changes are tracked separately for history.
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href={`/clients/${clientId}`} className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
