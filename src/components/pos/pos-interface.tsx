'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  Edit3,
  Package
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { useProducts } from '@/hooks/use-products'
import { useCustomers } from '@/hooks/use-customers'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatNPR } from '@/lib/nepal-utils'
import { PriceInputDialog } from './price-input-dialog'
import type { Product, ProductVariant } from '@/types/database'

export interface CartItem {
  id: string
  productId?: string
  name: string
  price: number
  quantity: number
  stock: number
  variant?: ProductVariant & {
    id: string
    name: string
    price?: number
  }
  total?: number
}

interface POSInterfaceProps {
  onClose?: () => void
}

export function POSInterface({ onClose }: POSInterfaceProps) {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id
  
  const { data: products = [], refetch: refetchProducts } = useProducts(businessId || '')
  const { data: customers = [] } = useCustomers(businessId || '')
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string
    name: string
    phone?: string
    email?: string
  } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'esewa' | 'khalti' | 'bank'>('cash')
  const [discount, setDiscount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [priceDialogOpen, setPriceDialogOpen] = useState(false)
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<Product & { suppliers?: { id: string; name: string } } | null>(null)

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Add product to cart
  const addToCart = (product: Product & { suppliers?: { id: string; name: string } }) => {
    if (product.current_stock <= 0) {
      toast.error('Product is out of stock')
      return
    }

    // Check current cart quantity for this product
    const existingItem = cart.find(item => item.id === product.id)
    const currentCartQuantity = existingItem ? existingItem.quantity : 0
    
    if (currentCartQuantity >= product.current_stock) {
      toast.error(`Cannot add more items. Available stock: ${product.current_stock}`)
      return
    }

    // Always open price dialog for dynamic pricing (bargaining)
    setSelectedProductForPricing(product)
    setPriceDialogOpen(true)
  }

  // Function to add item to cart with specified price
  const addItemToCart = (product: {
    id: string
    name: string
    current_stock: number
  }, price: number) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    setCart(prev => {
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, {
          id: product.id,
          name: product.name,
          price: price,
          quantity: 1,
          stock: product.current_stock
        }]
      }
    })
  }

  // Handle price confirmation from dialog
  const handlePriceConfirm = (price: number) => {
    if (selectedProductForPricing) {
      addItemToCart(selectedProductForPricing, price)
      setSelectedProductForPricing(null)
    }
  }

  // Update cart item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    // Find the product to check current stock
    const product = products.find(p => p.id === id)
    if (!product) {
      toast.error('Product not found')
      return
    }

    if (quantity > product.current_stock) {
      toast.error(`Cannot exceed available stock. Available: ${product.current_stock}`)
      return
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity, stock: product.current_stock }
        }
        return item
      })
    )
  }

  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  // Update item price in cart
  const updatePrice = (id: string, price: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, price }
        }
        return item
      })
    )
    toast.success('Price updated successfully')
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = (subtotal * discount) / 100
  const total = subtotal - discountAmount

  // Process sale
  const processSale = async () => {
    if (isProcessing) {
      console.log('Sale already in progress, ignoring duplicate request')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!businessId) {
      toast.error('No business found')
      return
    }

    // Validate stock availability before processing
    for (const item of cart) {
      const product = products.find(p => p.id === item.id)
      console.log(`Validating item: ${item.name}, product found:`, product)
      if (!product) {
        toast.error(`Product not found: ${item.name}`)
        return
      }
      console.log(`Stock check: ${item.name} - Available: ${product.current_stock}, Required: ${item.quantity}`)
      if (product.current_stock < item.quantity) {
        toast.error(`Insufficient stock for ${item.name}. Available: ${product.current_stock}, Required: ${item.quantity}`)
        return
      }
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()

      // Refresh products data to get latest stock levels
      const { data: latestProducts } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId)

      console.log('Latest products from DB:', latestProducts?.filter(p => cart.some(c => c.id === p.id)))
      console.log('Business ID being used:', businessId)
      console.log('User ID:', user?.id)

      // Refetch products to ensure we have latest data
      await refetchProducts()

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`

      // Prepare sale data
      const saleData = {
        p_business_id: businessId,
        p_invoice_number: invoiceNumber,
        p_sale_date: new Date().toISOString().split('T')[0],
        p_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })),
        p_subtotal: subtotal,
        p_total_amount: total,
        p_customer_id: selectedCustomer?.id || null,
        p_discount: discountAmount,
        p_tax: 0,
        p_payment_method: paymentMethod,
        p_notes: `Payment via ${paymentMethod}`
      }

      // Debug: Log the data being sent
      console.log('Processing sale with data:', saleData)
      console.log('Cart items:', cart)
      console.log('Products data:', products.filter(p => cart.some(c => c.id === p.id)))

      // Debug: Check actual current stock in database
      for (const item of cart) {
        const { data: stockCheck } = await supabase.rpc('debug_check_stock', {
          p_business_id: businessId,
          p_product_id: item.id
        })
        console.log(`Stock check for ${item.name}:`, stockCheck)
        
        // Also get real-time stock directly from database
        const { data: realTimeStock } = await supabase
          .from('products')
          .select('current_stock, name')
          .eq('id', item.id)
          .eq('business_id', businessId)
          .single()
        
        console.log(`Real-time stock for ${item.name}:`, realTimeStock)
        
        // Check detailed stock status
        const { data: stockStatus } = await supabase.rpc('check_and_fix_stock', {
          p_business_id: businessId,
          p_product_id: item.id
        })
        console.log(`Detailed stock status for ${item.name}:`, stockStatus)
      }

      // Debug the calculation
      console.log('Calculation check:')
      console.log('subtotal:', subtotal)
      console.log('discountAmount:', discountAmount)
      console.log('total:', total)
      console.log('Constraint check: total === subtotal - discountAmount + 0?', total === subtotal - discountAmount + 0)

      // Use the robust database function to handle the entire transaction
      console.log('Using robust database function...')
      
      const { data: result, error: processError } = await supabase.rpc('process_sale_robust', {
        p_business_id: businessId,
        p_invoice_number: invoiceNumber,
        p_sale_date: new Date().toISOString().split('T')[0],
        p_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        })),
        p_subtotal: subtotal,
        p_discount: discountAmount,
        p_total_amount: total,
        p_payment_method: paymentMethod,
        p_customer_id: selectedCustomer?.id || null
      })
      
      if (processError) {
        console.error('Sale processing error:', processError)
        
        // Handle specific error types
        if (processError.code === '23514' && processError.message.includes('valid_stock')) {
          // Stock constraint violation - provide helpful message
          toast.error('Stock constraint error. Please refresh the page and try again with current stock levels.')
          await refetchProducts() // Refresh to get current stock
          return
        } else if (processError.message.includes('Insufficient stock')) {
          // Insufficient stock error from our function
          toast.error(processError.message)
          await refetchProducts()
          return
        } else {
          // Other errors
          throw new Error(`Failed to process sale: ${processError.message}`)
        }
      }
      
      console.log('Sale processing result:', result)
      
      if (result?.success) {
        console.log('Sale completed successfully! Sale ID:', result.sale_id)
        toast.success(`Sale completed successfully! Invoice: ${result.invoice_number}`)
        
        // Refresh products to get updated stock levels
        await refetchProducts()
        
        // Reset form
        setCart([])
        setSelectedCustomer(null)
        setDiscount(0)
        setSearchQuery('')
      } else {
        throw new Error('Sale processing returned unsuccessful result')
      }

    } catch (error: unknown) {
      console.error('Error processing sale:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process sale')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      product.current_stock <= 0 ? 'opacity-50' : ''
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Package className={`h-8 w-8 text-gray-400 ${product.images && product.images.length > 0 ? 'hidden' : ''}`} />
                        </div>
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-primary">
                            {product.selling_price ? formatNPR(product.selling_price) : 'Price TBD'}
                          </span>
                          <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'}>
                            Stock: {product.current_stock}
                          </Badge>
                        </div>
                        {product.category && (
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No products found matching your search' : 'No products available'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart and Checkout */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setSelectedCustomer(customer || null)
                }}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatNPR(item.price)} each
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const newPrice = prompt(`Enter new price for ${item.name}:`, item.price.toString())
                            if (newPrice && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
                              updatePrice(item.id, Number(newPrice))
                            }
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Discount */}
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cash')}
                    className="flex items-center gap-2"
                  >
                    <Banknote className="h-4 w-4" />
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'esewa' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('esewa')}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    eSewa
                  </Button>
                  <Button
                    variant={paymentMethod === 'khalti' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('khalti')}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Khalti
                  </Button>
                  <Button
                    variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('bank')}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Bank
                  </Button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatNPR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%):</span>
                    <span>-{formatNPR(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatNPR(total)}</span>
                </div>
              </div>

              {/* Process Sale Button */}
              <Button
                onClick={processSale}
                disabled={cart.length === 0 || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Complete Sale
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Price Input Dialog */}
      <PriceInputDialog
        isOpen={priceDialogOpen}
        onClose={() => {
          setPriceDialogOpen(false)
          setSelectedProductForPricing(null)
        }}
        onConfirm={handlePriceConfirm}
        productName={selectedProductForPricing?.name || ''}
        suggestedPrice={selectedProductForPricing?.purchase_price ? selectedProductForPricing.purchase_price * 1.3 : undefined}
      />
    </>
  )
}