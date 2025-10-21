import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'
import type { InventoryTransaction, Database } from '@/types/database'
import { toast } from 'sonner'

// Get inventory transactions by product
export function useInventoryTransactions(productId: string, limit = 50) {
  return useQuery({
    queryKey: queryKeys.productInventory(productId),
    queryFn: () => inventoryQueries.getByProductId(productId, limit),
    enabled: !!productId,
  })
}

// Get all inventory transactions for a business
export function useBusinessInventoryTransactions(businessId: string, limit = 100) {
  return useQuery({
    queryKey: ['inventory-transactions', businessId],
    queryFn: () => inventoryQueries.getByBusinessId(businessId, limit),
    enabled: !!businessId,
  })
}

// Get stock movement summary for a product
export function useProductStockSummary(productId: string, days = 30) {
  return useQuery({
    queryKey: ['product-stock-summary', productId, days],
    queryFn: () => inventoryQueries.getStockSummary(productId, days),
    enabled: !!productId,
  })
}

// Create inventory transaction mutation
export function useCreateInventoryTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transaction: Database['public']['Tables']['inventory_transactions']['Insert']) =>
      inventoryQueries.create(transaction),
    onSuccess: (data) => {
      // Invalidate product inventory transactions
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.productInventory(data.product_id) 
      })
      // Invalidate the product itself (stock will change)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.product(data.product_id) 
      })
      
      // Get product data to invalidate business-level queries
      const product = queryClient.getQueryData<{ business_id: string }>(queryKeys.product(data.product_id))
      if (product) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessProducts(product.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lowStockProducts(product.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['inventory-transactions', product.business_id] 
        })
      }
      
      toast.success('Inventory updated successfully')
    },
    onError: (error) => {
      console.error('Failed to create inventory transaction:', error)
      toast.error('Failed to update inventory')
    },
  })
}

// Create stock adjustment mutation
export function useCreateStockAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, adjustmentQuantity, reason }: {
      productId: string
      adjustmentQuantity: number
      reason: string
    }) => inventoryQueries.createAdjustment(productId, adjustmentQuantity, reason),
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.productInventory(data.product_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.product(data.product_id) 
      })
      
      // Get product data to invalidate business-level queries
      const product = queryClient.getQueryData<{ business_id: string }>(queryKeys.product(data.product_id))
      if (product) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessProducts(product.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lowStockProducts(product.business_id) 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['inventory-transactions', product.business_id] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['product-stock-summary', data.product_id] 
        })
      }
      
      toast.success('Stock adjustment completed successfully')
    },
    onError: (error) => {
      console.error('Failed to create stock adjustment:', error)
      toast.error('Failed to adjust stock')
    },
  })
}

// Bulk create inventory transactions
export function useBulkCreateInventoryTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactions: Database['public']['Tables']['inventory_transactions']['Insert'][]) =>
      inventoryQueries.createBulk(transactions),
    onSuccess: (data) => {
      // Get unique product IDs and business IDs
      const productIds = [...new Set(data.map(t => t.product_id))]
      const businessIds = new Set<string>()
      
      // Invalidate queries for each affected product
      productIds.forEach(productId => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.productInventory(productId) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.product(productId) 
        })
        
        // Get product data to collect business IDs
        const product = queryClient.getQueryData<{ business_id: string }>(queryKeys.product(productId))
        if (product) {
          businessIds.add(product.business_id)
        }
      })
      
      // Invalidate business-level queries
      businessIds.forEach(businessId => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.businessProducts(businessId) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.lowStockProducts(businessId) 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['inventory-transactions', businessId] 
        })
      })
      
      toast.success(`${data.length} inventory transactions processed successfully`)
    },
    onError: (error) => {
      console.error('Failed to create bulk inventory transactions:', error)
      toast.error('Failed to process inventory transactions')
    },
  })
}