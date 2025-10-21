'use client'

import { useCustomerPurchaseHistory } from '@/hooks/use-customers'
import { CustomerInsights } from './customer-insights'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Star,
  TrendingUp,
  ShoppingBag,
  Clock,
  Gift
} from 'lucide-react'
import { format } from 'date-fns'
import type { Customer } from '@/types/database'

interface CustomerDetailsProps {
  customer: Customer
  onEdit: () => void
}

export function CustomerDetails({ customer, onEdit }: CustomerDetailsProps) {
  const { data: purchaseHistory, isLoading: isLoadingHistory } = useCustomerPurchaseHistory(customer.id, 20)

  const getCustomerInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCustomerTags = (customer: Customer) => {
    const tags: string[] = []
    
    if (customer.outstanding_balance > 0) tags.push('Outstanding')
    if (customer.total_purchases > 50000) tags.push('High Value')
    if (customer.loyalty_points > 100) tags.push('Loyal')
    if (customer.notes?.includes('VIP')) tags.push('VIP')
    if (customer.notes?.includes('Wholesale')) tags.push('Wholesale')
    
    return tags
  }

  const calculateAveragePurchase = () => {
    if (!purchaseHistory || purchaseHistory.length === 0) return 0
    return customer.total_purchases / purchaseHistory.length
  }

  const getLastPurchaseDate = () => {
    if (!purchaseHistory || purchaseHistory.length === 0) return null
    return new Date(purchaseHistory[0].sale_date)
  }

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {getCustomerInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <div className="flex gap-2 mt-2">
              {getCustomerTags(customer).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Customer
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Purchases</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              NPR {customer.total_purchases.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Outstanding</span>
            </div>
            <div className={`text-2xl font-bold mt-2 ${customer.outstanding_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              NPR {customer.outstanding_balance.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Loyalty Points</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {customer.loyalty_points}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avg. Purchase</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              NPR {Math.round(calculateAveragePurchase()).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.date_of_birth && (
                  <div className="flex items-center gap-3">
                    <Gift className="h-4 w-4 text-muted-foreground" />
                    <span>Birthday: {format(new Date(customer.date_of_birth), 'MMMM dd, yyyy')}</span>
                  </div>
                )}
                {customer.last_visit_date && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Last Visit: {format(new Date(customer.last_visit_date), 'MMMM dd, yyyy')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="space-y-1">
                      {customer.address.street && <div>{customer.address.street}</div>}
                      <div>
                        {[customer.address.city, customer.address.district, customer.address.province]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {customer.address.postal_code && <div>{customer.address.postal_code}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Limit:</span>
                  <span className="font-medium">NPR {customer.credit_limit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Credit:</span>
                  <span className={`font-medium ${(customer.credit_limit - customer.outstanding_balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    NPR {(customer.credit_limit - customer.outstanding_balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={customer.active ? 'default' : 'secondary'}>
                    {customer.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {customer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{customer.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div>Loading purchase history...</div>
              ) : !purchaseHistory || purchaseHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No purchase history found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseHistory.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">
                            {sale.invoice_number}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sale.sale_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell>
                            NPR {sale.total_amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                sale.payment_status === 'paid' ? 'default' :
                                sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                              }
                            >
                              {sale.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Orders:</span>
                  <span className="font-medium">{purchaseHistory?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Order Value:</span>
                  <span className="font-medium">NPR {Math.round(calculateAveragePurchase()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Since:</span>
                  <span className="font-medium">
                    {format(new Date(customer.created_at), 'MMMM yyyy')}
                  </span>
                </div>
                {getLastPurchaseDate() && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Purchase:</span>
                    <span className="font-medium">
                      {format(getLastPurchaseDate()!, 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loyalty Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Points:</span>
                  <span className="font-medium">{customer.loyalty_points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lifetime Value:</span>
                  <span className="font-medium">NPR {customer.total_purchases.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer Tier:</span>
                  <Badge variant="outline">
                    {customer.total_purchases > 100000 ? 'Platinum' :
                     customer.total_purchases > 50000 ? 'Gold' :
                     customer.total_purchases > 20000 ? 'Silver' : 'Bronze'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <CustomerInsights customer={customer} />
        </TabsContent>
      </Tabs>
    </div>
  )
}