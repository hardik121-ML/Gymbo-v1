// ============================================================================
// Client Card Component
// ============================================================================
// Displays client information in a card format for the client list
// ============================================================================

import Link from 'next/link'
import { BalanceIndicator } from './BalanceIndicator'

interface ClientCardProps {
  id: string
  name: string
  balance: number
  rate: number // Rate in paise
}

function formatCurrency(paise: number): string {
  return `₹${(paise / 100).toFixed(0)}`
}

export function ClientCard({ id, name, balance, rate }: ClientCardProps) {
  return (
    <Link href={`/clients/${id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <BalanceIndicator balance={balance} size="md" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
              <p className="text-sm text-gray-600">{formatCurrency(rate)}/class</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {balance}
            </div>
            <div className="text-xs text-gray-500">
              {balance === 1 ? 'class' : 'classes'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
