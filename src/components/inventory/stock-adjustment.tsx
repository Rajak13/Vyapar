'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateStockAdjustment } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react'
import { formatNPR } from '@/lib/nepal-utils'
import type { Product } from '@/types/database'

const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Please select a product'),
  adjustmentType: z.enum(['increase', 'decrease']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Please provide a reason for the adjustment'),
})

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>

interface StockAdjustmentProps {
  businessId: string
  selectedProduct?: Product
  trigger?: React.ReactNode
}

const adjustmentReasons = [
  'Physical count correction',
  'Damaged goods',
  'Expired products',
  'Theft/Loss',
  'Found inventory',
  'Supplier return',
  'Quality control rejection',
  'Transfer between locations',
  'Other',
]

export function StockAdjustment({ businessId, selectedProduct, trigger }: StockAdjustmentProps) {
  const [open, setOpen] = useState(false)
  const [customReason, setCustomReason] = useState('')
  
  const { data: products } = useProducts(businessId)
  const createAdjustment = useCreateStockAdjustment()

  const form = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: selectedProduct?.id || '',
      adjustmentType: 'increase',
      quantity: 1,
      reason: '',
    },
  })

  const selectedProductData = products?.find(p => p.id === form.watch('productId')) || selectedProduct
  const adjustmentType = form.watch('adjustmentType')
  const quantity = form.watch('quantity')
  const reasonValue = form.watch('reason')

  const onSubmit = async (data: StockAdjustmentForm) => {
    try {
      const adjustmentQuantity = data.adjustmentType === 'increase' ? data.quantity : -data.quantity
      const finalReason = data.reason === 'Other' ? customReason : data.reason

      await createAdjustment.mutateAsync({
        productId: data.productId,
        adjustmentQuantity,
        reason: finalReason,
      })

      form.reset()
      setCustomReason('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to create stock adjustment:', error)
    }
  }

  const newStockLevel = selectedProductData 
    ? selectedProductData.current_stock + (adjustmentType === 'increase' ? quantity : -quantity)
    : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Adjust Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Make manual adjustments to product stock levels. This will create an inventory transaction record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!selectedProduct}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <Badge variant="secondary" className="ml-2">
                              {product.current_stock} in stock
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Current Stock Info */}
            {selectedProductData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Current Stock Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Stock:</span>
                    <span className="font-medium">{selectedProductData.current_stock} units</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stock Value:</span>
                    <span className="font-medium">
                      {formatNPR(selectedProductData.current_stock * selectedProductData.purchase_price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Min Stock Level:</span>
                    <span className="font-medium">{selectedProductData.min_stock_level} units</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Adjustment Type */}
            <FormField
              control={form.control}
              name="adjustmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="increase">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2 text-green-600" />
                          Increase Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="decrease">
                        <div className="flex items-center">
                          <Minus className="h-4 w-4 mr-2 text-red-600" />
                          Decrease Stock
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Stock Level Preview */}
            {selectedProductData && quantity > 0 && (
              <Card className={newStockLevel < 0 ? 'border-red-200 bg-red-50' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Stock Level:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${newStockLevel < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {newStockLevel} units
                      </span>
                      {newStockLevel < 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  {newStockLevel < 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Warning: This adjustment will result in negative stock
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Adjustment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {adjustmentReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Reason Input */}
            {reasonValue === 'Other' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Reason</label>
                <Textarea
                  placeholder="Please specify the reason for this adjustment..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAdjustment.isPending || (reasonValue === 'Other' && !customReason.trim())}
              >
                {createAdjustment.isPending ? 'Processing...' : 'Apply Adjustment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}