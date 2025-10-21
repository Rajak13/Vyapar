'use client'

import { useState } from 'react'
import { useCustomers, useUpdateCustomer } from '@/hooks/use-customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Star,
  Gift,
  Trophy,
  Crown,
  Award,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  Zap,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import type { Customer } from '@/types/database'
import { toast } from 'sonner'

interface LoyaltyManagementProps {
  businessId: string
}

interface LoyaltyTier {
  name: string
  minSpending: number
  pointsMultiplier: number
  benefits: string[]
  color: string
  icon: React.ComponentType<{ className?: string }>
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    minSpending: 0,
    pointsMultiplier: 1,
    benefits: ['10 points per NPR 1000 spent', 'Birthday wishes'],
    color: 'text-amber-600',
    icon: Award
  },
  {
    name: 'Silver',
    minSpending: 20000,
    pointsMultiplier: 1.5,
    benefits: ['15 points per NPR 1000 spent', '5% discount on special occasions', 'Priority customer service'],
    color: 'text-gray-500',
    icon: Star
  },
  {
    name: 'Gold',
    minSpending: 50000,
    pointsMultiplier: 2,
    benefits: ['20 points per NPR 1000 spent', '10% discount on special occasions', 'Early access to new products', 'Free gift wrapping'],
    color: 'text-yellow-500',
    icon: Trophy
  },
  {
    name: 'Platinum',
    minSpending: 100000,
    pointsMultiplier: 3,
    benefits: ['30 points per NPR 1000 spent', '15% discount on special occasions', 'Exclusive VIP events', 'Personal shopping assistance', 'Free home delivery'],
    color: 'text-purple-600',
    icon: Crown
  }
]

const POINT_REDEMPTION_OPTIONS = [
  { points: 100, reward: 'NPR 50 discount', value: 50 },
  { points: 200, reward: 'NPR 120 discount', value: 120 },
  { points: 500, reward: 'NPR 350 discount', value: 350 },
  { points: 1000, reward: 'NPR 800 discount', value: 800 },
  { points: 2000, reward: 'Free product (up to NPR 2000)', value: 2000 },
]

export function LoyaltyManagement({ businessId }: LoyaltyManagementProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [pointsReason, setPointsReason] = useState('')
  const [showRedemption, setShowRedemption] = useState(false)

  const { data: customers, isLoading } = useCustomers(businessId)
  const updateCustomer = useUpdateCustomer()

  if (isLoading) {
    return <div>Loading loyalty management...</div>
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground text-center">
            Add customers to start managing loyalty programs.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getCustomerTier = (customer: Customer): LoyaltyTier => {
    return LOYALTY_TIERS
      .slice()
      .reverse()
      .find(tier => customer.total_purchases >= tier.minSpending) || LOYALTY_TIERS[0]
  }

  const getNextTier = (customer: Customer): LoyaltyTier | null => {
    const currentTier = getCustomerTier(customer)
    const currentIndex = LOYALTY_TIERS.findIndex(tier => tier.name === currentTier.name)
    return currentIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentIndex + 1] : null
  }

  const getProgressToNextTier = (customer: Customer): number => {
    const nextTier = getNextTier(customer)
    if (!nextTier) return 100

    const currentTier = getCustomerTier(customer)
    const progress = ((customer.total_purchases - currentTier.minSpending) /
      (nextTier.minSpending - currentTier.minSpending)) * 100
    return Math.min(progress, 100)
  }

  const handleAddPoints = async () => {
    if (!selectedCustomer || !pointsToAdd) return

    const points = parseInt(pointsToAdd)
    if (isNaN(points) || points <= 0) {
      toast.error('Please enter a valid number of points')
      return
    }

    try {
      await updateCustomer.mutateAsync({
        id: selectedCustomer.id,
        updates: {
          loyalty_points: selectedCustomer.loyalty_points + points
        }
      })

      toast.success(`Added ${points} loyalty points to ${selectedCustomer.name}`)
      setPointsToAdd('')
      setPointsReason('')
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Failed to add points:', error)
      toast.error('Failed to add loyalty points')
    }
  }

  const handleRedeemPoints = async (customer: Customer, points: number, reward: string) => {
    if (customer.loyalty_points < points) {
      toast.error('Insufficient loyalty points')
      return
    }

    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        updates: {
          loyalty_points: customer.loyalty_points - points
        }
      })

      toast.success(`Redeemed ${points} points for ${reward}`)
    } catch (error) {
      console.error('Failed to redeem points:', error)
      toast.error('Failed to redeem points')
    }
  }

  // Calculate loyalty statistics
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0)
  const averagePoints = totalLoyaltyPoints / customers.length
  const tierDistribution = LOYALTY_TIERS.map(tier => ({
    ...tier,
    count: customers.filter(c => getCustomerTier(c).name === tier.name).length
  }))

  // Get customers with upcoming birthdays (next 30 days)
  const upcomingBirthdays = customers.filter(customer => {
    if (!customer.date_of_birth) return false

    const today = new Date()
    const birthday = new Date(customer.date_of_birth)
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1)
    }

    const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilBirthday <= 30
  }).sort((a, b) => {
    const today = new Date()
    const aBirthday = new Date(a.date_of_birth!)
    const bBirthday = new Date(b.date_of_birth!)
    const aThisYear = new Date(today.getFullYear(), aBirthday.getMonth(), aBirthday.getDate())
    const bThisYear = new Date(today.getFullYear(), bBirthday.getMonth(), bBirthday.getDate())

    if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1)
    if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1)

    return aThisYear.getTime() - bThisYear.getTime()
  })

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points Issued</p>
                <p className="text-2xl font-bold">{totalLoyaltyPoints.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  Avg: {Math.round(averagePoints)} per customer
                </p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP Customers</p>
                <p className="text-2xl font-bold">
                  {tierDistribution.find(t => t.name === 'Platinum')?.count || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Platinum tier members
                </p>
              </div>
              <Crown className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Birthdays</p>
                <p className="text-2xl font-bold">{upcomingBirthdays.length}</p>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tiers</p>
                <p className="text-2xl font-bold">
                  {tierDistribution.filter(t => t.count > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Out of {LOYALTY_TIERS.length} tiers
                </p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customer Loyalty</TabsTrigger>
          <TabsTrigger value="tiers">Tier Management</TabsTrigger>
          <TabsTrigger value="birthdays">Birthdays & Events</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Loyalty Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Progress to Next Tier</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const tier = getCustomerTier(customer)
                      const nextTier = getNextTier(customer)
                      const progress = getProgressToNextTier(customer)
                      const TierIcon = tier.icon

                      return (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">{customer.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TierIcon className={`h-4 w-4 ${tier.color}`} />
                              <Badge variant="outline" className={tier.color}>
                                {tier.name}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{customer.loyalty_points}</div>
                          </TableCell>
                          <TableCell>
                            NPR {customer.total_purchases.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {nextTier ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>To {nextTier.name}</span>
                                  <span>{progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="text-xs text-muted-foreground">
                                  NPR {(nextTier.minSpending - customer.total_purchases).toLocaleString()} more needed
                                </div>
                              </div>
                            ) : (
                              <Badge variant="default">Max Tier</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Add Points
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setShowRedemption(true)
                                }}
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Redeem
                              </Button>
                            </div>
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

        <TabsContent value="tiers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LOYALTY_TIERS.map((tier) => {
              const TierIcon = tier.icon
              const tierCustomers = customers.filter(c => getCustomerTier(c).name === tier.name)

              return (
                <Card key={tier.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TierIcon className={`h-5 w-5 ${tier.color}`} />
                      {tier.name} Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum Spending:</span>
                      <span className="font-medium">NPR {tier.minSpending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Points Multiplier:</span>
                      <span className="font-medium">{tier.pointsMultiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Members:</span>
                      <span className="font-medium">{tierCustomers.length}</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Benefits:</Label>
                      <ul className="text-sm space-y-1">
                        {tier.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="birthdays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Upcoming Birthdays & Special Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBirthdays.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBirthdays.map((customer) => {
                    const birthday = new Date(customer.date_of_birth!)
                    const today = new Date()
                    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

                    if (thisYearBirthday < today) {
                      thisYearBirthday.setFullYear(today.getFullYear() + 1)
                    }

                    const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const tier = getCustomerTier(customer)
                    const TierIcon = tier.icon

                    return (
                      <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <TierIcon className={`h-4 w-4 ${tier.color}`} />
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(thisYearBirthday, 'MMMM dd')} • {customer.phone}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={daysUntil <= 7 ? 'destructive' : 'outline'}>
                            {daysUntil === 0 ? 'Today!' :
                              daysUntil === 1 ? 'Tomorrow' :
                                `${daysUntil} days`}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Send Wishes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Gift className="h-4 w-4 mr-1" />
                            Birthday Bonus
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4" />
                  <p>No upcoming birthdays in the next 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Customer Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Festival Greetings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Gift className="h-4 w-4 mr-2" />
                  Create Special Offers
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Customer Appreciation Event
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="h-4 w-4 mr-2" />
                  Loyalty Campaign
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tierDistribution.map((tier) => {
                    const TierIcon = tier.icon
                    const percentage = customers.length > 0 ? (tier.count / customers.length) * 100 : 0

                    return (
                      <div key={tier.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TierIcon className={`h-4 w-4 ${tier.color}`} />
                            <span className="font-medium">{tier.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {tier.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Points Dialog */}
      <Dialog open={!!selectedCustomer && !showRedemption} onOpenChange={() => {
        setSelectedCustomer(null)
        setPointsToAdd('')
        setPointsReason('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Loyalty Points - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points to Add</Label>
              <Input
                id="points"
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="Enter points amount"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                placeholder="e.g., Birthday bonus, Special purchase"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                Cancel
              </Button>
              <Button onClick={handleAddPoints} disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'Adding...' : 'Add Points'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Points Redemption Dialog */}
      <Dialog open={showRedemption} onOpenChange={setShowRedemption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Points - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Available Points</div>
              <div className="text-2xl font-bold">{selectedCustomer?.loyalty_points || 0}</div>
            </div>

            <div className="space-y-3">
              <Label>Redemption Options</Label>
              {POINT_REDEMPTION_OPTIONS.map((option) => (
                <div
                  key={option.points}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${(selectedCustomer?.loyalty_points || 0) >= option.points
                    ? 'hover:bg-muted/50'
                    : 'opacity-50 cursor-not-allowed'
                    }`}
                  onClick={() => {
                    if (selectedCustomer && selectedCustomer.loyalty_points >= option.points) {
                      handleRedeemPoints(selectedCustomer, option.points, option.reward)
                      setShowRedemption(false)
                      setSelectedCustomer(null)
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{option.reward}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.points} points required
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Value: NPR {option.value}
                      </div>
                      {(selectedCustomer?.loyalty_points || 0) < option.points && (
                        <div className="text-xs text-red-600">
                          Need {option.points - (selectedCustomer?.loyalty_points || 0)} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}