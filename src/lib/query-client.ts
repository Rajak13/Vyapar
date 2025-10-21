import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache time: 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for important data
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  // Business keys
  businesses: ['businesses'] as const,
  business: (id: string) => ['businesses', id] as const,
  userBusinesses: (userId: string) => ['businesses', 'user', userId] as const,

  // Product keys
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  businessProducts: (businessId: string) => ['products', 'business', businessId] as const,
  productSearch: (businessId: string, query: string) => 
    ['products', 'search', businessId, query] as const,
  lowStockProducts: (businessId: string) => 
    ['products', 'low-stock', businessId] as const,

  // Customer keys
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  businessCustomers: (businessId: string) => ['customers', 'business', businessId] as const,
  customerSearch: (businessId: string, query: string) => 
    ['customers', 'search', businessId, query] as const,
  customerPurchaseHistory: (customerId: string, limit: number) => 
    ['customers', customerId, 'purchase-history', limit] as const,
  customersWithOutstanding: (businessId: string) => 
    ['customers', 'outstanding', businessId] as const,

  // Sale keys
  sales: ['sales'] as const,
  sale: (id: string) => ['sales', id] as const,
  businessSales: (businessId: string) => ['sales', 'business', businessId] as const,
  outstandingSales: (businessId: string) => ['sales', 'outstanding', businessId] as const,
  overdueSales: (businessId: string) => ['sales', 'overdue', businessId] as const,

  // Payment keys
  payments: ['payments'] as const,
  payment: (id: string) => ['payments', id] as const,
  salePayments: (saleId: string) => ['payments', 'sale', saleId] as const,
  paymentStatistics: (businessId: string) => ['payments', 'statistics', businessId] as const,

  // Expense keys
  expenses: ['expenses'] as const,
  expense: (id: string) => ['expenses', id] as const,
  businessExpenses: (businessId: string) => ['expenses', 'business', businessId] as const,
  recurringExpenseNotifications: (businessId: string) => 
    ['expenses', 'recurring-notifications', businessId] as const,

  // Inventory keys
  inventory: ['inventory'] as const,
  productInventory: (productId: string) => ['inventory', 'product', productId] as const,

  // Dashboard keys
  dashboard: ['dashboard'] as const,
  dashboardMetrics: (businessId: string) => ['dashboard', 'metrics', businessId] as const,

  // Supplier keys
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  businessSuppliers: (businessId: string) => ['suppliers', 'business', businessId] as const,
} as const