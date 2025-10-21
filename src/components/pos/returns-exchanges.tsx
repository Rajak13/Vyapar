'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  RotateCcw, 
  RefreshCw, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Receipt,
  AlertCircle,
  Calendar,
  User,
  Package
} from 'lucide-react'
import { useReturns, useSaleForReturn, useCreateReturn, useProcessReturn } from '@/hooks/use-returns'
import { useBusinesses } from '@/hooks/use-businesses'
import { useAuth } from '@/contexts/auth-context'
import { ReturnItem, Sale, ReturnReason, ReturnType, ReturnExchange } from '@/types/database'
import { toast } from 'sonner'
import { error } from 'console'

interface ReturnExchangeFormData {
  original_sale_id: string
  return_type: ReturnType
  reason: ReturnReason
  reason_description?: string
  returned_items: ReturnItem[]
  exchange_items: ReturnItem[]
  notes?: string
}

export function ReturnsExchanges() {
  const { user } = useAuth()
  const { data: businesses } = useBusinesses(user?.id || '')
  const currentBusiness = businesses?.[0]
  const { data: returns, isLoading } = useReturns(currentBusiness?.id)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredReturns = returns?.filter(returnItem => {
    const matchesSearch = 
      returnItem.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.original_sale?.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getReasonLabel = (reason: ReturnReason) => {
    const labels = {
      defective: 'Defective',
      wrong_size: 'Wrong Size',
      wrong_color: 'Wrong Color',
      customer_changed_mind: 'Changed Mind',
      damaged: 'Damaged',
      other: 'Other'
    }
    return labels[reason] || reason
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Exchanges</h1>
          <p className="text-gray-600">Manage product returns and exchanges</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Return/Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Return/Exchange</DialogTitle>
            </DialogHeader>
            <CreateReturnExchangeForm 
              businessId={currentBusiness?.id || ''}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by return number, customer, or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No returns found</h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No returns match your current filters.' 
                  : 'You haven\'t processed any returns or exchanges yet.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create First Return/Exchange
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredReturns?.map((returnItem) => (
            <ReturnExchangeCard key={returnItem.id} returnItem={returnItem} />
          ))
        )}
      </div>
    </div>
  )
}

function ReturnExchangeCard({ returnItem }: { 
  returnItem: ReturnExchange & { 
    customer?: { id: string; name: string; phone?: string } 
    original_sale?: { id: string; invoice_number: string; sale_date: string; total_amount: number }
  } 
}) {
  const processReturn = useProcessReturn()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleApprove = () => {
    processReturn.mutate({ returnId: returnItem.id, approve: true })
  }

  const handleReject = () => {
    processReturn.mutate({ returnId: returnItem.id, approve: false })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{returnItem.return_number}</h3>
              <Badge className={getStatusColor(returnItem.status)}>
                {returnItem.status}
              </Badge>
              <Badge variant="outline">
                {returnItem.return_type === 'return' ? (
                  <RotateCcw className="h-3 w-3 mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {returnItem.return_type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(returnItem.return_date).toLocaleDateString()}
              </div>
              {returnItem.customer && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {returnItem.customer.name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                {returnItem.original_sale?.invoice_number}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-semibold">
              NPR {returnItem.original_amount.toLocaleString()}
            </div>
            {returnItem.return_type === 'exchange' && returnItem.exchange_difference !== 0 && (
              <div className={`text-sm ${returnItem.exchange_difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {returnItem.exchange_difference > 0 ? '+' : ''}NPR {returnItem.exchange_difference.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Reason:</span>
            <span>{getReasonLabel(returnItem.reason as ReturnReason)}</span>
            {returnItem.reason_description && (
              <span className="text-gray-600">- {returnItem.reason_description}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Items:</span>
            <span>{returnItem.returned_items.length} returned</span>
            {returnItem.exchange_items.length > 0 && (
              <span>, {returnItem.exchange_items.length} exchanged</span>
            )}
          </div>

          {returnItem.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={handleApprove}
                disabled={processReturn.isPending}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleReject}
                disabled={processReturn.isPending}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>

          {isExpanded && (
            <div className="border-t pt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Returned Items</h4>
                <div className="space-y-2">
                  {returnItem.returned_items.map((item: ReturnItem, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        {item.variant && (
                          <span className="text-gray-600 ml-2">
                            ({Object.entries(item.variant).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div>Qty: {item.quantity}</div>
                        <div className="font-medium">NPR {item.total_price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {returnItem.exchange_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Exchange Items</h4>
                  <div className="space-y-2">
                    {returnItem.exchange_items.map((item: ReturnItem, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm bg-blue-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{item.product_name}</span>
                          {item.variant && (
                            <span className="text-gray-600 ml-2">
                              ({Object.entries(item.variant).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <div>Qty: {item.quantity}</div>
                          <div className="font-medium">NPR {item.total_price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {returnItem.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{returnItem.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateReturnExchangeForm({ 
  businessId, 
  onSuccess 
}: { 
  businessId: string
  onSuccess: () => void 
}) {
  const [saleId, setSaleId] = useState('')
  const [formData, setFormData] = useState<Partial<ReturnExchangeFormData>>({
    return_type: 'return',
    reason: 'defective',
    returned_items: [],
    exchange_items: []
  })

  const { data: sale } = useSaleForReturn(saleId)
  const createReturn = useCreateReturn()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sale || !formData.returned_items?.length) {
      toast.error('Please select items to return')
      return
    }

    try {
      await createReturn.mutateAsync({
        business_id: businessId,
        original_sale_id: sale.id,
        customer_id: sale.customer_id || undefined,
        return_type: formData.return_type!,
        reason: formData.reason!,
        reason_description: formData.reason_description,
        returned_items: formData.returned_items,
        exchange_items: formData.exchange_items || [],
        notes: formData.notes
      })
      onSuccess()
    } catch {
      console.error('Error creating return:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="sale-lookup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sale-lookup">Find Sale</TabsTrigger>
          <TabsTrigger value="return-details" disabled={!sale}>Return Details</TabsTrigger>
          <TabsTrigger value="review" disabled={!formData.returned_items?.length}>Review</TabsTrigger>
        </TabsList>

        <TabsContent value="sale-lookup" className="space-y-4">
          <div>
            <Label htmlFor="sale-search">Search Sale by Invoice Number</Label>
            <Input
              id="sale-search"
              placeholder="Enter invoice number..."
              value={saleId}
              onChange={(e) => setSaleId(e.target.value)}
            />
          </div>

          {sale && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sale Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Invoice:</span> {sale.invoice_number}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {new Date(sale.sale_date).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span> {sale.customer?.name || 'Walk-in'}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> NPR {sale.total_amount.toLocaleString()}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {sale.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <span>{item.product_name}</span>
                        <span>Qty: {item.quantity} × NPR {item.unit_price} = NPR {item.total_price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="return-details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="return-type">Type</Label>
              <Select 
                value={formData.return_type} 
                onValueChange={(value: ReturnType) => setFormData(prev => ({ ...prev, return_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="exchange">Exchange</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(value: ReturnReason) => setFormData(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">Defective</SelectItem>
                  <SelectItem value="wrong_size">Wrong Size</SelectItem>
                  <SelectItem value="wrong_color">Wrong Color</SelectItem>
                  <SelectItem value="customer_changed_mind">Changed Mind</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="reason-description">Reason Description (Optional)</Label>
            <Textarea
              id="reason-description"
              placeholder="Additional details about the return reason..."
              value={formData.reason_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, reason_description: e.target.value }))}
            />
          </div>

          {sale && (
            <div>
              <Label>Select Items to Return</Label>
              <div className="space-y-2 mt-2">
                {sale.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <div className="text-sm text-gray-600">
                        NPR {item.unit_price} × {item.quantity} = NPR {item.total_price}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const returnItem: ReturnItem = {
                            product_id: item.product_id,
                            product_name: item.product_name,
                            variant: item.variant,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total_price: item.total_price
                          }
                          setFormData(prev => ({
                            ...prev,
                            returned_items: [...(prev.returned_items || []), returnItem]
                          }))
                        }}
                      >
                        Add to Return
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this return/exchange..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <div>
            <h3 className="font-medium mb-4">Review Return/Exchange</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Type:</span> {formData.return_type}</div>
                <div><span className="font-medium">Reason:</span> {getReasonLabel(formData.reason!)}</div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items to Return ({formData.returned_items?.length})</h4>
                <div className="space-y-2">
                  {formData.returned_items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <span>{item.product_name}</span>
                      <span>NPR {item.total_price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Return Amount:</span>
                  <span>NPR {formData.returned_items?.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createReturn.isPending} className="flex-1">
              {createReturn.isPending ? 'Creating...' : `Create ${formData.return_type}`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    case 'completed': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getReasonLabel(reason: ReturnReason) {
  const labels = {
    defective: 'Defective',
    wrong_size: 'Wrong Size',
    wrong_color: 'Wrong Color',
    customer_changed_mind: 'Changed Mind',
    damaged: 'Damaged',
    other: 'Other'
  }
  return labels[reason] || reason
}