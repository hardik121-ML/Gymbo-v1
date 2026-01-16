'use client'

import {
  CircleDot,
  CircleX,
  CreditCard,
  Edit2,
  UserPlus,
  Edit,
  UserX,
} from 'lucide-react'
import type { Database } from '@/types/database.types'
import { formatCurrency } from '@/lib/utils/currency'

type AuditLog = Database['public']['Tables']['audit_log']['Row']

interface AuditEventItemProps {
  log: AuditLog
  isLast: boolean
}

export function AuditEventItem({ log }: AuditEventItemProps) {
  const { action, details, created_at, previous_balance, new_balance } = log

  // Format timestamp
  const timestamp = new Date(created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // Render different event types
  const renderEventContent = () => {
    switch (action) {
      case 'PUNCH_ADD': {
        const detailsObj = details as { punch_date?: string; paid_with_credit?: boolean } | null
        const punchDate = detailsObj?.punch_date
          ? new Date(detailsObj.punch_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown date'

        const paidWithCredit = detailsObj?.paid_with_credit

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CircleDot className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Class punched</p>
              <p className="text-sm text-muted-foreground">{punchDate}</p>
              {paidWithCredit && (
                <p className="text-xs text-blue-500 mt-1">Paid with credit</p>
              )}
              {previous_balance !== null && new_balance !== null && !paidWithCredit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {previous_balance} → {new_balance} classes
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'PUNCH_REMOVE': {
        const detailsObj = details as { punch_date?: string } | null
        const punchDate = detailsObj?.punch_date
          ? new Date(detailsObj.punch_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Unknown date'

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CircleX className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Class removed</p>
              <p className="text-sm text-muted-foreground">Removed {punchDate}</p>
              {previous_balance !== null && new_balance !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {previous_balance} → {new_balance} classes
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'PUNCH_EDIT': {
        const detailsObj = details as { old_date?: string; new_date?: string } | null
        const oldDate = detailsObj?.old_date
          ? new Date(detailsObj.old_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown'
        const newDate = detailsObj?.new_date
          ? new Date(detailsObj.new_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'Unknown'

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Edit className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Class date edited</p>
              <p className="text-sm text-muted-foreground">
                {oldDate} → {newDate}
              </p>
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'PAYMENT_ADD': {
        const detailsObj = details as {
          amount?: number
          classes_added?: number
          rate_at_payment?: number
          credit_used?: number
          credit_added?: number
        } | null

        const amount = detailsObj?.amount || 0
        const classesAdded = detailsObj?.classes_added || 0
        const rate = detailsObj?.rate_at_payment || 0
        const creditUsed = detailsObj?.credit_used || 0
        const creditAdded = detailsObj?.credit_added || 0

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CreditCard className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Payment received</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(amount)}, +{classesAdded} classes @ {formatCurrency(rate)}/class
              </p>
              {creditUsed > 0 && (
                <p className="text-xs text-blue-500 mt-1">
                  Used {formatCurrency(creditUsed)} credit
                </p>
              )}
              {creditAdded > 0 && (
                <p className="text-xs text-green-500 mt-1">
                  Added {formatCurrency(creditAdded)} credit
                </p>
              )}
              {previous_balance !== null && new_balance !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Balance: {previous_balance} → {new_balance} classes
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'RATE_CHANGE': {
        const detailsObj = details as { new_rate?: number; effective_date?: string } | null
        const newRate = detailsObj?.new_rate || 0

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Edit2 className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Rate changed</p>
              <p className="text-sm text-muted-foreground">
                New rate: {formatCurrency(newRate)}/class
              </p>
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'CLIENT_ADD': {
        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <UserPlus className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Client added</p>
              <p className="text-sm text-muted-foreground">Created account</p>
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'CLIENT_UPDATE': {
        const detailsObj = details as {
          previous?: { name?: string; phone?: string }
          updated?: { name?: string; phone?: string }
        } | null

        const changes = []
        if (
          detailsObj?.previous?.name &&
          detailsObj?.updated?.name &&
          detailsObj.previous.name !== detailsObj.updated.name
        ) {
          changes.push(`Name: ${detailsObj.previous.name} → ${detailsObj.updated.name}`)
        }
        if (
          detailsObj?.previous?.phone !== detailsObj?.updated?.phone
        ) {
          changes.push(
            `Phone: ${detailsObj?.previous?.phone || 'none'} → ${detailsObj?.updated?.phone || 'none'}`
          )
        }

        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Edit className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Client updated</p>
              {changes.length > 0 ? (
                <div className="text-sm text-muted-foreground">
                  {changes.map((change, i) => (
                    <p key={i}>{change}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Details updated</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      case 'CLIENT_DELETE': {
        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Client deleted</p>
              <p className="text-sm text-muted-foreground">Soft deleted</p>
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
      }

      default:
        return (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <CircleDot className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{action}</p>
              <p className="text-sm text-muted-foreground">Unknown event type</p>
            </div>
            <div className="text-xs text-muted-foreground">{timestamp}</div>
          </div>
        )
    }
  }

  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-background border-2 border-muted flex items-center justify-center" />

      {/* Event content */}
      <div className="bg-card border border-border rounded-lg p-4">
        {renderEventContent()}
      </div>
    </div>
  )
}
