'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Share2, Download, Printer } from 'lucide-react'

interface StatementPreviewProps {
  pdfBlob: Blob
  filename: string
  onBack: () => void
}

export function StatementPreview({ pdfBlob, filename, onBack }: StatementPreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(pdfBlob)
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pdfBlob])

  const handleShare = async () => {
    const file = new File([pdfBlob], filename, { type: 'application/pdf' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      // Desktop fallback: just download the file
      handleDownload()
    }
  }

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
  }

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-foreground/5">
        <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto w-full">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center -ml-2"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-sm font-bold lowercase tracking-widest text-center absolute left-1/2 -translate-x-1/2">
            statement preview
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* PDF Preview */}
      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        {blobUrl && (
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '210/297' }}>
            <iframe
              ref={iframeRef}
              src={`${blobUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-foreground/5 px-6 py-4">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider"
          >
            <Share2 size={18} strokeWidth={1.5} />
            share
          </button>
          <button
            onClick={handleDownload}
            className="w-14 h-14 rounded-full border border-foreground/20 flex items-center justify-center"
          >
            <Download size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={handlePrint}
            className="w-14 h-14 rounded-full border border-foreground/20 flex items-center justify-center"
          >
            <Printer size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
