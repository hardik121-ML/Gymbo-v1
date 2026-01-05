'use client'

// ============================================================================
// Logout Button Component
// ============================================================================
// Client-side button to handle logout via POST request
// ============================================================================

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  )
}
