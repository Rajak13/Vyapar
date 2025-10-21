import { useState, useCallback, useMemo } from 'react'
import { 
  formatNPR, 
  parseNepalNumber, 
  validateCurrencyInput, 
  CurrencyInputOptions,
  formatNepalNumber
} from '@/lib/nepal-utils'

export interface UseCurrencyInputOptions extends CurrencyInputOptions {
  initialValue?: number
  onChange?: (value: number) => void
  formatOnBlur?: boolean
  showSymbol?: boolean
}

export interface UseCurrencyInputReturn {
  value: string
  numericValue: number
  formattedValue: string
  error: string | null
  isValid: boolean
  setValue: (value: string) => void
  setNumericValue: (value: number) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlur: () => void
  reset: () => void
}

export function useCurrencyInput(options: UseCurrencyInputOptions = {}): UseCurrencyInputReturn {
  const {
    initialValue = 0,
    onChange,
    formatOnBlur = true,
    showSymbol = false,
    ...validationOptions
  } = options

  const [value, setValue] = useState<string>(
    initialValue > 0 ? formatNPR(initialValue, { showSymbol: false }) : ''
  )
  const [error, setError] = useState<string | null>(null)

  const numericValue = useMemo(() => {
    return value ? parseNepalNumber(value) : 0
  }, [value])

  const formattedValue = useMemo(() => {
    return numericValue > 0 ? formatNPR(numericValue, { showSymbol }) : ''
  }, [numericValue, showSymbol])

  const isValid = useMemo(() => {
    if (!value) return true // Empty is valid (will be handled by required validation)
    const validation = validateCurrencyInput(value, validationOptions)
    return validation.isValid
  }, [value, validationOptions])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }

    // Call onChange with numeric value
    if (onChange) {
      const numeric = parseNepalNumber(newValue)
      onChange(numeric)
    }
  }, [error, onChange])

  const handleBlur = useCallback(() => {
    if (!value) return

    const validation = validateCurrencyInput(value, validationOptions)
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid amount')
    } else {
      setError(null)
      
      // Format the value on blur if enabled
      if (formatOnBlur && validation.formattedValue) {
        setValue(validation.formattedValue.replace('Rs. ', ''))
      }
    }
  }, [value, validationOptions, formatOnBlur])

  const setValueDirectly = useCallback((newValue: string) => {
    setValue(newValue)
    setError(null)
  }, [])

  const setNumericValue = useCallback((newValue: number) => {
    const formatted = newValue > 0 ? formatNPR(newValue, { showSymbol: false }) : ''
    setValue(formatted)
    setError(null)
    
    if (onChange) {
      onChange(newValue)
    }
  }, [onChange])

  const reset = useCallback(() => {
    setValue('')
    setError(null)
    
    if (onChange) {
      onChange(0)
    }
  }, [onChange])

  return {
    value,
    numericValue,
    formattedValue,
    error,
    isValid,
    setValue: setValueDirectly,
    setNumericValue,
    handleChange,
    handleBlur,
    reset,
  }
}

// Hook for displaying formatted currency values (read-only)
export function useFormattedCurrency(
  amount: number, 
  options?: {
    showSymbol?: boolean
    showDecimals?: boolean
    useShortForm?: boolean
  }
): string {
  return useMemo(() => {
    return formatNPR(amount, options)
  }, [amount, options])
}

// Hook for number formatting in Lakhs/Crores
export function useFormattedNumber(
  num: number,
  options?: {
    precision?: number
    showFullForm?: boolean
  }
): string {
  return useMemo(() => {
    // Use the imported formatNepalNumber function
    return formatNepalNumber(num, options)
  }, [num, options])
}