'use client'

// ============================================================================
// Add Client Page
// ============================================================================
// Form to add a new client with name, phone, and rate
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/clients"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Add Client</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter client name"
                required
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10-digit mobile number"
                maxLength={10}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>

            {/* Rate Field */}
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                Rate per Class (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="rate"
                inputMode="numeric"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 800"
                min="100"
                max="10000"
                required
              />
              {validationErrors.rate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rate}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Between ₹100 and ₹10,000</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href="/clients"
                className="flex-1 bg-gray-200 text-gray-700 text-center font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
