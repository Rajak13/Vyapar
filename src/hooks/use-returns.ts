'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ReturnExchange, ReturnPayment, ReturnItem, Sale } from '@/types/database'
import { toast } from 'sonner'

const supabase = createClient()

export function useReturns(businessId?: string) {
  return useQuery({
    queryKey: ['returns', businessId],
    queryFn: async () => {
      if (!businessId) throw new Error('Business ID is required')
      
      const { data, error } = await supabase
        .from('returns_exchanges')
        .select(`
          *,
          customer:customers(id, name, phone),
          original_sale:sales(id, invoice_number, sale_date, total_amount)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (ReturnExchange & {
        customer?: { id: string; name: string; phone?: string }
        original_sale?: { id: string; invoice_number: string; sale_date: string; total_amount: number }
      })[]
    },
    enabled: !!businessId,
  })
}

export function useReturn(returnId?: string) {
  return useQuery({
    queryKey: ['return', returnId],
    queryFn: async () => {
      if (!returnId) throw new Error('Return ID is required')
      
      const { data, error } = await supabase
        .from('returns_exchanges')
        .select(`
          *,
          customer:customers(id, name, phone, email),
          original_sale:sales(id, invoice_number, sale_date, total_amount, items),
          return_payments(*)
        `)
        .eq('id', returnId)
        .single()

      if (error) throw error
      return data as ReturnExchange & {
        customer?: { id: string; name: string; phone?: string; email?: string }
        original_sale?: Sale
        return_payments?: ReturnPayment[]
      }
    },
    enabled: !!returnId,
  })
}

export function useSaleForReturn(saleId?: string) {
  return useQuery({
    queryKey: ['sale-for-return', saleId],
    queryFn: async () => {
      if (!saleId) throw new Error('Sale ID is required')
      
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(id, name, phone),
          payments(*)
        `)
        .eq('id', saleId)
        .single()

      if (error) throw error
      return data as Sale & {
        customer?: { id: string; name: string; phone?: string }
        payments?: { amount: number; payment_method: string }[]
      }
    },
    enabled: !!saleId,
  })
}

export function useCreateReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (returnData: {
      business_id: string
      original_sale_id: string
      customer_id?: string
      return_type: 'return' | 'exchange'
      reason: string
      reason_description?: string
      returned_items: ReturnItem[]
      exchange_items?: ReturnItem[]
      notes?: string
    }) => {
      // Generate return number
      const { data: returnNumber, error: numberError } = await supabase
        .rpc('generate_return_number', { business_uuid: returnData.business_id })

      if (numberError) throw numberError

      // Calculate amounts
      const { data: amounts, error: amountsError } = await supabase
        .rpc('calculate_return_amounts', {
          returned_items: returnData.returned_items,
          exchange_items: returnData.exchange_items || []
        })

      if (amountsError) throw amountsError

      const calculatedAmounts = amounts[0]

      // Create the return record
      const { data, error } = await supabase
        .from('returns_exchanges')
        .insert({
          ...returnData,
          return_number: returnNumber,
          original_amount: calculatedAmounts.original_amount,
          refund_amount: returnData.return_type === 'return' ? calculatedAmounts.original_amount : 0,
          exchange_difference: calculatedAmounts.difference,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success(`${data.return_type === 'return' ? 'Return' : 'Exchange'} created successfully`)
    },
    onError: (error) => {
      console.error('Error creating return:', error)
      toast.error('Failed to create return/exchange')
    },
  })
}

export function useProcessReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ returnId, approve }: { returnId: string; approve: boolean }) => {
      const { data, error } = await supabase
        .rpc('process_return_exchange', {
          return_id: returnId,
          approve: approve
        })

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['return', variables.returnId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
      
      toast.success(variables.approve ? 'Return/exchange approved' : 'Return/exchange rejected')
    },
    onError: (error) => {
      console.error('Error processing return:', error)
      toast.error('Failed to process return/exchange')
    },
  })
}

export function useCreateReturnPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentData: {
      return_id: string
      amount: number
      payment_method: string
      reference_number?: string
      notes?: string
    }) => {
      const { data, error } = await supabase
        .from('return_payments')
        .insert(paymentData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['return', data.return_id] })
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      toast.success('Refund payment recorded')
    },
    onError: (error) => {
      console.error('Error creating return payment:', error)
      toast.error('Failed to record refund payment')
    },
  })
}

export function useUpdateReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      returnId, 
      updates 
    }: { 
      returnId: string
      updates: Partial<ReturnExchange>
    }) => {
      const { data, error } = await supabase
        .from('returns_exchanges')
        .update(updates)
        .eq('id', returnId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['return', data.id] })
      toast.success('Return/exchange updated')
    },
    onError: (error) => {
      console.error('Error updating return:', error)
      toast.error('Failed to update return/exchange')
    },
  })
}