import { z } from 'zod'


// Enum schemas
export const businessTypeSchema = z.enum(['retail', 'service', 'wholesale'] as const)
export const paymentStatusSchema = z.enum(['paid', 'partial', 'unpaid'] as const)
export const paymentMethodSchema = z.enum([
  'cash',
  'esewa',
  'khalti',
  'ime_pay',
  'bank_transfer',
  'card',
] as const)
export const transactionTypeSchema = z.enum(['in', 'out', 'adjustment'] as const)

// Core object schemas
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('Nepal'),
})

export const contactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  social_media: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      whatsapp: z.string().optional(),
    })
    .optional(),
})

export const businessSettingsSchema = z.object({
  language: z.enum(['en', 'ne']).default('en'),
  currency: z.literal('NPR').default('NPR'),
  timezone: z.string().default('Asia/Kathmandu'),
  date_format: z.enum(['AD', 'BS']).default('AD'),
  low_stock_threshold: z.number().min(0).default(5),
  invoice_prefix: z.string().default('INV'),
  tax_rate: z.number().min(0).max(100).default(13),
  fiscal_year_start: z.string().default('2024-07-16'), // Shrawan 1
})

export const productVariantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  material: z.string().optional(),
  design: z.string().optional(),
  additional_price: z.number().default(0),
  stock_adjustment: z.number().default(0),
})

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  variant: productVariantSchema.optional(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  total_price: z.number().min(0),
})

export const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  quantity: z.number().min(1),
  unit_cost: z.number().min(0),
  total_cost: z.number().min(0),
})

// Database table schemas
export const businessSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_type: businessTypeSchema,
  address: addressSchema,
  contact: contactInfoSchema,
  settings: businessSettingsSchema,
  fiscal_year_start: z.string(),
  vat_number: z.string().optional(),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const businessInsertSchema = businessSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const businessUpdateSchema = businessInsertSchema.partial()

export const supplierSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string().min(2, 'Supplier name must be at least 2 characters'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: addressSchema,
  payment_terms: z.number().min(0).default(30),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const supplierInsertSchema = supplierSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const supplierUpdateSchema = supplierInsertSchema.partial()

export const productSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  purchase_price: z.number().min(0).default(0),
  selling_price: z.number().min(0),
  current_stock: z.number().min(0).default(0),
  min_stock_level: z.number().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  variants: z.array(productVariantSchema).default([]),
  supplier_id: z.string().uuid().optional(),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const productInsertSchema = productSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const productUpdateSchema = productInsertSchema.partial()

export const customerSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: addressSchema,
  date_of_birth: z.string().optional(),
  total_purchases: z.number().min(0).default(0),
  outstanding_balance: z.number().default(0),
  credit_limit: z.number().min(0).default(0),
  last_visit_date: z.string().optional(),
  loyalty_points: z.number().min(0).default(0),
  notes: z.string().optional(),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
})

export const customerInsertSchema = customerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const customerUpdateSchema = customerInsertSchema.partial()

export const saleSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  invoice_number: z.string().min(1),
  sale_date: z.string(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  payment_status: paymentStatusSchema.default('unpaid'),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const saleInsertSchema = saleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const saleUpdateSchema = saleInsertSchema.partial()

export const paymentSchema = z.object({
  id: z.string().uuid(),
  sale_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_method: paymentMethodSchema,
  payment_date: z.string(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
})

export const paymentInsertSchema = paymentSchema.omit({
  id: true,
  created_at: true,
})

export const paymentUpdateSchema = paymentInsertSchema.partial()

export const expenseSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  vendor: z.string().optional(),
  expense_date: z.string(),
  receipt_url: z.string().url().optional(),
  recurring: z.boolean().default(false),
  recurring_frequency: z.number().min(1).optional(),
  next_occurrence: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const expenseInsertSchema = expenseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const expenseUpdateSchema = expenseInsertSchema.partial()

export const inventoryTransactionSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  transaction_type: transactionTypeSchema,
  quantity: z.number(),
  reference_id: z.string().uuid().optional(),
  reference_type: z.string().optional(),
  unit_cost: z.number().min(0).optional(),
  notes: z.string().optional(),
  timestamp: z.string(),
})

export const inventoryTransactionInsertSchema = inventoryTransactionSchema.omit({
  id: true,
  timestamp: true,
})

export const inventoryTransactionUpdateSchema = inventoryTransactionInsertSchema.partial()

export const purchaseOrderSchema = z.object({
  id: z.string().uuid(),
  business_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  order_number: z.string().min(1),
  order_date: z.string(),
  expected_delivery: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total_amount: z.number().min(0),
  status: z.string().default('pending'),
  notes: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const purchaseOrderInsertSchema = purchaseOrderSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const purchaseOrderUpdateSchema = purchaseOrderInsertSchema.partial()

// Form validation schemas (for user input)
export const businessFormSchema = z.object({
  business_name: z.string().min(2, 'Business name must be at least 2 characters'),
  business_type: businessTypeSchema,
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    district: z.string().min(1, 'District is required'),
    province: z.string().min(1, 'Province is required'),
    postal_code: z.string().optional(),
  }),
  contact: z.object({
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
  vat_number: z.string().optional(),
  settings: businessSettingsSchema.partial(),
})

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  purchase_price: z.number().min(0).optional(),
  selling_price: z.number().min(0.01, 'Selling price must be greater than 0'),
  current_stock: z.number().min(0).default(0),
  min_stock_level: z.number().min(0).default(0),
  supplier_id: z.string().uuid().optional(),
  variants: z.array(productVariantSchema).default([]),
})

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number is required').optional(),
  email: z.string().email().optional(),
  address: addressSchema.partial(),
  date_of_birth: z.string().optional(),
  credit_limit: z.number().min(0).default(0),
  notes: z.string().optional(),
})

export const saleFormSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  notes: z.string().optional(),
})

export const paymentFormSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_method: paymentMethodSchema,
  payment_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
})

export const expenseFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  vendor: z.string().optional(),
  expense_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  recurring: z.boolean().default(false),
  recurring_frequency: z.number().min(1).optional(),
})

// Expense categories
export const expenseCategoriesSchema = z.enum([
  'Rent',
  'Utilities',
  'Salaries',
  'Transportation',
  'Marketing',
  'Purchases',
  'Office Supplies',
  'Insurance',
  'Professional Services',
  'Maintenance',
  'Miscellaneous',
] as const)

export type ExpenseCategory = z.infer<typeof expenseCategoriesSchema>

// Export all form types
export type BusinessFormData = z.infer<typeof businessFormSchema>
export type ProductFormData = z.infer<typeof productFormSchema>
export type CustomerFormData = z.infer<typeof customerFormSchema>
export type SaleFormData = z.infer<typeof saleFormSchema>
export type PaymentFormData = z.infer<typeof paymentFormSchema>
export type ExpenseFormData = z.infer<typeof expenseFormSchema>