'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNPR, formatNepalNumber } from '@/lib/nepal-utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  previousValue?: number
  icon: LucideIcon
  description?: string
  format?: 'currency' | 'number' | 'percentage'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  trendLabel?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  previousValue,
  icon: Icon,
  description,
  format = 'currency',
  trend,
  trendValue,
  trendLabel,
  className,
}: MetricCardProps) {
  // Calculate trend if not provided but previousValue exists
  const calculatedTrend = trend || (previousValue !== undefined ? 
    (value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral') : 
    'neutral'
  )

  const calculatedTrendValue = trendValue || (previousValue !== undefined ? 
    Math.abs(((value - previousValue) / previousValue) * 100) : 
    0
  )

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatNPR(val, { useShortForm: val >= 100000 }) // Use short form for large amounts
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return formatNepalNumber(val, { precision: val >= 1000 ? 1 : 0 })
    }
  }

  const getTrendIcon = () => {
    switch (calculatedTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />
      case 'down':
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  const getTrendColor = () => {
    switch (calculatedTrend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {formatValue(value)}
        </div>
        
        {(calculatedTrendValue > 0 || trendLabel) && (
          <div className={cn(
            "flex items-center text-xs",
            getTrendColor()
          )}>
            {getTrendIcon()}
            <span className="ml-1">
              {trendLabel || `${calculatedTrendValue.toFixed(1)}% from ${previousValue !== undefined ? 'previous' : 'last period'}`}
            </span>
          </div>
        )}
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}