'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'

const customerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerFormSchema>

interface CustomerFormProps {
  customer?: {
    id?: string
    name?: string
    phone?: string
    email?: string
    address?: { street?: string }
    notes?: string
  }
  businessId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({ customer, businessId: propBusinessId, onSuccess, onCancel }: CustomerFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address?.street || '',
      notes: customer.notes || '',
    } : {
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    }
  })

  // Get business ID - use prop if provided, otherwise fetch
  useEffect(() => {
    if (propBusinessId) {
      setBusinessId(propBusinessId)
      return
    }

    const fetchBusiness = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createClient()
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id)
          .eq('active', true)
          .limit(1)
        
        if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id)
        }
      } catch (error) {
        console.error('Error fetching business:', error)
      }
    }
    
    fetchBusiness()
  }, [propBusinessId, user?.id])

  const onSubmit = async (data: CustomerFormData) => {
    if (!businessId) {
      toast.error('No business found')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const customerData = {
        ...data,
        business_id: businessId,
        address: data.address ? { street: data.address } : {},
      }

      if (customer?.id) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id)
        
        if (error) throw error
        toast.success('Customer updated successfully!')
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert(customerData)
        
        if (error) throw error
        toast.success('Customer created successfully!')
      }
      
      reset()
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error saving customer:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save customer')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter customer name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter customer address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about the customer"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {customer ? 'Update' : 'Create'} Customer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}