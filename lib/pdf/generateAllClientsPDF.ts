/**
 * All Clients PDF Generator
 *
 * Generates summary PDF of all clients with statistics and balance overview.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AllClientsPDFData } from './types'
import {
  PDF_CONFIG,
  addHeader,
  addFooter,
  addSectionDivider,
  addSectionHeading,
  formatCurrency,
  sanitizeText,
} from './pdfTemplate'

export function generateAllClientsPDF(data: AllClientsPDFData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Add header
  let yPos = addHeader(doc, 'ALL CLIENTS SUMMARY', {
    name: data.trainer.brand_name,
    address: data.trainer.brand_address,
    phone: data.trainer.brand_phone,
    email: data.trainer.brand_email,
  })

  // Period info
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'bold')
  doc.text(`Period: ${data.dateRange.label}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 8

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // SUMMARY STATISTICS
  yPos = addSectionHeading(doc, yPos, 'SUMMARY STATISTICS')

  doc.setFont('helvetica', 'normal')
  doc.text(`Total Clients: ${data.summary.totalClients}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 6
  doc.text(`Total Classes (Remaining): ${data.summary.totalClasses}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 6
  doc.text(`Total Payments Received: ${formatCurrency(data.summary.totalPayments)}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 6
  doc.text(`Total Outstanding: ${formatCurrency(data.summary.totalOutstanding)}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 10

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // CLIENT LIST
  yPos = addSectionHeading(doc, yPos, 'CLIENT LIST (Sorted by Balance)')

  if (data.clients.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text('No clients found', PDF_CONFIG.marginLeft, yPos)
    doc.setTextColor(...PDF_CONFIG.colors.black)
  } else {
    // Prepare table data
    const tableData = data.clients.map((client) => [
      sanitizeText(client.name),
      sanitizeText(client.phone || 'N/A'),
      client.balance.toString(),
      client.amountDue > 0 ? formatCurrency(client.amountDue) : '-',
    ])

    // Generate table using autoTable
    autoTable(doc as any, {
      startY: yPos,
      head: [['Name', 'Phone', 'Balance', 'Amount Due']],
      body: tableData,
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
        0: { cellWidth: 55 }, // Name
        1: { cellWidth: 40 }, // Phone
        2: { cellWidth: 20, halign: 'center' }, // Balance
        3: { cellWidth: 35, halign: 'right' }, // Amount Due
      },
      didParseCell: (data) => {
        // Highlight negative balances in red
        if (data.column.index === 2 && data.cell.raw) {
          const balance = parseInt(data.cell.raw as string)
          if (balance < 0) {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
      margin: { left: PDF_CONFIG.marginLeft, right: PDF_CONFIG.marginRight },
    })
  }

  // Footer
  addFooter(doc)

  // Generate filename
  const today = new Date().toISOString().split('T')[0]
  const filename = `All_Clients_Summary_${today}.pdf`

  // Download PDF
  doc.save(filename)
}
