'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { formatNPR } from '@/lib/nepal-utils'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { dashboardQueries } from '@/lib/database/queries'
import { useQuery } from '@tanstack/react-query'

interface CustomerInsightsChartProps {
  businessId?: string
  isLoading?: boolean
}

export function CustomerInsightsChart({ 
  businessId,
  isLoading = false 
}: CustomerInsightsChartProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  
  // Use provided businessId or first business
  const currentBusinessId = businessId || businesses?.[0]?.id
  
  const { data: chartData, isLoading: dataLoading } = useQuery({
    queryKey: ['dashboard', 'customer-insights', currentBusinessId],
    queryFn: () => dashboardQueries.getCustomerInsights(currentBusinessId!),
    enabled: !!currentBusinessId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })

  const loading = isLoading || dataLoading || !currentBusinessId
  const data = chartData || []

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            New: {payload[0]?.value} customers
          </p>
          <p className="text-green-600">
            Returning: {payload[1]?.value} customers
          </p>
          <p className="text-purple-600">
            Total Spent: {formatNPR(payload[2]?.value || 0)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer Insights</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Insights</CardTitle>
        <CardDescription>
          New vs returning customers and spending patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="period" 
              className="text-xs"
            />
            <YAxis 
              yAxisId="customers"
              orientation="left"
              className="text-xs"
            />
            <YAxis 
              yAxisId="spending"
              orientation="right"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="customers"
              dataKey="newCustomers" 
              stackId="customers"
              fill="#3b82f6" 
              radius={[0, 0, 0, 0]}
              name="New Customers"
            />
            <Bar 
              yAxisId="customers"
              dataKey="returningCustomers" 
              stackId="customers"
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              name="Returning Customers"
            />
            <Line
              yAxisId="spending"
              type="monotone"
              dataKey="totalSpent"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}