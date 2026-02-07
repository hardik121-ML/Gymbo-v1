/**
 * Export Client PDF Button
 *
 * Trigger button for single client PDF export.
 * Opens ExportModal in "single" mode.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExportModal } from '@/components/ExportModal'

interface ExportClientPDFButtonProps {
  clientId: string
  clientName: string
}

export function ExportClientPDFButton({ clientId, clientName }: ExportClientPDFButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setShowModal(true)}>
        📄 Export PDF
      </Button>
      {showModal && (
        <ExportModal
          mode="single"
          clientId={clientId}
          clientName={clientName}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
