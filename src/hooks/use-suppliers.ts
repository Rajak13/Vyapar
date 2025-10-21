'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Supplier, PurchaseOrder, PurchaseItem } from '@/types/database'
import { toast } from 'sonner'

export function useSuppliers() {
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Get all suppliers for the business
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) throw new Error('Business not found')

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', business.id)
        .eq('active', true)
        .order('name')

      if (error) throw error
      return data as Supplier[]
    },
    enabled: !!user?.id,
  })

  // Get supplier by ID
  const useSupplier = (supplierId: string) => {
    return useQuery({
      queryKey: ['supplier', supplierId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single()

        if (error) throw error
        return data as Supplier
      },
      enabled: !!supplierId,
    })
  }

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single()

      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`)
    },
  })

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier'] })
      toast.success('Supplier updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update supplier: ${error.message}`)
    },
  })

  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ active: false })
        .eq('id', supplierId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier deleted successfully')
    },
    onError: (error) => {
      toast.error(`Failed to delete supplier: ${error.message}`)
    },
  })

  return {
    suppliers: suppliersQuery.data || [],
    isLoading: suppliersQuery.isLoading,
    error: suppliersQuery.error,
    useSupplier,
    createSupplier: createSupplierMutation.mutate,
    updateSupplier: updateSupplierMutation.mutate,
    deleteSupplier: deleteSupplierMutation.mutate,
    isCreating: createSupplierMutation.isPending,
    isUpdating: updateSupplierMutation.isPending,
    isDeleting: deleteSupplierMutation.isPending,
  }
}

export function usePurchaseOrders() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get all purchase orders for the business
  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')
      
      const supabase = createClient()
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) throw new Error('Business not found')

      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name, contact_person, phone, email)
        `)
        .eq('business_id', business.id)
        .order('order_date', { ascending: false })

      if (error) throw error
      return data as (PurchaseOrder & { supplier: Partial<Supplier> })[]
    },
    enabled: !!user?.id,
  })

  // Get purchase order by ID
  const usePurchaseOrder = (orderId: string) => {
    return useQuery({
      queryKey: ['purchase-order', orderId],
      queryFn: async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('purchase_orders')
          .select(`
            *,
            supplier:suppliers(*)
          `)
          .eq('id', orderId)
          .single()

        if (error) throw error
        return data as PurchaseOrder & { supplier: Supplier }
      },
      enabled: !!orderId,
    })
  }

  // Get purchase orders by supplier
  const usePurchaseOrdersBySupplier = (supplierId: string) => {
    return useQuery({
      queryKey: ['purchase-orders-by-supplier', supplierId],
      queryFn: async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('supplier_id', supplierId)
          .order('order_date', { ascending: false })

        if (error) throw error
        return data as PurchaseOrder[]
      },
      enabled: !!supplierId,
    })
  }

  // Create purchase order mutation
  const createPurchaseOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert(orderData)
        .select()
        .single()

      if (error) throw error
      return data as PurchaseOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create purchase order: ${error.message}`)
    },
  })

  // Update purchase order mutation
  const updatePurchaseOrderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PurchaseOrder> & { id: string }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PurchaseOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order'] })
      toast.success('Purchase order updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update purchase order: ${error.message}`)
    },
  })

  // Generate purchase order number
  const generateOrderNumber = async (businessId: string): Promise<string> => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('generate_purchase_order_number', {
      business_uuid: businessId,
      prefix: 'PO'
    })

    if (error) {
      // Fallback to simple numbering if function doesn't exist
      const { data: orders } = await supabase
        .from('purchase_orders')
        .select('order_number')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)

      const lastNumber = orders?.[0]?.order_number?.match(/PO-(\d+)/)?.[1]
      const nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1
      return `PO-${String(nextNumber).padStart(4, '0')}`
    }

    return data
  }

  return {
    purchaseOrders: purchaseOrdersQuery.data || [],
    isLoading: purchaseOrdersQuery.isLoading,
    error: purchaseOrdersQuery.error,
    usePurchaseOrder,
    usePurchaseOrdersBySupplier,
    createPurchaseOrder: createPurchaseOrderMutation.mutate,
    updatePurchaseOrder: updatePurchaseOrderMutation.mutate,
    generateOrderNumber,
    isCreating: createPurchaseOrderMutation.isPending,
    isUpdating: updatePurchaseOrderMutation.isPending,
  }
}

// Supplier analytics hook
export function useSupplierAnalytics(supplierId?: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['supplier-analytics', supplierId, user?.id],
    queryFn: async () => {
      if (!user?.id || !supplierId) throw new Error('Missing required parameters')

      const supabase = createClient()
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!business) throw new Error('Business not found')

      // Get purchase orders for this supplier
      const { data: orders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('business_id', business.id)

      if (ordersError) throw ordersError

      // Calculate analytics
      const totalOrders = orders?.length || 0
      const totalAmount = orders?.reduce((sum: number, order: PurchaseOrder) => sum + order.total_amount, 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0
      
      const statusCounts = orders?.reduce((acc: Record<string, number>, order: PurchaseOrder) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      // Get recent orders (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentOrders = orders?.filter((order: PurchaseOrder) => 
        new Date(order.created_at) >= sixMonthsAgo
      ) || []

      return {
        totalOrders,
        totalAmount,
        averageOrderValue,
        statusCounts,
        recentOrders: recentOrders.length,
        onTimeDeliveryRate: 0, // This would need delivery tracking
        lastOrderDate: orders?.[0]?.order_date || null,
      }
    },
    enabled: !!user?.id && !!supplierId,
  })
}