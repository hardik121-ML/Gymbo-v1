/**
 * Export Modal Component
 *
 * Three-screen modal flow for PDF export:
 * 1. Date range selection
 * 2. Generating PDF (loading)
 * 3. Success confirmation
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DateRangeSelector } from '@/components/DateRangeSelector'
import { SuccessOverlay } from '@/components/SuccessOverlay'
import { generateClientPDF } from '@/lib/pdf/generateClientPDF'
import { generateAllClientsPDF } from '@/lib/pdf/generateAllClientsPDF'
import type { DateRangePreset, DateRangeConfig } from '@/lib/pdf/types'

interface ExportModalProps {
  mode: 'single' | 'all'
  clientId?: string
  clientName?: string
  open: boolean
  onClose: () => void
}

type Screen = 'select' | 'generating' | 'success'

export function ExportModal({ mode, clientId, clientName, open, onClose }: ExportModalProps) {
  const [screen, setScreen] = useState<Screen>('select')
  const [dateRange, setDateRange] = useState<DateRangePreset>('allTime')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [generatedFileName, setGeneratedFileName] = useState('')

  // Calculate date range from preset or custom dates
  const calculateDateRange = (): DateRangeConfig | null => {
    const today = new Date()
    let startDate = ''
    let endDate = today.toISOString().split('T')[0]
    let label = ''

    switch (dateRange) {
      case 'last30':
        {
          const date = new Date(today)
          date.setDate(date.getDate() - 30)
          startDate = date.toISOString().split('T')[0]
          label = 'Last 30 days'
        }
        break

      case 'last90':
        {
          const date = new Date(today)
          date.setDate(date.getDate() - 90)
          startDate = date.toISOString().split('T')[0]
          label = 'Last 3 months'
        }
        break

      case 'allTime':
        startDate = ''
        endDate = ''
        label = 'All time'
        break

      case 'custom':
        if (!customStartDate || !customEndDate) {
          setValidationError('Please select both start and end dates')
          return null
        }
        if (customStartDate > customEndDate) {
          setValidationError('Start date must be before or equal to end date')
          return null
        }
        if (customStartDate > today.toISOString().split('T')[0]) {
          setValidationError('Start date cannot be in the future')
          return null
        }
        if (customEndDate > today.toISOString().split('T')[0]) {
          setValidationError('End date cannot be in the future')
          return null
        }
        startDate = customStartDate
        endDate = customEndDate
        label = `${customStartDate} to ${customEndDate}`
        break
    }

    setValidationError(null)
    return { startDate, endDate, label }
  }

  // Handle generate PDF
  const handleGeneratePDF = async () => {
    const dateRangeConfig = calculateDateRange()
    if (!dateRangeConfig) return

    setScreen('generating')
    setError(null)

    try {
      // Build API URL with query params
      const params = new URLSearchParams()
      if (dateRangeConfig.startDate) params.append('startDate', dateRangeConfig.startDate)
      if (dateRangeConfig.endDate) params.append('endDate', dateRangeConfig.endDate)

      const url =
        mode === 'single'
          ? `/api/clients/${clientId}/export-data?${params.toString()}`
          : `/api/clients/export-all?${params.toString()}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()

      // Add label to dateRange
      data.dateRange.label = dateRangeConfig.label

      // Generate PDF (client-side)
      if (mode === 'single') {
        generateClientPDF(data)
        const fileName = `${clientName?.replace(/\s+/g, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`
        setGeneratedFileName(fileName)
      } else {
        generateAllClientsPDF(data)
        const fileName = `All_Clients_Summary_${new Date().toISOString().split('T')[0]}.pdf`
        setGeneratedFileName(fileName)
      }

      // Show success
      setScreen('success')

      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF. Please try again.')
      setScreen('select')
    }
  }

  // Handle custom date changes
  const handleCustomDatesChange = (start: string, end: string) => {
    setCustomStartDate(start)
    setCustomEndDate(end)
    setValidationError(null)
  }

  // Reset state when modal closes
  const handleClose = () => {
    setScreen('select')
    setDateRange('allTime')
    setCustomStartDate('')
    setCustomEndDate('')
    setError(null)
    setValidationError(null)
    setGeneratedFileName('')
    onClose()
  }

  return (
    <>
      <Dialog open={open && screen !== 'success'} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          {screen === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle>Export as PDF</DialogTitle>
                <DialogDescription>
                  {mode === 'single'
                    ? `Generate a PDF statement for ${clientName}`
                    : 'Generate a summary PDF for all clients'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <DateRangeSelector
                  selectedRange={dateRange}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onRangeChange={setDateRange}
                  onCustomDatesChange={handleCustomDatesChange}
                  validationError={validationError || undefined}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleGeneratePDF} disabled={!!validationError}>
                  Generate PDF
                </Button>
              </div>
            </>
          )}

          {screen === 'generating' && (
            <>
              <DialogHeader>
                <DialogTitle>Generating PDF</DialogTitle>
                <DialogDescription>Please wait while we generate your PDF...</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-muted-foreground">Generating your PDF...</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success overlay */}
      {screen === 'success' && (
        <SuccessOverlay
          primaryText="PDF exported!"
          secondaryText={generatedFileName}
          onDismiss={handleClose}
        />
      )}
    </>
  )
}
