'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { businessInfoSchema, type BusinessInfoFormData } from '@/lib/validations/business'
import { Store, ShoppingBag, Truck } from 'lucide-react'

interface BusinessInfoStepProps {
  data: BusinessInfoFormData
  onDataChange: (data: BusinessInfoFormData) => void
  onValidationChange: (isValid: boolean) => void
}

const businessTypes = [
  {
    value: 'retail' as const,
    label: 'Retail',
    description: 'Sell products directly to customers',
    icon: Store,
  },
  {
    value: 'service' as const,
    label: 'Service',
    description: 'Provide services to customers',
    icon: ShoppingBag,
  },
  {
    value: 'wholesale' as const,
    label: 'Wholesale',
    description: 'Sell products in bulk to retailers',
    icon: Truck,
  },
]

export function BusinessInfoStep({ data, onDataChange, onValidationChange }: BusinessInfoStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const watchedData = watch()

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(watchedData)
  }, [watchedData.businessName, watchedData.businessType, watchedData.description, onDataChange])

  React.useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          placeholder="Enter your business name"
          {...register('businessName')}
          className={errors.businessName ? 'border-red-500' : ''}
        />
        {errors.businessName && (
          <p className="text-sm text-red-500">{errors.businessName.message}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Business Type *</Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {businessTypes.map((type) => {
            const Icon = type.icon
            return (
              <Button
                key={type.value}
                type="button"
                variant={watchedData.businessType === type.value ? 'default' : 'outline'}
                className="h-auto p-4 flex flex-col items-center gap-2 text-center"
                onClick={() => setValue('businessType', type.value, { shouldValidate: true })}
              >
                <Icon className="h-6 w-6" />
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground">{type.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
        {errors.businessType && (
          <p className="text-sm text-red-500">{errors.businessType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description (Optional)</Label>
        <textarea
          id="description"
          placeholder="Briefly describe your business"
          className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>
    </div>
  )
}