// ============================================================================
// Loading Skeleton Components
// ============================================================================
// Reusable skeleton loaders for different page types
// ============================================================================

import { Card, CardContent } from '@/components/ui/card'

export function ClientListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-6 bg-muted rounded w-12"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ClientDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Balance Card Skeleton */}
      <Card className="animate-pulse">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-12 bg-muted rounded w-32 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-24 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-40 mx-auto"></div>
        </CardContent>
      </Card>

      {/* Action Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
        ))}
      </div>

      {/* Punches List Skeleton */}
      <Card className="animate-pulse">
        <CardContent className="p-4 space-y-3">
          <div className="h-5 bg-muted rounded w-32"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function FormSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-muted rounded w-20"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        ))}
        <div className="h-10 bg-muted rounded w-full"></div>
      </CardContent>
    </Card>
  )
}

export function PaymentHistorySkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4 space-y-4">
        <div className="h-6 bg-muted rounded w-32"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </div>
            <div className="h-5 bg-muted rounded w-16"></div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/2"></div>
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-2/3"></div>
      <div className="h-32 bg-muted rounded w-full"></div>
    </div>
  )
}
