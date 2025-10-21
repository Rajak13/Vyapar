'use client'

import { useCustomerAnalytics, useCustomerLifetimeValue } from '@/hooks/use-customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  ShoppingBag, 
  Calendar, 
  Star,
  Target,
  Clock,
  Award,
  Zap
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Customer } from '@/types/database'

interface CustomerInsightsProps {
  customer: Customer
}

export function CustomerInsights({ customer }: CustomerInsightsProps) {
  const { data: analytics, isLoading: analyticsLoading } = useCustomerAnalytics(customer.id)
  const { data: lifetimeValue, isLoading: clvLoading } = useCustomerLifetimeValue(customer.id)

  if (analyticsLoading || clvLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!analytics || !lifetimeValue) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No purchase data available</h3>
          <p className="text-muted-foreground text-center">
            This customer hasn&apos;t made any purchases yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate customer score (0-100)
  const calculateCustomerScore = () => {
    let score = 0
    
    // Recency (30 points) - when was last purchase
    if (analytics.lastOrderDate) {
      const daysSinceLastOrder = (Date.now() - new Date(analytics.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastOrder <= 30) score += 30
      else if (daysSinceLastOrder <= 90) score += 20
      else if (daysSinceLastOrder <= 180) score += 10
    }
    
    // Frequency (30 points) - how often they purchase
    if (analytics.totalOrders >= 10) score += 30
    else if (analytics.totalOrders >= 5) score += 20
    else if (analytics.totalOrders >= 2) score += 10
    
    // Monetary (40 points) - how much they spend
    if (analytics.totalSpent >= 100000) score += 40
    else if (analytics.totalSpent >= 50000) score += 30
    else if (analytics.totalSpent >= 20000) score += 20
    else if (analytics.totalSpent >= 5000) score += 10
    
    return Math.min(score, 100)
  }

  const customerScore = calculateCustomerScore()
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Champion', variant: 'default' as const }
    if (score >= 60) return { label: 'Loyal', variant: 'secondary' as const }
    if (score >= 40) return { label: 'Potential', variant: 'outline' as const }
    return { label: 'At Risk', variant: 'destructive' as const }
  }

  const scoreBadge = getScoreBadge(customerScore)

  // Prepare chart data
  const spendingTrendData = analytics.spendingTrend.map(item => ({
    month: format(parseISO(item.month + '-01'), 'MMM yyyy'),
    amount: item.amount
  }))

  const favoriteProductsData = analytics.favoriteProducts.map(item => ({
    name: item.product.length > 15 ? item.product.substring(0, 15) + '...' : item.product,
    fullName: item.product,
    quantity: item.count
  }))

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(customerScore)}`}>
                  {customerScore}/100
                </p>
                <Badge variant={scoreBadge.variant} className="mt-1">
                  {scoreBadge.label}
                </Badge>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Predicted CLV</p>
                <p className="text-2xl font-bold">
                  NPR {lifetimeValue.predictedLifetimeValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Current: NPR {lifetimeValue.currentLifetimeValue.toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visit Frequency</p>
                <p className="text-2xl font-bold">
                  {analytics.visitFrequency > 0 ? `${analytics.visitFrequency}d` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalOrders} total orders
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  NPR {Math.round(analytics.averageOrderValue).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lifetimeValue.purchaseFrequency.toFixed(1)}/month
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spendingTrendData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendingTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`NPR ${Number(value).toLocaleString()}`, 'Amount']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Favorite Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Favorite Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoriteProductsData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={favoriteProductsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} items`,
                        props.payload?.fullName || 'Product'
                      ]}
                    />
                    <Bar dataKey="quantity" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Journey Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Customer Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div>
                  <p className="font-medium">First Purchase</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.firstOrderDate ? format(new Date(analytics.firstOrderDate), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <Badge variant="outline">Customer Since</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <div>
                  <p className="font-medium">Latest Purchase</p>
                  <p className="text-sm text-muted-foreground">
                    {analytics.lastOrderDate ? format(new Date(analytics.lastOrderDate), 'MMMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
              <Badge variant="outline">Most Recent</Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <div>
                  <p className="font-medium">Customer Lifespan</p>
                  <p className="text-sm text-muted-foreground">
                    {lifetimeValue.customerLifespanMonths} months active
                  </p>
                </div>
              </div>
              <Badge variant="outline">Duration</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerScore >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">Champion Customer</p>
                <p className="text-sm text-green-700">
                  This customer is highly valuable. Consider offering exclusive deals or early access to new products.
                </p>
              </div>
            )}
            
            {customerScore >= 60 && customerScore < 80 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Loyal Customer</p>
                <p className="text-sm text-blue-700">
                  Great customer! Consider loyalty rewards or referral programs to increase engagement.
                </p>
              </div>
            )}
            
            {customerScore >= 40 && customerScore < 60 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">Potential Customer</p>
                <p className="text-sm text-yellow-700">
                  This customer has potential. Try targeted promotions or personalized recommendations.
                </p>
              </div>
            )}
            
            {customerScore < 40 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">At Risk Customer</p>
                <p className="text-sm text-red-700">
                  This customer may be churning. Consider re-engagement campaigns or special offers.
                </p>
              </div>
            )}

            {customer.outstanding_balance > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800">Outstanding Balance</p>
                <p className="text-sm text-orange-700">
                  Customer has NPR {customer.outstanding_balance.toLocaleString()} outstanding. Consider payment reminders.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}