'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { Store, BarChart3, Users, Package } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl dark:text-white">
            Vyapar Vision
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600 md:text-2xl dark:text-gray-300">
            {t('business.businessSetup')} - Comprehensive business management platform designed for Nepal&apos;s retail ecosystem
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/signup')}
            >
              {t('auth.signUp')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => router.push('/login')}
            >
              {t('auth.signIn')}
            </Button>
          </div>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center">
            <CardHeader>
              <Store className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <CardTitle>{t('navigation.pos')}</CardTitle>
              <CardDescription>
                Fast and efficient POS system for quick transactions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Package className="mx-auto mb-4 h-12 w-12 text-green-600" />
              <CardTitle>{t('navigation.inventory')}</CardTitle>
              <CardDescription>
                Track stock levels, manage products, and get low stock alerts
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="mx-auto mb-4 h-12 w-12 text-purple-600" />
              <CardTitle>{t('navigation.customers')}</CardTitle>
              <CardDescription>
                Build customer relationships and track purchase history
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="mx-auto mb-4 h-12 w-12 text-orange-600" />
              <CardTitle>{t('navigation.reports')}</CardTitle>
              <CardDescription>
                Get insights into your business performance and trends
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Built for Nepal
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Features designed specifically for Nepali businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <h3 className="mb-2 font-semibold">{t('dateTime.nepaliDate')} Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full support for Bikram Sambat calendar and fiscal year
                </p>
              </div>
              <div className="text-center">
                <h3 className="mb-2 font-semibold">Offline First</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Works seamlessly even with poor internet connectivity
                </p>
              </div>
              <div className="text-center">
                <h3 className="mb-2 font-semibold">Mobile Optimized</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perfect for mobile devices with touch-friendly interface
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}