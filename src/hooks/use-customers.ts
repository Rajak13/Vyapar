import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customerQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Customer, Database } from '@/types/database'
import { toast } from 'sonner'

// Get customers by business
export function useCustomers(businessId: string) {
  return useQuery({
    queryKey: queryKeys.businessCustomers(businessId),
    queryFn: () => customerQueries.getByBusinessId(businessId),
    enabled: !!businessId,
  })
}

// Get customer by ID
export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => customerQueries.getById(id),
    enabled: !!id,
  })
}

// Search customers
export function useCustomerSearch(businessId: string, query: string) {
  return useQuery({
    queryKey: queryKeys.customerSearch(businessId, query),
    queryFn: () => customerQueries.search(businessId, query),
    enabled: !!businessId && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds for search results
  })
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customer: Database['public']['Tables']['customers']['Insert']) =>
      customerQueries.create(customer),
    onSuccess: (data) => {
      // Invalidate business customers list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessCustomers(data.business_id) 
      })
      // Set the new customer in cache
      queryClient.setQueryData(queryKeys.customer(data.id), data)
      toast.success('Customer created successfully')
    },
    onError: (error) => {
      console.error('Failed to create customer:', error)
      toast.error('Failed to create customer')
    },
  })
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['customers']['Update'] 
    }) => customerQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customer(id) })

      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData<Customer>(queryKeys.customer(id))

      // Optimistically update
      if (previousCustomer) {
        queryClient.setQueryData<Customer>(queryKeys.customer(id), {
          ...previousCustomer,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousCustomer }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customer(id), context.previousCustomer)
      }
      console.error('Failed to update customer:', error)
      toast.error('Failed to update customer')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.customer(data.id), data)
      // Invalidate business customers list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessCustomers(data.business_id) 
      })
      toast.success('Customer updated successfully')
    },
  })
}

// Delete customer mutation
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customerQueries.delete(id),
    onMutate: async (id) => {
      // Get customer data before deletion for cleanup
      const customer = queryClient.getQueryData<Customer>(queryKeys.customer(id))
      return { customer }
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.customer(id) })
      
      // Invalidate related queries
      if (context?.customer) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessCustomers(context.customer.business_id) 
        })
      }
      
      toast.success('Customer deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer')
    },
  })
}

// Get customer purchase history
export function useCustomerPurchaseHistory(customerId: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.customerPurchaseHistory(customerId, limit),
    queryFn: () => customerQueries.getPurchaseHistory(customerId, limit),
    enabled: !!customerId,
  })
}

// Get customer analytics
export function useCustomerAnalytics(customerId: string) {
  return useQuery({
    queryKey: ['customer-analytics', customerId],
    queryFn: () => customerQueries.getCustomerAnalytics(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get customer lifetime value
export function useCustomerLifetimeValue(customerId: string) {
  return useQuery({
    queryKey: ['customer-lifetime-value', customerId],
    queryFn: () => customerQueries.getCustomerLifetimeValue(customerId),
    enabled: !!customerId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}