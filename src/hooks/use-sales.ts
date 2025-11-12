import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { saleQueries, paymentQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Sale, Payment, Database } from '@/types/database'
import { toast } from 'sonner'

// Get sales by business
export function useSales(businessId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.businessSales(businessId),
    queryFn: () => saleQueries.getByBusinessId(businessId, limit),
    enabled: !!businessId,
  })
}

// Get sale by ID
export function useSale(id: string) {
  return useQuery({
    queryKey: queryKeys.sale(id),
    queryFn: () => saleQueries.getById(id),
    enabled: !!id,
  })
}

// Generate invoice number
export function useGenerateInvoiceNumber(businessId: string, prefix = 'INV') {
  return useQuery({
    queryKey: ['invoice-number', businessId, prefix],
    queryFn: () => saleQueries.generateInvoiceNumber(businessId, prefix),
    enabled: !!businessId,
    staleTime: 0, // Always fetch fresh invoice number
    gcTime: 0, // Don&apos;t cache invoice numbers
  })
}

// Create sale mutation
export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sale: Database['public']['Tables']['sales']['Insert']) =>
      saleQueries.create(sale),
    onSuccess: (data) => {
      // Invalidate business sales list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessSales(data.business_id) 
      })
      // Set the new sale in cache
      queryClient.setQueryData(queryKeys.sale(data.id), data)
      
      // Invalidate related data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessProducts(data.business_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardMetrics(data.business_id) 
      })
      
      // If customer is associated, invalidate customer data
      if (data.customer_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.customer(data.customer_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessCustomers(data.business_id) 
        })
      }
      
      toast.success('Sale created successfully')
    },
    onError: (error) => {
      console.error('Failed to create sale:', error)
      toast.error('Failed to create sale')
    },
  })
}

// Update sale mutation
export function useUpdateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['sales']['Update'] 
    }) => saleQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.sale(id) })

      // Snapshot previous value
      const previousSale = queryClient.getQueryData<Sale>(queryKeys.sale(id))

      // Optimistically update
      if (previousSale) {
        queryClient.setQueryData<Sale>(queryKeys.sale(id), {
          ...previousSale,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousSale }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousSale) {
        queryClient.setQueryData(queryKeys.sale(id), context.previousSale)
      }
      console.error('Failed to update sale:', error)
      toast.error('Failed to update sale')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.sale(data.id), data)
      // Invalidate business sales list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessSales(data.business_id) 
      })
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardMetrics(data.business_id) 
      })
      toast.success('Sale updated successfully')
    },
  })
}

// Delete sale mutation
export function useDeleteSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Get sale data first to restore stock
      const sale = await saleQueries.getById(id)
      
      // Delete the sale (triggers will handle stock restoration)
      await saleQueries.delete(id)
      
      return sale
    },
    onSuccess: (sale) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.sale(sale.id) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessSales(sale.business_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessProducts(sale.business_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardMetrics(sale.business_id) 
      })
      
      if (sale.customer_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.customer(sale.customer_id) 
        })
      }
      
      toast.success('Sale deleted and stock restored')
    },
    onError: (error) => {
      console.error('Failed to delete sale:', error)
      toast.error('Failed to delete sale')
    },
  })
}
