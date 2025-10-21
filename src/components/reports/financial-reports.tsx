'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
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
import { useExpenses } from '@/hooks/use-expenses'
import { useSales } from '@/hooks/use-sales'
import type { Expense, Sale } from '@/types/database'

interface FinancialReportsProps {
  businessId: string
}

type DateRange = '7d' | '30d' | '90d' | 'current_month' | 'last_month' | 'current_year'

interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  grossProfit: number
  profitMargin: number
  expensesByCategory: Record<string, number>
  monthlyTrends: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  topExpenseCategories: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export function FinancialReports({ businessId }: FinancialReportsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  
  const { data: expenses, isLoading: expensesLoading } = useExpenses(businessId, 1000)
  const { data: sales, isLoading: salesLoading } = useSales(businessId, 1000)

  const isLoading = expensesLoading || salesLoading

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

  // Filter data by date range
  const filteredExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date)
    return expenseDate >= startDate && expenseDate <= endDate
  }) || []

  const filteredSales = sales?.filter(sale => {
    const saleDate = new Date(sale.sale_date)
    return saleDate >= startDate && saleDate <= endDate
  }) || []

  // Calculate financial metrics
  const calculateMetrics = (): FinancialMetrics => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const grossProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Expenses by category
    const expensesByCategory: Record<string, number> = {}
    filteredExpenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount
    })

    // Top expense categories
    const topExpenseCategories = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(subMonths(new Date(), i))
      
      const monthRevenue = sales?.filter(sale => {
        const saleDate = new Date(sale.sale_date)
        return saleDate >= monthStart && saleDate <= monthEnd
      }).reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      const monthExpenses = expenses?.filter(expense => {
        const expenseDate = new Date(expense.expense_date)
        return expenseDate >= monthStart && expenseDate <= monthEnd
      }).reduce((sum, expense) => sum + expense.amount, 0) || 0

      monthlyTrends.push({
        month: format(monthStart, 'MMM yyyy'),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses
      })
    }

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin,
      expensesByCategory,
      monthlyTrends,
      topExpenseCategories
    }
  }

  const metrics = calculateMetrics()

  // Calculate previous period for comparison
  const getPreviousPeriodMetrics = () => {
    const periodLength = endDate.getTime() - startDate.getTime()
    const prevStart = new Date(startDate.getTime() - periodLength)
    const prevEnd = new Date(endDate.getTime() - periodLength)

    const prevExpenses = expenses?.filter(expense => {
      const expenseDate = new Date(expense.expense_date)
      return expenseDate >= prevStart && expenseDate <= prevEnd
    }) || []

    const prevSales = sales?.filter(sale => {
      const saleDate = new Date(sale.sale_date)
      return saleDate >= prevStart && saleDate <= prevEnd
    }) || []

    const prevRevenue = prevSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const prevExpenseTotal = prevExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const prevProfit = prevRevenue - prevExpenseTotal

    return { prevRevenue, prevExpenseTotal, prevProfit }
  }

  const { prevRevenue, prevExpenseTotal, prevProfit } = getPreviousPeriodMetrics()

  // Calculate percentage changes
  const revenueChange = prevRevenue > 0 ? ((metrics.totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
  const expenseChange = prevExpenseTotal > 0 ? ((metrics.totalExpenses - prevExpenseTotal) / prevExpenseTotal) * 100 : 0
  const profitChange = prevProfit !== 0 ? ((metrics.grossProfit - prevProfit) / Math.abs(prevProfit)) * 100 : 0

  const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />
    if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-600">Profit & loss analysis and expense insights</p>
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
                <div className={`flex items-center space-x-1 text-sm ${getChangeColor(revenueChange)}`}>
                  {getChangeIcon(revenueChange)}
                  <span>{Math.abs(revenueChange).toFixed(1)}% vs previous period</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalExpenses)}</p>
                <div className={`flex items-center space-x-1 text-sm ${getChangeColor(-expenseChange)}`}>
                  {getChangeIcon(expenseChange)}
                  <span>{Math.abs(expenseChange).toFixed(1)}% vs previous period</span>
                </div>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gross Profit</p>
                <p className={`text-2xl font-bold ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.grossProfit)}
                </p>
                <div className={`flex items-center space-x-1 text-sm ${getChangeColor(profitChange)}`}>
                  {getChangeIcon(profitChange)}
                  <span>{Math.abs(profitChange).toFixed(1)}% vs previous period</span>
                </div>
              </div>
              <BarChart3 className={`h-8 w-8 ${metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className={`text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.profitMargin.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {metrics.profitMargin >= 20 ? 'Excellent' : 
                   metrics.profitMargin >= 10 ? 'Good' : 
                   metrics.profitMargin >= 0 ? 'Fair' : 'Loss'}
                </p>
              </div>
              <PieChart className={`h-8 w-8 ${metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{trend.month}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-green-600">Revenue: {formatCurrency(trend.revenue)}</span>
                    <span className="text-red-600">Expenses: {formatCurrency(trend.expenses)}</span>
                    <span className={trend.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Profit: {formatCurrency(trend.profit)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={trend.profit >= 0 ? 'default' : 'destructive'}>
                    {trend.profit >= 0 ? 'Profit' : 'Loss'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topExpenseCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{category.category}</p>
                    <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}% of total expenses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(category.amount)}</p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Income vs Expenses</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-600">Total Income</span>
                  <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600">Total Expenses</span>
                  <span className="font-medium">{formatCurrency(metrics.totalExpenses)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center font-bold">
                  <span className={metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Net Cash Flow
                  </span>
                  <span className={metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(metrics.grossProfit)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Financial Health</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Expense Ratio</span>
                  <Badge variant={metrics.totalRevenue > 0 && (metrics.totalExpenses / metrics.totalRevenue) < 0.8 ? 'default' : 'destructive'}>
                    {metrics.totalRevenue > 0 ? ((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1) : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Break-even Point</span>
                  <span className="text-sm text-gray-600">
                    {metrics.totalRevenue >= metrics.totalExpenses ? 'Achieved' : 'Not achieved'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Financial Status</span>
                  <Badge variant={metrics.grossProfit >= 0 ? 'default' : 'destructive'}>
                    {metrics.grossProfit >= 0 ? 'Profitable' : 'Loss-making'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}