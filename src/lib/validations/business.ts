import { z } from 'zod'

export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters'),
  businessType: z.enum(['retail', 'service', 'wholesale'], {
    message: 'Please select a business type',
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
})

export const addressSchema = z.object({
  street: z
    .string()
    .min(1, 'Street address is required')
    .max(200, 'Street address must be less than 200 characters'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters'),
  district: z
    .string()
    .min(1, 'District is required')
    .max(100, 'District must be less than 100 characters'),
  province: z.enum([
    'Province 1',
    'Madhesh Province',
    'Bagmati Province',
    'Gandaki Province',
    'Lumbini Province',
    'Karnali Province',
    'Sudurpashchim Province',
  ], {
    message: 'Please select a province',
  }),
  postalCode: z
    .string()
    .max(10, 'Postal code must be less than 10 characters')
    .optional(),
})

export const contactInfoSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^(\+977)?[0-9]{10}$/, 'Please enter a valid Nepali phone number'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
})

export const businessSettingsSchema = z.object({
  language: z.enum(['en', 'ne'], {
    message: 'Please select a language',
  }),
  fiscalYearStart: z.enum([
    'shrawan', // July-August (Nepali fiscal year)
    'january', // January (English fiscal year)
  ], {
    message: 'Please select fiscal year start',
  }),
  currency: z.literal('NPR'),
  timezone: z.literal('Asia/Kathmandu'),
  dateFormat: z.enum(['AD', 'BS'], {
    message: 'Please select date format',
  }),
  lowStockThreshold: z
    .number()
    .min(0, 'Low stock threshold must be 0 or greater')
    .max(1000, 'Low stock threshold must be less than 1000'),
  invoicePrefix: z
    .string()
    .min(1, 'Invoice prefix is required')
    .max(10, 'Invoice prefix must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Invoice prefix must contain only uppercase letters and numbers'),
  taxRate: z
    .number()
    .min(0, 'Tax rate must be 0 or greater')
    .max(100, 'Tax rate must be 100 or less'),
  isVatRegistered: z.boolean(),
  vatNumber: z
    .string()
    .max(20, 'VAT number must be less than 20 characters')
    .optional(),
})

export const completeBusinessProfileSchema = z.object({
  businessInfo: businessInfoSchema,
  address: addressSchema,
  contactInfo: contactInfoSchema,
  settings: businessSettingsSchema,
})

export type BusinessInfoFormData = z.infer<typeof businessInfoSchema>
export type AddressFormData = z.infer<typeof addressSchema>
export type ContactInfoFormData = z.infer<typeof contactInfoSchema>
export type BusinessSettingsFormData = z.infer<typeof businessSettingsSchema>
export type CompleteBusinessProfileFormData = z.infer<typeof completeBusinessProfileSchema>