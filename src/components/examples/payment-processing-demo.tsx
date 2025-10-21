'use client'

import { useState } from 'react'
import { PaymentProcessing } from '@/components/pos/payment-processing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CartItem } from '@/components/pos/pos-interface'
import { Customer } from '@/types/database'

// Mock data for demonstration
const mockCartItems: CartItem[] = [
  {
    id: '1',
    productId: 'prod-1',
    name: 'Designer Kurti',
    price: 1500,
    quantity: 2,
    stock: 10,
    variant: {
      id: 'variant-1',
      name: 'M Red Cotton',
      price: 0,
      size: 'M',
      color: 'Red',
      material: 'Cotton',
      additional_price: 0,
      stock_adjustment: 0
    },
    total: 3000
  },
  {
    id: '2',
    productId: 'prod-2',
    name: 'Casual Shirt',
    price: 800,
    quantity: 1,
    stock: 5,
    total: 800
  },
  {
    id: '3',
    productId: 'prod-3',
    name: 'Formal Pants',
    price: 1200,
    quantity: 1,
    stock: 8,
    total: 1200
  }
]

const mockCustomer: Customer = {
  id: '1',
  business_id: '1',
  name: 'Sita Sharma',
  phone: '+977-9841234567',
  email: 'sita@example.com',
  address: {
    street: '123 Durbar Marg',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati'
  },
  date_of_birth: '1985-05-15',
  total_purchases: 15000,
  outstanding_balance: 0,
  credit_limit: 20000,
  last_visit_date: '2024-01-10',
  loyalty_points: 150,
  notes: 'Regular customer',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export function PaymentProcessingDemo() {
  const [showDemo, setShowDemo] = useState(false)
  const [useCustomer, setUseCustomer] = useState(true)

  const total = mockCartItems.reduce((sum, item) => sum + (item.total || 0), 0)

  const handlePaymentComplete = () => {
    setShowDemo(false)
    alert('Payment completed! This is just a demo.')
  }

  const handleBack = () => {
    setShowDemo(false)
  }

  if (showDemo) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <PaymentProcessing
          cartItems={mockCartItems}
          customer={useCustomer ? mockCustomer : null}
          total={total}
          onPaymentComplete={handlePaymentComplete}
          onBack={handleBack}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Processing Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Demo Features:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Multiple payment methods (Cash, eSewa, Khalti, IME Pay, Bank Transfer, Card)</li>
              <li>✅ Discount application (percentage and fixed amount)</li>
              <li>✅ Professional PDF invoice generation</li>
              <li>✅ Print and share functionality</li>
              <li>✅ Payment validation and reference tracking</li>
              <li>✅ Change calculation for overpayments</li>
              <li>✅ Customer information integration</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Sample Cart Items:</h3>
            <div className="space-y-2">
              {mockCartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} 
                    {item.variant && (
                      <span className="text-gray-500">
                        {' '}({[item.variant.size, item.variant.color, item.variant.material].filter(Boolean).join(', ')})
                      </span>
                    )}
                    {' '}x {item.quantity}
                  </span>
                  <span>NPR {(item.total || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-semibold">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>NPR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustomer"
                checked={useCustomer}
                onChange={(e) => setUseCustomer(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="useCustomer" className="text-sm">
                Include customer information ({mockCustomer.name})
              </label>
            </div>

            <Button onClick={() => setShowDemo(true)} className="w-full">
              Start Payment Processing Demo
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Note:</strong> This is a demonstration component. In the actual POS system, 
            this payment processing interface is integrated with the full POS workflow including 
            product selection and customer management.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}