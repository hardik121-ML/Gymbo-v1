'use client'

import { AppShell } from '@/components/AppShell'
import { LedgerCard } from '@/components/LedgerCard'
import { SwipeToDelete } from '@/components/SwipeToDelete'
import { User, Plus } from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  balance: number
  current_rate: number
  credit_balance?: number
  updated_at: string
}

interface DashboardContentProps {
  clients: Client[]
  classesDone: number
  classesPending: number
  earnings: number
  trend?: string
  isPositive?: boolean
}

export function DashboardContent({
  clients,
  classesDone,
  classesPending,
  earnings,
  trend,
  isPositive,
}: DashboardContentProps) {
  return (
    <AppShell
      title="dashboard"
      showBottomNav={true}
      activeTab="dashboard"
    >
      <div className="flex flex-col gap-4">
        {/* Ledger Card */}
        <LedgerCard
          classesDone={classesDone}
          classesPending={classesPending}
          earnings={earnings}
          trend={trend}
          isPositive={isPositive}
        />

        {/* Client List Section */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold lowercase underline decoration-2 underline-offset-4">
              clients
            </span>
            <Link
              href="/clients/new"
              className="w-8 h-8 flex items-center justify-center rounded-full border border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
            >
              <Plus size={16} strokeWidth={1.5} />
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm lowercase">
                no clients yet
              </p>
              <Link
                href="/clients/new"
                className="text-xs font-mono lowercase underline decoration-dashed underline-offset-4 opacity-60 hover:opacity-100 transition-opacity mt-2 inline-block"
              >
                add your first client
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {clients.map((client) => (
                <SwipeToDelete
                  key={client.id}
                  clientId={client.id}
                  clientName={client.name}
                >
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between p-4 border border-foreground/10 rounded-xl hover:border-foreground transition-colors cursor-pointer group bg-background stagger-item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-foreground text-foreground">
                        <User size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                          {client.name}
                          {client.balance < 0 && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono">
                        {client.balance}
                      </span>
                      <span className="text-[10px] lowercase text-muted-foreground tracking-wider">
                        left
                      </span>
                    </div>
                  </Link>
                </SwipeToDelete>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
