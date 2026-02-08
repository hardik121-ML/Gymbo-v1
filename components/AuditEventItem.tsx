'use client'

import type { Database } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'

type AuditLog = Database['public']['Tables']['audit_log']['Row']

interface AuditEventItemProps {
  log: AuditLog
  isLast: boolean
}

export function AuditEventItem({ log, isLast }: AuditEventItemProps) {
  const { action, details, created_at } = log

  const timestamp = new Date(created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const getEventTitle = (): string => {
    switch (action) {
      case 'PUNCH_ADD': return 'class punched'
      case 'PUNCH_REMOVE': return 'class removed'
      case 'PUNCH_EDIT': return 'class date edited'
      case 'PAYMENT_ADD': {
        const d = details as { amount?: number } | null
        const amt = d?.amount || 0
        return `payment recorded (${formatCurrency(amt)})`
      }
      case 'RATE_CHANGE': {
        const d = details as { new_rate?: number; old_rate?: number } | null
        if (d?.old_rate && d?.new_rate) {
          return `rate updated (${formatCurrency(d.old_rate)} → ${formatCurrency(d.new_rate)})`
        }
        return `rate updated (${formatCurrency(d?.new_rate || 0)})`
      }
      case 'CLIENT_ADD': return 'client created'
      case 'CLIENT_UPDATE': return 'client updated'
      case 'CLIENT_DELETE': return 'client deleted'
      default: return (action as string).toLowerCase().replace(/_/g, ' ')
    }
  }

  return (
    <div className={`py-4 ${!isLast ? 'border-b border-foreground/10' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-bold text-sm">{getEventTitle()}</p>
          <p className="text-xs font-mono opacity-40 mt-1 lowercase">by you</p>
        </div>
        <p className="text-xs font-mono opacity-50 whitespace-nowrap">{timestamp}</p>
      </div>
    </div>
  )
}
