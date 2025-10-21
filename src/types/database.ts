export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type BusinessType = 'retail' | 'service' | 'wholesale'
export type PaymentStatus = 'paid' | 'partial' | 'unpaid'
export type PaymentMethod = 'cash' | 'esewa' | 'khalti' | 'ime_pay' | 'bank_transfer' | 'card'
export type TransactionType = 'in' | 'out' | 'adjustment'
export type ReturnType = 'return' | 'exchange'
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type ReturnReason = 'defective' | 'wrong_size' | 'wrong_color' | 'customer_changed_mind' | 'damaged' | 'other'

// Core interfaces
export interface Address {
  street?: string
  city?: string
  district?: string
  province?: string
  postal_code?: string
  country?: string
}

export interface ContactInfo {
  phone?: string
  email?: string
  website?: string
  social_media?: {
    facebook?: string
    instagram?: string
    whatsapp?: string
  }
}

export interface BusinessSettings {
  language: 'en' | 'ne'
  currency: 'NPR'
  timezone: string
  date_format: 'AD' | 'BS'
  low_stock_threshold: number
  invoice_prefix: string
  tax_rate: number
  fiscal_year_start: string
}

export interface ProductVariant {
  size?: string
  color?: string
  material?: string
  design?: string
  additional_price: number
  stock_adjustment: number
}

export interface SaleItem {
  product_id: string
  product_name: string
  variant?: ProductVariant
  quantity: number
  unit_price: number
  total_price: number
}

export interface PurchaseItem {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
  total_cost: number
}

export interface ReturnItem {
  product_id: string
  product_name: string
  variant?: ProductVariant
  quantity: number
  unit_price: number
  total_price: number
  reason?: string
}

// Database table interfaces
export interface Business {
  id: string
  owner_id: string
  business_name: string
  business_type: BusinessType
  address: Address
  contact: ContactInfo
  settings: BusinessSettings
  fiscal_year_start: string
  vat_number?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  business_id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address: Address
  payment_terms: number
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  sku?: string
  category?: string
  purchase_price: number
  selling_price: number
  current_stock: number
  min_stock_level: number
  images: string[]
  variants: ProductVariant[]
  supplier_id?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone?: string
  email?: string
  address: Address
  date_of_birth?: string
  total_purchases: number
  outstanding_balance: number
  credit_limit: number
  last_visit_date?: string
  loyalty_points: number
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  business_id: string
  customer_id?: string
  invoice_number: string
  sale_date: string
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  payment_status: PaymentStatus
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  sale_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  notes?: string
  created_at: string
}

export interface Expense {
  id: string
  business_id: string
  category: string
  amount: number
  description?: string
  vendor?: string
  expense_date: string
  receipt_url?: string
  recurring: boolean
  recurring_frequency?: number
  next_occurrence?: string
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  product_id: string
  transaction_type: TransactionType
  quantity: number
  reference_id?: string
  reference_type?: string
  unit_cost?: number
  notes?: string
  timestamp: string
}

export interface PurchaseOrder {
  id: string
  business_id: string
  supplier_id: string
  order_number: string
  order_date: string
  expected_delivery?: string
  items: PurchaseItem[]
  subtotal: number
  tax: number
  total_amount: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ReturnExchange {
  id: string
  business_id: string
  original_sale_id: string
  customer_id?: string
  return_number: string
  return_type: ReturnType
  return_date: string
  reason: ReturnReason
  reason_description?: string
  status: ReturnStatus
  returned_items: ReturnItem[]
  exchange_items: ReturnItem[]
  original_amount: number
  refund_amount: number
  exchange_difference: number
  processed_by?: string
  processed_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ReturnPayment {
  id: string
  return_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  reference_number?: string
  notes?: string
  created_at: string
}

// Dashboard metrics interface
export interface DashboardMetrics {
  today_sales: number
  yesterday_sales: number
  monthly_revenue: number
  last_month_revenue: number
  total_customers: number
  new_customers_this_month: number
  pending_payments: number
  low_stock_items: number
  total_products: number
  sales_this_week: number
  last_week_sales: number
  average_order_value: number
}

// Low stock product interface
export interface LowStockProduct {
  id: string
  name: string
  current_stock: number
  min_stock_level: number
  category?: string
}

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business
        Insert: Omit<Business, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Business, 'id' | 'created_at' | 'updated_at'>>
      }
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>>
      }
      payments: {
        Row: Payment
        Insert: Omit<Payment, 'id' | 'created_at'>
        Update: Partial<Omit<Payment, 'id' | 'created_at'>>
      }
      expenses: {
        Row: Expense
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>
      }
      inventory_transactions: {
        Row: InventoryTransaction
        Insert: Omit<InventoryTransaction, 'id' | 'timestamp'>
        Update: Partial<Omit<InventoryTransaction, 'id' | 'timestamp'>>
      }
      purchase_orders: {
        Row: PurchaseOrder
        Insert: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>>
      }
      returns_exchanges: {
        Row: ReturnExchange
        Insert: Omit<ReturnExchange, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ReturnExchange, 'id' | 'created_at' | 'updated_at'>>
      }
      return_payments: {
        Row: ReturnPayment
        Insert: Omit<ReturnPayment, 'id' | 'created_at'>
        Update: Partial<Omit<ReturnPayment, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: {
        Args: { business_uuid: string; prefix?: string }
        Returns: string
      }
      generate_return_number: {
        Args: { business_uuid: string; prefix?: string }
        Returns: string
      }
      process_return_exchange: {
        Args: { return_id: string; approve?: boolean }
        Returns: boolean
      }
      calculate_return_amounts: {
        Args: { 
          returned_items: Json
          exchange_items?: Json
        }
        Returns: {
          original_amount: number
          exchange_amount: number
          difference: number
        }[]
      }
      get_low_stock_products: {
        Args: { business_uuid: string }
        Returns: LowStockProduct[]
      }
      get_dashboard_metrics: {
        Args: { 
          business_uuid: string
          start_date?: string
          end_date?: string
        }
        Returns: DashboardMetrics[]
      }
    }
    Enums: {
      business_type: BusinessType
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      transaction_type: TransactionType
      return_type: ReturnType
      return_status: ReturnStatus
      return_reason: ReturnReason
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}