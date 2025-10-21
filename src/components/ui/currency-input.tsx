"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrencyInput, UseCurrencyInputOptions } from "@/hooks/use-currency-input"

export interface CurrencyInputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>,
    UseCurrencyInputOptions {
  label?: string
  error?: string
  showSymbol?: boolean
  onValueChange?: (value: number) => void
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
    label, 
    error: externalError,
    showSymbol = true,
    onValueChange,
    initialValue,
    allowNegative,
    maxValue,
    minValue,
    precision,
    formatOnBlur = true,
    ...props 
  }, ref) => {
    const {
      value,
      numericValue,
      error: internalError,
      isValid,
      handleChange,
      handleBlur,
    } = useCurrencyInput({
      initialValue,
      onChange: onValueChange,
      allowNegative,
      maxValue,
      minValue,
      precision,
      formatOnBlur,
      showSymbol: false, // We'll handle symbol display separately
    })

    const error = externalError || internalError
    const hasError = !isValid || !!error

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className={cn(hasError && "text-destructive")}>
            {label}
          </Label>
        )}
        <div className="relative">
          {showSymbol && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              Rs.
            </div>
          )}
          <Input
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              showSymbol && "pl-12",
              hasError && "border-destructive focus-visible:ring-destructive",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={error ? `${props.id}-error` : undefined}
          />
        </div>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!error && numericValue > 0 && (
          <p className="text-xs text-muted-foreground">
            Numeric value: {numericValue.toLocaleString()}
          </p>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }