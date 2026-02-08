'use client'

import { AuditEventItem } from './AuditEventItem'
import type { Database } from '@/types/database.types'

type AuditLog = Database['public']['Tables']['audit_log']['Row']

interface AuditTimelineProps {
  logs: AuditLog[]
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm lowercase">no history yet</p>
      </div>
    )
  }

  return (
    <div>
      {logs.map((log, index) => (
        <AuditEventItem
          key={log.id}
          log={log}
          isLast={index === logs.length - 1}
        />
      ))}
    </div>
  )
}
