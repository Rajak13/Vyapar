'use client'

import { useState, useMemo } from 'react'
import { useExpenses } from '@/hooks/use-expenses'
import { 
  Search, 
  Building, 
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Vendor {
  id: string
  name: string
  total_expenses: number
  last_expense_date?: string
  created_at: string
}

interface VendorManagementProps {
  businessId: string
}

export function VendorManagement({ businessId }: VendorManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch expenses to extract vendor information
  const { data: expenses = [], isLoading } = useExpenses(businessId)

  // Extract unique vendors from expenses
  const vendors = useMemo(() => {
    const vendorMap = new Map<string, Vendor & { expense_count: number }>()

    expenses.forEach((expense) => {
      if (expense.vendor) {
        const vendorName = expense.vendor
        const existing = vendorMap.get(vendorName)

        if (existing) {
          // Update existing vendor stats
          existing.total_expenses += expense.amount
          existing.expense_count += 1
          if (!existing.last_expense_date || expense.expense_date > existing.last_expense_date) {
            existing.last_expense_date = expense.expense_date
          }
        } else {
          // Create new vendor entry
          vendorMap.set(vendorName, {
            id: vendorName, // Use vendor name as ID
            name: vendorName,
            total_expenses: expense.amount,
            expense_count: 1,
            last_expense_date: expense.expense_date,
            created_at: expense.created_at,
          })
        }
      }
    })

    return Array.from(vendorMap.values()).sort((a, b) => 
      b.total_expenses - a.total_expenses
    )
  }, [expenses])

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendor Management</h2>
          <p className="text-gray-600">View vendors from your expense records</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search term.'
                  : 'Vendors will appear here once you record expenses with vendor names.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Expenses</TableHead>
                    <TableHead>Last Expense</TableHead>
                    <TableHead>Expense Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{vendor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          NPR {vendor.total_expenses.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {vendor.last_expense_date ? (
                          <Badge variant="outline">
                            {new Date(vendor.last_expense_date).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No expenses</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {(vendor as any).expense_count || 0} expenses
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

    </div>
  )
}