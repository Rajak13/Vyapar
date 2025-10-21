export interface Address {
  street?: string
  city: string
  state?: string
  postal_code?: string
  country: string
}

export interface ContactInfo {
  phone: string
  email?: string
  website?: string
}

export interface BusinessSettings {
  language: 'en' | 'ne'
  currency: 'NPR'
  timezone: string
  date_format: 'AD' | 'BS'
  low_stock_threshold: number
  invoice_prefix: string
  tax_rate: number
}

export interface Business {
  id: string
  owner_id: string
  business_name: string
  business_type: 'retail' | 'service' | 'wholesale'
  address: Address
  contact: ContactInfo
  settings: BusinessSettings
  fiscal_year_start: Date
  created_at: Date
  updated_at: Date
}

export interface ProductVariant {
  size?: string
  color?: string
  material?: string
  design?: string
  additional_price: number
  stock_adjustment: number
}

export interface Product {
  id: string
  business_id: string
  name: string
  description?: string
  sku: string
  category: string
  purchase_price: number
  selling_price: number
  current_stock: number
  min_stock_level: number
  images: string[]
  variants: ProductVariant[]
  supplier_id?: string
  active: boolean
  created_at: Date
  updated_at: Date
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone?: string
  email?: string
  address?: Address
  total_purchases: number
  outstanding_balance: number
  last_visit_date?: Date
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface SaleItem {
  product_id: string
  product_name: string
  variant?: ProductVariant
  quantity: number
  unit_price: number
  total_price: number
}

export type PaymentMethod =
  | 'cash'
  | 'esewa'
  | 'khalti'
  | 'ime_pay'
  | 'bank_transfer'
  | 'card'

export interface Sale {
  id: string
  business_id: string
  customer_id?: string
  invoice_number: string
  sale_date: Date
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  total_amount: number
  payment_status: 'paid' | 'partial' | 'unpaid'
  payment_method: PaymentMethod[]
  notes?: string
  created_at: Date
}

export interface Payment {
  id: string
  sale_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date: Date
  reference_number?: string
  created_at: Date
}

export interface Expense {
  id: string
  business_id: string
  category: string
  amount: number
  description?: string
  vendor?: string
  expense_date: Date
  receipt_url?: string
  recurring: boolean
  created_at: Date
}

export interface InventoryTransaction {
  id: string
  product_id: string
  transaction_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_id?: string
  timestamp: Date
  notes?: string
}
