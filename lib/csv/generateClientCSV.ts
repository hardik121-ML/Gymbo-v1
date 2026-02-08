/**
 * Client CSV Generator
 *
 * Generates CSV string for a single client's statement data.
 */

import type { ClientPDFData } from '@/lib/pdf/types'

function formatCurrency(paise: number): string {
  return (paise / 100).toFixed(2)
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateClientCSV(data: ClientPDFData): string {
  const rows: string[] = []

  // Header info
  rows.push('CLIENT STATEMENT')
  rows.push(`Client,${escapeCSV(data.client.name)}`)
  if (data.client.phone) rows.push(`Phone,${escapeCSV(data.client.phone)}`)
  rows.push(`Period,${escapeCSV(data.dateRange.label)}`)
  rows.push('')

  // Classes section
  rows.push('CLASSES ATTENDED')
  rows.push('Date,Paid with Credit')
  if (data.punches.length === 0) {
    rows.push('No classes in selected period')
  } else {
    data.punches.forEach((punch) => {
      rows.push(`${punch.punch_date},${punch.paid_with_credit ? 'Yes' : 'No'}`)
    })
  }
  rows.push('')

  // Payments section
  rows.push('PAYMENTS RECEIVED')
  rows.push('Date,Amount,Classes Added,Rate,Credit Used,Credit Added')
  if (data.payments.length === 0) {
    rows.push('No payments in selected period')
  } else {
    data.payments.forEach((payment) => {
      rows.push([
        payment.payment_date,
        formatCurrency(payment.amount),
        payment.classes_added.toString(),
        formatCurrency(payment.rate_at_payment),
        payment.credit_used ? formatCurrency(payment.credit_used) : '0',
        payment.credit_added ? formatCurrency(payment.credit_added) : '0',
      ].join(','))
    })
  }
  rows.push('')

  // Balance
  rows.push('BALANCE SUMMARY')
  rows.push(`Current Balance,${data.balance.current} classes`)
  rows.push(`Credit Balance,${formatCurrency(data.balance.credit)}`)
  if (data.balance.amountDue > 0) {
    rows.push(`Amount Due,${formatCurrency(data.balance.amountDue)}`)
  }

  return rows.join('\n')
}

function generateFilename(clientName: string): string {
  const name = clientName.replace(/[^a-zA-Z0-9]/g, '_')
  const today = new Date().toISOString().split('T')[0]
  return `${name}_Statement_${today}.csv`
}

export function downloadClientCSV(data: ClientPDFData): void {
  const csv = generateClientCSV(data)
  const filename = generateFilename(data.client.name)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function getClientCSVBlob(data: ClientPDFData): { blob: Blob; filename: string } {
  const csv = generateClientCSV(data)
  const filename = generateFilename(data.client.name)
  return { blob: new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename }
}
