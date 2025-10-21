'use client'

import React, { useState, useCallback } from 'react'
import { MultiStepWizard } from '@/components/ui/multi-step-wizard'
import { BusinessInfoStep } from './business-info-step'
import { AddressStep } from './address-step'
import { ContactInfoStep } from './contact-info-step'
import { BusinessSettingsStep } from './business-settings-step'
import {
  type BusinessInfoFormData,
  type AddressFormData,
  type ContactInfoFormData,
  type BusinessSettingsFormData,
} from '@/lib/validations/business'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BusinessSetupWizardProps {
  onComplete?: (data: {
    businessInfo: BusinessInfoFormData
    address: AddressFormData
    contactInfo: ContactInfoFormData
    settings: BusinessSettingsFormData
  }) => void
}

export function BusinessSetupWizard({ onComplete }: BusinessSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Form data state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoFormData>({
    businessName: '',
    businessType: 'retail',
    description: '',
  })

  const [address, setAddress] = useState<AddressFormData>({
    street: '',
    city: '',
    district: '',
    province: 'Bagmati Province',
    postalCode: '',
  })

  const [contactInfo, setContactInfo] = useState<ContactInfoFormData>({
    phone: '',
    email: '',
    website: '',
  })

  const [settings, setSettings] = useState<BusinessSettingsFormData>({
    language: 'en',
    fiscalYearStart: 'shrawan',
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    dateFormat: 'AD',
    lowStockThreshold: 10,
    invoicePrefix: 'INV',
    taxRate: 13,
    isVatRegistered: false,
  })

  // Validation state
  const [stepValidation, setStepValidation] = useState([false, false, false, false])

  const updateStepValidation = useCallback((stepIndex: number, isValid: boolean) => {
    setStepValidation(prev => {
      const newValidation = [...prev]
      newValidation[stepIndex] = isValid
      return newValidation
    })
  }, [])

  const handleNext = useCallback(() => {
    setCurrentStep(prev => prev + 1)
  }, [])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => prev - 1)
  }, [])

  const handleComplete = useCallback(async () => {
    setIsLoading(true)
    try {
      const completeData = {
        businessInfo,
        address,
        contactInfo,
        settings,
      }

      if (onComplete) {
        await onComplete(completeData)
      } else {
        // Default behavior - save to localStorage and redirect
        localStorage.setItem('businessSetupData', JSON.stringify(completeData))
        toast.success('Business setup completed successfully!')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Failed to complete business setup')
      console.error('Business setup error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [businessInfo, address, contactInfo, settings, onComplete, router])

  // Memoized callback functions to prevent infinite re-renders
  const handleBusinessInfoChange = useCallback((data: BusinessInfoFormData) => {
    setBusinessInfo(data)
  }, [])

  const handleAddressChange = useCallback((data: AddressFormData) => {
    setAddress(data)
  }, [])

  const handleContactInfoChange = useCallback((data: ContactInfoFormData) => {
    setContactInfo(data)
  }, [])

  const handleSettingsChange = useCallback((data: BusinessSettingsFormData) => {
    setSettings(data)
  }, [])

  const handleBusinessInfoValidation = useCallback((isValid: boolean) => {
    updateStepValidation(0, isValid)
  }, [updateStepValidation])

  const handleAddressValidation = useCallback((isValid: boolean) => {
    updateStepValidation(1, isValid)
  }, [updateStepValidation])

  const handleContactInfoValidation = useCallback((isValid: boolean) => {
    updateStepValidation(2, isValid)
  }, [updateStepValidation])

  const handleSettingsValidation = useCallback((isValid: boolean) => {
    updateStepValidation(3, isValid)
  }, [updateStepValidation])

  const steps = React.useMemo(() => [
    {
      id: 'business-info',
      title: 'Business Information',
      description: 'Tell us about your business',
      content: (
        <BusinessInfoStep
          data={businessInfo}
          onDataChange={handleBusinessInfoChange}
          onValidationChange={handleBusinessInfoValidation}
        />
      ),
    },
    {
      id: 'address',
      title: 'Business Address',
      description: 'Where is your business located?',
      content: (
        <AddressStep
          data={address}
          onDataChange={handleAddressChange}
          onValidationChange={handleAddressValidation}
        />
      ),
    },
    {
      id: 'contact',
      title: 'Contact Information',
      description: 'How can customers reach you?',
      content: (
        <ContactInfoStep
          data={contactInfo}
          onDataChange={handleContactInfoChange}
          onValidationChange={handleContactInfoValidation}
        />
      ),
    },
    {
      id: 'settings',
      title: 'Business Settings',
      description: 'Configure your business preferences',
      content: (
        <BusinessSettingsStep
          data={settings}
          onDataChange={handleSettingsChange}
          onValidationChange={handleSettingsValidation}
        />
      ),
    },
  ], [
    businessInfo, 
    address, 
    contactInfo, 
    settings,
    handleBusinessInfoChange,
    handleAddressChange,
    handleContactInfoChange,
    handleSettingsChange,
    handleBusinessInfoValidation,
    handleAddressValidation,
    handleContactInfoValidation,
    handleSettingsValidation
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Your Business
          </h1>
          <p className="text-lg text-gray-600">
            Let&apos;s get your business profile ready in just a few steps
          </p>
        </div>

        <MultiStepWizard
          steps={steps}
          currentStep={currentStep}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onComplete={handleComplete}
          isNextDisabled={!stepValidation[currentStep]}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}