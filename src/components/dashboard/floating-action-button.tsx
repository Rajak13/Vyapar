'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Plus,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'

interface QuickAction {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const quickActions: QuickAction[] = [
  {
    label: 'Add Sale',
    href: '/pos',
    icon: ShoppingCart,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    label: 'Add Expense',
    href: '/expenses/new',
    icon: Receipt,
    color: 'bg-red-500 hover:bg-red-600',
  },
  {
    label: 'Add Product',
    href: '/inventory/new',
    icon: Package,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    label: 'Add Customer',
    href: '/customers/new',
    icon: Users,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
]

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50">
      {/* Quick Action Buttons */}
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <div
            key={action.label}
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              isOpen ? "translate-y-0" : "translate-y-4"
            )}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <span className="bg-background px-3 py-1 rounded-full text-sm font-medium shadow-lg border border-border whitespace-nowrap text-foreground">
              {action.label}
            </span>
            <Link href={action.href} onClick={() => setIsOpen(false)}>
              <Button
                size="sm"
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg text-white",
                  action.color
                )}
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        onClick={toggleOpen}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          isOpen 
            ? "bg-gray-500 hover:bg-gray-600 rotate-45" 
            : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}