'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addressSchema, type AddressFormData } from '@/lib/validations/business'

interface AddressStepProps {
  data: AddressFormData
  onDataChange: (data: AddressFormData) => void
  onValidationChange: (isValid: boolean) => void
}

const provinces = [
  'Province 1',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
]

export function AddressStep({ data, onDataChange, onValidationChange }: AddressStepProps) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const watchedData = watch()

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(watchedData)
  }, [watchedData.street, watchedData.city, watchedData.district, watchedData.province, watchedData.postalCode, onDataChange])

  React.useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          placeholder="Enter your street address"
          {...register('street')}
          className={errors.street ? 'border-red-500' : ''}
        />
        {errors.street && (
          <p className="text-sm text-red-500">{errors.street.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="Enter your city"
            {...register('city')}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">District *</Label>
          <Input
            id="district"
            placeholder="Enter your district"
            {...register('district')}
            className={errors.district ? 'border-red-500' : ''}
          />
          {errors.district && (
            <p className="text-sm text-red-500">{errors.district.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="province">Province *</Label>
          <select
            id="province"
            {...register('province')}
            className={`w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md ${
              errors.province ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select Province</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
          {errors.province && (
            <p className="text-sm text-red-500">{errors.province.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code (Optional)</Label>
          <Input
            id="postalCode"
            placeholder="Enter postal code"
            {...register('postalCode')}
            className={errors.postalCode ? 'border-red-500' : ''}
          />
          {errors.postalCode && (
            <p className="text-sm text-red-500">{errors.postalCode.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}