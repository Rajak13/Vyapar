'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Bell, 
  Send, 
  MessageSquare, 
  Mail,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  User
} from 'lucide-react'
import { Customer, Sale } from '@/types/database'
import { toast } from 'sonner'

interface PaymentRemindersProps {
  customers: Customer[]
  overdueSales: (Sale & { customers?: { name: string; phone?: string; email?: string } })[]
}

interface ReminderTemplate {
  id: string
  name: string
  subject: string
  message: string
  type: 'sms' | 'email' | 'whatsapp'
}

const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'gentle-sms',
    name: 'Gentle SMS Reminder',
    subject: 'Payment Reminder',
    message: 'Dear {customer_name}, this is a friendly reminder that you have an outstanding balance of NPR {amount} for invoice {invoice_number}. Please make payment at your earliest convenience. Thank you!',
    type: 'sms'
  },
  {
    id: 'formal-email',
    name: 'Formal Email',
    subject: 'Payment Due - Invoice {invoice_number}',
    message: 'Dear {customer_name},\n\nWe hope this message finds you well. This is to remind you that payment for Invoice {invoice_number} dated {sale_date} is now due.\n\nAmount Due: NPR {amount}\nDue Date: {due_date}\n\nPlease arrange payment at your earliest convenience. If you have any questions, please don\'t hesitate to contact us.\n\nThank you for your business.\n\nBest regards,\n{business_name}',
    type: 'email'
  },
  {
    id: 'urgent-sms',
    name: 'Urgent SMS',
    subject: 'Urgent Payment Required',
    message: 'URGENT: Dear {customer_name}, your payment of NPR {amount} for invoice {invoice_number} is overdue. Please contact us immediately to arrange payment. Thank you.',
    type: 'sms'
  }
]

export function PaymentReminders({ customers, overdueSales }: PaymentRemindersProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate>(DEFAULT_TEMPLATES[0])
  const [customMessage, setCustomMessage] = useState('')
  const [isCustomTemplate, setIsCustomTemplate] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Get customers with outstanding balances
  const customersWithOutstanding = customers.filter(customer => customer.outstanding_balance > 0)

  // Group overdue sales by customer
  const overdueByCustomer = overdueSales.reduce((acc, sale) => {
    if (!sale.customer_id) return acc
    
    if (!acc[sale.customer_id]) {
      acc[sale.customer_id] = {
        customer: sale.customers,
        sales: [],
        totalAmount: 0
      }
    }
    
    acc[sale.customer_id].sales.push(sale)
    acc[sale.customer_id].totalAmount += sale.total_amount
    
    return acc
  }, {} as Record<string, { customer?: { name: string; phone?: string; email?: string }, sales: Sale[], totalAmount: number }>)

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === customersWithOutstanding.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customersWithOutstanding.map(c => c.id))
    }
  }

  const formatMessage = (template: string, customer: Customer, sale?: Sale) => {
    const customerData = overdueByCustomer[customer.id]
    const totalOverdue = customerData?.totalAmount || customer.outstanding_balance
    const oldestSale = customerData?.sales.sort((a, b) => 
      new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
    )[0]

    return template
      .replace(/{customer_name}/g, customer.name)
      .replace(/{amount}/g, totalOverdue.toLocaleString())
      .replace(/{invoice_number}/g, oldestSale?.invoice_number || 'Multiple')
      .replace(/{sale_date}/g, oldestSale ? new Date(oldestSale.sale_date).toLocaleDateString('en-GB') : '')
      .replace(/{due_date}/g, oldestSale ? new Date(new Date(oldestSale.sale_date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB') : '')
      .replace(/{business_name}/g, 'Your Business Name') // This should come from business context
  }

  const handleSendReminders = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer')
      return
    }

    const message = isCustomTemplate ? customMessage : selectedTemplate.message
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSending(true)

    try {
      // Simulate sending reminders (in real implementation, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id))
      
      // Log the reminders that would be sent
      console.log('Sending reminders to:', selectedCustomerData.map(customer => ({
        customer: customer.name,
        method: selectedTemplate.type,
        message: formatMessage(message, customer)
      })))

      toast.success(`Payment reminders sent to ${selectedCustomers.length} customer(s)`)
      setSelectedCustomers([])
      
    } catch (error) {
      console.error('Failed to send reminders:', error)
      toast.error('Failed to send payment reminders')
    } finally {
      setIsSending(false)
    }
  }

  const getDaysOverdue = (saleDate: string) => {
    const sale = new Date(saleDate)
    const dueDate = new Date(sale.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days payment terms
    const today = new Date()
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{customersWithOutstanding.length}</div>
                <div className="text-sm text-gray-600">Customers with Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{overdueSales.length}</div>
                <div className="text-sm text-gray-600">Overdue Invoices</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{selectedCustomers.length}</div>
                <div className="text-sm text-gray-600">Selected for Reminder</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Customers
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedCustomers.length === customersWithOutstanding.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {customersWithOutstanding.map((customer) => {
              const customerOverdue = overdueByCustomer[customer.id]
              const oldestOverdue = customerOverdue?.sales.reduce((oldest, sale) => {
                const saleDate = new Date(sale.sale_date)
                const oldestDate = new Date(oldest.sale_date)
                return saleDate < oldestDate ? sale : oldest
              }, customerOverdue.sales[0])
              
              const daysOverdue = oldestOverdue ? getDaysOverdue(oldestOverdue.sale_date) : 0

              return (
                <div
                  key={customer.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomers.includes(customer.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCustomerToggle(customer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        Outstanding: NPR {customer.outstanding_balance.toLocaleString()}
                      </div>
                      {customer.phone && (
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      )}
                    </div>
                    <div className="text-right">
                      {daysOverdue > 0 && (
                        <Badge variant="destructive" className="mb-1">
                          {daysOverdue} days overdue
                        </Badge>
                      )}
                      <div className="text-sm text-gray-600">
                        {customerOverdue?.sales.length || 0} overdue invoice(s)
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Message Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reminder Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Message Template</Label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate.id === template.id && !isCustomTemplate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setIsCustomTemplate(false)
                  }}
                  className="flex items-center gap-2"
                >
                  {template.type === 'sms' && <Phone className="h-3 w-3" />}
                  {template.type === 'email' && <Mail className="h-3 w-3" />}
                  {template.type === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                  {template.name}
                </Button>
              ))}
              <Button
                variant={isCustomTemplate ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsCustomTemplate(true)}
              >
                Custom Message
              </Button>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label>Message Content</Label>
            {isCustomTemplate ? (
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message..."
                rows={6}
              />
            ) : (
              <div className="p-3 bg-gray-50 border rounded-lg">
                <div className="font-medium mb-2">{selectedTemplate.subject}</div>
                <div className="text-sm whitespace-pre-wrap">{selectedTemplate.message}</div>
              </div>
            )}
          </div>

          {/* Variable Help */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-2">Available Variables:</div>
            <div className="text-xs text-blue-700 space-y-1">
              <div><code>{'{customer_name}'}</code> - Customer&apos;s name</div>
              <div><code>{'{amount}'}</code> - Outstanding amount</div>
              <div><code>{'{invoice_number}'}</code> - Invoice number</div>
              <div><code>{'{sale_date}'}</code> - Sale date</div>
              <div><code>{'{due_date}'}</code> - Payment due date</div>
              <div><code>{'{business_name}'}</code> - Your business name</div>
            </div>
          </div>

          {/* Preview */}
          {selectedCustomers.length > 0 && (
            <div className="space-y-2">
              <Label>Message Preview (for {customers.find(c => c.id === selectedCustomers[0])?.name})</Label>
              <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                {formatMessage(
                  isCustomTemplate ? customMessage : selectedTemplate.message,
                  customers.find(c => c.id === selectedCustomers[0])!
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Button 
              onClick={handleSendReminders}
              disabled={selectedCustomers.length === 0 || isSending}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : `Send Reminders (${selectedCustomers.length})`}
            </Button>
            <Button variant="outline" onClick={() => setSelectedCustomers([])}>
              Clear Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}