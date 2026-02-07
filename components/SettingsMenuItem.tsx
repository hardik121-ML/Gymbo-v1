'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SettingsMenuItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'destructive'
}

export function SettingsMenuItem({
  icon,
  label,
  href,
  onClick,
  variant = 'default',
}: SettingsMenuItemProps) {
  const content = (
    <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'opacity-70',
              variant === 'destructive' && 'text-destructive'
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              'text-base',
              variant === 'destructive' && 'text-destructive'
            )}
          >
            {label}
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block stagger-item">
        {content}
      </Link>
    )
  }

  return (
    <div onClick={onClick} className="stagger-item">
      {content}
    </div>
  )
}
