'use client'

import { useTranslations as useNextIntlTranslations } from 'next-intl'

// Re-export useTranslations from next-intl for consistency
export const useTranslations = useNextIntlTranslations

// Custom hook for common translations
export function useCommonTranslations() {
  const t = useNextIntlTranslations('common')
  return t
}

// Custom hook for navigation translations
export function useNavigationTranslations() {
  const t = useNextIntlTranslations('navigation')
  return t
}

// Custom hook for auth translations
export function useAuthTranslations() {
  const t = useNextIntlTranslations('auth')
  return t
}

// Custom hook for business translations
export function useBusinessTranslations() {
  const t = useNextIntlTranslations('business')
  return t
}

// Custom hook for dashboard translations
export function useDashboardTranslations() {
  const t = useNextIntlTranslations('dashboard')
  return t
}

// Custom hook for POS translations
export function usePOSTranslations() {
  const t = useNextIntlTranslations('pos')
  return t
}

// Custom hook for inventory translations
export function useInventoryTranslations() {
  const t = useNextIntlTranslations('inventory')
  return t
}

// Custom hook for customer translations
export function useCustomerTranslations() {
  const t = useNextIntlTranslations('customers')
  return t
}

// Custom hook for supplier translations
export function useSupplierTranslations() {
  const t = useNextIntlTranslations('suppliers')
  return t
}

// Custom hook for expense translations
export function useExpenseTranslations() {
  const t = useNextIntlTranslations('expenses')
  return t
}

// Custom hook for report translations
export function useReportTranslations() {
  const t = useNextIntlTranslations('reports')
  return t
}

// Custom hook for settings translations
export function useSettingsTranslations() {
  const t = useNextIntlTranslations('settings')
  return t
}

// Custom hook for error translations
export function useErrorTranslations() {
  const t = useNextIntlTranslations('errors')
  return t
}

// Custom hook for validation translations
export function useValidationTranslations() {
  const t = useNextIntlTranslations('validation')
  return t
}

// Custom hook for date/time translations
export function useDateTimeTranslations() {
  const t = useNextIntlTranslations('dateTime')
  return t
}

// Custom hook for currency translations
export function useCurrencyTranslations() {
  const t = useNextIntlTranslations('currency')
  return t
}