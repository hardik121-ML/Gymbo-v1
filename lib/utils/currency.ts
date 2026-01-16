// ============================================================================
// Currency Utility Functions
// ============================================================================
// Format currency amounts consistently throughout the app (INR - Indian Rupees)
// ============================================================================

/**
 * Format an amount in paise to Indian Rupees with proper formatting
 * @param paise - Amount in paise (1 rupee = 100 paise)
 * @returns Formatted string like "₹1,000" or "₹84,500"
 *
 * Examples:
 * - formatCurrency(100000) => "₹1,000"
 * - formatCurrency(8450000) => "₹84,500"
 * - formatCurrency(0) => "₹0"
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

/**
 * Format a rate (per class) with proper INR formatting
 * @param paise - Rate in paise (1 rupee = 100 paise)
 * @returns Formatted string like "₹1,000/class"
 *
 * Examples:
 * - formatRate(100000) => "₹1,000/class"
 * - formatRate(250000) => "₹2,500/class"
 */
export function formatRate(paise: number): string {
  return `${formatCurrency(paise)}/class`
}
