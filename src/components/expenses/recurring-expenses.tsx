'use client'

import { useState } from 'react'
import { format, addDays, isBefore, isToday, isTomorrow } from 'date-fns'
import { 
  Repeat, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks/use-expenses'
import type { Expense } from '@/types/database'

interface RecurringExpensesProps {
  businessId: string
  onEditExpense?: (expense: Expense) => void
}

export function RecurringExpenses({ businessId, onEditExpense }: RecurringExpensesProps) {
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  const [processingExpenseId, setProcessingExpenseId] = useState<string | null>(null)

  const { data: expenses, isLoading } = useExpenses(businessId)
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  // Filter only recurring expenses
  const recurringExpenses = expenses?.filter(expense => expense.recurring) || []

  // Categorize recurring expenses by status
  const upcomingExpenses = recurringExpenses.filter(expense => {
    if (!expense.next_occurrence) return false
    const nextDate = new Date(expense.next_occurrence)
    return isBefore(new Date(), nextDate) && !isToday(nextDate)
  })

  const dueToday = recurringExpenses.filter(expense => {
    if (!expense.next_occurrence) return false
    return isToday(new Date(expense.next_occurrence))
  })

  const dueTomorrow = recurringExpenses.filter(expense => {
    if (!expense.next_occurrence) return false
    return isTomorrow(new Date(expense.next_occurrence))
  })

  const overdue = recurringExpenses.filter(expense => {
    if (!expense.next_occurrence) return false
    const nextDate = new Date(expense.next_occurrence)
    return isBefore(nextDate, new Date()) && !isToday(nextDate)
  })

  const getFrequencyText = (frequency: number) => {
    if (frequency === 7) return 'Weekly'
    if (frequency === 14) return 'Bi-weekly'
    if (frequency === 30) return 'Monthly'
    if (frequency === 90) return 'Quarterly'
    if (frequency === 365) return 'Yearly'
    return `Every ${frequency} days`
  }

  const getStatusBadge = (expense: Expense) => {
    if (!expense.next_occurrence) return null

    const nextDate = new Date(expense.next_occurrence)
    
    if (isBefore(nextDate, new Date()) && !isToday(nextDate)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    
    if (isToday(nextDate)) {
      return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>
    }
    
    if (isTomorrow(nextDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800">Due Tomorrow</Badge>
    }
    
    return <Badge variant="outline">Upcoming</Badge>
  }

  const handleProcessRecurring = async (expense: Expense) => {
    if (!expense.next_occurrence || !expense.recurring_frequency) return

    setProcessingExpenseId(expense.id)
    
    try {
      // Create a new expense record for this occurrence
      await createExpense.mutateAsync({
        business_id: businessId,
        category: expense.category,
        amount: expense.amount,
        description: `${expense.description} (Recurring)`,
        vendor: expense.vendor,
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        recurring: false, // The new record is not recurring
      })

      // Update the recurring expense with next occurrence date
      const nextOccurrence = addDays(new Date(expense.next_occurrence), expense.recurring_frequency)
      
      await updateExpense.mutateAsync({
        id: expense.id,
        updates: {
          next_occurrence: format(nextOccurrence, 'yyyy-MM-dd'),
        },
      })
    } catch (error) {
      console.error('Failed to process recurring expense:', error)
    } finally {
      setProcessingExpenseId(null)
    }
  }

  const handleDeleteRecurring = async () => {
    if (!deleteExpenseId) return

    try {
      await deleteExpense.mutateAsync(deleteExpenseId)
      setDeleteExpenseId(null)
    } catch (error) {
      console.error('Failed to delete recurring expense:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-600">{dueToday.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Due Tomorrow</p>
                <p className="text-2xl font-bold text-yellow-600">{dueTomorrow.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Repeat className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recurring</p>
                <p className="text-2xl font-bold text-blue-600">{recurringExpenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications for Due Expenses */}
      {(overdue.length > 0 || dueToday.length > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Bell className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Expense Reminders</h3>
                <div className="mt-2 space-y-1">
                  {overdue.length > 0 && (
                    <p className="text-sm text-orange-800">
                      You have {overdue.length} overdue recurring expense{overdue.length > 1 ? 's' : ''}.
                    </p>
                  )}
                  {dueToday.length > 0 && (
                    <p className="text-sm text-orange-800">
                      You have {dueToday.length} expense{dueToday.length > 1 ? 's' : ''} due today.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses ({recurringExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Repeat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recurring expenses</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set up recurring expenses to automate your regular business costs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{expense.description || 'Recurring Expense'}</p>
                          {expense.vendor && (
                            <p className="text-sm text-gray-500">{expense.vendor}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        NPR {expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {expense.recurring_frequency && getFrequencyText(expense.recurring_frequency)}
                      </TableCell>
                      <TableCell>
                        {expense.next_occurrence && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(expense.next_occurrence), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(expense)}
                          {(isToday(new Date(expense.next_occurrence || '')) || 
                            isBefore(new Date(expense.next_occurrence || ''), new Date())) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProcessRecurring(expense)}
                              disabled={processingExpenseId === expense.id}
                            >
                              {processingExpenseId === expense.id ? (
                                'Processing...'
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Record
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              onEditExpense?.(expense)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteExpenseId(expense.id)
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring expense? This will stop all future automatic recordings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecurring}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}