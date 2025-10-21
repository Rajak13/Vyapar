'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Bell, Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useLowStockProducts } from '@/hooks/use-products'
import { useUpdateProduct } from '@/hooks/use-products'
import { 
  useNotificationSettings, 
  useSaveNotificationSettings,
  useSendLowStockNotifications
} from '@/hooks/use-notifications'
import { checkLowStockAlerts, type NotificationSettings } from '@/lib/notifications'
import { toast } from 'sonner'
import type { LowStockProduct } from '@/types/database'

interface LowStockAlertsProps {
  businessId: string
  businessName?: string
}

export function LowStockAlerts({ businessId, businessName = 'Your Business' }: LowStockAlertsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const { data: lowStockProducts, isLoading, error, refetch } = useLowStockProducts(businessId)
  const { data: notificationSettings } = useNotificationSettings(businessId)
  const saveSettings = useSaveNotificationSettings()
  const sendNotifications = useSendLowStockNotifications()
  const updateProduct = useUpdateProduct()

  // Local state for settings form
  const [localSettings, setLocalSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    smsEnabled: false,
    threshold: 10,
    criticalThreshold: 5,
  })

  // Update local settings when data loads
  useEffect(() => {
    if (notificationSettings) {
      setLocalSettings(notificationSettings)
    }
  }, [notificationSettings])

  // Categorize products by severity
  const { criticalProducts, lowProducts } = lowStockProducts && localSettings 
    ? checkLowStockAlerts(lowStockProducts, localSettings)
    : { criticalProducts: [], lowProducts: [] }

  const handleUpdateThreshold = async (productId: string, newThreshold: number) => {
    try {
      await updateProduct.mutateAsync({
        id: productId,
        updates: { min_stock_level: newThreshold }
      })
      toast.success('Stock threshold updated successfully')
    } catch {
      console.error('Failed to update threshold:', error)
      toast.error('Failed to update threshold')
    }
  }

  const handleSendNotifications = async () => {
    if (!localSettings) return

    sendNotifications.mutate({
      businessId,
      settings: localSettings,
      businessName,
      lowStockProducts: lowProducts,
      criticalProducts
    })
  }

  const handleSaveSettings = async () => {
    await saveSettings.mutateAsync({
      businessId,
      settings: localSettings
    })
    setIsSettingsOpen(false)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load low stock alerts</h3>
            <p className="text-gray-600 mb-4">Please try refreshing the page</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Low Stock Alerts
          </h1>
          <p className="text-gray-600">
            Monitor and manage products with low inventory levels
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogDescription>
                  Configure how you want to be notified about low stock levels
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Threshold Settings */}
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={localSettings.threshold}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      threshold: parseInt(e.target.value) || 0
                    }))}
                    min="0"
                  />
                  <p className="text-sm text-gray-600">
                    Alert when stock falls below this level
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criticalThreshold">Critical Stock Threshold</Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    value={localSettings.criticalThreshold}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      criticalThreshold: parseInt(e.target.value) || 0
                    }))}
                    min="0"
                  />
                  <p className="text-sm text-gray-600">
                    Critical alert when stock falls below this level
                  </p>
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.emailEnabled}
                    onCheckedChange={(checked: boolean) => setLocalSettings(prev => ({
                      ...prev,
                      emailEnabled: checked
                    }))}
                  />
                </div>

                {localSettings.emailEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={localSettings.emailAddress || ''}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        emailAddress: e.target.value
                      }))}
                    />
                  </div>
                )}

                {/* SMS Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive alerts via SMS
                    </p>
                  </div>
                  <Switch
                    checked={localSettings.smsEnabled}
                    onCheckedChange={(checked: boolean) => setLocalSettings(prev => ({
                      ...prev,
                      smsEnabled: checked
                    }))}
                  />
                </div>

                {localSettings.smsEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+977-9800000000"
                      value={localSettings.phoneNumber || ''}
                      onChange={(e) => setLocalSettings(prev => ({
                        ...prev,
                        phoneNumber: e.target.value
                      }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saveSettings.isPending}
                >
                  {saveSettings.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {(criticalProducts.length > 0 || lowProducts.length > 0) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Send Alerts
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Send Low Stock Notifications</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send notifications for {criticalProducts.length + lowProducts.length} products 
                    with low stock levels via your configured channels.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleSendNotifications}
                    disabled={sendNotifications.isPending}
                  >
                    {sendNotifications.isPending ? 'Sending...' : 'Send Notifications'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical Stock</p>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Skeleton className="h-8 w-8" /> : criticalProducts.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Skeleton className="h-8 w-8" /> : lowProducts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Skeleton className="h-8 w-8" /> : (criticalProducts.length + lowProducts.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Products */}
      {criticalProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Critical Stock Alert ({criticalProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalProducts.map(product => (
                <LowStockProductCard
                  key={product.id}
                  product={product}
                  severity="critical"
                  onUpdateThreshold={handleUpdateThreshold}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {lowProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert ({lowProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowProducts.map(product => (
                <LowStockProductCard
                  key={product.id}
                  product={product}
                  severity="low"
                  onUpdateThreshold={handleUpdateThreshold}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Alerts State */}
      {!isLoading && criticalProducts.length === 0 && lowProducts.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">
                All Stock Levels Look Good!
              </h3>
              <p className="text-gray-600">
                No products are currently below their minimum stock levels.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Individual product card component
function LowStockProductCard({
  product,
  severity,
  onUpdateThreshold
}: {
  product: LowStockProduct
  severity: 'critical' | 'low'
  onUpdateThreshold: (productId: string, threshold: number) => void
}) {
  const [newThreshold, setNewThreshold] = useState(product.min_stock_level)
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveThreshold = () => {
    onUpdateThreshold(product.id, newThreshold)
    setIsEditing(false)
  }

  const stockPercentage = (product.current_stock / product.min_stock_level) * 100

  return (
    <div className={`p-4 border rounded-lg ${
      severity === 'critical' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="font-semibold">{product.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {product.category && (
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                )}
                <span>Current: {product.current_stock}</span>
                <span>•</span>
                <span>Min: {product.min_stock_level}</span>
              </div>
            </div>
          </div>

          {/* Stock Level Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Stock Level</span>
              <span>{stockPercentage.toFixed(0)}% of minimum</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(parseInt(e.target.value) || 0)}
                className="w-20"
                min="0"
              />
              <Button size="sm" onClick={handleSaveThreshold}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Adjust
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}