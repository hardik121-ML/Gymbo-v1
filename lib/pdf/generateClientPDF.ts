/**
 * Client PDF Generator
 *
 * Generates individual client statement PDFs matching the invoice-style design:
 * Brand icon + STATEMENT header, BILL TO, line items table, TOTAL DUE.
 */

import jsPDF from 'jspdf'
import type { ClientPDFData } from './types'
import {
  PDF_CONFIG,
  addStatementHeader,
  addBillTo,
  addLineItemsTable,
  addTotalDue,
  addFooter,
  checkPageBreak,
  formatCurrency,
  formatDateShort,
  formatDate,
  generateInvoiceCode,
} from './pdfTemplate'

export function generateClientPDF(data: ClientPDFData): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const today = new Date().toISOString().split('T')[0]
  const invoiceCode = generateInvoiceCode(data.client.name, today)
  const statementDate = formatDate(today)

  // Header: brand icon, STATEMENT, invoice code, date, brand name, address
  let yPos = addStatementHeader(doc, data.trainer, invoiceCode, statementDate)

  // BILL TO: client name + phone
  yPos = addBillTo(doc, yPos, data.client.name, data.client.phone)

  // Build line items — punches as "Training Session" rows with per-class rate
  const lineItems: Array<{ description: string; date: string; amount: string }> = []

  // Determine rate per class from the most recent payment, or show "-"
  const ratePerClass = data.payments.length > 0
    ? data.payments[0].rate_at_payment
    : 0

  data.punches.forEach((punch) => {
    lineItems.push({
      description: 'Training Session',
      date: formatDateShort(punch.punch_date),
      amount: ratePerClass > 0 ? formatCurrency(ratePerClass) : '-',
    })
  })

  // Add payment rows below punches
  data.payments.forEach((payment) => {
    const note = payment.credit_added && payment.credit_added > 0
      ? ` +${formatCurrency(payment.credit_added)} credit`
      : ''
    lineItems.push({
      description: `Payment (${payment.classes_added} classes)${note}`,
      date: formatDateShort(payment.payment_date),
      amount: formatCurrency(payment.amount),
    })
  })

  if (lineItems.length === 0) {
    doc.setFontSize(PDF_CONFIG.fontSize.body)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text('No activity in selected period', PDF_CONFIG.marginLeft, yPos)
    doc.setTextColor(...PDF_CONFIG.colors.black)
    yPos += 15
  } else {
    yPos = addLineItemsTable(doc, yPos, lineItems)
  }

  // Total due section
  yPos = checkPageBreak(doc, yPos, 50)
  const isCredit = data.balance.amountDue === 0
  const totalAmount = data.balance.amountDue > 0
    ? formatCurrency(data.balance.amountDue)
    : `${data.balance.current} classes`

  yPos = addTotalDue(doc, yPos, totalAmount, isCredit)

  // Footer
  addFooter(doc)

  // Filename
  const clientName = data.client.name.replace(/[^a-zA-Z0-9]/g, '_')
  const filename = `${clientName}_Statement_${today}.pdf`

  return { doc, filename }
}

export function downloadClientPDF(data: ClientPDFData): void {
  const { doc, filename } = generateClientPDF(data)
  doc.save(filename)
}

export function getClientPDFBlob(data: ClientPDFData): { blob: Blob; filename: string } {
  const { doc, filename } = generateClientPDF(data)
  return { blob: doc.output('blob'), filename }
}
