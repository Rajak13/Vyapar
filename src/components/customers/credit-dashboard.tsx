'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { useSales } from '@/hooks/use-sales'
import { CreditManagement } from './credit-management'
import { PaymentReminders } from './payment-reminders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  DollarSign,
  Calendar,
  Eye,
  Send,
  Clock,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import type { Customer, Sale } from '@/types/database'

interface CreditDashboardProps {
  businessId: string
}

export function CreditDashboard({ businessId }: CreditDashboardProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showReminders, setShowReminders] = useState(false)

  const { data: customers, isLoading: customersLoading } = useCustomers(businessId)
  const { data: sales, isLoading: salesLoading } = useSales(businessId, 200) // Get more sales for analysis

  if (customersLoading || salesLoading) {
    return <div>Loading credit dashboard...</div>
  }

  if (!customers || !sales) {
    return <div>No data available</div>
  }

  // Calculate credit metrics
  const customersWithCredit = customers.filter(c => c.credit_limit > 0)
  const customersWithOutstanding = customers.filter(c => c.outstanding_balance > 0)
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0)
  const totalCreditLimit = customers.reduce((sum, c) => sum + c.credit_limit, 0)
  const totalCreditUtilized = customers.reduce((sum, c) => sum + Math.min(c.outstanding_balance, c.credit_limit), 0)
  const creditUtilizationRate = totalCreditLimit > 0 ? (totalCreditUtilized / totalCreditLimit) * 100 : 0

  // Get overdue sales (sales older than 30 days with outstanding balance)
  const overdueSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date)
    const daysSince = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
    return sale.payment_status !== 'paid' && daysSince > 30
  }).map(sale => ({
    ...sale,
    customers: customers.find(c => c.id === sale.customer_id) ? {
      name: customers.find(c => c.id === sale.customer_id)!.name,
      phone: customers.find(c => c.id === sale.customer_id)!.phone,
      email: customers.find(c => c.id === sale.customer_id)!.email,
    } : undefined
  }))

  // Risk analysis
  const highRiskCustomers = customers.filter(customer => {
    const creditUtilization = customer.credit_limit > 0 
      ? (customer.outstanding_balance / customer.credit_limit) * 100 
      : 0
    return creditUtilization > 80 || customer.outstanding_balance > 50000
  })

  const getDaysOverdue = (saleDate: string) => {
    const sale = new Date(saleDate)
    const dueDate = new Date(sale.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days payment terms
    const today = new Date()
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getCreditRiskLevel = (customer: Customer) => {
    const creditUtilization = customer.credit_limit > 0 
      ? (customer.outstanding_balance / customer.credit_limit) * 100 
      : 0
    
    if (customer.outstanding_balance === 0) return { level: 'low', color: 'text-green-600', label: 'Low Risk' }
    if (creditUtilization < 50) return { level: 'medium', color: 'text-yellow-600', label: 'Medium Risk' }
    if (creditUtilization < 80) return { level: 'high', color: 'text-orange-600', label: 'High Risk' }
    return { level: 'critical', color: 'text-red-600', label: 'Critical Risk' }
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  NPR {totalOutstanding.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customersWithOutstanding.length} customers
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credit Utilization</p>
                <p className="text-2xl font-bold">
                  {creditUtilizationRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  NPR {totalCreditUtilized.toLocaleString()} / {totalCreditLimit.toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-bold text-orange-600">
                  {overdueSales.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  NPR {overdueSales.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Risk Customers</p>
                <p className="text-2xl font-bold text-red-600">
                  {highRiskCustomers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => setShowReminders(true)} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Payment Reminders
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Export Credit Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Follow-ups
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="outstanding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Invoices</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="credit-limits">Credit Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle>Customers with Outstanding Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersWithOutstanding.map((customer) => {
                      const creditUtilization = customer.credit_limit > 0 
                        ? (customer.outstanding_balance / customer.credit_limit) * 100 
                        : 0
                      const riskLevel = getCreditRiskLevel(customer)
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">{customer.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-red-600">
                              NPR {customer.outstanding_balance.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            NPR {customer.credit_limit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    creditUtilization > 80 ? 'bg-red-500' : 
                                    creditUtilization > 50 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm">{creditUtilization.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {customer.last_visit_date ? 
                              format(new Date(customer.last_visit_date), 'MMM dd, yyyy') : 
                              'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={riskLevel.level === 'low' ? 'default' : 'destructive'}>
                              {riskLevel.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Sale Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueSales.map((sale) => {
                      const daysOverdue = getDaysOverdue(sale.sale_date)
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.invoice_number}
                          </TableCell>
                          <TableCell>
                            {sale.customers?.name || 'Unknown Customer'}
                          </TableCell>
                          <TableCell>
                            NPR {sale.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sale.sale_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {daysOverdue} days
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              sale.payment_status === 'paid' ? 'default' :
                              sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                            }>
                              {sale.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Credit Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {highRiskCustomers.map((customer) => {
                  const creditUtilization = customer.credit_limit > 0 
                    ? (customer.outstanding_balance / customer.credit_limit) * 100 
                    : 0
                  const riskLevel = getCreditRiskLevel(customer)
                  
                  return (
                    <div key={customer.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <Badge variant={riskLevel.level === 'low' ? 'default' : 'destructive'}>
                          {riskLevel.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Outstanding:</span>
                          <div className="font-medium text-red-600">
                            NPR {customer.outstanding_balance.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Credit Limit:</span>
                          <div className="font-medium">
                            NPR {customer.credit_limit.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Utilization:</span>
                          <div className="font-medium">
                            {creditUtilization.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Purchases:</span>
                          <div className="font-medium">
                            NPR {customer.total_purchases.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          Manage Credit
                        </Button>
                        <Button variant="outline" size="sm">
                          Send Reminder
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-limits">
          <Card>
            <CardHeader>
              <CardTitle>Credit Limit Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Current Limit</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Available Credit</TableHead>
                      <TableHead>Total Purchases</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersWithCredit.map((customer) => {
                      const availableCredit = customer.credit_limit - customer.outstanding_balance
                      
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">{customer.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            NPR {customer.credit_limit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <span className={customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                              NPR {customer.outstanding_balance.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={availableCredit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              NPR {availableCredit.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            NPR {customer.total_purchases.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              Edit Limit
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Credit Management Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credit Management - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CreditManagement 
              customer={selectedCustomer}
              recentSales={sales.filter(s => s.customer_id === selectedCustomer.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Reminders Dialog */}
      <Dialog open={showReminders} onOpenChange={setShowReminders}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Payment Reminders</DialogTitle>
          </DialogHeader>
          <PaymentReminders 
            customers={customers}
            overdueSales={overdueSales}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}