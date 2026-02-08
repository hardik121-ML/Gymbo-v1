import Link from 'next/link'
import { FileText } from 'lucide-react'

export function ExportAllClientsButton() {
  return (
    <Link
      href="/clients/export"
      className="flex items-center gap-2 px-4 py-2 border border-foreground/10 rounded-full text-xs font-mono lowercase hover:bg-foreground/5 transition-colors"
    >
      <FileText size={14} strokeWidth={1.5} />
      export all
    </Link>
  )
}
