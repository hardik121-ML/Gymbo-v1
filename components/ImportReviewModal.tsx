'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Contact {
  name: string
  phone: string
}

interface ImportReviewModalProps {
  contacts: Contact[]
  onConfirm: () => void
  onCancel: () => void
}

interface ImportResult {
  imported: Array<{
    id: string
    name: string
    phone: string | null
  }>
  skipped: Array<{
    name: string
    phone: string
    reason: string
  }>
  message?: string
}

export function ImportReviewModal({ contacts, onConfirm, onCancel }: ImportReviewModalProps) {
  const router = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleConfirmImport = async () => {
    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/clients/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to import contacts')
        return
      }

      // Show result screen
      setImportResult(data)
      setShowResult(true)
    } catch (err) {
      console.error('Error importing contacts:', err)
      setError('Failed to import contacts. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (showResult && importResult && importResult.imported.length > 0) {
      // Refresh the page to show new clients
      router.refresh()
    }
    onConfirm()
  }

  // Result screen after import
  if (showResult && importResult) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Complete</DialogTitle>
            <DialogDescription>
              Here&apos;s a summary of your import
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Success message */}
            {importResult.imported.length > 0 && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="text-green-700 dark:text-green-400">
                  ✓ Successfully imported {importResult.imported.length} client
                  {importResult.imported.length === 1 ? '' : 's'}
                </AlertDescription>
              </Alert>
            )}

            {/* Imported clients */}
            {importResult.imported.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Imported Clients:</h4>
                <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-md border border-border p-2">
                  {importResult.imported.map((client, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 rounded bg-muted/50 flex justify-between"
                    >
                      <span className="font-medium">{client.name}</span>
                      <span className="text-muted-foreground">{client.phone}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Set rates for these clients by clicking &quot;Edit Client&quot; on their detail pages
                </p>
              </div>
            )}

            {/* Skipped contacts */}
            {importResult.skipped.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                  Skipped Contacts ({importResult.skipped.length}):
                </h4>
                <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-md border border-yellow-500/20 p-2">
                  {importResult.skipped.map((contact, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-muted-foreground">{contact.phone}</span>
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-400">
                        {contact.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Review screen before import
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Contacts</DialogTitle>
          <DialogDescription>
            Review the selected contacts before importing. Duplicates will be automatically
            skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Contact list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Selected Contacts ({contacts.length})
              </h4>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto rounded-md border border-border p-2">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="text-sm p-2 rounded bg-muted/50 flex justify-between items-center"
                >
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-muted-foreground text-xs">{contact.phone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info message */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Note:</strong> Clients will be imported without rates. You&apos;ll need to set
              rates individually after import.
            </AlertDescription>
          </Alert>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isImporting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? 'Importing...' : `Import ${contacts.length} Contact${contacts.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
