'use client'

import { ThemeProvider } from '@/components/ThemeProvider'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider defaultTheme="dark">
      {children}
    </ThemeProvider>
  )
}
