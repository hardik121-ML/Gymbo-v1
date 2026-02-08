'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Tab = 'dashboard' | 'clients' | 'profile'

const tabHrefs: Record<Tab, string> = {
  dashboard: '/dashboard',
  clients: '/clients',
  profile: '/settings',
}

interface BottomNavProps {
  activeTab?: Tab
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const pathname = usePathname()

  const tabs: Tab[] = ['dashboard', 'clients', 'profile']

  const resolvedActive =
    activeTab ||
    (pathname.startsWith('/dashboard')
      ? 'dashboard'
      : pathname.startsWith('/clients')
        ? 'clients'
        : 'profile')

  return (
    <div className="w-full flex flex-col z-10 shrink-0 mt-auto bg-background/80 backdrop-blur-md border-t border-foreground/5 fixed bottom-0 left-0 right-0">
      <div className="flex items-center justify-around w-full h-20 px-6 max-w-3xl mx-auto">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={tabHrefs[tab]}
            className="relative flex flex-col items-center h-full justify-center px-2 flex-1"
          >
            <span
              className={cn(
                'text-[10px] font-bold lowercase tracking-[0.15em] transition-all duration-300',
                resolvedActive === tab
                  ? 'text-foreground scale-110'
                  : 'text-foreground/40 hover:text-foreground/70'
              )}
            >
              {tab}
            </span>
            {resolvedActive === tab && (
              <div className="absolute bottom-4 w-1 h-1 rounded-full bg-foreground" />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
