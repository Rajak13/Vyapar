'use client'

import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/inventory/product-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewProductPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/inventory')
  }

  const handleCancel = () => {
    router.push('/inventory')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product for your inventory</p>
        </div>
      </div>

      <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}