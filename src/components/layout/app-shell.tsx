'use client'

import { useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { MobileNavigation } from './mobile-navigation'
import { FloatingActionButton } from '../dashboard/floating-action-button'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - Only show on desktop (xl and above) */}
      <div className="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
        <Sidebar />
      </div>

      {/* Mobile/Tablet Sidebar Overlay */}
      <div className={cn(
        "fixed inset-0 z-50 xl:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border">
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="xl:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="py-6 px-4 sm:px-6 lg:px-8 pb-20 xl:pb-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile/Tablet Bottom Navigation - Show on mobile and tablet */}
      <div className="xl:hidden">
        <MobileNavigation />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  )
}