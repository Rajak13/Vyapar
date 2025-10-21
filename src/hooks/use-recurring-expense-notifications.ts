import { useQuery } from '@tanstack/react-query'
import { isToday, isTomorrow, isBefore, addDays } from 'date-fns'
import { useExpenses } from './use-expenses'
import { queryKeys } from '@/lib/query-client'
import type { Expense } from '@/types/database'

export interface RecurringExpenseNotification {
  id: string
  expense: Expense
  type: 'overdue' | 'due_today' | 'due_tomorrow' | 'due_soon'
  daysUntilDue: number
  message: string
}

export function useRecurringExpenseNotifications(businessId: string) {
  const { data: expenses } = useExpenses(businessId)

  return useQuery({
    queryKey: queryKeys.recurringExpenseNotifications(businessId),
    queryFn: () => {
      if (!expenses) return []

      const recurringExpenses = expenses.filter(expense => 
        expense.recurring && expense.next_occurrence
      )

      const notifications: RecurringExpenseNotification[] = []
      const today = new Date()

      recurringExpenses.forEach(expense => {
        if (!expense.next_occurrence) return

        const nextDate = new Date(expense.next_occurrence)
        const daysUntilDue = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        let type: RecurringExpenseNotification['type']
        let message: string

        if (isBefore(nextDate, today) && !isToday(nextDate)) {
          type = 'overdue'
          message = `${expense.description || expense.category} is overdue`
        } else if (isToday(nextDate)) {
          type = 'due_today'
          message = `${expense.description || expense.category} is due today`
        } else if (isTomorrow(nextDate)) {
          type = 'due_tomorrow'
          message = `${expense.description || expense.category} is due tomorrow`
        } else if (daysUntilDue <= 7) {
          type = 'due_soon'
          message = `${expense.description || expense.category} is due in ${daysUntilDue} days`
        } else {
          return // Skip expenses that are not due soon
        }

        notifications.push({
          id: expense.id,
          expense,
          type,
          daysUntilDue,
          message,
        })
      })

      // Sort by urgency: overdue, due today, due tomorrow, due soon
      return notifications.sort((a, b) => {
        const urgencyOrder = { overdue: 0, due_today: 1, due_tomorrow: 2, due_soon: 3 }
        return urgencyOrder[a.type] - urgencyOrder[b.type]
      })
    },
    enabled: !!expenses,
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })
}

// Hook to get summary counts
export function useRecurringExpenseSummary(businessId: string) {
  const { data: notifications = [] } = useRecurringExpenseNotifications(businessId)

  return {
    overdue: notifications.filter(n => n.type === 'overdue').length,
    dueToday: notifications.filter(n => n.type === 'due_today').length,
    dueTomorrow: notifications.filter(n => n.type === 'due_tomorrow').length,
    dueSoon: notifications.filter(n => n.type === 'due_soon').length,
    total: notifications.length,
    notifications,
  }
}