'use client'

import { AppShell } from '@/components/AppShell'
import { useTheme } from '@/components/ThemeProvider'
import { User, Palette, Bell, Shield, HelpCircle, LogOut, ChevronRight, Sun, Moon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

const settingsItems = [
  { icon: User, label: 'profile information', href: '/settings/profile' },
  { icon: Palette, label: 'brand settings', href: '/settings/brand' },
  { icon: Bell, label: 'notifications', href: '/settings/notifications' },
  { icon: Shield, label: 'privacy & security', href: '/settings/privacy' },
  { icon: HelpCircle, label: 'help & support', href: '/settings/help' },
]

interface SettingsContentProps {
  trainerName: string
}

export function SettingsContent({ trainerName }: SettingsContentProps) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      router.push('/login')
    } catch (err) {
      setError('failed to log out. please try again.')
      console.error('Logout error:', err)
    }
  }

  return (
    <AppShell title="settings" showBottomNav={true} activeTab="profile">
      {/* Profile */}
      <div className="flex flex-col items-center gap-3 my-8">
        <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center text-foreground border border-foreground relative overflow-hidden">
          <User size={40} strokeWidth={1} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold lowercase tracking-wide">
            {trainerName ? trainerName.toLowerCase() : '\u00A0'}
          </h2>
          <p className="text-xs font-mono text-muted-foreground lowercase tracking-wider">
            head trainer
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-center mb-8">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-6 py-3 border border-foreground/10 rounded-full transition-colors hover:bg-foreground/5"
        >
          {theme === 'dark' ? (
            <>
              <Moon size={16} strokeWidth={1.5} />
              <span className="text-xs font-bold lowercase tracking-wider">dark mode</span>
            </>
          ) : (
            <>
              <Sun size={16} strokeWidth={1.5} />
              <span className="text-xs font-bold lowercase tracking-wider">light mode</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-4 py-2 rounded-full text-center mb-4">
          {error}
        </p>
      )}

      {/* Settings List */}
      <div className="space-y-6">
        {settingsItems.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="w-full flex items-center justify-between group py-2 border-b border-transparent hover:border-foreground/10 transition-colors stagger-item"
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} strokeWidth={1.5} />
              <span className="font-medium text-sm lowercase">{item.label}</span>
            </div>
            <ChevronRight
              strokeWidth={1.5}
              size={16}
              className="opacity-0 group-hover:opacity-30 transition-opacity"
            />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-8 border-t border-foreground/10 pt-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 text-destructive font-bold lowercase tracking-wider text-xs hover:bg-destructive/10 rounded-full transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut strokeWidth={1.5} size={16} />
          log out
        </button>
      </div>
    </AppShell>
  )
}
