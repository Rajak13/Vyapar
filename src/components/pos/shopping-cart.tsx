'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Package,
  Edit3
} from 'lucide-react'
import { CartItem } from './pos-interface'
import { CurrencyDisplay } from '@/components/ui/number-display'


interface ShoppingCartProps {
  items: CartItem[]
  onUpdateItem: (itemId: string, quantity: number) => void
  onUpdatePrice: (itemId: string, price: number) => void
  onRemoveItem: (itemId: string) => void
  onClear: () => void
  onProceed: () => void
  total: number
}

export function ShoppingCart({
  items,
  onUpdateItem,
  onUpdatePrice,
  onRemoveItem,
  onClear,
  onProceed,
  total
}: ShoppingCartProps) {
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState('')
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handlePriceEdit = (itemId: string, currentPrice: number) => {
    setEditingPrice(itemId)
    setTempPrice(currentPrice.toString())
  }

  const handlePriceSave = (itemId: string) => {
    const newPrice = Number(tempPrice)
    if (newPrice > 0) {
      onUpdatePrice(itemId, newPrice)
    }
    setEditingPrice(null)
    setTempPrice('')
  }

  const handlePriceCancel = () => {
    setEditingPrice(null)
    setTempPrice('')
  }

  return (
    <Card className="h-fit sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Shopping Cart
          </div>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Your cart is empty</p>
            <p className="text-gray-400 text-xs mt-1">Add products to get started</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                      {item.variant && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.variant.size && (
                            <Badge variant="secondary" className="text-xs">
                              {item.variant.size}
                            </Badge>
                          )}
                          {item.variant.color && (
                            <Badge variant="secondary" className="text-xs">
                              {item.variant.color}
                            </Badge>
                          )}
                          {item.variant.material && (
                            <Badge variant="secondary" className="text-xs">
                              {item.variant.material}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {editingPrice === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(e.target.value)}
                              className="w-20 h-6 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handlePriceSave(item.id)
                                if (e.key === 'Escape') handlePriceCancel()
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePriceSave(item.id)}
                              className="h-6 w-6 p-0 text-green-600"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handlePriceCancel}
                              className="h-6 w-6 p-0 text-red-600"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">
                              <CurrencyDisplay value={item.price} variant="small" /> each
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePriceEdit(item.id, item.price)}
                              className="h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 1
                          onUpdateItem(item.id, Math.max(1, qty))
                        }}
                        className="w-12 h-7 text-center text-xs"
                        min="1"
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="font-semibold text-sm">
                      <CurrencyDisplay value={item.price * item.quantity} variant="default" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Items ({itemCount})</span>
                <CurrencyDisplay value={total} variant="small" />
              </div>
              
              <div className="flex items-center justify-between font-semibold text-lg">
                <span>Total</span>
                <CurrencyDisplay value={total} variant="large" className="text-primary" />
              </div>

              <Button 
                onClick={onProceed} 
                className="w-full"
                size="lg"
              >
                Proceed to Customer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}