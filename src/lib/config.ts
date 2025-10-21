export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Vyapar Vision',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description:
      "Comprehensive business management platform for Nepal's retail ecosystem",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableAnalytics: false, // Will be enabled later
    enablePaymentGateway: false, // Will be enabled later
  },
  business: {
    defaultCurrency: 'NPR',
    defaultLanguage: 'en',
    defaultTimezone: 'Asia/Kathmandu',
    supportedLanguages: ['en', 'ne'],
    fiscalYearStart: 'july', // Nepali fiscal year starts in July (Shrawan)
  },
  ui: {
    itemsPerPage: 20,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    touchTargetSize: 44, // Minimum touch target size in pixels
  },
} as const

export type Config = typeof config
