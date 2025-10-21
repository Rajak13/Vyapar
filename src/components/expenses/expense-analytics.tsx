'use client'

import { useState } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useExpenses } from '@/hooks/use-expenses'
import type { Expense } from '@/types/database'

interface ExpenseAnalyticsProps {
  businessId: string
}

type DateRange = '30d' | '90d' | '6m' | '1y'

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
]

export function ExpenseAnalytics({ businessId }: ExpenseAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  
  const { data: expenses, isLoading } = useExpenses(businessId, 1000)

  // Calculate date range
  const getDateRange = (range: DateRange) => {
    const now = new Date()
    switch (range) {
      case '30d':
        return { start: subDays(now, 30), end: now }
      case '90d':
        return { start: subDays(now, 90), end: now }
      case '6m':
        return { start: subMonths(now, 6), end: now }
      case '1y':
        return { start: subMonths(now, 12), end: now }
      default:
        return { start: subDays(now, 30), end: now }
    }
  }

  const { start: startDate, end: endDate } = getDateRange(dateRange)

  // Filter expenses by date range
  const filteredExpenses = expenses?.filter(expense => {
    const expenseDate = new Date(expense.expense_date)
    return expenseDate >= startDate && expenseDate <= endDate
  }) || []

  // Calculate category breakdown
  const getCategoryBreakdown = () => {
    const categoryTotals: Record<string, number> = {}
    
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
    })

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / filteredExpenses.reduce((sum, e) => sum + e.amount, 0)) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Calculate monthly trends
  const getMonthlyTrends = () => {
    const monthlyData: Record<string, Record<string, number>> = {}
    
    filteredExpenses.forEach(expense => {
      const month = format(new Date(expense.expense_date), 'MMM yyyy')
      if (!monthlyData[month]) {
        monthlyData[month] = {}
      }
      monthlyData[month][expense.category] = (monthlyData[month][expense.category] || 0) + expense.amount
    })

    return Object.entries(monthlyData)
      .map(([month, categories]) => ({
        month,
        total: Object.values(categories).reduce((sum, amount) => sum + amount, 0),
        ...categories
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  // Calculate vendor analysis
  const getVendorAnalysis = () => {
    const vendorTotals: Record<string, { amount: number; count: number }> = {}
    
    filteredExpenses.forEach(expense => {
      const vendor = expense.vendor || 'Unknown'
      if (!vendorTotals[vendor]) {
        vendorTotals[vendor] = { amount: 0, count: 0 }
      }
      vendorTotals[vendor].amount += expense.amount
      vendorTotals[vendor].count += 1
    })

    return Object.entries(vendorTotals)
      .map(([vendor, data]) => ({
        vendor,
        amount: data.amount,
        count: data.count,
        average: data.amount / data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }

  // Calculate expense frequency
  const getExpenseFrequency = () => {
    const dailyExpenses: Record<string, number> = {}
    
    filteredExpenses.forEach(expense => {
      const date = format(new Date(expense.expense_date), 'yyyy-MM-dd')
      dailyExpenses[date] = (dailyExpenses[date] || 0) + expense.amount
    })

    return Object.entries(dailyExpenses)
      .map(([date, amount]) => ({
        date,
        amount,
        formattedDate: format(new Date(date), 'MMM dd')
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const categoryBreakdown = getCategoryBreakdown()
  const monthlyTrends = getMonthlyTrends()
  const vendorAnalysis = getVendorAnalysis()
  const expenseFrequency = getExpenseFrequency()

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const averageDaily = totalExpenses / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
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
          <h2 className="text-2xl font-bold">Expense Analytics</h2>
          <p className="text-gray-600">Detailed analysis of your expense patterns</p>
        </div>
        <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold">NPR {totalExpenses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Daily</p>
              <p className="text-2xl font-bold">NPR {averageDaily.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold">{filteredExpenses.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Category</p>
              <p className="text-2xl font-bold">{categoryBreakdown[0]?.category || 'N/A'}</p>
              <p className="text-sm text-gray-500">
                {categoryBreakdown[0] ? `${categoryBreakdown[0].percentage.toFixed(1)}%` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category} (${(percentage as number).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`NPR ${value.toLocaleString()}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`NPR ${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Expense Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Expense Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={expenseFrequency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="formattedDate" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`NPR ${value.toLocaleString()}`, 'Amount']} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorAnalysis.slice(0, 5).map((vendor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{vendor.vendor}</p>
                      <p className="text-sm text-gray-500">{vendor.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">NPR {vendor.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">
                      Avg: NPR {vendor.average.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{category.category}</h4>
                  <Badge style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                    {category.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold">NPR {category.amount.toLocaleString()}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}