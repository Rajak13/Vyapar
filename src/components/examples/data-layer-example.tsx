/**
 * Example component demonstrating the data access layer usage
 * This file shows how to use the custom hooks with TanStack Query
 */

'use client'

import { useState } from 'react'
import {
    useProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useDashboardMetrics,
    useLowStockProducts
} from '@/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductFormData } from '@/lib/validations/database'

interface DataLayerExampleProps {
    businessId: string
}

export function DataLayerExample({ businessId }: DataLayerExampleProps) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

    // Query hooks - automatically handle loading, error, and caching
    const { data: products, isLoading: productsLoading, error: productsError } = useProducts(businessId)
    const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics(businessId)
    const { data: lowStockProducts } = useLowStockProducts(businessId)

    // Mutation hooks - handle optimistic updates and error recovery
    const createProductMutation = useCreateProduct()
    const updateProductMutation = useUpdateProduct()
    const deleteProductMutation = useDeleteProduct()

    const handleCreateProduct = () => {
        const newProduct: ProductFormData = {
            name: 'Sample Product',
            selling_price: 100,
            current_stock: 10,
            min_stock_level: 5,
            variants: [],
        }

        createProductMutation.mutate({
            business_id: businessId,
            ...newProduct,
            purchase_price: 0,
            images: [],
            variants: [],
            active: true,
        })
    }

    const handleUpdateProduct = (productId: string) => {
        updateProductMutation.mutate({
            id: productId,
            updates: {
                selling_price: 150, // Update price
                current_stock: 15,  // Update stock
            }
        })
    }

    const handleDeleteProduct = (productId: string) => {
        deleteProductMutation.mutate(productId)
    }

    if (productsLoading) {
        return <div>Loading products...</div>
    }

    if (productsError) {
        return <div>Error loading products: {productsError.message}</div>
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    {metricsLoading ? (
                        <p>Loading metrics...</p>
                    ) : metrics ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Today&apos;s Sales</p>
                                <p className="text-2xl font-bold">NPR {metrics.today_sales.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Customers</p>
                                <p className="text-2xl font-bold">{metrics.total_customers}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Payments</p>
                                <p className="text-2xl font-bold">NPR {metrics.pending_payments.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                                <p className="text-2xl font-bold text-red-600">{metrics.low_stock_items}</p>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            {/* Low Stock Alert */}
            {lowStockProducts && lowStockProducts.length > 0 && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">Low Stock Alert</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {lowStockProducts.map((product) => (
                                <div key={product.id} className="flex justify-between items-center">
                                    <span>{product.name}</span>
                                    <span className="text-red-600">
                                        {product.current_stock} / {product.min_stock_level}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Product Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Management</CardTitle>
                    <Button
                        onClick={handleCreateProduct}
                        disabled={createProductMutation.isPending}
                    >
                        {createProductMutation.isPending ? 'Creating...' : 'Add Sample Product'}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {products?.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-4 border rounded">
                                <div>
                                    <h3 className="font-medium">{product.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Stock: {product.current_stock} | Price: NPR {product.selling_price}
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleUpdateProduct(product.id)}
                                        disabled={updateProductMutation.isPending}
                                    >
                                        Update
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteProduct(product.id)}
                                        disabled={deleteProductMutation.isPending}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Mutation Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Mutation Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <p>Create Product: {createProductMutation.isPending ? 'Loading...' : 'Ready'}</p>
                        <p>Update Product: {updateProductMutation.isPending ? 'Loading...' : 'Ready'}</p>
                        <p>Delete Product: {deleteProductMutation.isPending ? 'Loading...' : 'Ready'}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}