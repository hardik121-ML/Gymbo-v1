'use client'

// ============================================================================
// Change Rate Page
// ============================================================================
// Form to change client rate with effective date tracking
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !clientData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/clients"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Change Rate</h1>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/clients/${clientId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Change Rate</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Client Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{clientData?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Current Rate: <span className="font-medium text-gray-900">₹{clientData?.currentRate}/class</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                ✓ {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* New Rate Field */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                New Rate (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="rate"
                inputMode="numeric"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1000"
                min="100"
                max="10000"
                required
                disabled={isSubmitting}
              />
              {validationErrors.rate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rate}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Between ₹100 and ₹10,000</p>
            </div>

            {/* Effective Date Field */}
            <div>
              <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="effectiveDate"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
              {validationErrors.effectiveDate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.effectiveDate}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                The date from which the new rate will apply
              </p>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
              💡 The new rate will apply to <strong>new payments only</strong>. Existing payment history will retain their original rates.
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href={`/clients/${clientId}`}
                className="flex-1 bg-gray-200 text-gray-700 text-center font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !!successMessage}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
