'use client'

import { useRouter } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'

export default function NewExpensePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id || ''

  const handleSuccess = () => {
    router.push('/expenses')
  }

  const handleCancel = () => {
    router.push('/expenses')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Expense</h1>
          <p className="text-muted-foreground">Record a new business expense</p>
        </div>
      </div>

      <ExpenseForm businessId={businessId} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}