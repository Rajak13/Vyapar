'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Minus } from 'lucide-react'


import type { Product as DatabaseProduct, ProductVariant } from '@/types/database'

interface Product extends DatabaseProduct {
  current_stock: number
}

interface ProductVariantSelectorProps {
  product: Product
  onAddToCart: (product: Product, variant?: ProductVariant & {
    id: string
    name: string
    price?: number
  }, quantity?: number) => void
  onClose: () => void
}

export function ProductVariantSelector({
  product,
  onAddToCart,
  onClose
}: ProductVariantSelectorProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)

  const variants = product.variants || []

  // Get unique values for each variant type
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))] as string[]
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))] as string[]
  const materials = [...new Set(variants.map(v => v.material).filter(Boolean))] as string[]

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariant((prev: ProductVariant | null) => ({
      size: prev?.size,
      color: prev?.color,
      material: prev?.material,
      design: prev?.design,
      additional_price: prev?.additional_price || 0,
      stock_adjustment: prev?.stock_adjustment || 0,
      ...prev,
      [type]: value
    }))
  }

  const getVariantPrice = () => {
    if (!selectedVariant) return product.selling_price

    const matchingVariant = variants.find(v =>
      (!selectedVariant.size || v.size === selectedVariant.size) &&
      (!selectedVariant.color || v.color === selectedVariant.color) &&
      (!selectedVariant.material || v.material === selectedVariant.material)
    )

    const additionalPrice = matchingVariant?.additional_price || 0
    return product.selling_price + additionalPrice
  }

  const handleAddToCart = () => {
    const hasVariants = sizes.length > 0 || colors.length > 0 || materials.length > 0
    
    let variantToAdd: (ProductVariant & { id: string; name: string; price?: number }) | undefined = undefined
    
    if (hasVariants && selectedVariant) {
      // Create a unique ID for the variant combination
      const variantId = `${product.id}-${selectedVariant.size || 'no-size'}-${selectedVariant.color || 'no-color'}-${selectedVariant.material || 'no-material'}`
      
      // Create a descriptive name for the variant
      const variantParts = [
        selectedVariant.size,
        selectedVariant.color,
        selectedVariant.material
      ].filter(Boolean)
      const variantName = variantParts.length > 0 ? variantParts.join(', ') : 'Default'
      
      variantToAdd = {
        ...selectedVariant,
        id: variantId,
        name: variantName,
        price: getVariantPrice()
      }
    }
    
    onAddToCart(product, variantToAdd, quantity)
    onClose()
  }

  const canAddToCart = () => {
    // If product has variants, ensure required ones are selected
    if (sizes.length > 0 && !selectedVariant?.size) return false
    if (colors.length > 0 && !selectedVariant?.color) return false
    if (materials.length > 0 && !selectedVariant?.material) return false
    return quantity > 0 && quantity <= product.current_stock
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              <p className="font-bold text-lg text-primary">
                NPR {getVariantPrice().toLocaleString()}
              </p>
            </div>
            <Badge variant={product.current_stock > 0 ? 'default' : 'destructive'}>
              {product.current_stock} in stock
            </Badge>
          </div>

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Size</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedVariant?.size === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVariantChange('size', size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {colors.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedVariant?.color === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVariantChange('color', color)}
                    className="capitalize"
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Material Selection */}
          {materials.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Material</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {materials.map((material) => (
                  <Button
                    key={material}
                    variant={selectedVariant?.material === material ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleVariantChange('material', material)}
                    className="capitalize"
                  >
                    {material}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <Label className="text-sm font-medium">Quantity</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min="1"
                max={product.current_stock}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(product.current_stock, quantity + 1))}
                disabled={quantity >= product.current_stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Total Price */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">
                NPR {(getVariantPrice() * quantity).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}