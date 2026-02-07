/**
 * PDF Template Utilities
 *
 * Shared utilities for PDF generation including layout constants,
 * header/footer rendering, and table utilities.
 */

import jsPDF from 'jspdf'

// PDF Configuration Constants
export const PDF_CONFIG = {
  // Page dimensions (A4)
  pageWidth: 210, // mm
  pageHeight: 297, // mm

  // Margins
  marginLeft: 20,
  marginRight: 20,
  marginTop: 20,
  marginBottom: 20,

  // Font sizes
  fontSize: {
    title: 16,
    heading: 12,
    body: 10,
    footer: 8,
  },

  // Colors (RGB)
  colors: {
    black: [0, 0, 0] as [number, number, number],
    gray: [128, 128, 128] as [number, number, number],
    lightGray: [200, 200, 200] as [number, number, number],
  },

  // Line spacing
  lineHeight: 1.5,
}

/**
 * Add header with trainer information to PDF
 */
export function addHeader(
  doc: jsPDF,
  title: string,
  trainerInfo: {
    name: string | null
    address: string | null
    phone: string | null
    email: string | null
  }
): number {
  let yPos = PDF_CONFIG.marginTop

  // Title
  doc.setFontSize(PDF_CONFIG.fontSize.title)
  doc.setFont('helvetica', 'bold')
  doc.text(title, PDF_CONFIG.pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Divider
  doc.setDrawColor(...PDF_CONFIG.colors.lightGray)
  doc.line(PDF_CONFIG.marginLeft, yPos, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, yPos)
  yPos += 8

  // Trainer info
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')

  const trainerName = sanitizeText(trainerInfo.name || 'Gymbo Trainer')
  const trainerAddress = sanitizeText(trainerInfo.address || 'Address not set')
  const trainerPhone = sanitizeText(trainerInfo.phone || 'Phone not set')

  doc.text(`Trainer: ${trainerName}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 5
  doc.text(`Address: ${trainerAddress}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 5
  doc.text(`Phone: ${trainerPhone}`, PDF_CONFIG.marginLeft, yPos)
  yPos += 5

  if (trainerInfo.email) {
    doc.text(`Email: ${sanitizeText(trainerInfo.email)}`, PDF_CONFIG.marginLeft, yPos)
    yPos += 5
  }

  // Divider
  yPos += 3
  doc.line(PDF_CONFIG.marginLeft, yPos, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, yPos)
  yPos += 8

  return yPos
}

/**
 * Add footer with generation timestamp
 */
export function addFooter(doc: jsPDF, pageNumber?: number): void {
  const yPos = PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom + 5

  doc.setFontSize(PDF_CONFIG.fontSize.footer)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...PDF_CONFIG.colors.gray)

  const timestamp = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const footerText = `Generated on ${timestamp} via Gymbo`
  doc.text(footerText, PDF_CONFIG.pageWidth / 2, yPos, { align: 'center' })

  if (pageNumber !== undefined) {
    doc.text(`Page ${pageNumber}`, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, yPos, { align: 'right' })
  }

  // Reset text color
  doc.setTextColor(...PDF_CONFIG.colors.black)
}

/**
 * Add section divider
 */
export function addSectionDivider(doc: jsPDF, yPos: number): number {
  doc.setDrawColor(...PDF_CONFIG.colors.lightGray)
  doc.line(PDF_CONFIG.marginLeft, yPos, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, yPos)
  return yPos + 8
}

/**
 * Truncate text to fit within a specific width
 */
function truncateText(doc: jsPDF, text: string, maxWidth: number): string {
  const textWidth = doc.getTextWidth(text)

  if (textWidth <= maxWidth - 2) {
    return text
  }

  // Binary search for the right length
  let truncated = text
  while (doc.getTextWidth(truncated + '...') > maxWidth - 2 && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
  }

  return truncated + '...'
}

/**
 * Add table row with text truncation for overflow
 */
export function addTableRow(
  doc: jsPDF,
  yPos: number,
  columns: string[],
  columnWidths: number[],
  isBold = false
): number {
  doc.setFont('helvetica', isBold ? 'bold' : 'normal')

  let xPos = PDF_CONFIG.marginLeft
  columns.forEach((text, index) => {
    const truncatedText = truncateText(doc, text, columnWidths[index])
    doc.text(truncatedText, xPos, yPos)
    xPos += columnWidths[index]
  })

  return yPos + 6
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
 * Add section heading
 */
export function addSectionHeading(doc: jsPDF, yPos: number, heading: string): number {
  doc.setFontSize(PDF_CONFIG.fontSize.heading)
  doc.setFont('helvetica', 'bold')
  doc.text(heading, PDF_CONFIG.marginLeft, yPos)
  yPos += 7

  // Reset to body font
  doc.setFontSize(PDF_CONFIG.fontSize.body)
  doc.setFont('helvetica', 'normal')

  return yPos
}

/**
 * Format currency (paise to rupees)
 * Using "Rs." instead of ₹ symbol for better PDF compatibility
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100
  return `Rs. ${rupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/**
 * Format date for display
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
 * Sanitize text for PDF rendering
 * jsPDF's default Helvetica font doesn't support many Unicode characters
 * This function removes/replaces problematic characters
 */
export function sanitizeText(text: string): string {
  if (!text) return ''

  // Replace common problematic characters
  let sanitized = text
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Keep basic Latin characters, remove others
      // Common replacements for Indian names
      const replacements: Record<string, string> = {
        'ā': 'a',
        'ī': 'i',
        'ū': 'u',
        'ē': 'e',
        'ō': 'o',
        'ñ': 'n',
        'ś': 's',
        'ṣ': 's',
        'ṭ': 't',
        'ḍ': 'd',
        'ṃ': 'm',
        'ṅ': 'n',
        'ḥ': 'h',
      }

      return replacements[char] || ''
    })
    .trim()

  return sanitized
}
