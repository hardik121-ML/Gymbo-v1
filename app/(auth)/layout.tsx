'use client'

import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const root = document.documentElement

    // Apply orange theme at root level
    root.classList.remove('dark')
    root.classList.add('theme-orange')

    return () => {
      // Restore user's theme on unmount (when navigating away from auth)
      root.classList.remove('theme-orange')
      const stored = localStorage.getItem('gymbo-theme') || 'dark'
      if (stored === 'dark') {
        root.classList.add('dark')
      }
    }
  }, [])

  return (
    <div className="bg-background text-foreground min-h-screen">
      {children}
    </div>
  )
}
