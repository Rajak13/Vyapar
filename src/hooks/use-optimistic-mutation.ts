import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey: readonly unknown[]
  updateFn?: (oldData: TData | undefined, variables: TVariables) => TData | undefined
  successMessage?: string
  errorMessage?: string
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  invalidateQueries?: readonly unknown[][]
}

/**
 * Custom hook for optimistic mutations with automatic rollback on error
 */
export function useOptimisticMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  updateFn,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  invalidateQueries = [],
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey)

      // Optimistically update if updateFn is provided
      if (updateFn && previousData) {
        const optimisticData = updateFn(previousData, variables)
        if (optimisticData) {
          queryClient.setQueryData<TData>(queryKey, optimisticData)
        }
      }

      return { previousData }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
      
      // Show error message
      if (errorMessage) {
        toast.error(errorMessage)
      }
      
      // Call custom error handler
      onError?.(error as Error, variables)
      
      console.error('Mutation failed:', error)
    },
    onSuccess: (data, variables) => {
      // Update cache with server response
      queryClient.setQueryData(queryKey, data)
      
      // Invalidate related queries
      invalidateQueries.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      
      // Show success message
      if (successMessage) {
        toast.success(successMessage)
      }
      
      // Call custom success handler
      onSuccess?.(data, variables)
    },
  })
}

/**
 * Hook for mutations that don't need optimistic updates but want consistent error handling
 */
export function useSimpleMutation<TData, TVariables>({
  mutationFn,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  invalidateQueries = [],
}: Omit<OptimisticMutationOptions<TData, TVariables>, 'queryKey' | 'updateFn'>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onError: (error, variables) => {
      if (errorMessage) {
        toast.error(errorMessage)
      }
      onError?.(error as Error, variables)
      console.error('Mutation failed:', error)
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      invalidateQueries.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      
      if (successMessage) {
        toast.success(successMessage)
      }
      onSuccess?.(data, variables)
    },
  })
}