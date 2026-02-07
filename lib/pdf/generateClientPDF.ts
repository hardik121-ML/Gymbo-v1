/**
 * Client PDF Generator
 *
 * Generates individual client statement PDFs with punches, payments, and balance info.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ClientPDFData } from './types'
import {
  PDF_CONFIG,
  addHeader,
  addFooter,
  addSectionDivider,
  addSectionHeading,
  checkPageBreak,
  formatCurrency,
  formatDate,
  sanitizeText,
} from './pdfTemplate'

export function generateClientPDF(data: ClientPDFData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Add header
  let yPos = addHeader(doc, 'CLIENT STATEMENT', {
    name: data.trainer.brand_name,
    address: data.trainer.brand_address,
    phone: data.trainer.brand_phone,
    email: data.trainer.brand_email,
  })

  // Client info
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'bold')
  doc.text(`Client: ${sanitizeText(data.client.name)}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 5

  if (data.client.phone) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Phone: ${sanitizeText(data.client.phone)}`, PDF_CONFIG.marginLeft, yPos)
    yPos += 5
  }

  doc.text(`Period: ${data.dateRange.label}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 8

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // CLASSES ATTENDED SECTION
  yPos = addSectionHeading(doc, yPos, 'CLASSES ATTENDED')

  if (data.punches.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text('No classes in selected period', PDF_CONFIG.marginLeft, yPos)
    doc.setTextColor(...PDF_CONFIG.colors.black)
    yPos += 10
  } else {
    // Prepare table data
    const punchData = data.punches.map((punch) => [
      formatDate(punch.punch_date),
      punch.paid_with_credit ? 'Yes' : 'No',
    ])

    // Generate table using autoTable
    autoTable(doc as any, {
      startY: yPos,
      head: [['Date', 'Paid with Credit']],
      body: punchData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [235, 235, 230],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: [10, 10, 10], // Consistent black background
        fontSize: 10,
        textColor: [235, 235, 230],
      },
      styles: {
        cellPadding: 3,
        lineColor: [60, 60, 60],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Date
        1: { cellWidth: 60 }, // Paid with Credit
      },
      margin: { left: PDF_CONFIG.marginLeft, right: PDF_CONFIG.marginRight },
    })

    yPos = (doc as any).lastAutoTable.finalY + 5
  }

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // PAYMENTS RECEIVED SECTION
  yPos = addSectionHeading(doc, yPos, 'PAYMENTS RECEIVED')

  if (data.payments.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text('No payments in selected period', PDF_CONFIG.marginLeft, yPos)
    doc.setTextColor(...PDF_CONFIG.colors.black)
    yPos += 10
  } else {
    // Prepare table data with credit info in a Notes column
    const paymentData = data.payments.map((payment) => {
      const creditNotes = []
      if (payment.credit_used && payment.credit_used > 0) {
        creditNotes.push(`+${formatCurrency(payment.credit_used)} credit used`)
      }
      if (payment.credit_added && payment.credit_added > 0) {
        creditNotes.push(`+${formatCurrency(payment.credit_added)} credit added`)
      }

      return [
        formatDate(payment.payment_date),
        formatCurrency(payment.amount),
        payment.classes_added.toString(),
        formatCurrency(payment.rate_at_payment),
        creditNotes.join('\n') || '-',
      ]
    })

    // Generate table using autoTable
    autoTable(doc as any, {
      startY: yPos,
      head: [['Date', 'Amount', 'Classes', 'Rate', 'Notes']],
      body: paymentData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: [235, 235, 230],
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: [10, 10, 10], // Consistent black background
        fontSize: 9,
        textColor: [235, 235, 230],
      },
      styles: {
        cellPadding: 3,
        lineColor: [60, 60, 60],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Date
        1: { cellWidth: 35, halign: 'right' }, // Amount
        2: { cellWidth: 20, halign: 'center' }, // Classes
        3: { cellWidth: 30, halign: 'right' }, // Rate
        4: { cellWidth: 55, fontSize: 8, fontStyle: 'italic', textColor: [150, 150, 150] }, // Notes
      },
      margin: { left: PDF_CONFIG.marginLeft, right: PDF_CONFIG.marginRight },
    })

    yPos = (doc as any).lastAutoTable.finalY + 5
  }

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // BALANCE SUMMARY
  yPos = checkPageBreak(doc, yPos, 25)
  doc.setFontSize(PDF_CONFIG.fontSize.heading)
  doc.setFont('helvetica', 'bold')

  doc.text(`CURRENT BALANCE: ${data.balance.current} classes`, PDF_CONFIG.marginLeft, yPos)
  yPos += 7

  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.text(`Credit Balance: ${formatCurrency(data.balance.credit)}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 7

  if (data.balance.amountDue > 0) {
    doc.setTextColor(220, 38, 38) // Red color for amount due
    doc.text(`Amount Due: ${formatCurrency(data.balance.amountDue)}`, PDF_CONFIG.marginLeft, yPos)
    doc.setTextColor(...PDF_CONFIG.colors.black)
    yPos += 7
  }

  // Footer
  addFooter(doc)

  // Generate filename (sanitize and replace spaces)
  const clientName = sanitizeText(data.client.name).replace(/\s+/g, '_')
  const today = new Date().toISOString().split('T')[0]
  const filename = `${clientName}_Statement_${today}.pdf`

  // Download PDF
  doc.save(filename)
}
