import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Vyapar Vision',
  description: 'Manage your business with Vyapar Vision',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <AppShell>
        {children}
      </AppShell>
    </ProtectedRoute>
  )
}