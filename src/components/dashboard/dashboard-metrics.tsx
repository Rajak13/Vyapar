'use client'

import { MetricCard } from './metric-card'
import { MetricsGrid } from '@/components/layout/dashboard-grid'
import { MetricCardSkeleton } from '@/components/layout/dashboard-skeleton'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { dashboardQueries } from '@/lib/database/queries'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Package,
  Calendar,
} from 'lucide-react'

interface DashboardMetricsProps {
  businessId?: string
}

export function DashboardMetrics({ businessId }: DashboardMetricsProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  
  // Use provided businessId or first business
  const currentBusinessId = businessId || businesses?.[0]?.id
  
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard', 'metrics', currentBusinessId],
    queryFn: () => dashboardQueries.getMetrics(currentBusinessId!),
    enabled: !!currentBusinessId,
    refetchInterval: 1000 * 60, // Refetch every minute for real-time updates
  })

  if (isLoading || !currentBusinessId) {
    return (
      <MetricsGrid>
        {Array.from({ length: 8 }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </MetricsGrid>
    )
  }

  // Use real data or show zeros for new businesses
  const dashboardData = metrics || {
    today_sales: 0,
    yesterday_sales: 0,
    monthly_revenue: 0,
    last_month_revenue: 0,
    total_customers: 0,
    new_customers_this_month: 0,
    pending_payments: 0,
    low_stock_items: 0,
    total_products: 0,
    sales_this_week: 0,
    last_week_sales: 0,
    average_order_value: 0,
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <MetricsGrid>
        <MetricCard
          title="Today's Sales"
          value={dashboardData.today_sales}
          previousValue={dashboardData.yesterday_sales}
          icon={DollarSign}
          description="Compared to yesterday"
          format="currency"
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={dashboardData.monthly_revenue}
          previousValue={dashboardData.last_month_revenue}
          icon={TrendingUp}
          description="This month's total"
          format="currency"
        />
        
        <MetricCard
          title="Total Customers"
          value={dashboardData.total_customers}
          icon={Users}
          description={`${dashboardData.new_customers_this_month} new this month`}
          format="number"
          trend={dashboardData.new_customers_this_month > 0 ? "up" : "neutral"}
          trendValue={dashboardData.new_customers_this_month}
          trendLabel={`+${dashboardData.new_customers_this_month} new customers`}
        />
        
        <MetricCard
          title="Pending Payments"
          value={dashboardData.pending_payments}
          icon={CreditCard}
          description="Outstanding amounts"
          format="currency"
          trend="neutral"
        />
      </MetricsGrid>

      {/* Secondary Metrics */}
      <MetricsGrid>
        <MetricCard
          title="Weekly Sales"
          value={dashboardData.sales_this_week}
          previousValue={dashboardData.last_week_sales}
          icon={ShoppingCart}
          description="This week vs last week"
          format="currency"
        />
        
        <MetricCard
          title="Average Order"
          value={dashboardData.average_order_value}
          icon={Calendar}
          description="Per transaction"
          format="currency"
          trend="neutral"
        />
        
        <MetricCard
          title="Total Products"
          value={dashboardData.total_products}
          icon={Package}
          description="In inventory"
          format="number"
          trend="neutral"
        />
        
        <MetricCard
          title="Low Stock Alert"
          value={dashboardData.low_stock_items}
          icon={AlertTriangle}
          description="Items need restocking"
          format="number"
          trend={dashboardData.low_stock_items > 0 ? 'down' : 'neutral'}
          className={dashboardData.low_stock_items > 0 ? 'border-orange-200 bg-orange-50' : ''}
        />
      </MetricsGrid>
    </div>
  )
}