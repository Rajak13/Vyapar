'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { Customer, Sale } from '@/types/database'
import { useUpdateCustomer } from '@/hooks/use-customers'
import { toast } from 'sonner'

interface CreditManagementProps {
  customer: Customer
  recentSales?: Sale[]
}

export function CreditManagement({ customer, recentSales = [] }: CreditManagementProps) {
  const [creditLimit, setCreditLimit] = useState(customer.credit_limit.toString())
  const [isEditing, setIsEditing] = useState(false)
  
  const updateCustomer = useUpdateCustomer()

  const availableCredit = customer.credit_limit - customer.outstanding_balance
  const creditUtilization = customer.credit_limit > 0 
    ? (customer.outstanding_balance / customer.credit_limit) * 100 
    : 0

  const handleUpdateCreditLimit = async () => {
    const newLimit = parseFloat(creditLimit)
    
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error('Please enter a valid credit limit')
      return
    }

    if (newLimit < customer.outstanding_balance) {
      toast.error('Credit limit cannot be less than current outstanding balance')
      return
    }

    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        updates: { credit_limit: newLimit }
      })
      setIsEditing(false)
      toast.success('Credit limit updated successfully')
    } catch (error) {
      console.error('Failed to update credit limit:', error)
      toast.error('Failed to update credit limit')
    }
  }

  const getCreditStatus = () => {
    if (customer.outstanding_balance === 0) {
      return { status: 'good', color: 'text-green-600', icon: CheckCircle, label: 'Good Standing' }
    } else if (creditUtilization < 50) {
      return { status: 'fair', color: 'text-blue-600', icon: Clock, label: 'Fair' }
    } else if (creditUtilization < 80) {
      return { status: 'warning', color: 'text-orange-600', icon: AlertTriangle, label: 'High Usage' }
    } else {
      return { status: 'critical', color: 'text-red-600', icon: AlertTriangle, label: 'Critical' }
    }
  }

  const creditStatus = getCreditStatus()
  const StatusIcon = creditStatus.icon

  // Get overdue sales (assuming sales older than 30 days with outstanding balance)
  const overdueSales = recentSales.filter(sale => {
    const saleDate = new Date(sale.sale_date)
    const daysSince = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24))
    return sale.payment_status !== 'paid' && daysSince > 30
  })

  return (
    <div className="space-y-6">
      {/* Credit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credit Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credit Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${creditStatus.color}`} />
              <span className="font-medium">Credit Status</span>
            </div>
            <Badge variant={creditStatus.status === 'good' ? 'default' : 'destructive'}>
              {creditStatus.label}
            </Badge>
          </div>

          {/* Credit Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Outstanding Balance</Label>
              <div className="text-2xl font-bold text-red-600">
                NPR {customer.outstanding_balance.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Available Credit</Label>
              <div className={`text-2xl font-bold ${availableCredit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                NPR {availableCredit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Credit Limit Management */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Credit Limit</Label>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="Enter credit limit"
                  min="0"
                  step="100"
                />
                <Button onClick={handleUpdateCreditLimit} disabled={updateCustomer.isPending}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => {
                  setCreditLimit(customer.credit_limit.toString())
                  setIsEditing(false)
                }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="text-lg font-semibold">
                NPR {customer.credit_limit.toLocaleString()}
              </div>
            )}
          </div>

          {/* Credit Utilization */}
          {customer.credit_limit > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Credit Utilization</span>
                <span className={creditUtilization > 80 ? 'text-red-600' : 'text-gray-600'}>
                  {creditUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    creditUtilization > 80 ? 'bg-red-500' : 
                    creditUtilization > 50 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Total Purchases</Label>
              <div className="text-lg font-semibold">
                NPR {customer.total_purchases.toLocaleString()}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Last Visit</Label>
              <div className="text-lg font-semibold">
                {customer.last_visit_date 
                  ? new Date(customer.last_visit_date).toLocaleDateString('en-GB')
                  : 'Never'
                }
              </div>
            </div>
          </div>

          {/* Overdue Sales Alert */}
          {overdueSales.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Overdue Payments ({overdueSales.length})
              </div>
              <div className="space-y-1 text-sm">
                {overdueSales.slice(0, 3).map((sale) => (
                  <div key={sale.id} className="flex justify-between">
                    <span>Invoice {sale.invoice_number}</span>
                    <span>NPR {sale.total_amount.toLocaleString()}</span>
                  </div>
                ))}
                {overdueSales.length > 3 && (
                  <div className="text-red-600 font-medium">
                    +{overdueSales.length - 3} more overdue
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Send Payment Reminder
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Payment History
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}