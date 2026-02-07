'use client'

import { MobileLayout } from '@/components/MobileLayout'
import { SettingsMenuItem } from '@/components/SettingsMenuItem'
import { User, Palette, Bell, Shield, HelpCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SettingsPage() {
  const router = useRouter()
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
      setError('Failed to log out. Please try again.')
      console.error('Logout error:', err)
    }
  }

  return (
    <MobileLayout title="Settings" showBackButton={true} backHref="/clients">
      <div className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SettingsMenuItem
          icon={<User size={20} />}
          label="profile information"
          href="/settings/profile"
        />

        <SettingsMenuItem
          icon={<Palette size={20} />}
          label="brand settings"
          href="/settings/brand"
        />

        <SettingsMenuItem
          icon={<Bell size={20} />}
          label="notifications"
          href="/settings/notifications"
        />

        <SettingsMenuItem
          icon={<Shield size={20} />}
          label="privacy & security"
          href="/settings/privacy"
        />

        <SettingsMenuItem
          icon={<HelpCircle size={20} />}
          label="help & support"
          href="/settings/help"
        />

        <SettingsMenuItem
          icon={<LogOut size={20} />}
          label="log out"
          onClick={handleLogout}
          variant="destructive"
        />
      </div>
    </MobileLayout>
  )
}
