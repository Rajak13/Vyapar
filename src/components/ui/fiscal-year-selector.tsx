'use client'

import * as React from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { getCurrentFiscalYear, getFiscalYearDetails, getFiscalYearRange, type FiscalYear } from '@/lib/nepal-utils'

interface FiscalYearSelectorProps {
  value?: FiscalYear
  onChange?: (fiscalYear: FiscalYear) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  yearRange?: { start: number; end: number }
}

export function FiscalYearSelector({
  value,
  onChange,
  placeholder = 'Select fiscal year',
  disabled = false,
  className,
  yearRange = { start: 2075, end: 2090 }, // Default range from BS 2075 to 2090
}: FiscalYearSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const fiscalYears = React.useMemo(() => {
    return getFiscalYearRange(yearRange.start, yearRange.end)
  }, [yearRange])

  const currentFiscalYear = React.useMemo(() => {
    const currentYear = getCurrentFiscalYear()
    return fiscalYears.find(fy => fy.year === currentYear) || fiscalYears[fiscalYears.length - 5]
  }, [fiscalYears])

  const handleFiscalYearSelect = (fiscalYearString: string) => {
    const selectedFiscalYear = fiscalYears.find(fy => fy.year === fiscalYearString)
    if (selectedFiscalYear) {
      onChange?.(selectedFiscalYear)
      setIsOpen(false)
    }
  }

  const displayValue = value?.year || placeholder

  return (
    <div className={cn('w-full', className)}>
      <Select
        value={value?.year}
        onValueChange={handleFiscalYearSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {fiscalYears.map((fiscalYear) => (
            <SelectItem key={fiscalYear.year} value={fiscalYear.year}>
              <div className="flex flex-col">
                <span className="font-medium">FY {fiscalYear.year}</span>
                <span className="text-xs text-muted-foreground">
                  {fiscalYear.startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {fiscalYear.endDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Quick fiscal year navigation component
interface FiscalYearNavigatorProps {
  currentFiscalYear: FiscalYear
  onFiscalYearChange: (fiscalYear: FiscalYear) => void
  className?: string
}

export function FiscalYearNavigator({
  currentFiscalYear,
  onFiscalYearChange,
  className,
}: FiscalYearNavigatorProps) {
  const navigateFiscalYear = (direction: 'prev' | 'next') => {
    const currentBSYear = parseInt(currentFiscalYear.year.split('/')[0])
    const newBSYear = direction === 'next' ? currentBSYear + 1 : currentBSYear - 1
    const newFiscalYear = getFiscalYearDetails(newBSYear)
    onFiscalYearChange(newFiscalYear)
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateFiscalYear('prev')}
      >
        ←
      </Button>
      
      <div className="flex flex-col items-center min-w-[120px]">
        <span className="font-medium">FY {currentFiscalYear.year}</span>
        <span className="text-xs text-muted-foreground">
          {currentFiscalYear.startDateBS.monthName} - {currentFiscalYear.endDateBS.monthName}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateFiscalYear('next')}
      >
        →
      </Button>
    </div>
  )
}

// Fiscal year summary component
interface FiscalYearSummaryProps {
  fiscalYear: FiscalYear
  className?: string
}

export function FiscalYearSummary({ fiscalYear, className }: FiscalYearSummaryProps) {
  const daysRemaining = Math.ceil(
    (fiscalYear.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const totalDays = Math.ceil(
    (fiscalYear.endDate.getTime() - fiscalYear.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const progress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100))

  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Fiscal Year {fiscalYear.year}</h3>
        <span className="text-sm text-muted-foreground">
          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Completed'}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Start: {fiscalYear.startDateBS.day} {fiscalYear.startDateBS.monthName}</span>
          <span>End: {fiscalYear.endDateBS.day} {fiscalYear.endDateBS.monthName}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          {progress.toFixed(1)}% completed
        </div>
      </div>
    </div>
  )
}