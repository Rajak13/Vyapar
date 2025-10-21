'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { contactInfoSchema, type ContactInfoFormData } from '@/lib/validations/business'
import { Phone, Mail, Globe } from 'lucide-react'

interface ContactInfoStepProps {
  data: ContactInfoFormData
  onDataChange: (data: ContactInfoFormData) => void
  onValidationChange: (isValid: boolean) => void
}

export function ContactInfoStep({ data, onDataChange, onValidationChange }: ContactInfoStepProps) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const watchedData = watch()

  // Update parent component when data changes
  React.useEffect(() => {
    onDataChange(watchedData)
  }, [watchedData.phone, watchedData.email, watchedData.website, onDataChange])

  React.useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Phone Number *
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="9841234567 or +9779841234567"
          {...register('phone')}
          className={errors.phone ? 'border-red-500' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter your primary business phone number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address (Optional)
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="business@example.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Email for business communications and receipts
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Website (Optional)
        </Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.yourbusiness.com"
          {...register('website')}
          className={errors.website ? 'border-red-500' : ''}
        />
        {errors.website && (
          <p className="text-sm text-red-500">{errors.website.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your business website or social media page
        </p>
      </div>
    </div>
  )
}