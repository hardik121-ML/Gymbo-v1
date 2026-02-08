'use client'

import { AppShell } from '@/components/AppShell'
import { PunchClassButton } from '@/components/PunchClassButton'
import { PunchCard } from '@/components/PunchCard'
import { LogPaymentButton } from '@/components/LogPaymentButton'
import { User, Clock, Edit2, FileText } from 'lucide-react'
import Link from 'next/link'

interface ClientDetailContentProps {
  client: {
    id: string
    name: string
    balance: number
    current_rate: number
    credit_balance: number
    created_at: string
  }
  enrichedPunches: Array<{
    id: string
    punch_date: string
    paid_with_credit: boolean
  }>
  totalPunches: number
  creditActivity: Array<{
    type: 'added' | 'used'
    amount: number
    date: string
    description: string
  } | null>
}

export function ClientDetailContent({
  client,
  enrichedPunches,
  totalPunches,
  creditActivity,
}: ClientDetailContentProps) {
  const memberSince = new Date(client.created_at).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <AppShell title="trainee" showBackButton={true} backHref="/clients">
      <div className="flex flex-col">
        {/* Hero */}
        <div className="flex flex-col items-center py-8 gap-4">
          <div className="w-24 h-24 bg-muted/10 rounded-full border border-foreground flex items-center justify-center text-foreground">
            <User size={48} strokeWidth={1} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight lowercase">
              {client.name.toLowerCase()}
            </h1>
            <p className="text-xs font-mono text-muted-foreground lowercase">
              member since {memberSince.toLowerCase()}
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-center gap-8 mt-2">
            <LogPaymentButton
              clientId={client.id}
              clientName={client.name}
              currentBalance={client.balance}
              currentRate={client.current_rate}
              currentCredit={client.credit_balance || 0}
            />
            <Link
              href={`/clients/${client.id}/history`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                <Clock size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-mono opacity-50 lowercase group-hover:opacity-100 transition-opacity">
                history
              </span>
            </Link>
            <Link
              href={`/clients/${client.id}/edit`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                <Edit2 size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-mono opacity-50 lowercase group-hover:opacity-100 transition-opacity">
                edit
              </span>
            </Link>
            <Link
              href={`/clients/${client.id}/export`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full border border-foreground/10 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                <FileText size={24} strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-mono opacity-50 lowercase group-hover:opacity-100 transition-opacity">
                export
              </span>
            </Link>
          </div>
        </div>

        {/* Punch Card */}
        <div className="py-4">
          <PunchCard
            balance={client.balance}
            clientId={client.id}
          />
        </div>

        {/* Primary CTA */}
        <div className="py-4">
          <PunchClassButton clientId={client.id} clientName={client.name} />
        </div>
      </div>
    </AppShell>
  )
}
