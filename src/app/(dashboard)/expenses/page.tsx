'use client'

import { useState } from 'react'
import { Plus, Receipt, Building, TrendingUp, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseList } from '@/components/expenses/expense-list'
import { VendorManagement } from '@/components/expenses/vendor-management'
import { RecurringExpenses } from '@/components/expenses/recurring-expenses'
import { FinancialReports } from '@/components/reports/financial-reports'
import { ExpenseAnalytics } from '@/components/expenses/expense-analytics'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import type { Expense } from '@/types/database'

export default function ExpensesPage() {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const currentBusiness = businesses?.[0] // Assuming single business for now

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [receiptDialogUrl, setReceiptDialogUrl] = useState<string | null>(null)

  const handleOpenForm = (expense?: Expense) => {
    setEditingExpense(expense || null)
    setIsFormDialogOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormDialogOpen(false)
    setEditingExpense(null)
  }

  const handleFormSuccess = () => {
    handleCloseForm()
  }

  const handleViewReceipt = (receiptUrl: string) => {
    setReceiptDialogUrl(receiptUrl)
  }

  if (!currentBusiness) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Please set up your business first to manage expenses.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-gray-600">Track and categorize your business expenses</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Record Expense
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center space-x-2">
            <Repeat className="h-4 w-4" />
            <span>Recurring</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Vendors</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseList
            businessId={currentBusiness.id}
            onEditExpense={handleOpenForm}
            onViewReceipt={handleViewReceipt}
          />
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          <RecurringExpenses
            businessId={currentBusiness.id}
            onEditExpense={handleOpenForm}
          />
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <VendorManagement businessId={currentBusiness.id} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="space-y-8">
            <FinancialReports businessId={currentBusiness.id} />
            <ExpenseAnalytics businessId={currentBusiness.id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Record New Expense'}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            businessId={currentBusiness.id}
            expense={editingExpense || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!receiptDialogUrl} onOpenChange={() => setReceiptDialogUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {receiptDialogUrl && (
            <div className="flex justify-center">
              <img
                src={receiptDialogUrl}
                alt="Receipt"
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}