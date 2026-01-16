'use client'

import { useMemo } from 'react'
import { AuditEventItem } from './AuditEventItem'
import type { Database } from '@/types/database.types'

type AuditLog = Database['public']['Tables']['audit_log']['Row']

interface AuditTimelineProps {
  logs: AuditLog[]
}

interface GroupedLogs {
  [month: string]: AuditLog[]
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  // Group logs by month
  const groupedLogs = useMemo(() => {
    const groups: GroupedLogs = {}

    logs.forEach((log) => {
      const date = new Date(log.created_at)
      const monthKey = date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })

      if (!groups[monthKey]) {
        groups[monthKey] = []
      }

      groups[monthKey].push(log)
    })

    return groups
  }, [logs])

  const monthKeys = Object.keys(groupedLogs)

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-center">no history yet</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {monthKeys.map((monthKey, monthIndex) => (
        <div key={monthKey} className="mb-8">
          {/* Sticky Month Header */}
          <div className="sticky top-0 bg-background z-10 py-2 mb-4">
            <h3 className="text-sm text-muted-foreground font-medium">
              {monthKey}
            </h3>
          </div>

          {/* Events for this month */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div
              className="absolute left-[11px] top-0 bottom-0 w-[1px]"
              style={{
                background: 'rgba(235, 235, 230, 0.2)',
              }}
            />

            {/* Event items */}
            <div className="space-y-4">
              {groupedLogs[monthKey].map((log, index) => (
                <AuditEventItem
                  key={log.id}
                  log={log}
                  isLast={
                    index === groupedLogs[monthKey].length - 1 &&
                    monthIndex === monthKeys.length - 1
                  }
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
