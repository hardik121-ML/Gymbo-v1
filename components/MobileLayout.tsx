'use client'

// ============================================================================
// Mobile Layout Component
// ============================================================================
// Provides consistent mobile-first layout with header, back button, and container
// ============================================================================

import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'

interface MobileLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  backHref?: string
  showLogout?: boolean
  headerAction?: ReactNode
}

export function MobileLayout({
  children,
  title = 'Gymbo',
  showBackButton = false,
  backHref,
  showLogout = false,
  headerAction,
}: MobileLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sticky for easy access */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button or Logo */}
            <div className="flex items-center gap-3">
              {showBackButton ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-9 w-9 p-0"
                  aria-label="Go back"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </Button>
              ) : null}
              <h1 className="text-xl font-bold truncate">{title}</h1>
            </div>

            {/* Right: Custom action or Logout */}
            <div className="flex items-center gap-2">
              {headerAction}
              {showLogout && <LogoutButton />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Max-width container for mobile-first design */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 screen-enter">
        {children}
      </main>
    </div>
  )
}
