/**
 * PDF Type Definitions
 *
 * Type definitions for PDF export functionality.
 */

export interface BrandSettings {
  brand_name: string | null
  brand_address: string | null
  brand_phone: string | null
  brand_email: string | null
}

export interface ClientPDFData {
  client: {
    name: string
    phone: string | null
  }
  trainer: BrandSettings
  dateRange: {
    start: string
    end: string
    label: string
  }
  punches: Array<{
    punch_date: string
    paid_with_credit: boolean
  }>
  payments: Array<{
    payment_date: string
    amount: number
    classes_added: number
    rate_at_payment: number
    credit_used?: number
    credit_added?: number
  }>
  balance: {
    current: number
    credit: number
    amountDue: number
  }
}

export interface AllClientsPDFData {
  trainer: BrandSettings
  dateRange: {
    start: string
    end: string
    label: string
  }
  summary: {
    totalClients: number
    totalClasses: number
    totalPayments: number
    totalOutstanding: number
  }
  clients: Array<{
    name: string
    phone: string | null
    balance: number
    credit: number
    amountDue: number
    current_rate: number
  }>
}

export type DateRangePreset = 'last30' | 'last90' | 'allTime' | 'custom'

export interface DateRangeConfig {
  startDate: string
  endDate: string
  label: string
}
