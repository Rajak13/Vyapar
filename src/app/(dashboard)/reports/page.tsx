'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinancialReports } from '@/components/reports/financial-reports'
import { ProductAnalytics } from '@/components/reports/product-analytics'
import { CustomerAnalytics } from '@/components/reports/customer-analytics'
import { ReportExports } from '@/components/reports/report-exports'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import {
  BarChart3,
  TrendingUp,
  Users,
  Download,
  FileText,
  PieChart,
  Activity
} from 'lucide-react'

export default function ReportsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('financial')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string>('')

  useEffect(() => {
    const fetchUserBusiness = async () => {
      if (!user?.id) return

      try {
        const supabase = createClient()
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('id, business_name')
          .eq('owner_id', user.id)
          .eq('active', true)
          .limit(1)

        if (error) {
          console.error('Error fetching business:', error)
        } else if (businesses && businesses.length > 0) {
          setBusinessId(businesses[0].id)
          setBusinessName(businesses[0].business_name)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserBusiness()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No business found. Please complete your business setup to view reports.</p>
          <Link href="/onboarding" className="text-blue-600 hover:underline">
            Complete Business Setup
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Comprehensive business intelligence for {businessName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ReportExports businessId={businessId} />
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Reports</p>
                <p className="text-2xl font-bold">P&L, Cash Flow</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Product Analytics</p>
                <p className="text-2xl font-bold">Performance</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Insights</p>
                <p className="text-2xl font-bold">Behavior</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Export & Share</p>
                <p className="text-2xl font-bold">PDF, Excel</p>
              </div>
              <Download className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Financial</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <FinancialReports businessId={businessId} />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductAnalytics businessId={businessId} />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerAnalytics businessId={businessId} />
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export & Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportExports businessId={businessId} detailed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}