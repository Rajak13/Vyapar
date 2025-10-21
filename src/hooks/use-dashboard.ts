import { useQuery } from '@tanstack/react-query'
import { dashboardQueries } from '@/lib/database/queries'
import { queryKeys } from '@/lib/query-client'

// Get dashboard metrics
export function useDashboardMetrics(
  businessId: string, 
  startDate?: string, 
  endDate?: string
) {
  return useQuery({
    queryKey: queryKeys.dashboardMetrics(businessId),
    queryFn: () => dashboardQueries.getMetrics(businessId, startDate, endDate),
    enabled: !!businessId,
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes for real-time feel
    staleTime: 1000 * 60, // Consider data stale after 1 minute
  })
}