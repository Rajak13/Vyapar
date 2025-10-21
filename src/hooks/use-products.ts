import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { Product, Database } from '@/types/database'
import { toast } from 'sonner'

// Get products by business
export function useProducts(businessId: string) {
  return useQuery({
    queryKey: queryKeys.businessProducts(businessId),
    queryFn: () => productQueries.getByBusinessId(businessId),
    enabled: !!businessId,
  })
}

// Get product by ID
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => productQueries.getById(id),
    enabled: !!id,
  })
}

// Search products
export function useProductSearch(businessId: string, query: string) {
  return useQuery({
    queryKey: queryKeys.productSearch(businessId, query),
    queryFn: () => productQueries.search(businessId, query),
    enabled: !!businessId && query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds for search results
  })
}

// Get low stock products
export function useLowStockProducts(businessId: string) {
  return useQuery({
    queryKey: queryKeys.lowStockProducts(businessId),
    queryFn: () => productQueries.getLowStock(businessId),
    enabled: !!businessId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (product: Database['public']['Tables']['products']['Insert']) =>
      productQueries.create(product),
    onSuccess: (data) => {
      // Invalidate business products list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessProducts(data.business_id) 
      })
      // Set the new product in cache
      queryClient.setQueryData(queryKeys.product(data.id), data)
      // Invalidate low stock products
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lowStockProducts(data.business_id) 
      })
      // Invalidate dashboard metrics to update product count
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard', 'metrics', data.business_id] 
      })
      toast.success('Product created successfully')
    },
    onError: (error) => {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product')
    },
  })
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Database['public']['Tables']['products']['Update'] 
    }) => productQueries.update(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.product(id) })

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData<Product>(queryKeys.product(id))

      // Optimistically update
      if (previousProduct) {
        queryClient.setQueryData<Product>(queryKeys.product(id), {
          ...previousProduct,
          ...updates,
          updated_at: new Date().toISOString(),
        })
      }

      return { previousProduct }
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.product(id), context.previousProduct)
      }
      console.error('Failed to update product:', error)
      toast.error('Failed to update product')
    },
    onSuccess: (data) => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.product(data.id), data)
      // Invalidate business products list
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.businessProducts(data.business_id) 
      })
      // Invalidate low stock products
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lowStockProducts(data.business_id) 
      })
      // Invalidate dashboard metrics
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard', 'metrics', data.business_id] 
      })
      toast.success('Product updated successfully')
    },
  })
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productQueries.delete(id),
    onMutate: async (id) => {
      // Get product data before deletion for cleanup
      const product = queryClient.getQueryData<Product>(queryKeys.product(id))
      return { product }
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.product(id) })
      
      // Invalidate related queries
      if (context?.product) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessProducts(context.product.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lowStockProducts(context.product.business_id) 
        })
      }
      
      toast.success('Product deleted successfully')
    },
    onError: (error) => {
      console.error('Failed to delete product:', error)
      toast.error('Failed to delete product')
    },
  })
}