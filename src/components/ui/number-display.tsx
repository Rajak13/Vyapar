"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatNPR, formatNepalNumber, formatNepalPercentage } from "@/lib/nepal-utils"

export interface NumberDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  type?: 'currency' | 'number' | 'percentage'
  showSymbol?: boolean
  showDecimals?: boolean
  useShortForm?: boolean
  precision?: number
  showFullForm?: boolean
  variant?: 'default' | 'large' | 'small' | 'muted'
}

const NumberDisplay = React.forwardRef<HTMLSpanElement, NumberDisplayProps>(
  ({ 
    className,
    value,
    type = 'currency',
    showSymbol = true,
    showDecimals = true,
    useShortForm = false,
    precision = 2,
    showFullForm = false,
    variant = 'default',
    ...props 
  }, ref) => {
    const formatValue = () => {
      switch (type) {
        case 'currency':
          return formatNPR(value, { showSymbol, showDecimals, useShortForm })
        case 'number':
          return formatNepalNumber(value, { precision, showFullForm })
        case 'percentage':
          return formatNepalPercentage(value, precision)
        default:
          return value.toString()
      }
    }

    const getVariantClasses = () => {
      switch (variant) {
        case 'large':
          return 'text-2xl font-bold'
        case 'small':
          return 'text-sm'
        case 'muted':
          return 'text-muted-foreground'
        default:
          return 'font-medium'
      }
    }

    const isNegative = value < 0
    const isZero = value === 0

    return (
      <span
        ref={ref}
        className={cn(
          getVariantClasses(),
          isNegative && 'text-destructive',
          isZero && 'text-muted-foreground',
          'tabular-nums', // Use monospace numbers for better alignment
          className
        )}
        title={`Exact value: ${value.toLocaleString()}`}
        {...props}
      >
        {formatValue()}
      </span>
    )
  }
)

NumberDisplay.displayName = "NumberDisplay"

// Specialized components for common use cases
export const CurrencyDisplay = React.forwardRef<HTMLSpanElement, Omit<NumberDisplayProps, 'type'>>(
  (props, ref) => <NumberDisplay ref={ref} type="currency" {...props} />
)

export const ShortCurrencyDisplay = React.forwardRef<HTMLSpanElement, Omit<NumberDisplayProps, 'type' | 'useShortForm'>>(
  (props, ref) => <NumberDisplay ref={ref} type="currency" useShortForm {...props} />
)

export const PercentageDisplay = React.forwardRef<HTMLSpanElement, Omit<NumberDisplayProps, 'type'>>(
  (props, ref) => <NumberDisplay ref={ref} type="percentage" {...props} />
)

export const LakhCroreDisplay = React.forwardRef<HTMLSpanElement, Omit<NumberDisplayProps, 'type'>>(
  (props, ref) => <NumberDisplay ref={ref} type="number" {...props} />
)

CurrencyDisplay.displayName = "CurrencyDisplay"
ShortCurrencyDisplay.displayName = "ShortCurrencyDisplay"
PercentageDisplay.displayName = "PercentageDisplay"
LakhCroreDisplay.displayName = "LakhCroreDisplay"

export { NumberDisplay }