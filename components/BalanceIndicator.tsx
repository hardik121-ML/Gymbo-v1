// ============================================================================
// Balance Indicator Component
// ============================================================================
// Visual indicator for client balance status (Red/Yellow/Green)
// ============================================================================

type BalanceStatus = 'negative' | 'low' | 'healthy'

interface BalanceIndicatorProps {
  balance: number
  size?: 'sm' | 'md' | 'lg'
}

function getBalanceStatus(balance: number): BalanceStatus {
  if (balance < 0) return 'negative'
  if (balance <= 3) return 'low'
  return 'healthy'
}

function getBalanceColor(status: BalanceStatus): string {
  switch (status) {
    case 'negative':
      return 'bg-red-500'
    case 'low':
      return 'bg-yellow-500'
    case 'healthy':
      return 'bg-green-500'
  }
}

function getBalanceLabel(status: BalanceStatus): string {
  switch (status) {
    case 'negative':
      return 'On credit'
    case 'low':
      return 'Low balance'
    case 'healthy':
      return 'Healthy'
  }
}

export function BalanceIndicator({ balance, size = 'md' }: BalanceIndicatorProps) {
  const status = getBalanceStatus(balance)
  const colorClass = getBalanceColor(status)
  const label = getBalanceLabel(status)

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${colorClass} rounded-full`}
        aria-label={label}
        title={label}
      />
    </div>
  )
}
