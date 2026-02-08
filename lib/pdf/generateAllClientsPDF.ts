/**
 * All Clients PDF Generator
 *
 * Generates summary PDF of all clients matching the statement design style:
 * Grab icon + header, summary stats, client list table.
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AllClientsPDFData } from './types'
import {
  PDF_CONFIG,
  addStatementHeader,
  addFooter,
  addSectionDivider,
  addSectionHeading,
  formatCurrency,
  formatDate,
  sanitizeText,
} from './pdfTemplate'

export function generateAllClientsPDF(data: AllClientsPDFData): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const today = new Date().toISOString().split('T')[0]

  // Header: grab icon, STATEMENT title, date, brand info
  let yPos = addStatementHeader(
    doc,
    data.trainer,
    `#ALL-${today.slice(0, 7)}`,
    formatDate(today)
  )

  // Period info
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text(`Period: ${data.dateRange.label}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 8

  // Section divider
  yPos = addSectionDivider(doc, yPos)

  // SUMMARY STATISTICS
  yPos = addSectionHeading(doc, yPos, 'SUMMARY STATISTICS')

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_CONFIG.colors.black)
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

    autoTable(doc as any, {
      startY: yPos,
      head: [['Name', 'Phone', 'Balance', 'Amount Due']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [...PDF_CONFIG.colors.gray],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [...PDF_CONFIG.colors.black],
      },
      styles: {
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
      },
      didParseCell: (cellData) => {
        if (cellData.column.index === 2 && cellData.cell.raw) {
          const balance = parseInt(cellData.cell.raw as string)
          if (balance < 0) {
            cellData.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
      margin: { left: PDF_CONFIG.marginLeft, right: PDF_CONFIG.marginRight },
    })
  }

  // Footer
  addFooter(doc)

  // Generate filename
  const filename = `All_Clients_Summary_${today}.pdf`

  return { doc, filename }
}

export function downloadAllClientsPDF(data: AllClientsPDFData): void {
  const { doc, filename } = generateAllClientsPDF(data)
  doc.save(filename)
}

export function getAllClientsPDFBlob(data: AllClientsPDFData): { blob: Blob; filename: string } {
  const { doc, filename } = generateAllClientsPDF(data)
  return { blob: doc.output('blob'), filename }
}
