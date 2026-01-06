'use client'

// ============================================================================
// Client Balance Card Component
// ============================================================================
// Displays client balance with animated counter
// ============================================================================

import { BalanceIndicator } from './BalanceIndicator'
import { AnimatedBalance } from './AnimatedBalance'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  if (balance < 0) return 'text-destructive'
  if (balance <= 3) return 'text-yellow-500'
  return 'text-green-500'
}

export function ClientBalanceCard({
  balance,
  rate,
  creditBalance
}: ClientBalanceCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BalanceIndicator balance={balance} size="lg" showLabel={true} />
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Balance
          </p>
        </div>
        <div className={`text-6xl font-bold mb-2 ${getBalanceColor(balance)}`}>
          <AnimatedBalance value={balance} />
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          {getBalanceStatusText(balance)}
        </p>
        {creditBalance > 0 && (
          <Badge variant="secondary" className="mb-4 bg-blue-500/10 border-blue-500/50 text-blue-400">
            💳 Credit: ₹{(creditBalance / 100).toFixed(0)}
          </Badge>
        )}
        <p className="text-sm text-muted-foreground">
          Rate: ₹{(rate / 100).toFixed(0)} per class
        </p>
      </CardContent>
    </Card>
  )
}
