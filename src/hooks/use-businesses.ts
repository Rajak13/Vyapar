import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessQueries, supabase } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Business, Database } from '@/types/database'
import { toast } from 'sonner'

// Get user's businesses
export function useBusinesses(userId: string) {
  return useQuery({
    queryKey: queryKeys.userBusinesses(userId),
    queryFn: () => businessQueries.getByUserId(userId),
    enabled: !!userId,
  })
}

// Get business by ID
export function useBusiness(id: string) {
  return useQuery({
    queryKey: queryKeys.business(id),
    queryFn: () => businessQueries.getById(id),
    enabled: !!id,
  })
}

// Create business mutation
export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (business: Database['public']['Tables']['businesses']['Insert']) => {
      try {
        // Try using the validation function first
        const { data, error } = await supabase.rpc('create_business_with_validation', {
          p_owner_id: business.owner_id,
          p_business_name: business.business_name,
          p_business_type: business.business_type || 'retail',
          p_address: business.address || {},
          p_contact: business.contact || {},
          p_settings: business.settings || {},
          p_fiscal_year_start: business.fiscal_year_start || new Date().toISOString().split('T')[0],
          p_vat_number: business.vat_number || null,
        })

        if (error) throw error
        return data as Business
      } catch (rpcError) {
        console.warn('RPC function failed, falling back to direct insert:', rpcError)
        
        // Fallback to direct insert
        return businessQueries.create(business)
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch user businesses
      queryClient.invalidateQueries({ queryKey: queryKeys.userBusinesses(data.owner_id) })
      // Set the new business in cache
      queryClient.setQueryData(queryKeys.business(data.id), data)
      toast.success('Business created successfully')
    },
    onError: (error: unknown) => {
      console.error('Failed to create business:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create business'
      toast.error(errorMessage)
    },
  })
}

// Update business mutation
export function useUpdateBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['businesses']['Update'] 
    }) => businessQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.business(id) })

      // Snapshot previous value
      const previousBusiness = queryClient.getQueryData<Business>(queryKeys.business(id))

      // Optimistically update
      if (previousBusiness) {
        queryClient.setQueryData<Business>(queryKeys.business(id), {
          ...previousBusiness,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousBusiness }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousBusiness) {
        queryClient.setQueryData(queryKeys.business(id), context.previousBusiness)
      }
      console.error('Failed to update business:', error)
      toast.error('Failed to update business')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.business(data.id), data)
      // Invalidate user businesses list
      queryClient.invalidateQueries({ queryKey: queryKeys.userBusinesses(data.owner_id) })
      toast.success('Business updated successfully')
    },
  })
}

// Delete business mutation
export function useDeleteBusiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => businessQueries.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.business(id) })
      // Invalidate user businesses list
      queryClient.invalidateQueries({ queryKey: queryKeys.businesses })
      toast.success('Business deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete business:', error)
      toast.error('Failed to delete business')
    },
  })
}