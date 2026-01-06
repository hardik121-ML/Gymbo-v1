'use client'

// ============================================================================
// Logout Button Component
// ============================================================================
// Client-side button to handle logout via POST request
// ============================================================================

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/login')
      } else {
        console.error('Logout failed')
        setIsLoggingOut(false)
      }
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  )
}
