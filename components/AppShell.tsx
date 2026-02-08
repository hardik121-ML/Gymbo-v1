'use client'

import { ReactNode } from 'react'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { cn } from '@/lib/utils'

type Tab = 'dashboard' | 'clients' | 'profile'

interface AppShellProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  backHref?: string
  showBottomNav?: boolean
  activeTab?: Tab
  rightAction?: ReactNode
}

export function AppShell({
  children,
  title,
  showBackButton = false,
  backHref,
  showBottomNav = false,
  activeTab,
  rightAction,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar
        title={title}
        showBackButton={showBackButton}
        backHref={backHref}
        rightAction={rightAction}
      />

      <main
        className={cn(
          'flex-1 px-6 py-6 screen-enter max-w-3xl mx-auto w-full',
          showBottomNav ? 'pb-24' : 'pb-8'
        )}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav activeTab={activeTab} />}
    </div>
  )
}
