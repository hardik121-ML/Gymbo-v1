'use client'

// ============================================================================
// Client Balance Card Component
// ============================================================================
// Displays client balance with animated counter
// ============================================================================

import { BalanceIndicator } from './BalanceIndicator'
import { AnimatedBalance } from './AnimatedBalance'

interface ClientBalanceCardProps {
  balance: number
  rate: number // Rate in paise
  creditBalance: number // Credit balance in paise
}

function getBalanceStatusText(balance: number): string {
  if (balance < 0) {
    const classes = Math.abs(balance)
    return `${classes} ${classes === 1 ? 'class' : 'classes'} on credit`
  }
  if (balance === 0) {
    return 'No classes remaining'
  }
  return `${balance} ${balance === 1 ? 'class' : 'classes'} remaining`
}

function getBalanceColor(balance: number): string {
  if (balance < 0) return 'text-red-600'
  if (balance <= 3) return 'text-yellow-600'
  return 'text-green-600'
}

export function ClientBalanceCard({
  balance,
  rate,
  creditBalance
}: ClientBalanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <BalanceIndicator balance={balance} size="lg" showLabel={true} />
        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          Balance
        </p>
      </div>
      <div className={`text-6xl font-bold mb-2 ${getBalanceColor(balance)}`}>
        <AnimatedBalance value={balance} />
      </div>
      <p className="text-lg text-gray-600 mb-4">
        {getBalanceStatusText(balance)}
      </p>
      {creditBalance > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 inline-block">
          <p className="text-sm font-medium text-blue-900">
            💳 Credit: ₹{(creditBalance / 100).toFixed(0)}
          </p>
        </div>
      )}
      <p className="text-sm text-gray-500">
        Rate: ₹{(rate / 100).toFixed(0)} per class
      </p>
    </div>
  )
}
