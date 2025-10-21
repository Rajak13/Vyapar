import type { Metadata, Viewport } from 'next'
import { Inter, Noto_Sans_Devanagari } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Providers } from '@/components/providers'
import { LanguageProvider } from '@/contexts/language-context'
import { locales, type Locale } from '@/i18n/config'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-nepali',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vyapar Vision - Business Management Platform',
  description:
    "Comprehensive business management platform designed for Nepal's retail ecosystem",
  keywords: [
    'business management',
    'nepal',
    'retail',
    'inventory',
    'pos',
    'vyapar',
  ],
  authors: [{ name: 'Vyapar Vision Team' }],
  creator: 'Vyapar Vision',
  publisher: 'Vyapar Vision',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vyapar Vision',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${inter.variable} ${notoSansDevanagari.variable} ${
          locale === 'ne' ? 'font-nepali' : 'font-sans'
        } antialiased`}
        dir={locale === 'ne' ? 'ltr' : 'ltr'} // Both languages are LTR
      >
        <NextIntlClientProvider messages={messages}>
          <LanguageProvider initialLocale={locale as Locale}>
            <Providers>{children}</Providers>
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}