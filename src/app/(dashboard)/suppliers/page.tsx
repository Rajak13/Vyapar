'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SupplierList } from '@/components/suppliers/supplier-list'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import { PurchaseOrderList } from '@/components/suppliers/purchase-order-list'
import { PurchaseOrderForm } from '@/components/suppliers/purchase-order-form'
import { SupplierAnalytics } from '@/components/suppliers/supplier-analytics'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Supplier } from '@/types/database'

export default function SuppliersPage() {
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddPO, setShowAddPO] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null)

  const handleAddSupplier = () => {
    setEditingSupplier(null)
    setShowAddSupplier(true)
  }

  const handleEditSupplier = (supplier: Partial<Supplier>) => {
    setEditingSupplier(supplier)
    setShowAddSupplier(true)
  }

  const handleCloseSupplierForm = () => {
    setShowAddSupplier(false)
    setEditingSupplier(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage suppliers and purchase orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddPO(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
          <Button onClick={handleAddSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <SupplierList onEditSupplier={handleEditSupplier} />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrderList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SupplierAnalytics />
        </TabsContent>
      </Tabs>

      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm
            supplier={editingSupplier || undefined}
            onSuccess={handleCloseSupplierForm}
            onCancel={handleCloseSupplierForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPO} onOpenChange={setShowAddPO}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm
            onSuccess={() => setShowAddPO(false)}
            onCancel={() => setShowAddPO(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}