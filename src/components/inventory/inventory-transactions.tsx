'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBusinessInventoryTransactions } from '@/hooks/use-inventory'
import { useProducts } from '@/hooks/use-products'
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Search, 
  Filter,
  Package,
  ShoppingCart,
  Truck,
  Settings
} from 'lucide-react'
import type { InventoryTransaction, TransactionType } from '@/types/database'

interface InventoryTransactionsProps {
  businessId: string
}

const transactionTypeConfig = {
  in: {
    label: 'Stock In',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    variant: 'default' as const,
  },
  out: {
    label: 'Stock Out',
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    variant: 'destructive' as const,
  },
  adjustment: {
    label: 'Adjustment',
    icon: RotateCcw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    variant: 'secondary' as const,
  },
}

const referenceTypeConfig = {
  sale: { label: 'Sale', icon: ShoppingCart },
  purchase: { label: 'Purchase', icon: Truck },
  manual_adjustment: { label: 'Manual Adjustment', icon: Settings },
  return: { label: 'Return', icon: RotateCcw },
  exchange: { label: 'Exchange', icon: Package },
}

export function InventoryTransactions({ businessId }: InventoryTransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [filterProduct, setFilterProduct] = useState<string>('all')

  const { data: transactions, isLoading } = useBusinessInventoryTransactions(businessId)
  const { data: products } = useProducts(businessId)

  // Filter transactions based on search and filters
  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesSearch = !searchTerm || 
      transaction.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.products.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    const matchesProduct = filterProduct === 'all' || transaction.product_id === filterProduct

    return matchesSearch && matchesType && matchesProduct
  }) || []

  // Calculate summary statistics
  const summary = filteredTransactions.reduce((acc, transaction) => {
    if (transaction.transaction_type === 'in') {
      acc.totalIn += transaction.quantity
    } else if (transaction.transaction_type === 'out') {
      acc.totalOut += transaction.quantity
    } else if (transaction.transaction_type === 'adjustment') {
      if (transaction.quantity > 0) {
        acc.totalIn += transaction.quantity
      } else {
        acc.totalOut += Math.abs(transaction.quantity)
      }
    }
    return acc
  }, { totalIn: 0, totalOut: 0 })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Stock In</p>
                <div className="text-2xl font-bold text-green-600">{summary.totalIn}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Stock Out</p>
                <div className="text-2xl font-bold text-red-600">{summary.totalOut}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Net Movement</p>
                <div className={`text-2xl font-bold ${
                  summary.totalIn - summary.totalOut >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.totalIn - summary.totalOut > 0 ? '+' : ''}{summary.totalIn - summary.totalOut}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name, SKU, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
            <Select value={filterType} onValueChange={(value) => setFilterType(value as TransactionType | 'all')}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Filter */}
            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger className="w-[200px]">
                <Package className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const config = transactionTypeConfig[transaction.transaction_type]
                    const Icon = config.icon
                    const refConfig = transaction.reference_type 
                      ? referenceTypeConfig[transaction.reference_type as keyof typeof referenceTypeConfig]
                      : null
                    const RefIcon = refConfig?.icon

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(transaction.timestamp), 'hh:mm a')}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.products.name}</div>
                            {transaction.products.sku && (
                              <div className="text-sm text-muted-foreground">
                                SKU: {transaction.products.sku}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <span className={`font-medium ${
                            transaction.transaction_type === 'in' || 
                            (transaction.transaction_type === 'adjustment' && transaction.quantity > 0)
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'in' || 
                             (transaction.transaction_type === 'adjustment' && transaction.quantity > 0)
                              ? '+' : '-'}
                            {Math.abs(transaction.quantity)}
                          </span>
                        </TableCell>

                        <TableCell>
                          {refConfig && RefIcon ? (
                            <div className="flex items-center gap-1 text-sm">
                              <RefIcon className="h-3 w-3" />
                              {refConfig.label}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {transaction.notes || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results Count */}
          {filteredTransactions.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}