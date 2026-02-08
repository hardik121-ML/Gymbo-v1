'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'

interface LedgerCardProps {
  classesDone: number
  classesPending: number
  earnings: number
  trend?: string
  isPositive?: boolean
}

export function LedgerCard({
  classesDone,
  classesPending,
  earnings,
  trend,
  isPositive = true,
}: LedgerCardProps) {
  return (
    <div className="bg-background text-foreground p-6 relative overflow-hidden rounded-xl border border-foreground flex flex-col justify-between min-h-[180px]">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono lowercase opacity-60">this month</span>
      </div>

      {/* Main Data Points */}
      <div className="grid grid-cols-2 gap-4 flex-1 items-center py-2">
        <div>
          <div className="text-4xl font-bold font-mono leading-none tracking-tighter">
            {classesDone}
          </div>
          <div className="text-xs lowercase text-muted-foreground mt-2 font-medium">
            classes done
          </div>
        </div>
        <div>
          <div className="text-4xl font-bold font-mono leading-none tracking-tighter opacity-60">
            {classesPending}
          </div>
          <div className="text-xs lowercase text-muted-foreground mt-2 font-medium">
            pending
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="flex items-end justify-between border-t border-foreground/10 pt-4 mt-2">
        <div>
          <div className="text-[10px] lowercase text-muted-foreground mb-1">earnings</div>
          <div className="text-xl font-bold font-mono tracking-tight">
            {formatCurrency(earnings)}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs opacity-80">
            {isPositive ? (
              <TrendingUp size={16} strokeWidth={1.5} />
            ) : (
              <TrendingDown size={16} strokeWidth={1.5} />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}
