'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { UserPlus, Contact } from 'lucide-react'

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

  const handleImportFromContacts = async () => {
    const supported = 'contacts' in navigator && 'ContactsManager' in window
    if (!supported) {
      setError('contact import is only supported on chrome/edge on android')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: false }
      )

      if (contacts.length === 0) return

      const contact = contacts[0]
      const name = contact.name?.[0] || ''
      const phoneNumbers = contact.tel || []

      // Prefer Indian mobile number, otherwise use first
      let phone = phoneNumbers[0] || ''
      const mobileNumber = phoneNumbers.find((num: string) => {
        const digits = num.replace(/\D/g, '')
        return /^[6-9]\d{9}$/.test(digits) || /^91[6-9]\d{9}$/.test(digits)
      })
      if (mobileNumber) phone = mobileNumber

      // Normalize phone: strip non-digits, remove 91 prefix
      let cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.slice(2)
      }

      setFormData(prev => ({
        ...prev,
        name: name || prev.name,
        phone: cleanPhone || prev.phone,
      }))
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error selecting contact:', err)
      }
    }
  }

  const validateForm = (): boolean => {
    const errors = { name: '', phone: '', rate: '' }

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

    setValidationErrors(errors)
    return !errors.name && !errors.phone && !errors.rate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          rate: parseInt(formData.rate),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'failed to create client')
        setIsSubmitting(false)
        return
      }

      router.push(`/clients/${data.client.id}`)
    } catch (err) {
      console.error('Error creating client:', err)
      setError('an unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <AppShell
      title="add client"
      showBackButton={true}
      backHref="/clients"
    >
      <form onSubmit={handleSubmit} className="flex flex-col min-h-[calc(100vh-10rem)]">
        {/* Error */}
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-full text-center mb-6">
            {error}
          </p>
        )}

        {/* Import from Contacts */}
        <div className="flex justify-center mb-4">
          <button
            type="button"
            onClick={handleImportFromContacts}
            className="flex items-center gap-2 text-sm font-mono lowercase underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            <Contact size={16} strokeWidth={1.5} />
            import from contacts
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex-1 space-y-8 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              full name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex. Alex Chen"
              className="w-full bg-transparent border-0 border-b border-foreground/20 py-3 text-lg font-bold placeholder:opacity-30 placeholder:font-normal focus:border-foreground outline-none transition-colors"
              required
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
            />
            {validationErrors.phone && (
              <p className="text-xs text-destructive">{validationErrors.phone}</p>
            )}
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              default rate
            </label>
            <div className="flex items-center border-b border-foreground/20 focus-within:border-foreground transition-colors">
              <span className="text-lg opacity-40 mr-1">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                placeholder="800"
                className="flex-1 bg-transparent border-0 py-3 text-lg font-bold placeholder:opacity-30 placeholder:font-normal outline-none"
                min="100"
                max="10000"
                required
              />
              <span className="text-sm font-mono opacity-40 lowercase">/ class</span>
            </div>
            {validationErrors.rate && (
              <p className="text-xs text-destructive">{validationErrors.rate}</p>
            )}
          </div>
        </div>

        {/* Create Button */}
        <div className="pt-8 pb-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-30 transition-opacity shadow-xl"
          >
            <UserPlus size={18} strokeWidth={1.5} />
            {isSubmitting ? 'creating...' : 'create client'}
          </button>
        </div>
      </form>
    </AppShell>
  )
}
