'use client'

import { BusinessSetupWizard } from '@/components/business/business-setup-wizard'
import { useAuth } from '@/contexts/auth-context'
import { useCreateBusiness } from '@/hooks/use-businesses'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type {
  BusinessInfoFormData,
  AddressFormData,
  ContactInfoFormData,
  BusinessSettingsFormData,
} from '@/lib/validations/business'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const createBusiness = useCreateBusiness()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Check if user already has a business setup
    if (user?.id) {
      const checkExistingBusiness = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()
          
          const { data: businesses, error } = await supabase
            .from('businesses')
            .select('id, business_name')
            .eq('owner_id', user.id)
            .limit(1)

          if (!error && businesses && businesses.length > 0) {
            // User already has a business, redirect to dashboard
            toast.success(`Welcome back to ${businesses[0].business_name}!`)
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error checking existing business:', error)
        }
      }

      checkExistingBusiness()
    }
  }, [user, loading, router])

  const handleBusinessSetupComplete = async (data: {
    businessInfo: BusinessInfoFormData
    address: AddressFormData
    contactInfo: ContactInfoFormData
    settings: BusinessSettingsFormData
  }) => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    try {
      // Prepare business data for creation
      const businessData = {
        owner_id: user.id,
        business_name: data.businessInfo.businessName,
        business_type: data.businessInfo.businessType,
        address: {
          street: data.address.street,
          city: data.address.city,
          district: data.address.district,
          province: data.address.province,
          postal_code: data.address.postalCode,
        },
        contact: {
          phone: data.contactInfo.phone,
          email: data.contactInfo.email,
          website: data.contactInfo.website,
        },
        settings: {
          language: data.settings.language,
          fiscal_year_start: data.settings.fiscalYearStart,
          currency: data.settings.currency,
          timezone: data.settings.timezone,
          date_format: data.settings.dateFormat,
          low_stock_threshold: data.settings.lowStockThreshold,
          invoice_prefix: data.settings.invoicePrefix,
          tax_rate: data.settings.taxRate,
          is_vat_registered: data.settings.isVatRegistered,
        },
        fiscal_year_start: data.settings.fiscalYearStart,
        vat_number: data.settings.isVatRegistered ? data.settings.vatNumber : undefined,
        active: true,
      }

      await createBusiness.mutateAsync(businessData)
      
      toast.success('Business setup completed successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Business setup error:', error)
      toast.error('Failed to complete business setup')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <BusinessSetupWizard onComplete={handleBusinessSetupComplete} />
}