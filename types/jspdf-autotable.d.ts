/**
 * Type declarations for jspdf-autotable
 */

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf'

  export interface UserOptions {
    head?: any[][]
    body?: any[][]
    foot?: any[][]
    startY?: number
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number }
    pageBreak?: 'auto' | 'avoid' | 'always'
    theme?: 'striped' | 'grid' | 'plain'
    styles?: any
    headStyles?: any
    bodyStyles?: any
    footStyles?: any
    alternateRowStyles?: any
    columnStyles?: { [key: number]: any }
    didDrawPage?: (data: any) => void
    didParseCell?: (data: any) => void
    willDrawCell?: (data: any) => void
    didDrawCell?: (data: any) => void
  }

  export default function autoTable(doc: jsPDF, options: UserOptions): void

  export interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
      finalY: number
    }
  }
}
