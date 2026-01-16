'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ImportReviewModal } from '@/components/ImportReviewModal'

interface Contact {
  name: string
  phone: string
}

interface ImportContactsButtonProps {
  onImportComplete?: () => void
}

export function ImportContactsButton({ onImportComplete }: ImportContactsButtonProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  useEffect(() => {
    // Check if Contact Picker API is supported
    if ('contacts' in navigator && 'ContactsManager' in window) {
      setIsSupported(true)
    }
  }, [])

  const handleImportClick = async () => {
    if (!isSupported) return

    setIsSelecting(true)

    try {
      // Request contacts with name and phone number
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contacts = await (navigator as any).contacts.select(
        ['name', 'tel'],
        { multiple: true }
      )

      // Process contacts
      const processedContacts: Contact[] = []

      for (const contact of contacts) {
        const name = contact.name?.[0] || 'Unknown'

        // Get phone numbers
        const phoneNumbers = contact.tel || []

        if (phoneNumbers.length === 0) {
          continue // Skip contacts without phone numbers
        }

        // Prefer mobile number, otherwise use first number
        let phone = phoneNumbers[0]

        // Try to find a mobile number (this is a best-effort approach)
        const mobileNumber = phoneNumbers.find((num: string) => {
          const digits = num.replace(/\D/g, '')
          // Indian mobile numbers start with 6-9 and have 10 digits
          return /^[6-9]\d{9}$/.test(digits) || /^91[6-9]\d{9}$/.test(digits)
        })

        if (mobileNumber) {
          phone = mobileNumber
        }

        processedContacts.push({
          name,
          phone,
        })
      }

      if (processedContacts.length > 0) {
        setSelectedContacts(processedContacts)
        setShowReviewModal(true)
      } else {
        alert('No valid contacts selected')
      }
    } catch (error) {
      console.error('Error selecting contacts:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        // AbortError means user cancelled, don't show error for that
        alert('Failed to select contacts. Please try again.')
      }
    } finally {
      setIsSelecting(false)
    }
  }

  const handleImportComplete = () => {
    setShowReviewModal(false)
    setSelectedContacts([])
    onImportComplete?.()
  }

  const handleCancel = () => {
    setShowReviewModal(false)
    setSelectedContacts([])
  }

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        disabled
        title="Contact import is only supported on Chrome/Edge on Android"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Import from Contacts
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleImportClick}
        disabled={isSelecting}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {isSelecting ? 'Selecting...' : 'Import from Contacts'}
      </Button>

      {showReviewModal && (
        <ImportReviewModal
          contacts={selectedContacts}
          onConfirm={handleImportComplete}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
