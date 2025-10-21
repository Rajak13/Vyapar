'use client'

import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/customers/customer-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewCustomerPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/customers')
  }

  const handleCancel = () => {
    router.push('/customers')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Customer</h1>
          <p className="text-muted-foreground">Create a new customer profile</p>
        </div>
      </div>

      <CustomerForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}