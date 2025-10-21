'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProductStockSummary, useInventoryTransactions } from '@/hooks/use-inventory'
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  Calendar,
  Package,
  Activity
} from 'lucide-react'
import type { Product } from '@/types/database'

interface StockMovementSummaryProps {
  product: Product
}

const periodOptions = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
]

export function StockMovementSummary({ product }: StockMovementSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  
  const { data: stockSummary, isLoading: summaryLoading } = useProductStockSummary(product.id, selectedPeriod)
  const { data: recentTransactions, isLoading: transactionsLoading } = useInventoryTransactions(product.id, 10)

  if (summaryLoading || transactionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Stock Movement Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const summary = stockSummary || { totalIn: 0, totalOut: 0, netChange: 0, transactions: [] }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Stock Movement Summary
        </h3>
        <Select 
          value={selectedPeriod.toString()} 
          onValueChange={(value) => setSelectedPeriod(parseInt(value))}
        >
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Stock In</p>
                <div className="text-2xl font-bold text-green-600">+{summary.totalIn}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Stock Out</p>
                <div className="text-2xl font-bold text-red-600">-{summary.totalOut}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Net Change</p>
                <div className={`text-2xl font-bold ${
                  summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.netChange > 0 ? '+' : ''}{summary.netChange}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Current Stock</p>
                <div className="text-2xl font-bold">{product.current_stock}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentTransactions || recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent transactions found
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const isPositive = transaction.transaction_type === 'in' || 
                  (transaction.transaction_type === 'adjustment' && transaction.quantity > 0)
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'in' ? 'bg-green-100' :
                        transaction.transaction_type === 'out' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {transaction.transaction_type === 'in' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {transaction.transaction_type === 'out' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        {transaction.transaction_type === 'adjustment' && <RotateCcw className="h-4 w-4 text-blue-600" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            transaction.transaction_type === 'in' ? 'default' :
                            transaction.transaction_type === 'out' ? 'destructive' : 'secondary'
                          }>
                            {transaction.transaction_type === 'in' ? 'Stock In' :
                             transaction.transaction_type === 'out' ? 'Stock Out' : 'Adjustment'}
                          </Badge>
                          <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : '-'}{Math.abs(transaction.quantity)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          {format(new Date(transaction.timestamp), 'MMM dd, yyyy hh:mm a')}
                          {transaction.notes && (
                            <span className="ml-2">• {transaction.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {transaction.reference_type && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.reference_type.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Stock Level</span>
              <span className="font-medium">{product.current_stock} units</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Minimum Stock Level</span>
              <span className="font-medium">{product.min_stock_level} units</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock Status</span>
              <Badge variant={
                product.current_stock <= 0 ? 'destructive' :
                product.current_stock <= product.min_stock_level ? 'secondary' : 'default'
              }>
                {product.current_stock <= 0 ? 'Out of Stock' :
                 product.current_stock <= product.min_stock_level ? 'Low Stock' : 'In Stock'}
              </Badge>
            </div>

            {selectedPeriod > 0 && summary.transactions.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Average Daily Movement ({selectedPeriod} days)
                </span>
                <span className="font-medium">
                  {(Math.abs(summary.netChange) / selectedPeriod).toFixed(1)} units/day
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}