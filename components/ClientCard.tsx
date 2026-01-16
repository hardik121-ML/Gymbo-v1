// ============================================================================
// Client Card Component
// ============================================================================
// Displays client information in a card format for the client list
// ============================================================================

import Link from 'next/link'
import { BalanceIndicator } from './BalanceIndicator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatRate } from '@/lib/utils/currency'

interface ClientCardProps {
  id: string
  name: string
  balance: number
  rate: number // Rate in paise
  credit?: number // Credit balance in paise (optional)
}

export function ClientCard({ id, name, balance, rate, credit }: ClientCardProps) {
  return (
    <Link href={`/clients/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <BalanceIndicator balance={balance} size="md" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{name}</h3>
                <p className="text-sm text-muted-foreground">{formatRate(rate)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${balance < 0 ? 'text-destructive' : ''}`}>
                {balance}
              </div>
              <div className="text-xs text-muted-foreground">
                {balance === 1 ? 'class' : 'classes'}
              </div>
              {credit && credit > 0 && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  +{formatCurrency(credit)} credit
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
