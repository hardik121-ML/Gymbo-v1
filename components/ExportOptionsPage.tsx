'use client'

import { useState } from 'react'
import { AppShell } from '@/components/AppShell'
import { StatementPreview } from '@/components/StatementPreview'
import { downloadClientPDF, getClientPDFBlob } from '@/lib/pdf/generateClientPDF'
import { downloadAllClientsPDF, getAllClientsPDFBlob } from '@/lib/pdf/generateAllClientsPDF'
import { downloadClientCSV } from '@/lib/csv/generateClientCSV'
import { downloadAllClientsCSV } from '@/lib/csv/generateAllClientsCSV'
import { Download, Share2 } from 'lucide-react'
import type { DateRangePreset, DateRangeConfig } from '@/lib/pdf/types'

type ExportFormat = 'pdf' | 'csv'

interface ExportOptionsPageProps {
  mode: 'single' | 'all'
  clientId?: string
  clientName?: string
}

const datePresets: { value: DateRangePreset; label: string }[] = [
  { value: 'thisMonth', label: 'this month' },
  { value: 'lastMonth', label: 'last month' },
  { value: 'last3Months', label: 'last 3 months' },
  { value: 'custom', label: 'custom' },
]

export function ExportOptionsPage({ mode, clientId, clientName }: ExportOptionsPageProps) {
  const [view, setView] = useState<'options' | 'preview'>('options')
  const [dateRange, setDateRange] = useState<DateRangePreset>('thisMonth')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [includeNotes, setIncludeNotes] = useState(true)
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfFilename, setPdfFilename] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const calculateDateRange = (): DateRangeConfig | null => {
    const now = new Date()
    let startDate = ''
    let endDate = today
    let label = ''

    switch (dateRange) {
      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate = start.toISOString().split('T')[0]
        label = 'This month'
        break
      }
      case 'lastMonth': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        startDate = start.toISOString().split('T')[0]
        endDate = end.toISOString().split('T')[0]
        label = 'Last month'
        break
      }
      case 'last3Months': {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        startDate = start.toISOString().split('T')[0]
        label = 'Last 3 months'
        break
      }
      case 'custom': {
        if (!customStartDate || !customEndDate) {
          setValidationError('please select both start and end dates')
          return null
        }
        if (customStartDate > customEndDate) {
          setValidationError('start date must be before end date')
          return null
        }
        if (customStartDate > today) {
          setValidationError('start date cannot be in the future')
          return null
        }
        startDate = customStartDate
        endDate = customEndDate
        label = `${customStartDate} to ${customEndDate}`
        break
      }
    }

    setValidationError(null)
    return { startDate, endDate, label }
  }

  const fetchData = async (dateRangeConfig: DateRangeConfig) => {
    const params = new URLSearchParams()
    if (dateRangeConfig.startDate) params.append('startDate', dateRangeConfig.startDate)
    if (dateRangeConfig.endDate) params.append('endDate', dateRangeConfig.endDate)

    const url =
      mode === 'single'
        ? `/api/clients/${clientId}/export-data?${params.toString()}`
        : `/api/clients/export-all?${params.toString()}`

    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch data')

    const data = await response.json()
    data.dateRange.label = dateRangeConfig.label

    // Strip credit notes if "include notes" is unchecked
    if (!includeNotes && data.payments) {
      data.payments = data.payments.map((p: Record<string, unknown>) => ({
        ...p,
        credit_added: 0,
        credit_used: 0,
      }))
    }

    return data
  }

  const handleGenerateStatement = async () => {
    const dateRangeConfig = calculateDateRange()
    if (!dateRangeConfig) return

    setGenerating(true)
    setError(null)

    try {
      const data = await fetchData(dateRangeConfig)

      if (format === 'csv') {
        if (mode === 'single') {
          downloadClientCSV(data)
        } else {
          downloadAllClientsCSV(data)
        }
      } else {
        if (mode === 'single') {
          downloadClientPDF(data)
        } else {
          downloadAllClientsPDF(data)
        }
      }

      if (navigator.vibrate) navigator.vibrate(50)
    } catch {
      setError(`failed to generate ${format}. please try again.`)
    } finally {
      setGenerating(false)
    }
  }

  const handlePreviewAndShare = async () => {
    const dateRangeConfig = calculateDateRange()
    if (!dateRangeConfig) return

    setGenerating(true)
    setError(null)

    try {
      const data = await fetchData(dateRangeConfig)

      if (mode === 'single') {
        const { blob, filename } = getClientPDFBlob(data)
        setPdfBlob(blob)
        setPdfFilename(filename)
      } else {
        const { blob, filename } = getAllClientsPDFBlob(data)
        setPdfBlob(blob)
        setPdfFilename(filename)
      }

      setView('preview')
    } catch {
      setError('failed to generate preview. please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (view === 'preview' && pdfBlob) {
    return (
      <StatementPreview
        pdfBlob={pdfBlob}
        filename={pdfFilename}
        onBack={() => setView('options')}
      />
    )
  }

  const backHref = mode === 'single' ? `/clients/${clientId}` : '/clients'
  const title = clientName ? `export · ${clientName.toLowerCase()}` : 'export options'

  return (
    <AppShell title={title} showBackButton={true} backHref={backHref}>
      <div className="flex flex-col min-h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
        <div className="flex-1 space-y-8">
          {/* Date Range */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              date range
            </label>
            <div className="flex flex-wrap gap-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setDateRange(preset.value)
                    setValidationError(null)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold lowercase tracking-wider transition-colors ${
                    dateRange === preset.value
                      ? 'bg-foreground text-background'
                      : 'border border-foreground/20'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {dateRange === 'custom' && (
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider block mb-1">
                    from
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    max={today}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value)
                      setValidationError(null)
                    }}
                    className="w-full bg-transparent border-0 border-b border-foreground/20 py-2 text-sm focus:outline-none focus:border-foreground"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider block mb-1">
                    to
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate || undefined}
                    max={today}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value)
                      setValidationError(null)
                    }}
                    className="w-full bg-transparent border-0 border-b border-foreground/20 py-2 text-sm focus:outline-none focus:border-foreground"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
            )}

            {validationError && (
              <p className="text-sm text-status-negative">{validationError}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              content
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold lowercase">include notes</span>
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-5 h-5 accent-foreground"
              />
            </label>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono lowercase opacity-50 tracking-wider">
              format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('pdf')}
                className={`px-4 py-2 rounded-full text-sm font-bold lowercase tracking-wider transition-colors ${
                  format === 'pdf'
                    ? 'bg-foreground text-background'
                    : 'border border-foreground/20'
                }`}
              >
                pdf
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={`px-4 py-2 rounded-full text-sm font-bold lowercase tracking-wider transition-colors ${
                  format === 'csv'
                    ? 'bg-foreground text-background'
                    : 'border border-foreground/20'
                }`}
              >
                csv
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-status-negative">{error}</p>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="space-y-3 pt-8 pb-4">
          <button
            onClick={handleGenerateStatement}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-foreground text-background font-bold text-sm lowercase tracking-wider disabled:opacity-50"
          >
            <Download size={18} strokeWidth={1.5} />
            {generating ? 'generating...' : 'generate statement'}
          </button>
          {format === 'pdf' && (
            <button
              onClick={handlePreviewAndShare}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-full border border-foreground/20 font-bold text-sm lowercase tracking-wider disabled:opacity-50"
            >
              <Share2 size={18} strokeWidth={1.5} />
              preview & share
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
