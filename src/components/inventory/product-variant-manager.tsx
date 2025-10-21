'use client'

import { useState } from 'react'
import { Plus, X, Edit, Copy, Trash2, Save, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { Product, ProductVariant } from '@/types/database'
import { formatNPR } from '@/lib/nepal-utils'
import { toast } from 'sonner'

interface ProductVariantManagerProps {
  product: Product
  onVariantsUpdate: (variants: ProductVariant[]) => void
  trigger?: React.ReactNode
}

interface VariantTemplate {
  name: string
  attributes: {
    sizes?: string[]
    colors?: string[]
    materials?: string[]
    designs?: string[]
  }
}

// Predefined variant templates for fashion items
const VARIANT_TEMPLATES: VariantTemplate[] = [
  {
    name: 'Basic Clothing',
    attributes: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple']
    }
  },
  {
    name: 'Kurti/Dress',
    attributes: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Pink', 'Maroon', 'Navy'],
      materials: ['Cotton', 'Silk', 'Chiffon', 'Georgette', 'Rayon', 'Polyester'],
      designs: ['Plain', 'Printed', 'Embroidered', 'Block Print', 'Digital Print']
    }
  },
  {
    name: 'Saree',
    attributes: {
      colors: ['Red', 'Blue', 'Green', 'Pink', 'Yellow', 'Orange', 'Purple', 'Black', 'White'],
      materials: ['Cotton', 'Silk', 'Chiffon', 'Georgette', 'Crepe', 'Net', 'Satin'],
      designs: ['Plain', 'Printed', 'Embroidered', 'Woven', 'Bandhani', 'Block Print']
    }
  },
  {
    name: 'Shoes/Footwear',
    attributes: {
      sizes: ['5', '6', '7', '8', '9', '10', '11', '12'],
      colors: ['Black', 'Brown', 'White', 'Red', 'Blue', 'Tan']
    }
  }
]

export function ProductVariantManager({ 
  product, 
  onVariantsUpdate, 
  trigger 
}: ProductVariantManagerProps) {
  const [open, setOpen] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || [])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<number[]>([])
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<number>(0)

  // Generate variants from template
  const generateFromTemplate = (templateName: string) => {
    const template = VARIANT_TEMPLATES.find(t => t.name === templateName)
    if (!template) return

    const newVariants: ProductVariant[] = []
    const { sizes, colors, materials, designs } = template.attributes

    // Generate all combinations
    const sizesToUse = sizes || ['']
    const colorsToUse = colors || ['']
    const materialsToUse = materials || ['']
    const designsToUse = designs || ['']

    sizesToUse.forEach(size => {
      colorsToUse.forEach(color => {
        materialsToUse.forEach(material => {
          designsToUse.forEach(design => {
            // Skip empty combinations
            if (!size && !color && !material && !design) return

            newVariants.push({
              size: size || '',
              color: color || '',
              material: material || '',
              design: design || '',
              additional_price: 0,
              stock_adjustment: 0
            })
          })
        })
      })
    })

    setVariants(prev => [...prev, ...newVariants])
    toast.success(`Generated ${newVariants.length} variants from template`)
  }

  // Add single variant
  const addVariant = () => {
    const newVariant: ProductVariant = {
      size: '',
      color: '',
      material: '',
      design: '',
      additional_price: 0,
      stock_adjustment: 0
    }
    setVariants(prev => [...prev, newVariant])
  }

  // Update variant
  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    setVariants(prev => prev.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    ))
  }

  // Remove variant
  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index))
    setSelectedVariants(prev => prev.filter(i => i !== index))
  }

  // Duplicate variant
  const duplicateVariant = (index: number) => {
    const variantToDuplicate = variants[index]
    setVariants(prev => [...prev, { ...variantToDuplicate }])
  }

  // Bulk operations
  const applyBulkPriceAdjustment = () => {
    if (selectedVariants.length === 0) {
      toast.error('Please select variants to update')
      return
    }

    setVariants(prev => prev.map((variant, index) => 
      selectedVariants.includes(index) 
        ? { ...variant, additional_price: bulkPriceAdjustment }
        : variant
    ))

    setBulkPriceAdjustment(0)
    setSelectedVariants([])
    toast.success(`Updated ${selectedVariants.length} variants`)
  }

  const deleteSelectedVariants = () => {
    setVariants(prev => prev.filter((_, index) => !selectedVariants.includes(index)))
    setSelectedVariants([])
    toast.success('Deleted selected variants')
  }

  // Export variants to CSV
  const exportVariants = () => {
    if (variants.length === 0) {
      toast.error('No variants to export')
      return
    }

    const csvContent = [
      ['Size', 'Color', 'Material', 'Design', 'Additional Price', 'Stock Adjustment'],
      ...variants.map(v => [
        v.size || '',
        v.color || '',
        v.material || '',
        v.design || '',
        v.additional_price.toString(),
        v.stock_adjustment.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${product.name}-variants.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Variants exported to CSV')
  }

  // Import variants from CSV
  const importVariants = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split('\n')
        const headers = lines[0].split(',')
        
        const importedVariants: ProductVariant[] = []
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',')
          if (values.length >= 6) {
            importedVariants.push({
              size: values[0] || '',
              color: values[1] || '',
              material: values[2] || '',
              design: values[3] || '',
              additional_price: parseFloat(values[4]) || 0,
              stock_adjustment: parseInt(values[5]) || 0
            })
          }
        }

        setVariants(prev => [...prev, ...importedVariants])
        toast.success(`Imported ${importedVariants.length} variants`)
      } catch {
        toast.error('Failed to import CSV file')
      }
    }
    reader.readAsText(file)
  }

  const handleSave = () => {
    onVariantsUpdate(variants)
    setOpen(false)
    toast.success('Variants updated successfully')
  }

  const getVariantLabel = (variant: ProductVariant) => {
    const parts = [variant.size, variant.color, variant.material, variant.design]
      .filter(Boolean)
    return parts.length > 0 ? parts.join(' - ') : 'Variant'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Manage Variants ({product.variants?.length || 0})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Product Variants - {product.name}</DialogTitle>
          <DialogDescription>
            Create and manage size, color, material, and design variations for your product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="flex items-center gap-4">
                <Label>Generate from template:</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_TEMPLATES.map(template => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => generateFromTemplate(selectedTemplate)}
                  disabled={!selectedTemplate}
                >
                  Generate Variants
                </Button>
              </div>

              {/* Import/Export */}
              <div className="flex items-center gap-4">
                <Button onClick={addVariant} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Single Variant
                </Button>
                
                <Label htmlFor="variant-import" className="cursor-pointer">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </span>
                  </Button>
                </Label>
                <Input
                  id="variant-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={importVariants}
                />

                <Button onClick={exportVariants} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Button 
                  onClick={() => setBulkEditMode(!bulkEditMode)}
                  variant={bulkEditMode ? "default" : "outline"}
                >
                  {bulkEditMode ? 'Exit' : 'Bulk Edit'}
                </Button>
              </div>

              {/* Bulk Operations */}
              {bulkEditMode && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <h4 className="font-medium">Bulk Operations</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Price Adjustment:</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={bulkPriceAdjustment}
                        onChange={(e) => setBulkPriceAdjustment(parseFloat(e.target.value) || 0)}
                        className="w-32"
                        placeholder="0.00"
                      />
                      <Button 
                        onClick={applyBulkPriceAdjustment}
                        disabled={selectedVariants.length === 0}
                        size="sm"
                      >
                        Apply to Selected
                      </Button>
                    </div>
                    <Button 
                      onClick={deleteSelectedVariants}
                      disabled={selectedVariants.length === 0}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Selected: {selectedVariants.length} variants
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Product Variants ({variants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No variants created yet. Use the quick actions above to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {bulkEditMode && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedVariants.length === variants.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedVariants(variants.map((_, i) => i))
                                } else {
                                  setSelectedVariants([])
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        <TableHead>Size</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>Design</TableHead>
                        <TableHead>Price Adjustment</TableHead>
                        <TableHead>Stock Adjustment</TableHead>
                        <TableHead>Final Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant, index) => (
                        <TableRow key={index}>
                          {bulkEditMode && (
                            <TableCell>
                              <Checkbox
                                checked={selectedVariants.includes(index)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedVariants(prev => [...prev, index])
                                  } else {
                                    setSelectedVariants(prev => prev.filter(i => i !== index))
                                  }
                                }}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <Input
                              value={variant.size || ''}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              placeholder="Size"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.color || ''}
                              onChange={(e) => updateVariant(index, 'color', e.target.value)}
                              placeholder="Color"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.material || ''}
                              onChange={(e) => updateVariant(index, 'material', e.target.value)}
                              placeholder="Material"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.design || ''}
                              onChange={(e) => updateVariant(index, 'design', e.target.value)}
                              placeholder="Design"
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={variant.additional_price}
                              onChange={(e) => updateVariant(index, 'additional_price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={variant.stock_adjustment}
                              onChange={(e) => updateVariant(index, 'stock_adjustment', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatNPR(product.selling_price + variant.additional_price)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => duplicateVariant(index)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeVariant(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variant Preview */}
          {variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Variant Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {getVariantLabel(variant)}
                      {variant.additional_price !== 0 && (
                        <span className="ml-1">
                          ({variant.additional_price > 0 ? '+' : ''}{formatNPR(variant.additional_price)})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Variants
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}