'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Receipt, Calendar, User, DollarSign, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { useDeleteSale } from '@/hooks/use-sales'
import { formatNPR } from '@/lib/nepal-utils'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SalesHistoryProps {
  businessId?: string
}

export function SalesHistory({ businessId }: SalesHistoryProps) {
  const [sales, setSales] = useState<Array<{
    id: string
    invoice_number: string
    total_amount: number
    created_at: string
    customer?: { name: string }
    payment_status: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<{
    id: string
    invoice_number: string
    total_amount: number
    created_at: string
    customer?: { name: string }
    payment_status: string
    items?: Array<{
      product_name: string
      quantity: number
      unit_price: number
    }>
  } | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
  
  const deleteSaleMutation = useDeleteSale()

  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const currentBusinessId = businessId || businesses?.[0]?.id

  useEffect(() => {
    if (currentBusinessId) {
      fetchSales()
    }
  }, [currentBusinessId])

  const fetchSales = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .eq('business_id', currentBusinessId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSales(data || [])
    } catch (error: unknown) {
      console.error('Error fetching sales:', error)
      toast.error('Failed to load sales history')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSales = sales.filter(sale =>
    sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSaleMutation.mutateAsync(saleId)
      toast.success('Sale deleted successfully. Stock has been restored.')
      setSaleToDelete(null)
      fetchSales() // Refresh the list
    } catch (error) {
      console.error('Error deleting sale:', error)
      toast.error('Failed to delete sale')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by invoice number or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sales List */}
      <div className="space-y-3">
        {filteredSales.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Receipt className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery ? 'Try adjusting your search criteria' : 'No sales have been made yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Receipt className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{sale.invoice_number}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(sale.created_at).toLocaleDateString()}
                        </div>
                        {sale.customer && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {sale.customer.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatNPR(sale.total_amount)}
                      </div>
                      <Badge 
                        variant={sale.payment_status === 'paid' ? 'default' : 'destructive'}
                      >
                        {sale.payment_status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSaleToDelete(sale.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Sale Details - {selectedSale.invoice_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{new Date(selectedSale.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p>{selectedSale.customer?.name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtotal</label>
                  <p>{formatNPR(selectedSale.total_amount * 0.9)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Discount</label>
                  <p>{formatNPR(selectedSale.total_amount * 0.1)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total</label>
                  <p className="font-semibold">{formatNPR(selectedSale.total_amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={selectedSale.payment_status === 'paid' ? 'default' : 'destructive'}>
                    {selectedSale.payment_status}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="text-sm font-medium text-gray-500">Items</label>
                <div className="mt-2 space-y-2">
                  {selectedSale.items?.map((item: {
                    product_name: string
                    quantity: number
                    unit_price: number
                  }, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{item.product_name || 'Product'}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span>{formatNPR(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between space-x-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setSaleToDelete(selectedSale.id)
                    setSelectedSale(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sale
                </Button>
                <Button variant="outline" onClick={() => setSelectedSale(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!saleToDelete} onOpenChange={() => setSaleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this sale and restore the stock for all items. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToDelete && handleDeleteSale(saleToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}