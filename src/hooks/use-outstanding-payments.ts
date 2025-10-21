import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Sale, Customer } from '@/types/database'
import { toast } from 'sonner'

// Get outstanding sales for a business
export function useOutstandingSales(businessId: string) {
  return useQuery({
    queryKey: queryKeys.outstandingSales(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email,
            outstanding_balance,
            credit_limit
          ),
          payments (
            id,
            amount,
            payment_method,
            payment_date
          )
        `)
        .eq('business_id', businessId)
        .in('payment_status', ['unpaid', 'partial'])
        .order('sale_date', { ascending: true })

      if (error) throw error
      return data as (Sale & { 
        customers?: Customer
        payments: Array<{ id: string; amount: number; payment_method: string; payment_date: string }>
      })[]
    },
    enabled: !!businessId,
  })
}

// Get overdue sales (older than 30 days)
export function useOverdueSales(businessId: string) {
  return useQuery({
    queryKey: queryKeys.overdueSales(businessId),
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            email,
            outstanding_balance,
            credit_limit
          ),
          payments (
            id,
            amount,
            payment_method,
            payment_date
          )
        `)
        .eq('business_id', businessId)
        .in('payment_status', ['unpaid', 'partial'])
        .lt('sale_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('sale_date', { ascending: true })

      if (error) throw error
      return data as (Sale & { 
        customers?: Customer
        payments: Array<{ id: string; amount: number; payment_method: string; payment_date: string }>
      })[]
    },
    enabled: !!businessId,
  })
}

// Get customers with outstanding balances
export function useCustomersWithOutstanding(businessId: string) {
  return useQuery({
    queryKey: queryKeys.customersWithOutstanding(businessId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', businessId)
        .eq('active', true)
        .gt('outstanding_balance', 0)
        .order('outstanding_balance', { ascending: false })

      if (error) throw error
      return data as Customer[]
    },
    enabled: !!businessId,
  })
}

// Record a payment for an outstanding sale
export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      saleId, 
      amount, 
      paymentMethod, 
      referenceNumber 
    }: {
      saleId: string
      amount: number
      paymentMethod: string
      referenceNumber?: string
    }) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          sale_id: saleId,
          amount,
          payment_method: paymentMethod as 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'check',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: referenceNumber,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.salePayments(data.sale_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sale(data.sale_id) })
      
      // Get sale data to invalidate business-level queries
      const sale = queryClient.getQueryData<{ business_id: string; customer_id?: string }>(queryKeys.sale(data.sale_id))
      if (sale) {
        queryClient.invalidateQueries({ queryKey: queryKeys.outstandingSales(sale.business_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.overdueSales(sale.business_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.customersWithOutstanding(sale.business_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.businessSales(sale.business_id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardMetrics(sale.business_id) })
        
        if (sale.customer_id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.customer(sale.customer_id) })
        }
      }
      
      toast.success('Payment recorded successfully')
    },
    onError: (error) => {
      console.error('Failed to record payment:', error)
      toast.error('Failed to record payment')
    },
  })
}

// Send payment reminder (placeholder for actual implementation)
export function useSendPaymentReminder() {
  return useMutation({
    mutationFn: async ({ 
      customerIds, 
      message, 
      method 
    }: {
      customerIds: string[]
      message: string
      method: 'sms' | 'email' | 'whatsapp'
    }) => {
      // This would integrate with actual SMS/email service
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Sending payment reminders:', {
        customerIds,
        message,
        method
      })
      
      return { success: true, sent: customerIds.length }
    },
    onSuccess: (data) => {
      toast.success(`Payment reminders sent to ${data.sent} customer(s)`)
    },
    onError: (error) => {
      console.error('Failed to send payment reminders:', error)
      toast.error('Failed to send payment reminders')
    },
  })
}

// Get payment reminder history (placeholder)
export function usePaymentReminderHistory(businessId: string) {
  return useQuery({
    queryKey: ['payment-reminder-history', businessId],
    queryFn: async () => {
      // This would fetch from a payment_reminders table
      // For now, return empty array
      return []
    },
    enabled: !!businessId,
  })
}

// Calculate payment statistics
export function usePaymentStatistics(businessId: string) {
  return useQuery({
    queryKey: queryKeys.paymentStatistics(businessId),
    queryFn: async () => {
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_status,
          sale_date,
          customer_id,
          payments (amount)
        `)
        .eq('business_id', businessId)

      if (error) throw error

      const totalSales = sales.length
      const paidSales = sales.filter(s => s.payment_status === 'paid').length
      const partialSales = sales.filter(s => s.payment_status === 'partial').length
      const unpaidSales = sales.filter(s => s.payment_status === 'unpaid').length
      
      const totalAmount = sales.reduce((sum, s) => sum + s.total_amount, 0)
      const paidAmount = sales
        .filter(s => s.payment_status === 'paid')
        .reduce((sum, s) => sum + s.total_amount, 0)
      
      const partialAmount = sales
        .filter(s => s.payment_status === 'partial')
        .reduce((sum, s) => {
          const totalPaid = s.payments.reduce((pSum: number, p: { amount: number }) => pSum + p.amount, 0)
          return sum + totalPaid
        }, 0)

      const outstandingAmount = totalAmount - paidAmount - partialAmount

      // Calculate average days to payment
      const paidSalesWithDates = sales.filter(s => s.payment_status === 'paid')
      const avgDaysToPayment = paidSalesWithDates.length > 0 
        ? paidSalesWithDates.reduce((sum, sale) => {
            // This is simplified - in reality you'd calculate from payment dates
            return sum + 15 // Placeholder average
          }, 0) / paidSalesWithDates.length
        : 0

      return {
        totalSales,
        paidSales,
        partialSales,
        unpaidSales,
        totalAmount,
        paidAmount,
        partialAmount,
        outstandingAmount,
        avgDaysToPayment,
        paymentRate: totalSales > 0 ? (paidSales / totalSales) * 100 : 0
      }
    },
    enabled: !!businessId,
  })
}