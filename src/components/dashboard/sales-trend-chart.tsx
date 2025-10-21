'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { formatNPR } from '@/lib/nepal-utils'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { dashboardQueries } from '@/lib/database/queries'
import { useQuery } from '@tanstack/react-query'

interface SalesTrendChartProps {
  businessId?: string
  isLoading?: boolean
  period?: 'week' | 'month' | 'year'
}

export function SalesTrendChart({ 
  businessId,
  isLoading = false, 
  period = 'week' 
}: SalesTrendChartProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  
  // Use provided businessId or first business
  const currentBusinessId = businessId || businesses?.[0]?.id
  
  const { data: chartData, isLoading: dataLoading } = useQuery({
    queryKey: ['dashboard', 'sales-trend', currentBusinessId, period],
    queryFn: () => dashboardQueries.getSalesTrend(currentBusinessId!, period),
    enabled: !!currentBusinessId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })

  const loading = isLoading || dataLoading || !currentBusinessId
  const data = chartData || []

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    switch (period) {
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      case 'month':
        return date.toLocaleDateString('en-US', { day: 'numeric' })
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short' })
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label ? formatDate(label) : ''}</p>
          <p className="text-blue-600">
            Sales: {payload[0]?.value} transactions
          </p>
          <p className="text-green-600">
            Revenue: {formatNPR(payload[1]?.value || 0)}
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
          <CardTitle>Sales Trend</CardTitle>
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
        <CardTitle>Sales Trend</CardTitle>
        <CardDescription>
          Daily sales and revenue for the past {period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs"
            />
            <YAxis 
              yAxisId="sales"
              orientation="left"
              className="text-xs"
            />
            <YAxis 
              yAxisId="revenue"
              orientation="right"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Line
              yAxisId="sales"
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}