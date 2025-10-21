'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowRight, 
  User, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  History,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { useCustomers, useCustomerSearch, useCreateCustomer, useCustomerPurchaseHistory } from '@/hooks/use-customers'
import { Customer } from '@/types/database'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CustomerSelectionProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
  onNext: () => void
}

interface NewCustomerFormData {
  name: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    district: string
  }
  credit_limit: number
}

export function CustomerSelection({
  selectedCustomer,
  onCustomerSelect,
  onNext
}: CustomerSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerFormData>({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      district: ''
    },
    credit_limit: 0
  })

  // Get current business
  const { user } = useAuth()
  const { data: businesses = [] } = useBusinesses(user?.id || '')
  const currentBusiness = businesses[0]
  const businessId = currentBusiness?.id || ''

  // Customer queries
  const { data: allCustomers = [] } = useCustomers(businessId)
  const { data: searchResults = [] } = useCustomerSearch(businessId, searchQuery)
  const createCustomerMutation = useCreateCustomer()

  // Get customer purchase history for selected customer
  const { data: selectedCustomerSales = [] } = useCustomerPurchaseHistory(
    selectedCustomer?.id || '', 
    5
  )

  // Use search results if searching, otherwise show all customers
  const displayCustomers = searchQuery.length >= 2 ? searchResults : allCustomers.slice(0, 10)

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer)
  }

  const handleCreateCustomer = async () => {
    if (!businessId) {
      toast.error('Business not found')
      return
    }

    if (!newCustomerData.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    try {
      const customerData = {
        business_id: businessId,
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim() || undefined,
        email: newCustomerData.email.trim() || undefined,
        address: {
          street: newCustomerData.address.street.trim() || undefined,
          city: newCustomerData.address.city.trim() || undefined,
          district: newCustomerData.address.district.trim() || undefined
        },
        credit_limit: newCustomerData.credit_limit || 0,
        total_purchases: 0,
        outstanding_balance: 0,
        loyalty_points: 0,
        active: true
      }

      const newCustomer = await createCustomerMutation.mutateAsync(customerData)
      onCustomerSelect(newCustomer)
      setShowNewCustomerDialog(false)
      setNewCustomerData({
        name: '',
        phone: '',
        email: '',
        address: { street: '', city: '', district: '' },
        credit_limit: 0
      })
      toast.success('Customer created and selected')
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error('Failed to create customer')
    }
  }

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Customer Search and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Customer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add New Customer Button */}
          <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newCustomerData.address.city}
                    onChange={(e) => setNewCustomerData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="credit_limit">Credit Limit (NPR)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={newCustomerData.credit_limit}
                    onChange={(e) => setNewCustomerData(prev => ({ 
                      ...prev, 
                      credit_limit: Number(e.target.value) || 0
                    }))}
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isPending || !newCustomerData.name.trim()}
                    className="flex-1"
                  >
                    {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewCustomerDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Customer List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {displayCustomers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchQuery.length >= 2 ? 'No customers found' : 'No customers yet'}
              </div>
            ) : (
              displayCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50',
                    selectedCustomer?.id === customer.id && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(customer.total_purchases)}
                      </div>
                      {customer.outstanding_balance > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Due: {formatCurrency(customer.outstanding_balance)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Walk-in Customer Option */}
          <Button
            variant="outline"
            onClick={() => onCustomerSelect(null)}
            className={cn(
              'w-full',
              selectedCustomer === null && 'border-primary bg-primary/5'
            )}
          >
            <User className="h-4 w-4 mr-2" />
            Walk-in Customer (No customer record)
          </Button>
        </CardContent>
      </Card>

      {/* Selected Customer Details */}
      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{selectedCustomer.name}</span>
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address?.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.address.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Account Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Purchases:</span>
                    <span className="font-medium">{formatCurrency(selectedCustomer.total_purchases)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Outstanding Balance:</span>
                    <span className={cn(
                      'font-medium',
                      selectedCustomer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {formatCurrency(selectedCustomer.outstanding_balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Limit:</span>
                    <span className="font-medium">{formatCurrency(selectedCustomer.credit_limit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Loyalty Points:</span>
                    <span className="font-medium">{selectedCustomer.loyalty_points}</span>
                  </div>
                  {selectedCustomer.last_visit_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Visit:</span>
                      <span className="font-medium">{formatDate(selectedCustomer.last_visit_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Purchase History */}
            {selectedCustomerSales.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Purchases
                </h4>
                <div className="space-y-2">
                  {selectedCustomerSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="text-sm font-medium">#{sale.invoice_number}</div>
                        <div className="text-xs text-gray-500">{formatDate(sale.sale_date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(sale.total_amount)}</div>
                        <Badge 
                          variant={sale.payment_status === 'paid' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {sale.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Warning */}
            {selectedCustomer.outstanding_balance > selectedCustomer.credit_limit && selectedCustomer.credit_limit > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-medium">Credit Limit Exceeded</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Outstanding balance ({formatCurrency(selectedCustomer.outstanding_balance)}) exceeds credit limit ({formatCurrency(selectedCustomer.credit_limit)})
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <Button onClick={onNext} className="w-full" size="lg">
        Continue to Payment
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}