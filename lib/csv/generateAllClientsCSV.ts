/**
 * All Clients CSV Generator
 *
 * Generates CSV string for all clients summary data.
 */

import type { AllClientsPDFData } from '@/lib/pdf/types'

function formatCurrency(paise: number): string {
  return (paise / 100).toFixed(2)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateAllClientsCSV(data: AllClientsPDFData): string {
  const rows: string[] = []

  // Header
  rows.push('ALL CLIENTS SUMMARY')
  rows.push(`Period,${escapeCSV(data.dateRange.label)}`)
  rows.push('')

  // Summary stats
  rows.push('SUMMARY')
  rows.push(`Total Clients,${data.summary.totalClients}`)
  rows.push(`Total Classes (Remaining),${data.summary.totalClasses}`)
  rows.push(`Total Payments Received,${formatCurrency(data.summary.totalPayments)}`)
  rows.push(`Total Outstanding,${formatCurrency(data.summary.totalOutstanding)}`)
  rows.push('')

  // Client list
  rows.push('CLIENT LIST')
  rows.push('Name,Phone,Balance,Credit,Amount Due,Rate')
  data.clients.forEach((client) => {
    rows.push([
      escapeCSV(client.name),
      escapeCSV(client.phone || 'N/A'),
      client.balance.toString(),
      formatCurrency(client.credit),
      formatCurrency(client.amountDue),
      formatCurrency(client.current_rate),
    ].join(','))
  })

  return rows.join('\n')
}

export function downloadAllClientsCSV(data: AllClientsPDFData): void {
  const csv = generateAllClientsCSV(data)
  const today = new Date().toISOString().split('T')[0]
  const filename = `All_Clients_Summary_${today}.csv`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getAllClientsCSVBlob(data: AllClientsPDFData): { blob: Blob; filename: string } {
  const csv = generateAllClientsCSV(data)
  const today = new Date().toISOString().split('T')[0]
  const filename = `All_Clients_Summary_${today}.csv`
  return { blob: new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename }
}
