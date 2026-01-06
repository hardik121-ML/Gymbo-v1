'use client'

import { useState, useEffect } from 'react'
import { PunchListItem } from './PunchListItem'

interface Punch {
  id: string
  punch_date: string
  paid_with_credit: boolean
}

interface PunchesListGroupedProps {
  clientId: string
  initialPunches?: Punch[]
  initialTotal?: number
}

interface GroupedPunches {
  [monthYear: string]: Punch[]
}

export function PunchesListGrouped({
  clientId,
  initialPunches = [],
  initialTotal = 0
}: PunchesListGroupedProps) {
  const [punches, setPunches] = useState<Punch[]>(initialPunches)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(initialPunches.length)
  const [hasMore, setHasMore] = useState(initialPunches.length < initialTotal)
  const [total, setTotal] = useState(initialTotal)
  const limit = 20

  // Sync with server data when initialPunches changes (e.g., after router.refresh())
  useEffect(() => {
    setPunches(initialPunches)
    setOffset(initialPunches.length)
    setHasMore(initialPunches.length < initialTotal)
    setTotal(initialTotal)
  }, [initialPunches, initialTotal])

  // Group punches by month and year
  const groupPunchesByMonth = (punchList: Punch[]): GroupedPunches => {
    const grouped: GroupedPunches = {}

    punchList.forEach(punch => {
      const date = new Date(punch.punch_date)
      const monthYear = date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric'
      })

      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }
      grouped[monthYear].push(punch)
    })

    return grouped
  }

  const loadMore = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/clients/${clientId}/punches?offset=${offset}&limit=${limit}`
      )

      if (!response.ok) {
        throw new Error('Failed to load more punches')
      }

      const data = await response.json()
      const newPunches = data.punches || []

      setPunches(prev => [...prev, ...newPunches])
      setOffset(prev => prev + newPunches.length)
      setHasMore(data.pagination.hasMore)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error loading more punches:', error)
      alert('Failed to load more punches. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Group punches for rendering
  const groupedPunches = groupPunchesByMonth(punches)
  const monthYearKeys = Object.keys(groupedPunches)

  if (punches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📅</div>
        <p>No classes recorded yet</p>
      </div>
    )
  }

  return (
    <div>
      {monthYearKeys.map((monthYear, idx) => (
        <div key={monthYear} className={idx > 0 ? 'mt-6' : ''}>
          {/* Month Header */}
          <div className="text-sm font-semibold text-gray-600 mb-3 px-1">
            {monthYear}
          </div>

          {/* Punches for this month */}
          <div className="space-y-2">
            {groupedPunches[monthYear].map((punch) => (
              <PunchListItem
                key={punch.id}
                id={punch.id}
                punchDate={punch.punch_date}
                paidWithCredit={punch.paid_with_credit}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination Info */}
      {total > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Showing {punches.length} of {total} classes
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-2 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="bg-white text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
