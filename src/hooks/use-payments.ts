import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Payment, Database } from '@/types/database'
import { toast } from 'sonner'

// Get payments by sale
export function usePayments(saleId: string) {
  return useQuery({
    queryKey: queryKeys.salePayments(saleId),
    queryFn: () => paymentQueries.getBySaleId(saleId),
    enabled: !!saleId,
  })
}

// Create payment mutation
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payment: Database['public']['Tables']['payments']['Insert']) =>
      paymentQueries.create(payment),
    onSuccess: (data) => {
      // Invalidate sale payments
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salePayments(data.sale_id) 
      })
      // Invalidate the sale itself (payment status might change)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.sale(data.sale_id) 
      })
      
      // Get sale data to invalidate business-level queries
      const sale = queryClient.getQueryData<{ business_id: string; customer_id?: string }>(queryKeys.sale(data.sale_id))
      if (sale) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessSales(sale.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboardMetrics(sale.business_id) 
        })
        
        // If customer is associated, invalidate customer data
        if (sale.customer_id) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.customer(sale.customer_id) 
          })
        }
      }
      
      toast.success('Payment recorded successfully')
    },
    onError: (error) => {
      console.error('Failed to create payment:', error)
      toast.error('Failed to record payment')
    },
  })
}

// Update payment mutation
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['payments']['Update'] 
    }) => paymentQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.payment(id) })

      // Snapshot previous value
      const previousPayment = queryClient.getQueryData<Payment>(queryKeys.payment(id))

      // Optimistically update
      if (previousPayment) {
        queryClient.setQueryData<Payment>(queryKeys.payment(id), {
          ...previousPayment,
          ...updates,
        })
      }

      return { previousPayment }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousPayment) {
        queryClient.setQueryData(queryKeys.payment(id), context.previousPayment)
      }
      console.error('Failed to update payment:', error)
      toast.error('Failed to update payment')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.payment(data.id), data)
      // Invalidate sale payments
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.salePayments(data.sale_id) 
      })
      // Invalidate the sale itself
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.sale(data.sale_id) 
      })
      toast.success('Payment updated successfully')
    },
  })
}

// Delete payment mutation
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => paymentQueries.delete(id),
    onMutate: async (id) => {
      // Get payment data before deletion for cleanup
      const payment = queryClient.getQueryData<Payment>(queryKeys.payment(id))
      return { payment }
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.payment(id) })
      
      // Invalidate related queries
      if (context?.payment) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.salePayments(context.payment.sale_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.sale(context.payment.sale_id) 
        })
      }
      
      toast.success('Payment deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete payment:', error)
      toast.error('Failed to delete payment')
    },
  })
}