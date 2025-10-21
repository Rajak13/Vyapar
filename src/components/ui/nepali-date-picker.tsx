'use client'

import * as React from 'react'
import { Calendar, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { adToBs, bsToAd, formatNepaliDate, NEPALI_MONTHS, type NepaliDate } from '@/lib/nepal-utils'

interface NepaliDatePickerProps {
  value?: Date
  onChange?: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  calendarSystem?: 'AD' | 'BS'
  onCalendarSystemChange?: (system: 'AD' | 'BS') => void
}

export function NepaliDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className,
  calendarSystem = 'AD',
  onCalendarSystemChange,
}: NepaliDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentSystem, setCurrentSystem] = React.useState<'AD' | 'BS'>(calendarSystem)
  const [viewDate, setViewDate] = React.useState(() => {
    if (value) return value
    return new Date()
  })

  const nepaliDate = React.useMemo(() => {
    if (!value) return null
    return adToBs(value)
  }, [value])

  const handleSystemChange = (system: 'AD' | 'BS') => {
    setCurrentSystem(system)
    onCalendarSystemChange?.(system)
  }

  const handleDateSelect = (date: Date) => {
    onChange?.(date)
    setIsOpen(false)
  }

  const formatDisplayDate = () => {
    if (!value) return placeholder
    
    if (currentSystem === 'BS' && nepaliDate) {
      return formatNepaliDate(nepaliDate, 'long')
    }
    
    return value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDisplayDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <Select value={currentSystem} onValueChange={handleSystemChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AD">AD</SelectItem>
                <SelectItem value="BS">BS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {currentSystem === 'AD' ? (
            <ADCalendar
              value={value}
              onChange={handleDateSelect}
              viewDate={viewDate}
              onViewDateChange={setViewDate}
            />
          ) : (
            <BSCalendar
              value={value}
              onChange={handleDateSelect}
              viewDate={viewDate}
              onViewDateChange={setViewDate}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface CalendarProps {
  value?: Date
  onChange: (date: Date) => void
  viewDate: Date
  onViewDateChange: (date: Date) => void
}

function ADCalendar({ value, onChange, viewDate, onViewDateChange }: CalendarProps) {
  const currentMonth = viewDate.getMonth()
  const currentYear = viewDate.getFullYear()
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    newDate.setMonth(currentMonth + (direction === 'next' ? 1 : -1))
    onViewDateChange(newDate)
  }

  const selectDate = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day)
    onChange(selectedDate)
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const date = new Date(currentYear, currentMonth, day)
    return date.toDateString() === value.toDateString()
  }

  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(currentYear, currentMonth, day)
    return date.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayWeekday }, (_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          return (
            <Button
              key={day}
              variant={isSelected(day) ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 w-8 p-0',
                isToday(day) && !isSelected(day) && 'bg-accent text-accent-foreground'
              )}
              onClick={() => selectDate(day)}
            >
              {day}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function BSCalendar({ value, onChange, viewDate, onViewDateChange }: CalendarProps) {
  const nepaliViewDate = adToBs(viewDate)
  const currentMonth = nepaliViewDate.month - 1 // Convert to 0-based index
  const currentYear = nepaliViewDate.year

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = currentMonth + (direction === 'next' ? 1 : -1)
    let newYear = currentYear

    if (newMonth > 11) {
      newMonth = 0
      newYear += 1
    } else if (newMonth < 0) {
      newMonth = 11
      newYear -= 1
    }

    // Convert back to AD for viewDate
    const newNepaliDate: NepaliDate = {
      year: newYear,
      month: newMonth + 1,
      day: 1,
      monthName: NEPALI_MONTHS[newMonth].en,
      monthNameNe: NEPALI_MONTHS[newMonth].ne,
    }
    
    const newADDate = bsToAd(newNepaliDate)
    onViewDateChange(newADDate)
  }

  const selectDate = (day: number) => {
    const nepaliDate: NepaliDate = {
      year: currentYear,
      month: currentMonth + 1,
      day,
      monthName: NEPALI_MONTHS[currentMonth].en,
      monthNameNe: NEPALI_MONTHS[currentMonth].ne,
    }
    
    const adDate = bsToAd(nepaliDate)
    onChange(adDate)
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const valueNepali = adToBs(value)
    return (
      valueNepali.year === currentYear &&
      valueNepali.month === currentMonth + 1 &&
      valueNepali.day === day
    )
  }

  const isToday = (day: number) => {
    const todayNepali = adToBs(new Date())
    return (
      todayNepali.year === currentYear &&
      todayNepali.month === currentMonth + 1 &&
      todayNepali.day === day
    )
  }

  const daysInMonth = NEPALI_MONTHS[currentMonth].days

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {NEPALI_MONTHS[currentMonth].en} {currentYear}
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Simple grid layout for BS calendar - in production, calculate proper weekday alignment */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          return (
            <Button
              key={day}
              variant={isSelected(day) ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-8 w-8 p-0',
                isToday(day) && !isSelected(day) && 'bg-accent text-accent-foreground'
              )}
              onClick={() => selectDate(day)}
            >
              {day}
            </Button>
          )
        })}
      </div>
    </div>
  )
}