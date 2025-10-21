'use client'

import { cn } from '@/lib/utils'

interface DashboardGridProps {
  children: React.ReactNode
  className?: string
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

interface DashboardSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

export function DashboardSection({ 
  children, 
  className, 
  title, 
  description 
}: DashboardSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// Responsive grid layouts for different content types
export function MetricsGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

export function ChartsGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1 lg:grid-cols-2",
      className
    )}>
      {children}
    </div>
  )
}

export function FullWidthGrid({ children, className }: DashboardGridProps) {
  return (
    <div className={cn(
      "grid gap-4 md:gap-6",
      "grid-cols-1",
      className
    )}>
      {children}
    </div>
  )
}