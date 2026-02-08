'use client'

import { ReactNode } from 'react'
import { AppShell } from '@/components/AppShell'
import { ClientPageActions } from '@/components/ClientPageActions'

export function ClientsPageShell({ children }: { children: ReactNode }) {
  return (
    <AppShell title="clients" showBottomNav={true} activeTab="clients">
      <ClientPageActions />
      {children}
    </AppShell>
  )
}
