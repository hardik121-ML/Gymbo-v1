/**
 * Export All Clients Button
 *
 * Trigger button for all clients summary PDF export.
 * Opens ExportModal in "all" mode.
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExportModal } from '@/components/ExportModal'

export function ExportAllClientsButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button variant="outline" className="w-full" size="lg" onClick={() => setShowModal(true)}>
        📊 Export All
      </Button>
      {showModal && (
        <ExportModal mode="all" open={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
