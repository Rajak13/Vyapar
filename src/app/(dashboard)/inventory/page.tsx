'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCatalog } from '@/components/inventory/product-catalog'
import { CategoryManagement } from '@/components/inventory/category-management'
import { InventoryTransactions } from '@/components/inventory/inventory-transactions'
import { LowStockAlerts } from '@/components/inventory/low-stock-alerts'
import { Package, Tag, Scan, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProducts, useLowStockProducts } from '@/hooks/use-products'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { formatNPR } from '@/lib/nepal-utils'
import { Badge } from '@/components/ui/badge'

export default function InventoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const { user } = useAuth()
  
  // Get business ID from businesses hook
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id
  
  const { data: products, isLoading } = useProducts(businessId || '')
  const { data: lowStockProducts } = useLowStockProducts(businessId || '')

  // Calculate inventory metrics
  const totalProducts = products?.length || 0
  const totalStockValue = products?.reduce((sum, product) => 
    sum + (product.current_stock * product.purchase_price), 0
  ) || 0
  const lowStockCount = lowStockProducts?.length || 0
  const categories = Array.from(new Set(products?.map(p => p.category).filter(Boolean))) as string[]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your products, categories, and stock levels
        </p>
      </div>

      {/* Inventory Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNPR(totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Product categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-3">
              {lowStockCount} products are running low on stock and need restocking.
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts?.slice(0, 5).map((product) => (
                <Badge key={product.id} variant="destructive">
                  {product.name} ({product.current_stock} left)
                </Badge>
              ))}
              {lowStockCount > 5 && (
                <Badge variant="outline">
                  +{lowStockCount - 5} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock Alerts
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stock-tracking" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Stock Tracking
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {product.current_stock} units
                      </div>
                      <div className="text-sm text-gray-500">
                        Min: {product.min_stock_level}
                      </div>
                    </div>
                    <Badge 
                      variant={product.current_stock <= product.min_stock_level ? 'destructive' : 'default'}
                    >
                      {product.current_stock <= product.min_stock_level ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <LowStockAlerts 
            businessId={businessId || ''} 
            businessName={businesses?.[0]?.business_name || 'Your Business'}
          />
        </TabsContent>

        <TabsContent value="stock-tracking" className="space-y-4">
          <InventoryTransactions businessId={businessId || ''} />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}