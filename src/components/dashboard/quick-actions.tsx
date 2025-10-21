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
    href: '/pos',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    title: 'Returns & Exchanges',
    description: 'Process returns and exchanges',
    href: '/pos?tab=returns',
    icon: RotateCcw,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    title: 'Add Expense',
    description: 'Record business expense',
    href: '/expenses/new',
    icon: Receipt,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    title: 'Manage Inventory',
    description: 'Add or update products',
    href: '/inventory',
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
]

const secondaryActions: QuickAction[] = [
  {
    title: 'Customer Management',
    description: 'View and manage customers',
    href: '/customers',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    title: 'View Reports',
    description: 'Business analytics',
    href: '/reports',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
  },
  {
    title: 'Payment Tracking',
    description: 'Manage payments',
    href: '/payments',
    icon: CreditCard,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    title: 'Generate Invoice',
    description: 'Create new invoice',
    href: '/invoices/new',
    icon: FileText,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
  },
  {
    title: 'Settings',
    description: 'Business settings',
    href: '/settings',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
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
                    "h-auto p-4 justify-start transition-colors",
                    action.bgColor
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "p-2 rounded-lg",
                      action.color.replace('text-', 'bg-').replace('-600', '-100')
                    )}>
                      <action.icon className={cn("h-5 w-5", action.color)} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{action.title}</div>
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
                    "h-auto p-3 flex-col gap-2 transition-colors",
                    action.bgColor
                  )}
                >
                  <action.icon className={cn("h-5 w-5", action.color)} />
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}