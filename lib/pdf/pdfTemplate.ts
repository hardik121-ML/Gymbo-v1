/**
 * PDF Template Utilities
 *
 * Shared utilities for PDF generation including layout constants,
 * header/footer rendering, and table utilities.
 */

import jsPDF from 'jspdf'
import type { BrandSettings } from './types'

// PDF Configuration Constants
export const PDF_CONFIG = {
  // Page dimensions (A4)
  pageWidth: 210, // mm
  pageHeight: 297, // mm

  // Margins
  marginLeft: 25,
  marginRight: 25,
  marginTop: 25,
  marginBottom: 20,

  // Content width
  get contentWidth() {
    return this.pageWidth - this.marginLeft - this.marginRight
  },

  // Font sizes
  fontSize: {
    title: 18,
    heading: 11,
    body: 10,
    small: 8,
    footer: 7,
    totalDue: 24,
  },

  // Colors (RGB)
  colors: {
    black: [30, 30, 30] as [number, number, number],
    gray: [128, 128, 128] as [number, number, number],
    lightGray: [200, 200, 200] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  },
}

/**
 * Draw the brand icon (filled circle with bold "G" for Gymbo)
 */
export function drawBrandIcon(doc: jsPDF, x: number, y: number, size: number): void {
  const radius = size / 2
  const cx = x + radius
  const cy = y + radius

  // Filled black circle
  doc.setFillColor(...PDF_CONFIG.colors.black)
  doc.circle(cx, cy, radius, 'F')

  // White bold "G" centered inside
  doc.setFontSize(size * 0.55)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.white)
  doc.text('G', cx, cy + size * 0.05, { align: 'center', baseline: 'middle' })

  // Reset
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')
}

/**
 * Add statement header matching the design reference
 * Returns the Y position after the header
 */
export function addStatementHeader(
  doc: jsPDF,
  trainerInfo: BrandSettings,
  invoiceCode: string,
  statementDate: string
): number {
  let yPos = PDF_CONFIG.marginTop
  const rightX = PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight

  // Brand icon (top left)
  drawBrandIcon(doc, PDF_CONFIG.marginLeft, yPos, 12)

  // STATEMENT (top right, bold)
  doc.setFontSize(PDF_CONFIG.fontSize.title)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.text('STATEMENT', rightX, yPos + 5, { align: 'right' })

  // Invoice code (right, small gray)
  doc.setFontSize(PDF_CONFIG.fontSize.small)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text(invoiceCode, rightX, yPos + 10, { align: 'right' })

  // Date (right, small gray)
  doc.text(statementDate, rightX, yPos + 14, { align: 'right' })

  yPos += 20

  // Trainer brand name (left, bold)
  doc.setFontSize(PDF_CONFIG.fontSize.heading)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.black)
  const brandName = sanitizeText(trainerInfo.brand_name || 'Gymbo Trainer')
  doc.text(brandName.toUpperCase(), PDF_CONFIG.marginLeft, yPos)
  yPos += 5

  // Address (left, normal gray)
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  const address = sanitizeText(trainerInfo.brand_address || '')
  if (address) {
    doc.text(address, PDF_CONFIG.marginLeft, yPos)
    yPos += 5
  }

  // Thin divider line
  yPos += 3
  doc.setDrawColor(...PDF_CONFIG.colors.lightGray)
  doc.setLineWidth(0.3)
  doc.line(PDF_CONFIG.marginLeft, yPos, rightX, yPos)
  yPos += 10

  return yPos
}

/**
 * Add BILL TO section
 */
export function addBillTo(
  doc: jsPDF,
  yPos: number,
  clientName: string,
  clientContact: string | null
): number {
  // "BILL TO:" label
  doc.setFontSize(PDF_CONFIG.fontSize.small)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text('BILL TO:', PDF_CONFIG.marginLeft, yPos)
  yPos += 5

  // Client name (bold, black)
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.text(sanitizeText(clientName), PDF_CONFIG.marginLeft, yPos)
  yPos += 5

  // Client phone/email (normal, gray)
  if (clientContact) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text(sanitizeText(clientContact), PDF_CONFIG.marginLeft, yPos)
    yPos += 5
  }

  yPos += 8
  return yPos
}

/**
 * Add the line items table (DESCRIPTION | DATE | AMOUNT)
 */
export function addLineItemsTable(
  doc: jsPDF,
  yPos: number,
  items: Array<{ description: string; date: string; amount: string }>
): number {
  const rightX = PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight
  const colDate = rightX - 50
  const colAmount = rightX

  // Table header
  doc.setFontSize(PDF_CONFIG.fontSize.small)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text('DESCRIPTION', PDF_CONFIG.marginLeft, yPos)
  doc.text('DATE', colDate, yPos, { align: 'center' })
  doc.text('AMOUNT', colAmount, yPos, { align: 'right' })
  yPos += 2

  // Header underline
  doc.setDrawColor(...PDF_CONFIG.colors.lightGray)
  doc.setLineWidth(0.5)
  doc.line(PDF_CONFIG.marginLeft, yPos, rightX, yPos)
  yPos += 7

  // Rows
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...PDF_CONFIG.colors.black)

  items.forEach((item) => {
    yPos = checkPageBreak(doc, yPos, 8)

    doc.setFont('helvetica', 'bold')
    doc.text(sanitizeText(item.description), PDF_CONFIG.marginLeft, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...PDF_CONFIG.colors.gray)
    doc.text(item.date, colDate, yPos, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PDF_CONFIG.colors.black)
    doc.text(item.amount, colAmount, yPos, { align: 'right' })
    yPos += 7

    // Faint row separator
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.1)
    doc.line(PDF_CONFIG.marginLeft, yPos - 3, rightX, yPos - 3)
  })

  return yPos
}

/**
 * Add total due section at the bottom
 */
export function addTotalDue(doc: jsPDF, yPos: number, totalAmount: string, isCredit: boolean): number {
  const rightX = PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight

  yPos += 5

  // Bold divider line
  doc.setDrawColor(...PDF_CONFIG.colors.black)
  doc.setLineWidth(1.5)
  doc.line(PDF_CONFIG.marginLeft, yPos, rightX, yPos)
  yPos += 8

  // "TOTAL DUE" label (right-aligned, small)
  doc.setFontSize(PDF_CONFIG.fontSize.small)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text(isCredit ? 'BALANCE' : 'TOTAL DUE', rightX, yPos, { align: 'right' })
  yPos += 10

  // Large amount (right-aligned)
  doc.setFontSize(PDF_CONFIG.fontSize.totalDue)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.text(totalAmount, rightX, yPos, { align: 'right' })
  yPos += 12

  // "Thank you for your business" (left, italic, gray)
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...PDF_CONFIG.colors.gray)
  doc.text('Thank you for your business', PDF_CONFIG.marginLeft, yPos)
  yPos += 8

  doc.setTextColor(...PDF_CONFIG.colors.black)
  return yPos
}

/**
 * Add footer with generation timestamp
 */
export function addFooter(doc: jsPDF): void {
  const yPos = PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom + 5

  doc.setFontSize(PDF_CONFIG.fontSize.footer)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...PDF_CONFIG.colors.gray)

  const timestamp = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  doc.text(`Generated on ${timestamp} via Gymbo`, PDF_CONFIG.pageWidth / 2, yPos, { align: 'center' })
  doc.setTextColor(...PDF_CONFIG.colors.black)
}

/**
 * Add section divider
 */
export function addSectionDivider(doc: jsPDF, yPos: number): number {
  doc.setDrawColor(...PDF_CONFIG.colors.lightGray)
  doc.setLineWidth(0.3)
  doc.line(PDF_CONFIG.marginLeft, yPos, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, yPos)
  return yPos + 8
}

/**
 * Add section heading
 */
export function addSectionHeading(doc: jsPDF, yPos: number, heading: string): number {
  doc.setFontSize(PDF_CONFIG.fontSize.heading)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.colors.black)
  doc.text(heading, PDF_CONFIG.marginLeft, yPos)
  yPos += 7

  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')

  return yPos
}

/**
 * Check if we need a page break and add new page if needed
 */
export function checkPageBreak(doc: jsPDF, yPos: number, requiredSpace: number): number {
  const maxY = PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom - 10

  if (yPos + requiredSpace > maxY) {
    doc.addPage()
    return PDF_CONFIG.marginTop
  }

  return yPos
}

/**
 * Format currency (paise to rupees)
 * Using "Rs." instead of ₹ symbol for better PDF compatibility
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100
  return `Rs. ${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format date for display (short: "Jan 28")
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date for display (full: "Jan 31, 2024")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Generate a unique-looking invoice code from client name and date
 */
export function generateInvoiceCode(clientName: string, date: string): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const initials = clientName
    .split(' ')
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3)
  return `#${initials}-${year}-${month}`
}

/**
 * Sanitize text for PDF rendering
 * jsPDF's default Helvetica font doesn't support many Unicode characters
 */
export function sanitizeText(text: string): string {
  if (!text) return ''

  let sanitized = text
    .replace(/[^\x00-\x7F]/g, (char) => {
      const replacements: Record<string, string> = {
        'ā': 'a', 'ī': 'i', 'ū': 'u', 'ē': 'e', 'ō': 'o',
        'ñ': 'n', 'ś': 's', 'ṣ': 's', 'ṭ': 't', 'ḍ': 'd',
        'ṃ': 'm', 'ṅ': 'n', 'ḥ': 'h',
      }
      return replacements[char] || ''
    })
    .trim()

  return sanitized
}
