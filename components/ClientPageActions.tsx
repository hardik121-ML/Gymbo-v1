'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ImportContactsButton } from '@/components/ImportContactsButton'
import { useRouter } from 'next/navigation'

export function ClientPageActions() {
  const router = useRouter()

  const handleImportComplete = () => {
    // Refresh the page to show newly imported clients
    router.refresh()
  }

  return (
    <div className="mb-6 space-y-3">
      <Link href="/clients/new" className="block">
        <Button className="w-full" size="lg">
          + Add Client
        </Button>
      </Link>

      <ImportContactsButton onImportComplete={handleImportComplete} />
    </div>
  )
}
