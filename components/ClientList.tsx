'use client'

import { useState } from 'react'
import { SwipeToDelete } from './SwipeToDelete'
import { User, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  balance: number
  current_rate: number
  credit_balance?: number
  updated_at: string
}

interface ClientListProps {
  clients: Client[]
}

type SortOption = 'updated' | 'name' | 'balance'

export function ClientList({ clients }: ClientListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('updated')

  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'balance':
        return b.balance - a.balance
      case 'updated':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
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

      {/* Sort Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground text-[10px] font-mono lowercase opacity-50">sort:</span>
          {(['updated', 'name', 'balance'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={cn(
                'px-3 py-1 rounded-full transition-colors text-xs lowercase font-mono',
                sortBy === option
                  ? 'bg-foreground text-background'
                  : 'border border-foreground/10 text-foreground/60 hover:border-foreground/30'
              )}
            >
              {option === 'updated' ? 'recent' : option}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      <div className="flex flex-col gap-2">
        {sortedClients.map((client) => (
          <SwipeToDelete
            key={client.id}
            clientId={client.id}
            clientName={client.name}
          >
            <Link
              href={`/clients/${client.id}`}
              className="flex items-center justify-between p-4 border border-foreground/10 rounded-xl hover:border-foreground transition-colors cursor-pointer group bg-background stagger-item"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border border-foreground text-foreground">
                  <User size={20} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                    <span className="truncate">{client.name}</span>
                    {client.balance < 0 && (
                      <div className="w-2 h-2 shrink-0 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-3">
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
    </>
  )
}
