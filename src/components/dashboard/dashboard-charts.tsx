'use client'

import { useState } from 'react'
import { ChartsGrid } from '@/components/layout/dashboard-grid'
import { SalesTrendChart } from './sales-trend-chart'
import { TopProductsChart } from './top-products-chart'
import { CustomerInsightsChart } from './customer-insights-chart'
import { DateRangeSelector } from './date-range-selector'
import { Button } from '@/components/ui/button'
import { BarChart3, PieChart, TrendingUp } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'

interface DashboardChartsProps {
  businessId?: string
  isLoading?: boolean
}

export function DashboardCharts({ businessId, isLoading = false }: DashboardChartsProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  
  // Use provided businessId or first business
  const currentBusinessId = businessId || businesses?.[0]?.id
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [productChartType, setProductChartType] = useState<'bar' | 'pie'>('bar')

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange)
    // In a real app, this would trigger data refetch with new date range
    console.log('Date range changed:', newDateRange)
  }

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Analytics & Insights</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
          
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={productChartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setProductChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={productChartType === 'pie' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setProductChartType('pie')}
            >
              <PieChart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <ChartsGrid>
        <SalesTrendChart 
          businessId={currentBusinessId}
          isLoading={isLoading}
          period="week"
        />
        
        <TopProductsChart 
          businessId={currentBusinessId}
          isLoading={isLoading}
          chartType={productChartType}
        />
      </ChartsGrid>

      {/* Full Width Chart */}
      <div className="grid grid-cols-1">
        <CustomerInsightsChart 
          businessId={currentBusinessId}
          isLoading={isLoading} 
        />
      </div>
    </div>
  )
}