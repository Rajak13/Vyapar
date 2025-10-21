'use client'

import { useState } from 'react'
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
import { Supplier } from '@/types/database'

const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  payment_terms: z.number().min(0).optional(),
  notes: z.string().optional(),
})

type SupplierFormData = z.infer<typeof supplierFormSchema>

interface SupplierFormProps {
  supplier?: Partial<Supplier>
  onSuccess?: () => void
  onCancel?: () => void
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplier ? {
      name: supplier.name || '',
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: typeof supplier.address === 'string' ? supplier.address : supplier.address?.street || '',
      payment_terms: 30,
      notes: supplier.notes || '',
    } : {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: 30,
      notes: '',
    }
  })

  // Get business ID
  useState(() => {
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
  })

  const onSubmit = async (data: SupplierFormData) => {
    if (!businessId) {
      toast.error('No business found')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      const supplierData = {
        ...data,
        business_id: businessId,
        address: data.address ? { street: data.address } : {},
      }

      if (supplier?.id) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', supplier.id)

        if (error) throw error
        toast.success('Supplier updated successfully!')
      } else {
        // Create new supplier
        const { error } = await supabase
          .from('suppliers')
          .insert(supplierData)

        if (error) throw error
        toast.success('Supplier created successfully!')
      }

      reset()
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error saving supplier:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save supplier')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{supplier ? 'Edit Supplier' : 'Add New Supplier'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter supplier name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                {...register('contact_person')}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
              <Input
                id="payment_terms"
                type="number"
                {...register('payment_terms', { valueAsNumber: true })}
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter supplier address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about the supplier"
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
              {supplier ? 'Update' : 'Create'} Supplier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}