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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatNPR } from '@/lib/nepal-utils'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { dashboardQueries } from '@/lib/database/queries'
import { useQuery } from '@tanstack/react-query'

interface TopProductsChartProps {
  businessId?: string
  isLoading?: boolean
  chartType?: 'bar' | 'pie'
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function TopProductsChart({ 
  businessId,
  isLoading = false, 
  chartType = 'bar' 
}: TopProductsChartProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  
  // Use provided businessId or first business
  const currentBusinessId = businessId || businesses?.[0]?.id
  
  const { data: chartData, isLoading: dataLoading } = useQuery({
    queryKey: ['dashboard', 'top-products', currentBusinessId],
    queryFn: () => dashboardQueries.getTopProducts(currentBusinessId!, 5),
    enabled: !!currentBusinessId,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })

  const loading = isLoading || dataLoading || !currentBusinessId
  const data = chartData || []

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { sales: number; revenue: number } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Sales: {data?.sales} units
          </p>
          <p className="text-green-600">
            Revenue: {formatNPR(data?.revenue || 0)}
          </p>
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
    if (active && payload && payload.length) {
      const item = payload[0] as { name: string; value: number; payload: { sales: number; revenue: number } }
      const totalQuantity = data.reduce((sum, product) => sum + product.quantity, 0)
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{item.name}</p>
          <p className="text-blue-600">
            {item.value} units ({totalQuantity > 0 ? ((item.value / totalQuantity) * 100).toFixed(1) : 0}%)
          </p>
          <p className="text-green-600">
            Revenue: {formatNPR(item.payload.revenue)}
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
          <CardTitle>Top Products</CardTitle>
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
        <CardTitle>Top Products</CardTitle>
        <CardDescription>
          Best selling products by quantity and revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="quantity" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}

                outerRadius={80}
                fill="#8884d8"
                dataKey="quantity"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}