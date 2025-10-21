import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Expense, Database } from '@/types/database'
import { toast } from 'sonner'

// Get expenses by business
export function useExpenses(businessId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.businessExpenses(businessId),
    queryFn: () => expenseQueries.getByBusinessId(businessId, limit),
    enabled: !!businessId,
  })
}

// Get expense by ID
export function useExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.expense(id),
    queryFn: () => expenseQueries.getById(id),
    enabled: !!id,
  })
}

// Create expense mutation
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (expense: Database['public']['Tables']['expenses']['Insert']) =>
      expenseQueries.create(expense),
    onSuccess: (data) => {
      // Invalidate business expenses list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessExpenses(data.business_id) 
      })
      // Set the new expense in cache
      queryClient.setQueryData(queryKeys.expense(data.id), data)
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardMetrics(data.business_id) 
      })
      toast.success('Expense recorded successfully')
    },
    onError: (error) => {
      console.error('Failed to create expense:', error)
      toast.error('Failed to record expense')
    },
  })
}

// Update expense mutation
export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['expenses']['Update'] 
    }) => expenseQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.expense(id) })

      // Snapshot previous value
      const previousExpense = queryClient.getQueryData<Expense>(queryKeys.expense(id))

      // Optimistically update
      if (previousExpense) {
        queryClient.setQueryData<Expense>(queryKeys.expense(id), {
          ...previousExpense,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousExpense }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousExpense) {
        queryClient.setQueryData(queryKeys.expense(id), context.previousExpense)
      }
      console.error('Failed to update expense:', error)
      toast.error('Failed to update expense')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.expense(data.id), data)
      // Invalidate business expenses list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessExpenses(data.business_id) 
      })
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboardMetrics(data.business_id) 
      })
      toast.success('Expense updated successfully')
    },
  })
}

// Delete expense mutation
export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => expenseQueries.delete(id),
    onMutate: async (id) => {
      // Get expense data before deletion for cleanup
      const expense = queryClient.getQueryData<Expense>(queryKeys.expense(id))
      return { expense }
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.expense(id) })
      
      // Invalidate related queries
      if (context?.expense) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessExpenses(context.expense.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.dashboardMetrics(context.expense.business_id) 
        })
      }
      
      toast.success('Expense deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete expense:', error)
      toast.error('Failed to delete expense')
    },
  })
}