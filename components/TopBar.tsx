'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Menu, Grab } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
  rightAction?: ReactNode
}

export function TopBar({
  title,
  showBackButton = false,
  backHref,
  rightAction,
}: TopBarProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="w-full flex flex-col z-10 shrink-0 bg-background/80 backdrop-blur-md sticky top-0">
      <div className="flex items-center justify-between w-full relative h-16 px-6">
        <div className="flex items-center justify-start w-12">
          {showBackButton ? (
            <button
              onClick={handleBack}
              className="text-foreground hover:opacity-60 transition-opacity flex items-center justify-start w-full"
              aria-label="Go back"
            >
              <ArrowLeft strokeWidth={1.5} size={24} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center">
              <Grab strokeWidth={1.5} size={16} />
            </div>
          )}
        </div>

        {title && (
          <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold tracking-[0.2em] lowercase text-foreground/80 pointer-events-none">
            {title}
          </h1>
        )}

        <div className="flex items-center justify-end w-12">
          {rightAction || (
            <Link
              href="/settings"
              className="text-foreground hover:opacity-60 transition-opacity flex items-center justify-end w-full"
            >
              <Menu strokeWidth={1.5} size={22} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
