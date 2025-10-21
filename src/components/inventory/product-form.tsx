'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products'
import { useBusinesses } from '@/hooks/use-businesses'
import type { Product } from '@/types/database'

// Product form validation schema - removed selling_price as it's for sales
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  purchase_price: z.number().min(0, 'Purchase price must be positive'),
  current_stock: z.number().int().min(0, 'Stock must be non-negative'),
  min_stock_level: z.number().int().min(0, 'Minimum stock level must be non-negative'),
})

type ProductFormData = z.infer<typeof productFormSchema>

interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { user } = useAuth()
  const [images, setImages] = useState<string[]>(product?.images || [])
  const [uploading, setUploading] = useState(false)

  // Get business ID
  const { data: businesses } = useBusinesses(user?.id || '')
  const businessId = businesses?.[0]?.id

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? {
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      category: product.category || '',
      purchase_price: product.purchase_price || 0,
      current_stock: product.current_stock || 0,
      min_stock_level: product.min_stock_level || 0,
    } : {
      name: '',
      description: '',
      sku: '',
      category: '',
      purchase_price: 0,
      current_stock: 0,
      min_stock_level: 0,
    }
  })

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      setImages(prev => [...prev, ...uploadedUrls])
      toast.success('Images uploaded successfully!')
    } catch (error: unknown) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!businessId) {
      toast.error('No business found')
      return
    }

    const productData = {
      ...data,
      business_id: businessId,
      images: images,
      active: true,
      selling_price: 0, // Will be set during sales
      variants: [],
      purchase_price: data.purchase_price,
    }

    try {
      if (product?.id) {
        await updateProduct.mutateAsync({ id: product.id, updates: productData })
      } else {
        await createProduct.mutateAsync(productData)
      }

      reset()
      setImages([])
      onSuccess?.()
    } catch {
      // Error handling is done in the hooks
    }
  }

  const isLoading = createProduct.isPending || updateProduct.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU/Barcode</Label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="Enter SKU or barcode"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Kurti, Saree, Dress"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price (NPR)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('purchase_price', {
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' ? undefined : Number(value)
                  })}
                  placeholder="Enter purchase price"
                />
                {errors.purchase_price && (
                  <p className="text-sm text-red-500">{errors.purchase_price.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  Selling price will be set during sales
                </p>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Stock Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_stock">Current Stock *</Label>
                <Input
                  id="current_stock"
                  type="number"
                  {...register('current_stock', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.current_stock && (
                  <p className="text-sm text-red-500">{errors.current_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Minimum Stock Level *</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  {...register('min_stock_level', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.min_stock_level && (
                  <p className="text-sm text-red-500">{errors.min_stock_level.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Images</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload Images
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  Upload multiple product images
                </span>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !businessId}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {product ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}