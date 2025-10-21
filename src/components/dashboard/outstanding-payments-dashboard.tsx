'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  Bell,
  FileText,
  Phone,
  Mail
} from 'lucide-react'
import { useOutstandingSales, useOverdueSales, useCustomersWithOutstanding, usePaymentStatistics } from '@/hooks/use-outstanding-payments'
import { PaymentReminders } from '@/components/customers/payment-reminders'
import { CreditManagement } from '@/components/customers/credit-management'
import { useBusinesses } from '@/hooks/use-businesses'
import { useAuth } from '@/contexts/auth-context'

export function OutstandingPaymentsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview')
  
  const { user } = useAuth()
  const { data: businesses = [] } = useBusinesses(user?.id || '')
  const currentBusiness = businesses[0] // For now, use the first business
  const businessId = currentBusiness?.id || ''

  const { data: outstandingSales = [], isLoading: loadingOutstanding } = useOutstandingSales(businessId)
  const { data: overdueSales = [], isLoading: loadingOverdue } = useOverdueSales(businessId)
  const { data: customersWithOutstanding = [], isLoading: loadingCustomers } = useCustomersWithOutstanding(businessId)
  const { data: paymentStats, isLoading: loadingStats } = usePaymentStatistics(businessId)

  if (!businessId) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Please set up your business first</p>
      </div>
    )
  }

  const totalOutstanding = outstandingSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalOverdue = overdueSales.reduce((sum, sale) => sum + sale.total_amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outstanding Payments</h1>
          <p className="text-gray-600">Manage credit sales and payment reminders</p>
        </div>
        <Button className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Send Reminders
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">NPR {totalOutstanding.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">NPR {totalOverdue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Overdue Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{customersWithOutstanding.length}</div>
                <div className="text-sm text-gray-600">Customers with Outstanding</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {paymentStats?.paymentRate.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-gray-600">Payment Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Sales</TabsTrigger>
          <TabsTrigger value="customers">Customer Credit</TabsTrigger>
          <TabsTrigger value="reminders">Payment Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Outstanding Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Outstanding Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outstandingSales.slice(0, 5).map((sale) => {
                  const daysOld = Math.floor(
                    (Date.now() - new Date(sale.sale_date).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0)
                  const remaining = sale.total_amount - totalPaid

                  return (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Invoice {sale.invoice_number}</span>
                          <Badge variant={sale.payment_status === 'partial' ? 'secondary' : 'destructive'}>
                            {sale.payment_status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {sale.customers?.name || 'Walk-in Customer'} • {daysOld} days ago
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">NPR {remaining.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          of NPR {sale.total_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {outstandingSales.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No outstanding sales found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers by Outstanding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers by Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customersWithOutstanding.slice(0, 5).map((customer) => {
                  const creditUtilization = customer.credit_limit > 0 
                    ? (customer.outstanding_balance / customer.credit_limit) * 100 
                    : 0

                  return (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          NPR {customer.outstanding_balance.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.credit_limit > 0 && (
                            <span className={creditUtilization > 80 ? 'text-red-600' : 'text-gray-600'}>
                              {creditUtilization.toFixed(0)}% of limit
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {customersWithOutstanding.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No customers with outstanding balance
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Outstanding Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outstandingSales.map((sale) => {
                  const daysOld = Math.floor(
                    (Date.now() - new Date(sale.sale_date).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0)
                  const remaining = sale.total_amount - totalPaid
                  const isOverdue = daysOld > 30

                  return (
                    <div key={sale.id} className={`p-4 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Invoice {sale.invoice_number}</span>
                          <Badge variant={sale.payment_status === 'partial' ? 'secondary' : 'destructive'}>
                            {sale.payment_status}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="destructive">
                              {daysOld} days overdue
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">NPR {remaining.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">remaining</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <div className="font-medium">{sale.customers?.name || 'Walk-in'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Sale Date:</span>
                          <div>{new Date(sale.sale_date).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <div>NPR {sale.total_amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <div>NPR {totalPaid.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Record Payment
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="h-3 w-3 mr-1" />
                          View Invoice
                        </Button>
                        {sale.customers?.phone && (
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            Call Customer
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {outstandingSales.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No outstanding sales found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customersWithOutstanding.map((customer) => (
              <CreditManagement 
                key={customer.id} 
                customer={customer}
                recentSales={outstandingSales.filter(sale => sale.customer_id === customer.id)}
              />
            ))}
            
            {customersWithOutstanding.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No customers with outstanding balance
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reminders">
          <PaymentReminders 
            customers={customersWithOutstanding}
            overdueSales={overdueSales}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}