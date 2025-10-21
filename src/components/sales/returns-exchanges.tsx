'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, RotateCcw, Plus, Calendar, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useBusinesses } from '@/hooks/use-businesses'
import { formatNPR } from '@/lib/nepal-utils'
import { toast } from 'sonner'
import { ReturnExchange } from '@/types/database'

interface ReturnsExchangesProps {
  businessId?: string
}

type ReturnWithRelations = ReturnExchange & {
  sales?: {
    invoice_number: string
    customers?: {
      name: string
    }
  }
}

export function ReturnsExchanges({ businessId }: ReturnsExchangesProps) {
  const [returns, setReturns] = useState<ReturnWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewReturn, setShowNewReturn] = useState(false)

  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const currentBusinessId = businessId || businesses?.[0]?.id

  useEffect(() => {
    if (currentBusinessId) {
      fetchReturns()
    }
  }, [currentBusinessId])

  const fetchReturns = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('returns_exchanges')
        .select(`
          *,
          sales (
            invoice_number,
            customers (
              name
            )
          )
        `)
        .eq('business_id', currentBusinessId)
        .order('created_at', { ascending: false })

      if (error && error.code !== 'PGRST116') { // Table might not exist
        throw error
      }
      setReturns(data || [])
    } catch (error: unknown) {
      console.error('Error fetching returns:', error)
      // Don't show error if table doesn't exist - it's expected
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        toast.error('Failed to load returns')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredReturns = returns.filter(returnItem =>
    returnItem.return_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    returnItem.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search returns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowNewReturn(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Process Return
        </Button>
      </div>

      {/* Returns List */}
      <div className="space-y-3">
        {filteredReturns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <RotateCcw className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No returns found</h3>
              <p className="text-gray-500 text-center mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'No returns have been processed yet'}
              </p>
              <Button onClick={() => setShowNewReturn(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Process First Return
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReturns.map((returnItem) => (
            <Card key={returnItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <RotateCcw className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{returnItem.return_number || returnItem.id}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(returnItem.return_date || returnItem.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Receipt className="h-3 w-3 mr-1" />
                          {returnItem.original_sale_id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatNPR(returnItem.refund_amount)}
                      </div>
                      <Badge
                        variant={returnItem.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {returnItem.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Return Modal */}
      {showNewReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Process Return/Exchange</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <RotateCcw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Returns System</h3>
                <p className="text-gray-500 mb-4">
                  The returns and exchanges system will be implemented here.
                </p>
                <p className="text-sm text-gray-400">
                  This will include features like:
                  <br />• Search and select original sale
                  <br />• Select items to return
                  <br />• Calculate refund amounts
                  <br />• Update inventory
                  <br />• Generate return receipts
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewReturn(false)}>
                  Close
                </Button>
                <Button disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}