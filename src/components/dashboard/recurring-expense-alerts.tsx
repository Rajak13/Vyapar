'use client'

import { Bell, AlertCircle, Clock, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurringExpenseSummary } from '@/hooks/use-recurring-expense-notifications'
import Link from 'next/link'

interface RecurringExpenseAlertsProps {
  businessId: string
}

export function RecurringExpenseAlerts({ businessId }: RecurringExpenseAlertsProps) {
  const { 
    overdue, 
    dueToday, 
    dueTomorrow, 
    total, 
    notifications 
  } = useRecurringExpenseSummary(businessId)

  // Don&apos;t show the widget if there are no notifications
  if (total === 0) {
    return null
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'due_today':
        return <Bell className="h-4 w-4 text-orange-600" />
      case 'due_tomorrow':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'due_today':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'due_tomorrow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-orange-900">
          <Bell className="h-5 w-5" />
          <span>Recurring Expense Alerts</span>
          <Badge variant="secondary" className="ml-auto">
            {total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex flex-wrap gap-2">
          {overdue > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {overdue} Overdue
            </Badge>
          )}
          {dueToday > 0 && (
            <Badge className="bg-orange-100 text-orange-800">
              {dueToday} Due Today
            </Badge>
          )}
          {dueTomorrow > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800">
              {dueTomorrow} Due Tomorrow
            </Badge>
          )}
        </div>

        {/* Top 3 most urgent notifications */}
        <div className="space-y-2">
          {notifications.slice(0, 3).map((notification) => (
            <div
              key={notification.id}
              className={`flex items-center space-x-3 p-2 rounded-lg border ${getAlertColor(notification.type)}`}
            >
              {getAlertIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {notification.message}
                </p>
                <p className="text-xs opacity-75">
                  NPR {notification.expense.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/expenses?tab=recurring">
              View All Recurring Expenses
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton
export function RecurringExpenseAlertsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  )
}