'use client'

// ============================================================================
// Client List Component
// ============================================================================
// Client-side component for sorting and displaying client list
// ============================================================================

import { useState } from 'react'
import { SwipeableClientCard } from './SwipeableClientCard'

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
        return b.balance - a.balance // Descending (highest first)
      case 'updated':
      default:
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  return (
    <>
      {/* Sort Controls */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Sort by:</span>
          <button
            onClick={() => setSortBy('updated')}
            className={`px-3 py-1 rounded-full transition-colors ${
              sortBy === 'updated'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded-full transition-colors ${
              sortBy === 'name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setSortBy('balance')}
            className={`px-3 py-1 rounded-full transition-colors ${
              sortBy === 'balance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Balance
          </button>
        </div>
      </div>

      {/* Client Cards */}
      <div className="space-y-3">
        {sortedClients.map((client) => (
          <SwipeableClientCard
            key={client.id}
            id={client.id}
            name={client.name}
            balance={client.balance}
            rate={client.current_rate}
            credit={client.credit_balance}
          />
        ))}
      </div>
    </>
  )
}
