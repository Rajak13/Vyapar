'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns'
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Heart,
  Clock,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useCustomers } from '@/hooks/use-customers'
import { useSales } from '@/hooks/use-sales'
import type { Customer, Sale } from '@/types/database'

interface CustomerAnalyticsProps {
  businessId: string
}

type DateRange = '7d' | '30d' | '90d' | 'current_month' | 'last_month' | 'current_year'

interface CustomerInsight {
  customer: Customer
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  lastVisit: Date | null
  daysSinceLastVisit: number
  frequency: number // orders per month
  lifetimeValue: number
  segment: 'vip' | 'loyal' | 'regular' | 'new' | 'at_risk'
  trend: 'up' | 'down' | 'stable'
}

interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  averageLifetimeValue: number
  averageOrderValue: number
  customerRetentionRate: number
  topCustomers: CustomerInsight[]
  newCustomersList: CustomerInsight[]
  atRiskCustomers: CustomerInsight[]
  customerSegments: Record<string, number>
  acquisitionTrend: Array<{
    month: string
    newCustomers: number
    returningCustomers: number
    totalRevenue: number
  }>
}

export function CustomerAnalytics({ businessId }: CustomerAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [sortBy, setSortBy] = useState<'spending' | 'frequency' | 'recent' | 'lifetime'>('spending')
  
  const { data: customers, isLoading: customersLoading } = useCustomers(businessId)
  const { data: sales, isLoading: salesLoading } = useSales(businessId, 1000)

  const isLoading = customersLoading || salesLoading

  // Calculate date range
  const getDateRange = (range: DateRange) => {
    const now = new Date()
    switch (range) {
      case '7d':
        return { start: subDays(now, 7), end: now }
      case '30d':
        return { start: subDays(now, 30), end: now }
      case '90d':
        return { start: subDays(now, 90), end: now }
      case 'current_month':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last_month':
        const lastMonth = subMonths(now, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      case 'current_year':
        return { start: new Date(now.getFullYear(), 0, 1), end: now }
      default:
        return { start: subDays(now, 30), end: now }
    }
  }

  const { start: startDate, end: endDate } = getDateRange(dateRange)

  // Filter sales by date range
  const filteredSales = sales?.filter(sale => {
    const saleDate = new Date(sale.sale_date)
    return saleDate >= startDate && saleDate <= endDate
  }) || []

  // Calculate customer metrics
  const customerMetrics = useMemo((): CustomerMetrics => {
    if (!customers || !sales) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        averageLifetimeValue: 0,
        averageOrderValue: 0,
        customerRetentionRate: 0,
        topCustomers: [],
        newCustomersList: [],
        atRiskCustomers: [],
        customerSegments: {},
        acquisitionTrend: []
      }
    }

    // Calculate insights for each customer
    const customerInsights: CustomerInsight[] = customers.map(customer => {
      // Get all sales for this customer
      const customerSales = sales.filter(sale => sale.customer_id === customer.id)
      const periodSales = filteredSales.filter(sale => sale.customer_id === customer.id)

      const totalSpent = periodSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const totalOrders = periodSales.length
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lifetimeValue = customerSales.reduce((sum, sale) => sum + sale.total_amount, 0)

      // Calculate last visit and frequency
      const sortedSales = customerSales.sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
      const lastVisit = sortedSales.length > 0 ? new Date(sortedSales[0].sale_date) : null
      const daysSinceLastVisit = lastVisit ? differenceInDays(new Date(), lastVisit) : Infinity

      // Calculate frequency (orders per month)
      const firstSale = sortedSales.length > 0 ? new Date(sortedSales[sortedSales.length - 1].sale_date) : null
      const monthsSinceFirst = firstSale ? Math.max(1, differenceInDays(new Date(), firstSale) / 30) : 1
      const frequency = customerSales.length / monthsSinceFirst

      // Determine customer segment
      let segment: CustomerInsight['segment'] = 'regular'
      if (lifetimeValue > 50000 && frequency > 2) segment = 'vip'
      else if (lifetimeValue > 20000 && frequency > 1) segment = 'loyal'
      else if (customerSales.length === 1 && daysSinceLastVisit < 30) segment = 'new'
      else if (daysSinceLastVisit > 60) segment = 'at_risk'

      // Calculate trend (comparing first half vs second half of customer's purchase history)
      const midIndex = Math.floor(customerSales.length / 2)
      const recentSales = customerSales.slice(0, midIndex)
      const olderSales = customerSales.slice(midIndex)
      
      const recentAvg = recentSales.length > 0 ? recentSales.reduce((sum, s) => sum + s.total_amount, 0) / recentSales.length : 0
      const olderAvg = olderSales.length > 0 ? olderSales.reduce((sum, s) => sum + s.total_amount, 0) / olderSales.length : 0
      
      let trend: CustomerInsight['trend'] = 'stable'
      if (recentAvg > olderAvg * 1.2) trend = 'up'
      else if (recentAvg < olderAvg * 0.8) trend = 'down'

      return {
        customer,
        totalSpent,
        totalOrders,
        averageOrderValue,
        lastVisit,
        daysSinceLastVisit,
        frequency,
        lifetimeValue,
        segment,
        trend
      }
    })

    // Calculate metrics
    const totalCustomers = customers.length
    const newCustomers = customerInsights.filter(c => c.segment === 'new').length
    const returningCustomers = customerInsights.filter(c => c.totalOrders > 1).length
    
    const averageLifetimeValue = customerInsights.length > 0 
      ? customerInsights.reduce((sum, c) => sum + c.lifetimeValue, 0) / customerInsights.length 
      : 0

    const averageOrderValue = filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length 
      : 0

    // Calculate retention rate (customers who made purchases in both periods)
    const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    const previousPeriodSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      return saleDate >= previousPeriodStart && saleDate < startDate
    })
    
    const currentPeriodCustomers = new Set(filteredSales.map(s => s.customer_id).filter(Boolean))
    const previousPeriodCustomers = new Set(previousPeriodSales.map(s => s.customer_id).filter(Boolean))
    const retainedCustomers = [...currentPeriodCustomers].filter(id => previousPeriodCustomers.has(id))
    
    const customerRetentionRate = previousPeriodCustomers.size > 0 
      ? (retainedCustomers.length / previousPeriodCustomers.size) * 100 
      : 0

    // Sort customers by different criteria
    const topCustomers = [...customerInsights]
      .sort((a, b) => {
        switch (sortBy) {
          case 'spending':
            return b.totalSpent - a.totalSpent
          case 'frequency':
            return b.frequency - a.frequency
          case 'recent':
            return (a.daysSinceLastVisit || Infinity) - (b.daysSinceLastVisit || Infinity)
          case 'lifetime':
            return b.lifetimeValue - a.lifetimeValue
          default:
            return b.totalSpent - a.totalSpent
        }
      })
      .slice(0, 10)

    const newCustomersList = customerInsights
      .filter(c => c.segment === 'new')
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    const atRiskCustomers = customerInsights
      .filter(c => c.segment === 'at_risk')
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10)

    // Customer segments
    const customerSegments = customerInsights.reduce((acc, insight) => {
      acc[insight.segment] = (acc[insight.segment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Acquisition trend (last 6 months)
    const acquisitionTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(subMonths(new Date(), i))
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date)
        return saleDate >= monthStart && saleDate <= monthEnd
      })

      const monthCustomers = new Set(monthSales.map(s => s.customer_id).filter(Boolean))
      const newInMonth = [...monthCustomers].filter(customerId => {
        const customer = customers.find(c => c.id === customerId)
        if (!customer) return false
        const firstSale = sales
          .filter(s => s.customer_id === customerId)
          .sort((a, b) => new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime())[0]
        if (!firstSale) return false
        const firstSaleDate = new Date(firstSale.sale_date)
        return firstSaleDate >= monthStart && firstSaleDate <= monthEnd
      })

      acquisitionTrend.push({
        month: format(monthStart, 'MMM yyyy'),
        newCustomers: newInMonth.length,
        returningCustomers: monthCustomers.size - newInMonth.length,
        totalRevenue: monthSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      })
    }

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      averageLifetimeValue,
      averageOrderValue,
      customerRetentionRate,
      topCustomers,
      newCustomersList,
      atRiskCustomers,
      customerSegments,
      acquisitionTrend
    }
  }, [customers, sales, filteredSales, startDate, endDate, sortBy])

  const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getSegmentBadge = (segment: CustomerInsight['segment']) => {
    switch (segment) {
      case 'vip':
        return <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
      case 'loyal':
        return <Badge className="bg-blue-100 text-blue-800">Loyal</Badge>
      case 'regular':
        return <Badge variant="outline">Regular</Badge>
      case 'new':
        return <Badge className="bg-green-100 text-green-800">New</Badge>
      case 'at_risk':
        return <Badge variant="destructive">At Risk</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'bg-purple-500'
      case 'loyal':
        return 'bg-blue-500'
      case 'regular':
        return 'bg-gray-500'
      case 'new':
        return 'bg-green-500'
      case 'at_risk':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Analytics & Insights</h2>
          <p className="text-gray-600">Customer behavior, acquisition trends, and retention analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-48">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="current_month">Current month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="current_year">Current year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: 'spending' | 'frequency' | 'recent' | 'lifetime') => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spending">By Spending</SelectItem>
              <SelectItem value="frequency">By Frequency</SelectItem>
              <SelectItem value="recent">By Recent</SelectItem>
              <SelectItem value="lifetime">By Lifetime Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customerMetrics.totalCustomers}</p>
                <p className="text-sm text-gray-500">Active customers</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Customers</p>
                <p className="text-2xl font-bold">{customerMetrics.newCustomers}</p>
                <p className="text-sm text-gray-500">This period</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Lifetime Value</p>
                <p className="text-2xl font-bold">{formatCurrency(customerMetrics.averageLifetimeValue)}</p>
                <p className="text-sm text-gray-500">Per customer</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-2xl font-bold">{customerMetrics.customerRetentionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">
                  {customerMetrics.customerRetentionRate > 70 ? 'Excellent' : 
                   customerMetrics.customerRetentionRate > 50 ? 'Good' : 'Needs improvement'}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(customerMetrics.customerSegments).map(([segment, count]) => (
              <div key={segment} className="text-center">
                <div className={`w-16 h-16 rounded-full ${getSegmentColor(segment)} mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{count}</span>
                </div>
                <p className="font-medium capitalize">{segment}</p>
                <p className="text-sm text-gray-500">
                  {((count / customerMetrics.totalCustomers) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Acquisition Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Acquisition Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerMetrics.acquisitionTrend.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{trend.month}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-green-600">New: {trend.newCustomers}</span>
                    <span className="text-blue-600">Returning: {trend.returningCustomers}</span>
                    <span className="text-gray-600">Revenue: {formatCurrency(trend.totalRevenue)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">
                    {trend.newCustomers + trend.returningCustomers} total
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Top Customers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerMetrics.topCustomers.map((insight, index) => (
              <div key={insight.customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{insight.customer.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{insight.customer.phone}</span>
                      <span>{insight.totalOrders} orders</span>
                      {getSegmentBadge(insight.segment)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-medium">{formatCurrency(insight.totalSpent)}</p>
                      <p className="text-sm text-gray-600">
                        LTV: {formatCurrency(insight.lifetimeValue)}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-1 ${getTrendColor(insight.trend)}`}>
                      {getTrendIcon(insight.trend)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New vs At-Risk Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              <span>New Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerMetrics.newCustomersList.slice(0, 5).map((insight, index) => (
                <div key={insight.customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{insight.customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {insight.daysSinceLastVisit < Infinity ? `${insight.daysSinceLastVisit} days ago` : 'Never visited'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(insight.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{insight.totalOrders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <span>At-Risk Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerMetrics.atRiskCustomers.slice(0, 5).map((insight, index) => (
                <div key={insight.customer.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{insight.customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {insight.daysSinceLastVisit} days since last visit
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{formatCurrency(insight.lifetimeValue)}</p>
                    <p className="text-xs text-gray-500">LTV</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}