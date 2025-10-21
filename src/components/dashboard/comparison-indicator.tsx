'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ComparisonIndicatorProps {
  current: number
  previous: number
  label: string
  format?: 'currency' | 'number' | 'percentage'
  className?: string
}

export function ComparisonIndicator({
  current,
  previous,
  label,
  format = 'number',
  className,
}: ComparisonIndicatorProps) {
  const difference = current - previous
  const percentageChange = previous !== 0 ? (difference / previous) * 100 : 0
  const isPositive = difference > 0
  const isNeutral = difference === 0

  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-NP', {
          style: 'currency',
          currency: 'NPR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Math.abs(value))
      case 'percentage':
        return `${Math.abs(value).toFixed(1)}%`
      default:
        return Math.abs(value).toString()
    }
  }

  const getIcon = () => {
    if (isNeutral) return <Minus className="h-3 w-3" />
    return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const getColorClass = () => {
    if (isNeutral) return 'text-gray-500'
    return isPositive ? 'text-green-600' : 'text-red-600'
  }

  const getBackgroundClass = () => {
    if (isNeutral) return 'bg-gray-100'
    return isPositive ? 'bg-green-100' : 'bg-red-100'
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
      getColorClass(),
      getBackgroundClass(),
      className
    )}>
      {getIcon()}
      <span>
        {isNeutral ? 'No change' : `${isPositive ? '+' : '-'}${formatValue(difference)}`}
      </span>
      {!isNeutral && (
        <span className="text-xs opacity-75">
          ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
        </span>
      )}
      <span className="text-xs opacity-75 ml-1">
        vs {label}
      </span>
    </div>
  )
}