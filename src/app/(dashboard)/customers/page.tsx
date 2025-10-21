'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCustomers } from '@/hooks/use-customers'
import { useBusinesses } from '@/hooks/use-businesses'
import { CustomerList } from '@/components/customers/customer-list'
import { CustomerForm } from '@/components/customers/customer-form'
import { CustomerSearch } from '@/components/customers/customer-search'
import { CustomerAnalytics } from '@/components/customers/customer-analytics'
import { CreditDashboard } from '@/components/customers/credit-dashboard'
import { LoyaltyManagement } from '@/components/customers/loyalty-management'
import { CustomerEngagement } from '@/components/customers/customer-engagement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, TrendingUp, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export default function CustomersPage() {
  const { user } = useAuth()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Get real business ID from user's businesses
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id || ''

  const { data: customers, isLoading } = useCustomers(businessId)

  if (!user) {
    return <div>Please log in to access customers.</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and track purchase history
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              businessId={businessId}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active customer accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NPR {customers?.reduce((sum, customer) => sum + customer.outstanding_balance, 0).toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Purchase Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NPR {customers?.length ?
                Math.round(customers.reduce((sum, customer) => sum + customer.total_purchases, 0) / customers.length).toLocaleString()
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer lifetime value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Customer List</TabsTrigger>
          <TabsTrigger value="credit">Credit & Payments</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search */}
          <CustomerSearch
            businessId={businessId}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
          />

          {/* Customer List */}
          <CustomerList
            businessId={businessId}
            searchQuery={searchQuery}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="credit">
          <CreditDashboard businessId={businessId} />
        </TabsContent>

        <TabsContent value="loyalty">
          <LoyaltyManagement businessId={businessId} />
        </TabsContent>

        <TabsContent value="engagement">
          <CustomerEngagement businessId={businessId} />
        </TabsContent>

        <TabsContent value="analytics">
          <CustomerAnalytics businessId={businessId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}