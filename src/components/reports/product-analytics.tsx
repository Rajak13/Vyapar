'use client'

import { useState, useMemo } from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import {
    TrendingUp,
    TrendingDown,
    Package,
    BarChart3,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Star,
    AlertTriangle,
    Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useProducts } from '@/hooks/use-products'
import { useSales } from '@/hooks/use-sales'
import type { Product, Sale } from '@/types/database'

interface ProductAnalyticsProps {
    businessId: string
}

type DateRange = '7d' | '30d' | '90d' | 'current_month' | 'last_month' | 'current_year'

interface ProductPerformance {
    product: Product
    totalSold: number
    totalRevenue: number
    averagePrice: number
    profitMargin: number
    inventoryTurnover: number
    daysToSellOut: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
}

interface ProductMetrics {
    bestSellers: ProductPerformance[]
    worstSellers: ProductPerformance[]
    highestMargin: ProductPerformance[]
    fastestTurnover: ProductPerformance[]
    slowestTurnover: ProductPerformance[]
    totalProductsSold: number
    averageInventoryTurnover: number
    totalRevenue: number
    categoryPerformance: Record<string, {
        revenue: number
        unitsSold: number
        productCount: number
    }>
}

export function ProductAnalytics({ businessId }: ProductAnalyticsProps) {
    const [dateRange, setDateRange] = useState<DateRange>('30d')
    const [sortBy, setSortBy] = useState<'revenue' | 'units' | 'margin' | 'turnover'>('revenue')

    const { data: products, isLoading: productsLoading } = useProducts(businessId)
    const { data: sales, isLoading: salesLoading } = useSales(businessId, 1000)

    const isLoading = productsLoading || salesLoading

    // Calculate date range
    const getDateRange = (range: DateRange) => {
        const now = new Date()
        switch (range) {
            case '7d':
                return { start: subDays(now, 7), end: now }
            case '30d':
                return { start: subDays(now, 30), end: now }
            case '90d':
                return { start: subDays(now, 90), end: now }
            case 'current_month':
                return { start: startOfMonth(now), end: endOfMonth(now) }
            case 'last_month':
                const lastMonth = subMonths(now, 1)
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
            case 'current_year':
                return { start: new Date(now.getFullYear(), 0, 1), end: now }
            default:
                return { start: subDays(now, 30), end: now }
        }
    }

    const { start: startDate, end: endDate } = getDateRange(dateRange)

    // Filter sales by date range
    const filteredSales = sales?.filter(sale => {
        const saleDate = new Date(sale.sale_date)
        return saleDate >= startDate && saleDate <= endDate
    }) || []

    // Calculate product performance metrics
    const productMetrics = useMemo((): ProductMetrics => {
        if (!products || !filteredSales) {
            return {
                bestSellers: [],
                worstSellers: [],
                highestMargin: [],
                fastestTurnover: [],
                slowestTurnover: [],
                totalProductsSold: 0,
                averageInventoryTurnover: 0,
                totalRevenue: 0,
                categoryPerformance: {}
            }
        }

        // Calculate performance for each product
        const productPerformances: ProductPerformance[] = products.map(product => {
            // Get all sales items for this product
            const productSales = filteredSales.flatMap(sale =>
                (sale.items as Array<{ product_id: string; quantity: number; unit_price: number; total_price: number }>).filter(item => item.product_id === product.id)
            )

            const totalSold = productSales.reduce((sum, item) => sum + item.quantity, 0)
            const totalRevenue = productSales.reduce((sum, item) => sum + item.total_price, 0)
            const averagePrice = totalSold > 0 ? totalRevenue / totalSold : product.selling_price

            // Calculate profit margin
            const profitMargin = product.selling_price > 0
                ? ((product.selling_price - product.purchase_price) / product.selling_price) * 100
                : 0

            // Calculate inventory turnover (simplified)
            const averageInventory = (product.current_stock + totalSold) / 2
            const inventoryTurnover = averageInventory > 0 ? totalSold / averageInventory : 0

            // Calculate days to sell out current stock
            const dailySalesRate = totalSold / Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            const daysToSellOut = dailySalesRate > 0 ? product.current_stock / dailySalesRate : Infinity

            // Calculate trend (simplified - comparing first half vs second half of period)
            const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
            const firstHalfSales = filteredSales
                .filter(sale => new Date(sale.sale_date) < midPoint)
                .flatMap(sale => (sale.items as Array<{ product_id: string; quantity: number }>).filter(item => item.product_id === product.id))
                .reduce((sum, item) => sum + item.quantity, 0)

            const secondHalfSales = filteredSales
                .filter(sale => new Date(sale.sale_date) >= midPoint)
                .flatMap(sale => (sale.items as Array<{ product_id: string; quantity: number }>).filter(item => item.product_id === product.id))
                .reduce((sum, item) => sum + item.quantity, 0)

            let trend: 'up' | 'down' | 'stable' = 'stable'
            let trendPercentage = 0

            if (firstHalfSales > 0) {
                trendPercentage = ((secondHalfSales - firstHalfSales) / firstHalfSales) * 100
                if (trendPercentage > 10) trend = 'up'
                else if (trendPercentage < -10) trend = 'down'
            } else if (secondHalfSales > 0) {
                trend = 'up'
                trendPercentage = 100
            }

            return {
                product,
                totalSold,
                totalRevenue,
                averagePrice,
                profitMargin,
                inventoryTurnover,
                daysToSellOut,
                trend,
                trendPercentage
            }
        })

        // Sort and categorize products
        const bestSellers = [...productPerformances]
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10)

        const worstSellers = [...productPerformances]
            .filter(p => p.totalSold > 0)
            .sort((a, b) => a.totalSold - b.totalSold)
            .slice(0, 10)

        const highestMargin = [...productPerformances]
            .filter(p => p.totalSold > 0)
            .sort((a, b) => b.profitMargin - a.profitMargin)
            .slice(0, 10)

        const fastestTurnover = [...productPerformances]
            .filter(p => p.inventoryTurnover > 0)
            .sort((a, b) => b.inventoryTurnover - a.inventoryTurnover)
            .slice(0, 10)

        const slowestTurnover = [...productPerformances]
            .filter(p => p.inventoryTurnover > 0)
            .sort((a, b) => a.inventoryTurnover - b.inventoryTurnover)
            .slice(0, 10)

        // Calculate totals
        const totalProductsSold = productPerformances.reduce((sum, p) => sum + p.totalSold, 0)
        const totalRevenue = productPerformances.reduce((sum, p) => sum + p.totalRevenue, 0)
        const averageInventoryTurnover = productPerformances.length > 0
            ? productPerformances.reduce((sum, p) => sum + p.inventoryTurnover, 0) / productPerformances.length
            : 0

        // Calculate category performance
        const categoryPerformance: Record<string, { revenue: number; unitsSold: number; productCount: number }> = {}

        productPerformances.forEach(perf => {
            const category = perf.product.category || 'Uncategorized'
            if (!categoryPerformance[category]) {
                categoryPerformance[category] = { revenue: 0, unitsSold: 0, productCount: 0 }
            }
            categoryPerformance[category].revenue += perf.totalRevenue
            categoryPerformance[category].unitsSold += perf.totalSold
            categoryPerformance[category].productCount += 1
        })

        return {
            bestSellers,
            worstSellers,
            highestMargin,
            fastestTurnover,
            slowestTurnover,
            totalProductsSold,
            averageInventoryTurnover,
            totalRevenue,
            categoryPerformance
        }
    }, [products, filteredSales, startDate, endDate])

    const formatCurrency = (amount: number) => `NPR ${amount.toLocaleString()}`

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <ArrowUpRight className="h-4 w-4 text-green-600" />
            case 'down':
                return <ArrowDownRight className="h-4 w-4 text-red-600" />
            default:
                return null
        }
    }

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600'
            case 'down':
                return 'text-red-600'
            default:
                return 'text-gray-600'
        }
    }

    const getPerformanceBadge = (performance: ProductPerformance) => {
        if (performance.totalSold === 0) return <Badge variant="secondary">No Sales</Badge>
        if (performance.inventoryTurnover > 2) return <Badge variant="default">Fast Moving</Badge>
        if (performance.inventoryTurnover < 0.5) return <Badge variant="destructive">Slow Moving</Badge>
        return <Badge variant="outline">Average</Badge>
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex space-x-2">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Product Performance Analytics</h2>
                    <p className="text-gray-600">Sales performance, inventory turnover, and profit analysis</p>
                </div>
                <div className="flex items-center space-x-4">
                    <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                        <SelectTrigger className="w-48">
                            <Calendar className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="current_month">Current month</SelectItem>
                            <SelectItem value="last_month">Last month</SelectItem>
                            <SelectItem value="current_year">Current year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(value: 'revenue' | 'units' | 'margin' | 'turnover') => setSortBy(value)}>
                        <SelectTrigger className="w-40">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="revenue">By Revenue</SelectItem>
                            <SelectItem value="units">By Units Sold</SelectItem>
                            <SelectItem value="margin">By Margin</SelectItem>
                            <SelectItem value="turnover">By Turnover</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Units Sold</p>
                                <p className="text-2xl font-bold">{productMetrics.totalProductsSold.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">Across all products</p>
                            </div>
                            <Package className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Product Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(productMetrics.totalRevenue)}</p>
                                <p className="text-sm text-gray-500">Total sales value</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Inventory Turnover</p>
                                <p className="text-2xl font-bold">{productMetrics.averageInventoryTurnover.toFixed(1)}x</p>
                                <p className="text-sm text-gray-500">
                                    {productMetrics.averageInventoryTurnover > 2 ? 'Excellent' :
                                        productMetrics.averageInventoryTurnover > 1 ? 'Good' : 'Needs improvement'}
                                </p>
                            </div>
                            <Zap className="h-8 w-8 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Products</p>
                                <p className="text-2xl font-bold">{products?.length || 0}</p>
                                <p className="text-sm text-gray-500">In catalog</p>
                            </div>
                            <Star className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(productMetrics.categoryPerformance)
                            .sort(([, a], [, b]) => b.revenue - a.revenue)
                            .slice(0, 8)
                            .map(([category, data]) => (
                                <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{category}</h4>
                                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                            <span>{data.productCount} products</span>
                                            <span>{data.unitsSold} units sold</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(data.revenue)}</p>
                                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-primary h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (data.revenue / productMetrics.totalRevenue) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* Best Selling Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Best Selling Products</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {productMetrics.bestSellers.slice(0, 10).map((performance, index) => (
                            <div key={performance.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-green-600">{index + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{performance.product.name}</h4>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                            <span>SKU: {performance.product.sku}</span>
                                            <span>{performance.product.category}</span>
                                            {getPerformanceBadge(performance)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                        <div>
                                            <p className="font-medium">{performance.totalSold} units</p>
                                            <p className="text-sm text-gray-600">{formatCurrency(performance.totalRevenue)}</p>
                                        </div>
                                        <div className={`flex items-center space-x-1 ${getTrendColor(performance.trend)}`}>
                                            {getTrendIcon(performance.trend)}
                                            <span className="text-sm">{Math.abs(performance.trendPercentage).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Highest Margin Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Star className="h-5 w-5" />
                        <span>Highest Profit Margin Products</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {productMetrics.highestMargin.slice(0, 10).map((performance, index) => (
                            <div key={performance.product.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-yellow-600">{index + 1}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{performance.product.name}</h4>
                                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                            <span>Cost: {formatCurrency(performance.product.purchase_price)}</span>
                                            <span>Price: {formatCurrency(performance.product.selling_price)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-green-600">{performance.profitMargin.toFixed(1)}%</p>
                                    <p className="text-sm text-gray-600">{performance.totalSold} units sold</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Turnover Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="h-5 w-5 text-green-600" />
                            <span>Fastest Moving Products</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {productMetrics.fastestTurnover.slice(0, 5).map((performance, index) => (
                                <div key={performance.product.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <span className="text-xs font-medium text-green-600">{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{performance.product.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {performance.daysToSellOut === Infinity ? 'Never' : `${Math.round(performance.daysToSellOut)} days to sell out`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600">{performance.inventoryTurnover.toFixed(1)}x</p>
                                        <p className="text-xs text-gray-500">{performance.totalSold} sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span>Slowest Moving Products</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {productMetrics.slowestTurnover.slice(0, 5).map((performance, index) => (
                                <div key={performance.product.id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                                            <span className="text-xs font-medium text-red-600">{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{performance.product.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Stock: {performance.product.current_stock} units
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-red-600">{performance.inventoryTurnover.toFixed(1)}x</p>
                                        <p className="text-xs text-gray-500">{performance.totalSold} sold</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}