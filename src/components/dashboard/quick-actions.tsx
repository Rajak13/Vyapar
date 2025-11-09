'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

const primaryActions: QuickAction[] = [
  {
    title: 'New Sale',
    description: 'Process a new transaction',
    href: '/sales',
    icon: ShoppingCart,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900',
  },
  {
    title: 'Returns & Exchanges',
    description: 'Process returns and exchanges',
    href: '/sales',
    icon: RotateCcw,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900',
  },
  {
    title: 'Add Expense',
    description: 'Record business expense',
    href: '/expenses',
    icon: Receipt,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900',
  },
  {
    title: 'Manage Inventory',
    description: 'Add or update products',
    href: '/inventory',
    icon: Package,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900',
  },
]

const secondaryActions: QuickAction[] = [
  {
    title: 'Customer Management',
    description: 'View and manage customers',
    href: '/customers',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900',
  },
  {
    title: 'View Reports',
    description: 'Business analytics',
    href: '/reports',
    icon: BarChart3,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900',
  },
  {
    title: 'Suppliers',
    description: 'Manage suppliers',
    href: '/suppliers',
    icon: CreditCard,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900',
  },
  {
    title: 'Products',
    description: 'Manage products',
    href: '/products',
    icon: FileText,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900',
  },
  {
    title: 'Settings',
    description: 'Business settings',
    href: '/settings',
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts for your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Primary Actions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {primaryActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-auto p-4 justify-start transition-colors w-full",
                    action.bgColor
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-background/50">
                      <action.icon className={cn("h-5 w-5", action.color)} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Other Actions
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {secondaryActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto p-3 flex-col gap-2 transition-colors w-full",
                    action.bgColor
                  )}
                >
                  <action.icon className={cn("h-5 w-5", action.color)} />
                  <span className="text-xs font-medium text-foreground">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}