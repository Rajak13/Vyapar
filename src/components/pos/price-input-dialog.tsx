'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatNPR } from '@/lib/nepal-utils'

interface PriceInputDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (price: number) => void
  productName: string
  suggestedPrice?: number
}

export function PriceInputDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
  suggestedPrice
}: PriceInputDialogProps) {
  const [price, setPrice] = useState(suggestedPrice?.toString() || '')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    const numPrice = Number(price)
    
    if (!price || isNaN(numPrice)) {
      setError('Please enter a valid price')
      return
    }
    
    if (numPrice <= 0) {
      setError('Price must be greater than 0')
      return
    }
    
    onConfirm(numPrice)
    setPrice('')
    setError('')
    onClose()
  }

  const handleClose = () => {
    setPrice('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Selling Price</DialogTitle>
          <DialogDescription>
            Enter the selling price for &quot;{productName}&quot;
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price">Selling Price (NPR)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value)
                setError('')
              }}
              placeholder="Enter price"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm()
                }
              }}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
          {suggestedPrice && (
            <div className="text-sm text-gray-600">
              Suggested price: {formatNPR(suggestedPrice)}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}