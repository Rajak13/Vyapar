'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  ArrowLeft, 
  Banknote, 
  Smartphone, 
  Building2,
  Percent,
  Minus,
  Receipt,
  Download,
  Printer,
  FileText,
  Share2
} from 'lucide-react'
import { CartItem } from './pos-interface'
import { Customer, Sale, Payment } from '@/types/database'
import { PaymentMethod } from '@/types/database'
import { useCreateSale } from '@/hooks/use-sales'
import { useCreatePayment } from '@/hooks/use-payments'
import { useGenerateInvoiceNumber } from '@/hooks/use-sales'
import { useBusinesses } from '@/hooks/use-businesses'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { useReactToPrint } from 'react-to-print'
import { generateAndDownloadInvoice, generateInvoiceForSharing } from '@/lib/invoice-generator'
import { CurrencyDisplay } from '@/components/ui/number-display'
import { CurrencyInput } from '@/components/ui/currency-input'

interface PaymentProcessingProps {
  cartItems: CartItem[]
  customer: Customer | null
  total: number
  onPaymentComplete: () => void
  onBack: () => void
}

interface PaymentEntry {
  method: PaymentMethod
  amount: number
  reference?: string
}

interface DiscountConfig {
  type: 'percentage' | 'fixed'
  value: number
}

const PAYMENT_METHODS: Array<{
  id: PaymentMethod
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-green-100 text-green-700' },
  { id: 'esewa', name: 'eSewa', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  { id: 'khalti', name: 'Khalti', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
  { id: 'ime_pay', name: 'IME Pay', icon: Smartphone, color: 'bg-red-100 text-red-700' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'card', name: 'Card', icon: CreditCard, color: 'bg-gray-100 text-gray-700' },
]

export function PaymentProcessing({
  cartItems,
  customer,
  total,
  onPaymentComplete,
  onBack
}: PaymentProcessingProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash')
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const [discount, setDiscount] = useState<DiscountConfig>({ type: 'fixed', value: 0 })
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  
  const invoiceRef = useRef<HTMLDivElement>(null)
  
  const createSale = useCreateSale()
  const createPayment = useCreatePayment()
  
  // Get current business
  const { user } = useAuth()
  const { data: businesses = [] } = useBusinesses(user?.id || '')
  const currentBusiness = businesses[0] // For now, use the first business
  const businessId = currentBusiness?.id || ''
  
  const { data: invoiceNumber } = useGenerateInvoiceNumber(businessId)

  // Calculate discount amount
  const discountAmount = discount.type === 'percentage' 
    ? (total * discount.value) / 100 
    : discount.value

  const subtotal = total
  const finalTotal = Math.max(0, subtotal - discountAmount)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remainingAmount = Math.max(0, finalTotal - totalPaid)
  const changeAmount = Math.max(0, totalPaid - finalTotal)

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceNumber}`,
  })

  const handleDownloadPDF = async () => {
    if (!completedSale || !currentBusiness) return

    try {
      await generateAndDownloadInvoice({
        business: currentBusiness,
        customer,
        sale: completedSale as Sale,
        payments: (completedSale as Sale & { payments?: Payment[] })?.payments || [],
        cartItems,
        discountAmount,
        finalTotal,
        changeAmount
      })
      toast.success('Invoice PDF downloaded successfully')
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      toast.error('Failed to generate PDF invoice')
    }
  }

  const handleShareInvoice = async () => {
    if (!completedSale || !currentBusiness) return

    try {
      const pdfBlob = await generateInvoiceForSharing({
        business: currentBusiness,
        customer,
        sale: completedSale as Sale,
        payments: (completedSale as Sale & { payments?: Payment[] })?.payments || [],
        cartItems,
        discountAmount,
        finalTotal,
        changeAmount
      })

      if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], `Invoice-${completedSale.invoice_number}.pdf`, { type: 'application/pdf' })] })) {
        const file = new File([pdfBlob], `Invoice-${completedSale.invoice_number}.pdf`, { type: 'application/pdf' })
        await navigator.share({
          title: `Invoice ${completedSale.invoice_number}`,
          text: `Invoice for ${finalTotal.toLocaleString()} NPR`,
          files: [file]
        })
      } else {
        // Fallback: create download link
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Invoice-${completedSale.invoice_number}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      
      toast.success('Invoice shared successfully')
    } catch (error) {
      console.error('Failed to share invoice:', error)
      toast.error('Failed to share invoice')
    }
  }

  const addPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    // Allow overpayment for cash (change will be calculated)
    if (selectedMethod !== 'cash' && amount > remainingAmount && remainingAmount > 0) {
      toast.error('Digital payment amount cannot exceed remaining balance. Use cash for overpayment.')
      return
    }

    // Validate reference for digital payments (optional for card payments)
    const requiresReference = selectedMethod !== 'cash' && selectedMethod !== 'card'
    if (requiresReference && !reference.trim()) {
      toast.error('Reference number is required for digital wallet payments')
      return
    }

    const newPayment: PaymentEntry = {
      method: selectedMethod,
      amount,
      reference: reference.trim() || undefined
    }

    setPayments([...payments, newPayment])
    setPaymentAmount('')
    setReference('')
    
    // Auto-select cash for change if overpaid
    if (amount > remainingAmount && remainingAmount > 0) {
      setSelectedMethod('cash')
    }
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const handleQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString())
  }

  const processSale = async () => {
    // Validation checks
    if (payments.length === 0) {
      toast.error('Please add at least one payment method')
      return
    }

    // Check if customer has sufficient credit limit for partial payments
    if (remainingAmount > 0 && customer) {
      const availableCredit = customer.credit_limit - customer.outstanding_balance
      if (remainingAmount > availableCredit) {
        toast.error(`Insufficient credit limit. Available credit: NPR ${availableCredit.toLocaleString()}`)
        return
      }
    }

    // For non-customer sales, require full payment
    if (remainingAmount > 0 && !customer) {
      toast.error('Partial payments require customer selection. Please select a customer or complete payment.')
      return
    }

    if (!businessId) {
      toast.error('Business information not found')
      return
    }

    if (cartItems.length === 0) {
      toast.error('No items in cart')
      return
    }

    // Validate digital payment references (excluding card payments which are optional)
    const digitalPayments = payments.filter(p => p.method !== 'cash' && p.method !== 'card')
    const missingReferences = digitalPayments.filter(p => !p.reference?.trim())
    
    if (missingReferences.length > 0) {
      toast.error('Reference numbers are required for digital wallet payments')
      return
    }

    setIsProcessing(true)

    try {
      // Determine payment status based on amount paid
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid'
      if (totalPaid >= finalTotal) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0) {
        paymentStatus = 'partial'
      }

      // Create sale record
      const saleData = {
        business_id: businessId,
        customer_id: customer?.id,
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        sale_date: new Date().toISOString().split('T')[0],
        items: cartItems.map(item => ({
          product_id: item.productId || item.id || '',
          product_name: item.name,
          variant: item.variant ? {
            ...item.variant,
            additional_price: 0,
            stock_adjustment: 0
          } : undefined,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total || (item.quantity * item.price)
        })),
        subtotal: subtotal,
        discount: discountAmount,
        tax: 0, // Tax calculation can be added later
        total_amount: finalTotal,
        payment_status: paymentStatus,
        notes: [
          discountAmount > 0 ? `Discount: ${discount.type === 'percentage' ? `${discount.value}%` : `NPR ${discount.value}`}` : null,
          remainingAmount > 0 ? `Outstanding: NPR ${remainingAmount.toLocaleString()}` : null
        ].filter(Boolean).join('; ') || undefined
      }

      const sale = await createSale.mutateAsync(saleData)

      // Create payment records
      const paymentPromises = payments.map(payment => 
        createPayment.mutateAsync({
          sale_id: sale.id,
          amount: payment.amount,
          payment_method: payment.method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: payment.reference,
        })
      )

      const createdPayments = await Promise.all(paymentPromises)

      setCompletedSale({
        ...sale,
        payments: []
      } as Sale & { payments: Payment[] })
      
      if (paymentStatus === 'paid') {
        toast.success('Sale completed successfully!')
      } else if (paymentStatus === 'partial') {
        toast.success(`Sale completed with partial payment. Outstanding: NPR ${remainingAmount.toLocaleString()}`)
      } else {
        toast.success('Credit sale recorded successfully!')
      }
      
    } catch (error) {
      console.error('Failed to process sale:', error)
      toast.error('Failed to process sale. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComplete = () => {
    setCompletedSale(null)
    onPaymentComplete()
  }

  // Show invoice after sale completion
  if (completedSale) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Receipt className="h-5 w-5" />
              Sale Completed Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-lg font-semibold">Invoice #{completedSale.invoice_number}</p>
              <p className="text-gray-600">Total: <CurrencyDisplay value={finalTotal} /></p>
              {changeAmount > 0 && (
                <p className="text-orange-600 font-medium">Change: <CurrencyDisplay value={changeAmount} /></p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleShareInvoice}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleComplete}>
                <FileText className="h-4 w-4 mr-2" />
                New Sale
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hidden invoice template for printing */}
        <div style={{ display: 'none' }}>
          <div ref={invoiceRef} className="max-w-md mx-auto bg-white p-6 text-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold mb-2">Vyapar Vision</h1>
              <p className="text-gray-600 text-xs">Modern Business Management</p>
              <div className="border-b border-gray-300 my-3"></div>
            </div>

            {/* Business Info */}
            <div className="mb-4">
              <h2 className="font-semibold">{currentBusiness?.business_name || 'Fashion Store'}</h2>
              <p className="text-xs text-gray-600">Kathmandu, Nepal</p>
              <p className="text-xs text-gray-600">Phone: +977-1-4444444</p>
            </div>

            {/* Invoice Details */}
            <div className="flex justify-between mb-4 text-xs">
              <div>
                <p><strong>Invoice #:</strong> {completedSale?.invoice_number}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}</p>
                <p><strong>Time:</strong> {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {customer && (
                <div className="text-right">
                  <p><strong>Customer:</strong></p>
                  <p>{customer.name}</p>
                  {customer.phone && <p>{customer.phone}</p>}
                </div>
              )}
            </div>

            <div className="border-b border-gray-300 my-3"></div>

            {/* Items */}
            <div className="mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-1">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.variant && (
                            <p className="text-gray-500 text-xs">
                              {[item.variant.size, item.variant.color, item.variant.material]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">{item.price.toLocaleString()}</td>
                      <td className="text-right py-1">{(item.total || (item.quantity * item.price)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <CurrencyDisplay value={subtotal} />
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-<CurrencyDisplay value={discountAmount} showSymbol={false} /></span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total:</span>
                <CurrencyDisplay value={finalTotal} />
              </div>
            </div>

            <div className="border-b border-gray-300 my-3"></div>

            {/* Payment Details */}
            <div className="mb-4">
              <h3 className="font-semibold text-xs mb-2">Payment Details:</h3>
              <div className="space-y-1 text-xs">
                {payments.map((payment, index) => {
                  const method = PAYMENT_METHODS.find(m => m.id === payment.method)
                  return (
                    <div key={index} className="flex justify-between">
                      <span>
                        {method?.name}
                        {payment.reference && ` (${payment.reference})`}:
                      </span>
                      <span>NPR {payment.amount.toLocaleString()}</span>
                    </div>
                  )
                })}
                
                {changeAmount > 0 && (
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Change:</span>
                    <span>NPR {changeAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-6">
              <p>Thank you for your business!</p>
              <p>Visit us again soon</p>
              <div className="border-b border-gray-300 my-2"></div>
              <p>Powered by Vyapar Vision</p>
            </div>

            {/* Barcode placeholder */}
            <div className="text-center mt-4">
              <div className="inline-block bg-black text-white px-2 py-1 text-xs font-mono">
                {completedSale?.invoice_number}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>NPR {subtotal.toLocaleString()}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">
                  Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'}):
                </span>
                <span className="text-green-600 font-medium">
                  -NPR {discountAmount.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-blue-600">NPR {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {totalPaid > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Amount Paid:</span>
                <span className="text-blue-600 font-medium">NPR {totalPaid.toLocaleString()}</span>
              </div>
              
              {remainingAmount > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Balance Due:</span>
                  <span className="text-orange-600 font-medium">NPR {remainingAmount.toLocaleString()}</span>
                </div>
              ) : changeAmount > 0 ? (
                <div className="flex justify-between text-sm p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-green-700 font-medium">Change to Return:</span>
                  <span className="text-green-700 font-bold">NPR {changeAmount.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-blue-700 font-medium">Payment Status:</span>
                  <span className="text-blue-700 font-bold">Fully Paid</span>
                </div>
              )}
            </div>
          )}

          {/* Customer Credit Information */}
          {customer && (
            <div className="border-t pt-3 space-y-2">
              <div className="text-sm font-medium text-gray-700">Customer Credit Info</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current Outstanding:</span>
                  <span className={customer.outstanding_balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    NPR {customer.outstanding_balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Limit:</span>
                  <span>NPR {customer.credit_limit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Credit:</span>
                  <span className={
                    (customer.credit_limit - customer.outstanding_balance - remainingAmount) >= 0 
                      ? 'text-green-600 font-medium' 
                      : 'text-red-600 font-medium'
                  }>
                    NPR {(customer.credit_limit - customer.outstanding_balance - remainingAmount).toLocaleString()}
                  </span>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-between">
                    <span>After This Sale:</span>
                    <span className="text-orange-600 font-medium">
                      NPR {(customer.outstanding_balance + remainingAmount).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Discount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={discount.type === 'fixed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDiscount({ ...discount, type: 'fixed' })}
            >
              Fixed Amount
            </Button>
            <Button
              variant={discount.type === 'percentage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDiscount({ ...discount, type: 'percentage' })}
            >
              Percentage
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={discount.type === 'percentage' ? 'Enter %' : 'Enter amount'}
              value={discount.value || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0
                // Validate percentage discount
                if (discount.type === 'percentage' && value > 100) {
                  toast.error('Percentage discount cannot exceed 100%')
                  return
                }
                // Validate fixed discount
                if (discount.type === 'fixed' && value > subtotal) {
                  toast.error('Discount amount cannot exceed subtotal')
                  return
                }
                setDiscount({ ...discount, value })
              }}
              className="flex-1"
              min="0"
              max={discount.type === 'percentage' ? 100 : subtotal}
              step={discount.type === 'percentage' ? 1 : 10}
            />
            <span className="text-sm text-gray-500 min-w-[30px]">
              {discount.type === 'percentage' ? '%' : 'NPR'}
            </span>
          </div>
          
          {/* Quick discount buttons */}
          <div className="flex gap-2 flex-wrap">
            {discount.type === 'percentage' ? (
              <>
                {[5, 10, 15, 20, 25].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount({ type: 'percentage', value: percent })}
                  >
                    {percent}%
                  </Button>
                ))}
              </>
            ) : (
              <>
                {[50, 100, 200, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDiscount({ type: 'fixed', value: amount })}
                    disabled={amount > subtotal}
                  >
                    {amount}
                  </Button>
                ))}
              </>
            )}
            {discount.value > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDiscount({ ...discount, value: 0 })}
                className="text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          {discountAmount > 0 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                Discount Applied: NPR {discountAmount.toLocaleString()}
                {discount.type === 'percentage' && ` (${discount.value}%)`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMethod(method.id)}
                className="flex items-center gap-2"
              >
                <method.icon className="h-4 w-4" />
                {method.name}
              </Button>
            ))}
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addPayment} disabled={!paymentAmount}>
                Add
              </Button>
            </div>
            
            {/* Quick Amount Buttons */}
            {remainingAmount > 0 && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(remainingAmount)}
                >
                  Exact ({remainingAmount.toLocaleString()})
                </Button>
                {[100, 500, 1000, 2000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Reference Number for Digital Payments */}
          {selectedMethod !== 'cash' && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Reference Number 
                {selectedMethod !== 'card' && <span className="text-red-500">*</span>}
                <span className="text-xs text-gray-500">
                  ({selectedMethod === 'card' ? 'Optional' : 'Required'} for {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name})
                </span>
              </Label>
              <Input
                placeholder={
                  selectedMethod === 'card' 
                    ? 'Card authorization number (optional)'
                    : `Enter ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} transaction ID`
                }
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={!reference.trim() && !['cash', 'card'].includes(selectedMethod) ? 'border-red-300' : ''}
              />
              {!reference.trim() && !['cash', 'card'].includes(selectedMethod) && (
                <p className="text-xs text-red-600">
                  Transaction reference is required for {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name} payments
                </p>
              )}
            </div>
          )}

          {/* Payment List */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label>Payments Added</Label>
              <div className="space-y-2">
                {payments.map((payment, index) => {
                  const method = PAYMENT_METHODS.find(m => m.id === payment.method)
                  return (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {method && <method.icon className="h-4 w-4" />}
                        <span className="font-medium">{method?.name}</span>
                        {payment.reference && (
                          <Badge variant="secondary" className="text-xs">
                            {payment.reference}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>NPR {payment.amount.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePayment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={processSale} 
          className="flex-1"
          disabled={payments.length === 0 || isProcessing}
        >
          {isProcessing ? 'Processing...' : 
           remainingAmount > 0 ? 
             (customer ? 'Complete Sale (Partial Payment)' : 'Complete Sale') : 
             'Complete Sale'}
        </Button>
      </div>
    </div>
  )
}