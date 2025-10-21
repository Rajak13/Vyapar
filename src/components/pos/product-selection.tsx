'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Package, 
  Grid3X3,
  List
} from 'lucide-react'
import { useProducts } from '@/hooks/use-products'
import type { Product, ProductVariant } from '@/types/database'
import { useBusinesses } from '@/hooks/use-businesses'
import { useAuth } from '@/contexts/auth-context'
import { CartItem } from './pos-interface'
import { ProductVariantSelector } from './product-variant-selector'
import { cn } from '@/lib/utils'

interface ProductSelectionProps {
  onAddToCart: (item: Omit<CartItem, 'id' | 'total'>) => void
}

export function ProductSelection({ onAddToCart }: ProductSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProduct, setSelectedProduct] = useState<Product & { suppliers?: { id: string; name: string } } | null>(null)

  const { user } = useAuth()
  const { data: businesses = [] } = useBusinesses(user?.id || '')
  const currentBusiness = businesses[0] // For now, use the first business
  const { data: products = [], isLoading } = useProducts(currentBusiness?.id || '')

  // Filter and search products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      return matchesSearch && matchesCategory && product.active
    })
  }, [products, searchQuery, selectedCategory])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = products.reduce((acc, product) => {
      if (product.category && !acc.includes(product.category)) {
        acc.push(product.category)
      }
      return acc
    }, [] as string[])
    return ['all', ...cats]
  }, [products])

  const handleAddToCart = (product: Product, variant?: ProductVariant & {
    id: string
    name: string
    price?: number
  }, quantity = 1) => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      quantity,
      stock: product.current_stock,
      variant,
    })
    setSelectedProduct(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === 'all' ? 'All' : category}
                </Button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'space-y-2'
      )}>
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              viewMode === 'list' && "flex-row"
            )}
            onClick={() => setSelectedProduct(product)}
          >
            <CardContent className={cn(
              "p-4",
              viewMode === 'list' && "flex items-center justify-between"
            )}>
              {viewMode === 'grid' ? (
                <div className="space-y-3">
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package className={`h-8 w-8 text-gray-400 ${product.images && product.images.length > 0 ? 'hidden' : ''}`} />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary">
                        NPR {product.selling_price.toLocaleString()}
                      </span>
                      <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'}>
                        {product.current_stock} in stock
                      </Badge>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full"
                    disabled={product.current_stock <= 0}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (product.variants && product.variants.length > 0) {
                        setSelectedProduct(product)
                      } else {
                        handleAddToCart(product)
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Package className={`h-6 w-6 text-gray-400 ${product.images && product.images.length > 0 ? 'hidden' : ''}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        NPR {product.selling_price.toLocaleString()}
                      </div>
                      <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'} className="text-xs">
                        {product.current_stock} in stock
                      </Badge>
                    </div>
                    
                    <Button 
                      size="sm"
                      disabled={product.current_stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (product.variants && product.variants.length > 0) {
                          setSelectedProduct(product)
                        } else {
                          handleAddToCart(product)
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add some products to your inventory to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Product Variant Selector Modal */}
      {selectedProduct && (
        <ProductVariantSelector
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}