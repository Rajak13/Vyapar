'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessSettingsSchema, type BusinessSettingsFormData } from '@/lib/validations/business'
import { Languages, Calendar, DollarSign, FileText, Percent } from 'lucide-react'

interface BusinessSettingsStepProps {
  data: BusinessSettingsFormData
  onDataChange: (data: BusinessSettingsFormData) => void
  onValidationChange: (isValid: boolean) => void
}

const languageOptions = [
  { value: 'en' as const, label: 'English', flag: '🇺🇸' },
  { value: 'ne' as const, label: 'नेपाली (Nepali)', flag: '🇳🇵' },
]

const fiscalYearOptions = [
  { 
    value: 'shrawan' as const, 
    label: 'Shrawan (Nepali Fiscal Year)', 
    description: 'July-August to June-July' 
  },
  { 
    value: 'january' as const, 
    label: 'January (English Fiscal Year)', 
    description: 'January to December' 
  },
]

const dateFormatOptions = [
  { value: 'AD' as const, label: 'AD (English Calendar)', description: '2024-01-15' },
  { value: 'BS' as const, label: 'BS (Bikram Sambat)', description: '२०८०-१०-०१' },
]

export function BusinessSettingsStep({ data, onDataChange, onValidationChange }: BusinessSettingsStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BusinessSettingsFormData>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const watchedData = watch()

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(watchedData)
  }, [
    watchedData.language,
    watchedData.fiscalYearStart,
    watchedData.currency,
    watchedData.timezone,
    watchedData.dateFormat,
    watchedData.lowStockThreshold,
    watchedData.invoicePrefix,
    watchedData.taxRate,
    watchedData.isVatRegistered,
    watchedData.vatNumber,
    onDataChange
  ])

  React.useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="space-y-8">
      {/* Language Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Language Preference *
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {languageOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={watchedData.language === option.value ? 'default' : 'outline'}
              className="h-auto p-4 flex items-center gap-3 justify-start"
              onClick={() => setValue('language', option.value, { shouldValidate: true })}
            >
              <span className="text-2xl">{option.flag}</span>
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
        {errors.language && (
          <p className="text-sm text-red-500">{errors.language.message}</p>
        )}
      </div>

      {/* Fiscal Year */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Fiscal Year Start *
        </Label>
        <div className="space-y-2">
          {fiscalYearOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={watchedData.fiscalYearStart === option.value ? 'default' : 'outline'}
              className="w-full h-auto p-4 flex flex-col items-start gap-1"
              onClick={() => setValue('fiscalYearStart', option.value, { shouldValidate: true })}
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </Button>
          ))}
        </div>
        {errors.fiscalYearStart && (
          <p className="text-sm text-red-500">{errors.fiscalYearStart.message}</p>
        )}
      </div>

      {/* Date Format */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Format *
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dateFormatOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={watchedData.dateFormat === option.value ? 'default' : 'outline'}
              className="h-auto p-4 flex flex-col items-center gap-1"
              onClick={() => setValue('dateFormat', option.value, { shouldValidate: true })}
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </Button>
          ))}
        </div>
        {errors.dateFormat && (
          <p className="text-sm text-red-500">{errors.dateFormat.message}</p>
        )}
      </div>

      {/* Business Configuration */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Low Stock Alert Threshold
          </Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min="0"
            max="1000"
            {...register('lowStockThreshold', { valueAsNumber: true })}
            className={errors.lowStockThreshold ? 'border-red-500' : ''}
          />
          {errors.lowStockThreshold && (
            <p className="text-sm text-red-500">{errors.lowStockThreshold.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Get alerts when stock falls below this number
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoicePrefix" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice Prefix
          </Label>
          <Input
            id="invoicePrefix"
            placeholder="INV"
            {...register('invoicePrefix')}
            className={errors.invoicePrefix ? 'border-red-500' : ''}
          />
          {errors.invoicePrefix && (
            <p className="text-sm text-red-500">{errors.invoicePrefix.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Prefix for invoice numbers (e.g., INV-001)
          </p>
        </div>
      </div>

      {/* VAT Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isVatRegistered"
            {...register('isVatRegistered')}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isVatRegistered" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            VAT Registered Business
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...register('taxRate', { valueAsNumber: true })}
              className={errors.taxRate ? 'border-red-500' : ''}
            />
            {errors.taxRate && (
              <p className="text-sm text-red-500">{errors.taxRate.message}</p>
            )}
          </div>

          {watchedData.isVatRegistered && (
            <div className="space-y-2">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                placeholder="Enter VAT number"
                {...register('vatNumber')}
                className={errors.vatNumber ? 'border-red-500' : ''}
              />
              {errors.vatNumber && (
                <p className="text-sm text-red-500">{errors.vatNumber.message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}