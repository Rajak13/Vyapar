import { createClient } from '@/lib/supabase/client'
import type {
  Database,
  Business,
  Product,
  Customer,
  Sale,
  SaleItem,
  Payment,
  Expense,
  InventoryTransaction,
  Supplier,
  PurchaseOrder,
  DashboardMetrics,
  LowStockProduct,
} from '@/types/database'

// Create a typed Supabase client
export const supabase = createClient()

// Business queries
export const businessQueries = {
  // Get user's businesses
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Business[]
  },

  // Get business by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Business
  },

  // Create business
  create: async (business: Database['public']['Tables']['businesses']['Insert']) => {
    const { data, error } = await supabase
      .from('businesses')
      .insert(business)
      .select()
      .single()

    if (error) throw error
    return data as Business
  },

  // Update business
  update: async (id: string, updates: Database['public']['Tables']['businesses']['Update']) => {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Business
  },

  // Delete business
  delete: async (id: string) => {
    const { error } = await supabase
      .from('businesses')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
  },
}

// Product queries
export const productQueries = {
  // Get products by business
  getByBusinessId: async (businessId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        suppliers (
          id,
          name
        )
      `)
      .eq('business_id', businessId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data as (Product & { suppliers?: { id: string; name: string } })[]
  },

  // Get product by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        suppliers (
          id,
          name,
          contact_person,
          phone,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Product & { suppliers?: Supplier }
  },

  // Search products
  search: async (businessId: string, query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('active', true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
      .order('name')
      .limit(20)

    if (error) throw error
    return data as Product[]
  },

  // Create product
  create: async (product: Database['public']['Tables']['products']['Insert']) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Update product
  update: async (id: string, updates: Database['public']['Tables']['products']['Update']) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Product
  },

  // Delete product
  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Get low stock products
  getLowStock: async (businessId: string) => {
    const { data, error } = await supabase
      .rpc('get_low_stock_products', { business_uuid: businessId })

    if (error) throw error
    return data as LowStockProduct[]
  },
}

// Customer queries
export const customerQueries = {
  // Get customers by business
  getByBusinessId: async (businessId: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data as Customer[]
  },

  // Get customer by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Customer
  },

  // Search customers
  search: async (businessId: string, query: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('active', true)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name')
      .limit(20)

    if (error) throw error
    return data as Customer[]
  },

  // Create customer
  create: async (customer: Database['public']['Tables']['customers']['Insert']) => {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()

    if (error) throw error
    return data as Customer
  },

  // Update customer
  update: async (id: string, updates: Database['public']['Tables']['customers']['Update']) => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Customer
  },

  // Delete customer
  delete: async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
  },

  // Get customer purchase history
  getPurchaseHistory: async (customerId: string, limit = 10) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        invoice_number,
        sale_date,
        total_amount,
        payment_status,
        items
      `)
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as (Pick<Sale, 'id' | 'invoice_number' | 'sale_date' | 'total_amount' | 'payment_status' | 'items'>)[]
  },

  // Get customer analytics
  getCustomerAnalytics: async (customerId: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        id,
        sale_date,
        total_amount,
        payment_status,
        items
      `)
      .eq('customer_id', customerId)
      .order('sale_date', { ascending: false })

    if (error) throw error

    const sales = data as (Pick<Sale, 'id' | 'sale_date' | 'total_amount' | 'payment_status' | 'items'>)[]
    
    // Calculate analytics
    const totalOrders = sales.length
    const totalSpent = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    
    // Calculate visit frequency (days between orders)
    const visitFrequency = totalOrders > 1 ? 
      (new Date(sales[0].sale_date).getTime() - new Date(sales[totalOrders - 1].sale_date).getTime()) / 
      (1000 * 60 * 60 * 24 * (totalOrders - 1)) : 0

    // Get favorite categories and products
    const productCounts: Record<string, number> = {}
    const categoryCounts: Record<string, number> = {}
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity
        // Note: category would need to be added to sale items or fetched separately
      })
    })

    const favoriteProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([product, count]) => ({ product, count }))

    // Monthly spending trend
    const monthlySpending: Record<string, number> = {}
    sales.forEach(sale => {
      const month = new Date(sale.sale_date).toISOString().slice(0, 7) // YYYY-MM
      monthlySpending[month] = (monthlySpending[month] || 0) + sale.total_amount
    })

    const spendingTrend = Object.entries(monthlySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }))

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      visitFrequency: Math.round(visitFrequency),
      favoriteProducts,
      spendingTrend,
      lastOrderDate: sales.length > 0 ? sales[0].sale_date : null,
      firstOrderDate: sales.length > 0 ? sales[sales.length - 1].sale_date : null,
    }
  },

  // Get customer lifetime value calculation
  getCustomerLifetimeValue: async (customerId: string) => {
    const analytics = await customerQueries.getCustomerAnalytics(customerId)
    
    // Simple CLV calculation: Average Order Value × Purchase Frequency × Customer Lifespan
    const customerLifespanMonths = analytics.firstOrderDate && analytics.lastOrderDate ? 
      (new Date(analytics.lastOrderDate).getTime() - new Date(analytics.firstOrderDate).getTime()) / 
      (1000 * 60 * 60 * 24 * 30) : 1

    const purchaseFrequencyPerMonth = analytics.totalOrders / Math.max(customerLifespanMonths, 1)
    const predictedLifetimeValue = analytics.averageOrderValue * purchaseFrequencyPerMonth * 12 // Projected for 1 year

    return {
      currentLifetimeValue: analytics.totalSpent,
      predictedLifetimeValue: Math.round(predictedLifetimeValue),
      averageOrderValue: analytics.averageOrderValue,
      purchaseFrequency: purchaseFrequencyPerMonth,
      customerLifespanMonths: Math.round(customerLifespanMonths),
    }
  },
}

// Sale queries
export const saleQueries = {
  // Get sales by business
  getByBusinessId: async (businessId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          phone
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_date
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as (Sale & { 
      customers?: { id: string; name: string; phone?: string }
      payments: Payment[]
    })[]
  },

  // Get sale by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email,
          address
        ),
        payments (
          id,
          amount,
          payment_method,
          payment_date,
          reference_number,
          notes
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Sale & { 
      customers?: Customer
      payments: Payment[]
    }
  },

  // Create sale
  create: async (sale: Database['public']['Tables']['sales']['Insert']) => {
    const { data, error } = await supabase
      .from('sales')
      .insert(sale)
      .select()
      .single()

    if (error) throw error
    return data as Sale
  },

  // Update sale
  update: async (id: string, updates: Database['public']['Tables']['sales']['Update']) => {
    const { data, error } = await supabase
      .from('sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Sale
  },

  // Generate invoice number
  generateInvoiceNumber: async (businessId: string, prefix = 'INV') => {
    const { data, error } = await supabase
      .rpc('generate_invoice_number', { 
        business_uuid: businessId, 
        prefix 
      })

    if (error) throw error
    return data as string
  },
}

// Payment queries
export const paymentQueries = {
  // Get payments by sale
  getBySaleId: async (saleId: string) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Payment[]
  },

  // Create payment
  create: async (payment: Database['public']['Tables']['payments']['Insert']) => {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single()

    if (error) throw error
    return data as Payment
  },

  // Update payment
  update: async (id: string, updates: Database['public']['Tables']['payments']['Update']) => {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Payment
  },

  // Delete payment
  delete: async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Expense queries
export const expenseQueries = {
  // Get expenses by business
  getByBusinessId: async (businessId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', businessId)
      .order('expense_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as Expense[]
  },

  // Get expense by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Expense
  },

  // Create expense
  create: async (expense: Database['public']['Tables']['expenses']['Insert']) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  // Update expense
  update: async (id: string, updates: Database['public']['Tables']['expenses']['Update']) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Expense
  },

  // Delete expense
  delete: async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// Inventory transaction queries
export const inventoryQueries = {
  // Get transactions by product
  getByProductId: async (productId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        products (
          name,
          sku
        )
      `)
      .eq('product_id', productId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as (InventoryTransaction & { products: { name: string; sku?: string } })[]
  },

  // Get all transactions for a business
  getByBusinessId: async (businessId: string, limit = 100) => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select(`
        *,
        products!inner (
          name,
          sku,
          business_id
        )
      `)
      .eq('products.business_id', businessId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as (InventoryTransaction & { products: { name: string; sku?: string; business_id: string } })[]
  },

  // Get stock movements summary for a product
  getStockSummary: async (productId: string, days = 30) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('transaction_type, quantity, timestamp')
      .eq('product_id', productId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (error) throw error
    
    // Calculate summary
    const summary = data.reduce((acc, transaction) => {
      const type = transaction.transaction_type
      if (type === 'in') {
        acc.totalIn += transaction.quantity
      } else if (type === 'out') {
        acc.totalOut += transaction.quantity
      } else if (type === 'adjustment') {
        if (transaction.quantity > 0) {
          acc.totalIn += transaction.quantity
        } else {
          acc.totalOut += Math.abs(transaction.quantity)
        }
      }
      return acc
    }, { totalIn: 0, totalOut: 0, netChange: 0 })
    
    summary.netChange = summary.totalIn - summary.totalOut
    
    return {
      ...summary,
      transactions: data as InventoryTransaction[]
    }
  },

  // Create inventory transaction with automatic stock update
  create: async (transaction: Database['public']['Tables']['inventory_transactions']['Insert']) => {
    const { data, error } = await supabase.rpc('create_inventory_transaction', {
      p_product_id: transaction.product_id,
      p_transaction_type: transaction.transaction_type,
      p_quantity: transaction.quantity,
      p_reference_id: transaction.reference_id || null,
      p_reference_type: transaction.reference_type || null,
      p_unit_cost: transaction.unit_cost || null,
      p_notes: transaction.notes || null
    })

    if (error) throw error
    return data as InventoryTransaction
  },

  // Create stock adjustment
  createAdjustment: async (productId: string, adjustmentQuantity: number, reason: string) => {
    const transaction: Database['public']['Tables']['inventory_transactions']['Insert'] = {
      product_id: productId,
      transaction_type: 'adjustment',
      quantity: adjustmentQuantity,
      reference_type: 'manual_adjustment',
      notes: reason
    }

    return inventoryQueries.create(transaction)
  },

  // Bulk create transactions (for sales, purchases, etc.)
  createBulk: async (transactions: Database['public']['Tables']['inventory_transactions']['Insert'][]) => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert(transactions)
      .select()

    if (error) throw error
    
    // Update stock levels for all affected products
    const productIds = [...new Set(transactions.map(t => t.product_id))]
    await Promise.all(productIds.map(productId => 
      supabase.rpc('update_product_stock', { p_product_id: productId })
    ))

    return data as InventoryTransaction[]
  },
}

// Dashboard queries
export const dashboardQueries = {
  // Get dashboard metrics
  getMetrics: async (businessId: string, startDate?: string, endDate?: string) => {
    const { data, error } = await supabase
      .rpc('get_dashboard_metrics', {
        business_uuid: businessId,
        start_date: startDate,
        end_date: endDate,
      })

    if (error) throw error
    return data?.[0] as DashboardMetrics
  },

  // Get sales trend data for charts
  getSalesTrend: async (businessId: string, period: 'week' | 'month' | 'year' = 'week') => {
    const endDate = new Date()
    const startDate = new Date()
    
    // Set date range based on period
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    const { data, error } = await supabase
      .from('sales')
      .select('sale_date, total_amount, items')
      .eq('business_id', businessId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .lte('sale_date', endDate.toISOString().split('T')[0])
      .order('sale_date')

    if (error) throw error

    // Group by date and calculate daily totals
    const dailyData: Record<string, { sales: number; revenue: number }> = {}
    
    data.forEach(sale => {
      const date = sale.sale_date
      if (!dailyData[date]) {
        dailyData[date] = { sales: 0, revenue: 0 }
      }
      dailyData[date].sales += 1
      dailyData[date].revenue += sale.total_amount
    })

    // Fill in missing dates with zero values
    const result = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        sales: dailyData[dateStr]?.sales || 0,
        revenue: dailyData[dateStr]?.revenue || 0
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return result
  },

  // Get top products data for charts
  getTopProducts: async (businessId: string, limit = 5) => {
    const { data, error } = await supabase
      .from('sales')
      .select('items')
      .eq('business_id', businessId)
      .gte('sale_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days

    if (error) throw error

    // Aggregate product sales
    const productStats: Record<string, { sales: number; revenue: number; quantity: number }> = {}
    
    data.forEach(sale => {
      sale.items.forEach((item: SaleItem) => {
        const productName = item.product_name
        if (!productStats[productName]) {
          productStats[productName] = { sales: 0, revenue: 0, quantity: 0 }
        }
        productStats[productName].sales += 1
        productStats[productName].revenue += item.unit_price * item.quantity
        productStats[productName].quantity += item.quantity
      })
    })

    // Sort by quantity and take top products
    return Object.entries(productStats)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, limit)
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        revenue: stats.revenue,
        quantity: stats.quantity
      }))
  },

  // Get customer insights data for charts
  getCustomerInsights: async (businessId: string) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 28) // Last 4 weeks

    const { data, error } = await supabase
      .from('sales')
      .select('sale_date, customer_id, total_amount')
      .eq('business_id', businessId)
      .gte('sale_date', startDate.toISOString().split('T')[0])
      .order('sale_date')

    if (error) throw error

    // Group by week
    const weeklyData: Record<string, { newCustomers: Set<string>; returningCustomers: Set<string>; totalSpent: number }> = {}
    const allCustomers = new Set<string>()
    
    data.forEach(sale => {
      const saleDate = new Date(sale.sale_date)
      const weekStart = new Date(saleDate)
      weekStart.setDate(saleDate.getDate() - saleDate.getDay()) // Start of week
      const weekKey = `Week ${Math.ceil((saleDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))}`
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { 
          newCustomers: new Set(), 
          returningCustomers: new Set(), 
          totalSpent: 0 
        }
      }
      
      if (sale.customer_id) {
        if (allCustomers.has(sale.customer_id)) {
          weeklyData[weekKey].returningCustomers.add(sale.customer_id)
        } else {
          weeklyData[weekKey].newCustomers.add(sale.customer_id)
          allCustomers.add(sale.customer_id)
        }
      }
      
      weeklyData[weekKey].totalSpent += sale.total_amount
    })

    return Object.entries(weeklyData).map(([period, data]) => ({
      period,
      newCustomers: data.newCustomers.size,
      returningCustomers: data.returningCustomers.size,
      totalSpent: data.totalSpent
    }))
  },
}

// Supplier queries
export const supplierQueries = {
  // Get suppliers by business
  getByBusinessId: async (businessId: string) => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('business_id', businessId)
      .eq('active', true)
      .order('name')

    if (error) throw error
    return data as Supplier[]
  },

  // Create supplier
  create: async (supplier: Database['public']['Tables']['suppliers']['Insert']) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },

  // Update supplier
  update: async (id: string, updates: Database['public']['Tables']['suppliers']['Update']) => {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Supplier
  },
}

// Notification settings queries
export const notificationQueries = {
  // Get notification settings by business
  getByBusinessId: async (businessId: string) => {
    const { data, error } = await supabase
      .rpc('get_notification_settings', { business_uuid: businessId })

    if (error) throw error
    return data?.[0] || {
      email_enabled: false,
      sms_enabled: false,
      threshold: 10,
      critical_threshold: 5,
      auto_alerts_enabled: false,
    }
  },

  // Upsert notification settings
  upsert: async (businessId: string, settings: {
    email_enabled?: boolean
    sms_enabled?: boolean
    email_address?: string
    phone_number?: string
    threshold?: number
    critical_threshold?: number
    auto_alerts_enabled?: boolean
  }) => {
    const { data, error } = await supabase
      .rpc('upsert_notification_settings', {
        business_uuid: businessId,
        p_email_enabled: settings.email_enabled,
        p_sms_enabled: settings.sms_enabled,
        p_email_address: settings.email_address,
        p_phone_number: settings.phone_number,
        p_threshold: settings.threshold,
        p_critical_threshold: settings.critical_threshold,
        p_auto_alerts_enabled: settings.auto_alerts_enabled,
      })

    if (error) throw error
    return data
  },

  // Log notification attempt
  logNotification: async (businessId: string, notification: {
    notification_type: 'email' | 'sms'
    recipient: string
    subject?: string
    message: string
    status?: 'pending' | 'sent' | 'failed'
    error_message?: string
    low_stock_count?: number
    critical_stock_count?: number
  }) => {
    const { data, error } = await supabase
      .rpc('log_notification', {
        business_uuid: businessId,
        p_notification_type: notification.notification_type,
        p_recipient: notification.recipient,
        p_subject: notification.subject,
        p_message: notification.message,
        p_status: notification.status || 'pending',
        p_error_message: notification.error_message,
        p_low_stock_count: notification.low_stock_count || 0,
        p_critical_stock_count: notification.critical_stock_count || 0,
      })

    if (error) throw error
    return data
  },

  // Get notification logs
  getLogs: async (businessId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },
}