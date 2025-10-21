'use client'

import { useState, useEffect } from 'react'
import { useCustomerSearch } from '@/hooks/use-customers'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Filter, X, Users, CreditCard, Calendar } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CustomerSearchProps {
  businessId: string
  onSearchChange: (query: string) => void
  searchQuery: string
}

interface SearchFilters {
  hasOutstandingBalance: boolean
  hasEmail: boolean
  hasPhone: boolean
  sortBy: 'name' | 'total_purchases' | 'last_visit_date' | 'outstanding_balance'
  sortOrder: 'asc' | 'desc'
  tags: string[]
}

export function CustomerSearch({ businessId, onSearchChange, searchQuery }: CustomerSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [filters, setFilters] = useState<SearchFilters>({
    hasOutstandingBalance: false,
    hasEmail: false,
    hasPhone: false,
    sortBy: 'name',
    sortOrder: 'asc',
    tags: [],
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [localQuery, onSearchChange])

  const { data: searchResults } = useCustomerSearch(businessId, localQuery)

  const clearFilters = () => {
    setFilters({
      hasOutstandingBalance: false,
      hasEmail: false,
      hasPhone: false,
      sortBy: 'name',
      sortOrder: 'asc',
      tags: [],
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    typeof value === 'boolean' ? value : 
    Array.isArray(value) ? value.length > 0 : 
    false
  ).length

  const commonTags = [
    'VIP',
    'Regular',
    'Wholesale',
    'New Customer',
    'Frequent Buyer',
    'High Value',
    'Local',
    'Online',
  ]

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Customers</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Customer Status Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Customer Status</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOutstandingBalance"
                    checked={filters.hasOutstandingBalance}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({ ...prev, hasOutstandingBalance: !!checked }))
                    }
                  />
                  <Label htmlFor="hasOutstandingBalance" className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Has Outstanding Balance
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasEmail"
                    checked={filters.hasEmail}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({ ...prev, hasEmail: !!checked }))
                    }
                  />
                  <Label htmlFor="hasEmail" className="text-sm">
                    Has Email Address
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPhone"
                    checked={filters.hasPhone}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({ ...prev, hasPhone: !!checked }))
                    }
                  />
                  <Label htmlFor="hasPhone" className="text-sm">
                    Has Phone Number
                  </Label>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sort By</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: SearchFilters['sortBy']) =>
                      setFilters(prev => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="total_purchases">Total Purchases</SelectItem>
                      <SelectItem value="last_visit_date">Last Visit</SelectItem>
                      <SelectItem value="outstanding_balance">Outstanding Balance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: SearchFilters['sortOrder']) =>
                      setFilters(prev => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Customer Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.includes(tag)
                            ? prev.tags.filter(t => t !== tag)
                            : [...prev.tags, tag]
                        }))
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.hasOutstandingBalance && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Outstanding Balance
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters(prev => ({ ...prev, hasOutstandingBalance: false }))}
              />
            </Badge>
          )}
          
          {filters.hasEmail && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Has Email
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters(prev => ({ ...prev, hasEmail: false }))}
              />
            </Badge>
          )}
          
          {filters.hasPhone && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Has Phone
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters(prev => ({ ...prev, hasPhone: false }))}
              />
            </Badge>
          )}

          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters(prev => ({
                  ...prev,
                  tags: prev.tags.filter(t => t !== tag)
                }))}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Search Results */}
      {localQuery.length >= 2 && searchResults && searchResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick Results</span>
              <Badge variant="outline">{searchResults.length}</Badge>
            </div>
            <div className="space-y-2">
              {searchResults.slice(0, 5).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.phone && `${customer.phone} • `}
                      {customer.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      NPR {customer.total_purchases.toLocaleString()}
                    </p>
                    {customer.outstanding_balance > 0 && (
                      <p className="text-sm text-red-600">
                        Outstanding: NPR {customer.outstanding_balance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}