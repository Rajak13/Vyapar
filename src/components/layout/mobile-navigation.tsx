'use client'

import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageToggle } from '@/components/ui/language-toggle'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'POS', href: '/pos', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

const quickActions = [
  { name: 'New Sale', href: '/pos', icon: ShoppingCart },
  { name: 'Add Product', href: '/inventory/new', icon: Package },
  { name: 'Add Customer', href: '/customers/new', icon: Users },
  { name: 'Add Expense', href: '/expenses/new', icon: BarChart3 },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false)

  return (
    <>
      {/* Enhanced Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 min-w-0 relative',
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
                <item.icon className={cn(
                  'h-5 w-5 mb-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span className="truncate leading-tight">{item.name}</span>
              </Link>
            )
          })}
          
          {/* Quick Actions Button */}
          <Sheet open={isQuickActionsOpen} onOpenChange={setIsQuickActionsOpen}>
            <SheetTrigger asChild>
              <Button
                size="sm"
                className="flex flex-col items-center justify-center px-2 py-2 h-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                <Plus className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Quick</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>Quick Actions</SheetTitle>
                <SheetDescription>
                  Quickly access common tasks
                </SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={() => setIsQuickActionsOpen(false)}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <action.icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{action.name}</span>
                  </Link>
                ))}
              </div>
              
              {/* Settings and Toggles */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <Link
                    href="/settings"
                    onClick={() => setIsQuickActionsOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <LanguageToggle />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      

    </>
  )
}