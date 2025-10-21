'use client'

import { useCustomers } from '@/hooks/use-customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import type { Customer } from '@/types/database'

interface CustomerAnalyticsProps {
  businessId: string
}

export function CustomerAnalytics({ businessId }: CustomerAnalyticsProps) {
  const { data: customers, isLoading } = useCustomers(businessId)

  if (isLoading) {
    return <div>Loading analytics...</div>
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customer data available</h3>
          <p className="text-muted-foreground text-center">
            Add customers to see analytics and insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate analytics data
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.active).length
  const customersWithOutstanding = customers.filter(c => c.outstanding_balance > 0).length
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_balance, 0)
  const totalLifetimeValue = customers.reduce((sum, c) => sum + c.total_purchases, 0)
  const averageLifetimeValue = totalLifetimeValue / totalCustomers
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0)

  // Customer segmentation by purchase value
  const customerTiers = customers.reduce((acc, customer) => {
    if (customer.total_purchases > 100000) acc.platinum++
    else if (customer.total_purchases > 50000) acc.gold++
    else if (customer.total_purchases > 20000) acc.silver++
    else acc.bronze++
    return acc
  }, { platinum: 0, gold: 0, silver: 0, bronze: 0 })

  const tierData = [
    { name: 'Platinum', value: customerTiers.platinum, color: '#8B5CF6' },
    { name: 'Gold', value: customerTiers.gold, color: '#F59E0B' },
    { name: 'Silver', value: customerTiers.silver, color: '#6B7280' },
    { name: 'Bronze', value: customerTiers.bronze, color: '#CD7C2F' },
  ]

  // Top customers by purchase value
  const topCustomers = [...customers]
    .sort((a, b) => b.total_purchases - a.total_purchases)
    .slice(0, 10)
    .map(customer => ({
      name: customer.name,
      value: customer.total_purchases,
      outstanding: customer.outstanding_balance,
      points: customer.loyalty_points
    }))

  // Customer acquisition trend (mock data - in real app would come from database)
  const acquisitionData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const monthCustomers = customers.filter(c => {
      const createdDate = new Date(c.created_at)
      return createdDate >= startOfMonth(date) && createdDate <= endOfMonth(date)
    }).length
    
    return {
      month: format(date, 'MMM yyyy'),
      customers: monthCustomers,
      cumulative: customers.filter(c => new Date(c.created_at) <= endOfMonth(date)).length
    }
  })

  // Contact information completeness
  const contactStats = {
    withPhone: customers.filter(c => c.phone).length,
    withEmail: customers.filter(c => c.email).length,
    withAddress: customers.filter(c => c.address?.city).length,
    withBirthday: customers.filter(c => c.date_of_birth).length,
  }

  // Geographic distribution
  const locationData = customers.reduce((acc, customer) => {
    const city = customer.address?.city || 'Unknown'
    acc[city] = (acc[city] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topLocations = Object.entries(locationData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([city, count]) => ({ city, count }))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
                <p className="text-xs text-muted-foreground">
                  {activeCustomers} active
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Lifetime Value</p>
                <p className="text-2xl font-bold">NPR {Math.round(averageLifetimeValue).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Total: NPR {totalLifetimeValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">NPR {totalOutstanding.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {customersWithOutstanding} customers
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
                <p className="text-sm font-medium text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {Math.round(totalLoyaltyPoints / totalCustomers)}
                </p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="segmentation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmentation">Customer Segmentation</TabsTrigger>
          <TabsTrigger value="top-customers">Top Customers</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition Trends</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="segmentation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Tiers Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {tierData.map((tier) => (
                    <div key={tier.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="text-sm">
                        {tier.name}: {tier.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tier Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tierData.map((tier) => (
                  <div key={tier.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{tier.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {tier.value} customers ({Math.round((tier.value / totalCustomers) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(tier.value / totalCustomers) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-customers">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Purchase Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCustomers} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `NPR ${Number(value).toLocaleString()}`,
                        name === 'value' ? 'Total Purchases' : name
                      ]}
                    />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acquisition">
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={acquisitionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="New Customers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Total Customers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information Completeness */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information Completeness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Phone Number</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contactStats.withPhone}/{totalCustomers} ({Math.round((contactStats.withPhone / totalCustomers) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(contactStats.withPhone / totalCustomers) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email Address</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contactStats.withEmail}/{totalCustomers} ({Math.round((contactStats.withEmail / totalCustomers) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(contactStats.withEmail / totalCustomers) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">Address</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contactStats.withAddress}/{totalCustomers} ({Math.round((contactStats.withAddress / totalCustomers) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(contactStats.withAddress / totalCustomers) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Birthday</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {contactStats.withBirthday}/{totalCustomers} ({Math.round((contactStats.withBirthday / totalCustomers) * 100)}%)
                    </span>
                  </div>
                  <Progress value={(contactStats.withBirthday / totalCustomers) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topLocations.map((location, index) => (
                  <div key={location.city} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm font-medium">{location.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{location.count} customers</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(location.count / totalCustomers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}