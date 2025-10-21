'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { formatNPR } from '@/lib/nepal-utils'
import { toast } from 'sonner'

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  order_date: z.string().min(1, 'Order date is required'),
  expected_delivery: z.string().optional(),
  notes: z.string().optional(),
})

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

interface PurchaseOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface PurchaseOrderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PurchaseOrderForm({ onSuccess, onCancel }: PurchaseOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Array<{
    id: string
    name: string
  }>>([])
  const [products, setProducts] = useState<Array<{
    id: string
    name: string
    price: number
  }>>([])
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      order_date: new Date().toISOString().split('T')[0],
    }
  })

  useEffect(() => {
    if (businessId) {
      fetchSuppliers()
      fetchProducts()
    }
  }, [businessId])

  const fetchSuppliers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setSuppliers(data || [])
    } catch (error: unknown) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('id, name, purchase_price')
        .eq('business_id', businessId)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setProducts((data || []).map(p => ({ id: p.id, name: p.name, price: p.purchase_price })))
    } catch (error: unknown) {
      console.error('Error fetching products:', error)
    }
  }

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        updatedItems[index].product_name = product.name
        updatedItems[index].unit_price = product.price || 0
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setItems(updatedItems)
  }

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const tax = subtotal * 0.13 // 13% VAT
  const total = subtotal + tax

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const orderNumber = `PO-${Date.now()}`
      
      const { error } = await supabase
        .from('purchase_orders')
        .insert({
          business_id: businessId,
          supplier_id: data.supplier_id,
          order_number: orderNumber,
          order_date: data.order_date,
          expected_delivery: data.expected_delivery || null,
          items: items,
          subtotal: subtotal,
          tax: tax,
          total_amount: total,
          status: 'pending',
          notes: data.notes,
        })

      if (error) throw error
      
      toast.success('Purchase order created successfully!')
      onSuccess?.()
    } catch (error: unknown) {
      console.error('Error creating purchase order:', error)
      toast.error('Failed to create purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase Order</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <Select onValueChange={(value) => setValue('supplier_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.supplier_id && (
                  <p className="text-sm text-red-500">{errors.supplier_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  id="order_date"
                  type="date"
                  {...register('order_date')}
                />
                {errors.order_date && (
                  <p className="text-sm text-red-500">{errors.order_date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery">Expected Delivery Date</Label>
              <Input
                id="expected_delivery"
                type="date"
                {...register('expected_delivery')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes for this purchase order"
                rows={3}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No items added yet. Click &quot;Add Item&quot; to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      {formatNPR(item.total_price)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 && (
            <div className="mt-4 space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (13%):</span>
                <span>{formatNPR(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{formatNPR(total)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isLoading || items.length === 0}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Create Purchase Order
        </Button>
      </div>
    </div>
  )
}