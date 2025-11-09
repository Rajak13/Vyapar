'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Camera, Upload, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useCreateExpense, useUpdateExpense } from '@/hooks/use-expenses'
import type { Expense } from '@/types/database'

// Predefined expense categories as per requirements
const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Salaries',
  'Transportation',
  'Marketing',
  'Purchases',
  'Office Supplies',
  'Insurance',
  'Professional Services',
  'Maintenance',
  'Miscellaneous'
] as const

const expenseFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  description: z.string().optional(),
  vendor: z.string().optional(),
  expense_date: z.date(),
  recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseFormSchema>

interface ExpenseFormProps {
  businessId: string
  expense?: Expense
  onSuccess?: () => void
  onCancel?: () => void
}

export function ExpenseForm({ businessId, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()

  const form = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: expense?.category || '',
      amount: expense?.amount?.toString() || '',
      description: expense?.description || '',
      vendor: expense?.vendor || '',
      expense_date: expense ? new Date(expense.expense_date) : new Date(),
      recurring: expense?.recurring || false,
      recurring_frequency: expense?.recurring_frequency?.toString() || '30',
    },
  })

  const { watch, setValue } = form
  const isRecurring = watch('recurring')

  const handleReceiptUpload = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).slice(0, 3) // Limit to 3 files
    setReceiptFiles(prev => [...prev, ...newFiles].slice(0, 3))

    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setReceiptPreviews(prev => [...prev, e.target!.result as string].slice(0, 3))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeReceipt = (index: number) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index))
    setReceiptPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadReceipts = async (): Promise<string[]> => {
    if (receiptFiles.length === 0) return []

    setIsUploading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (const file of receiptFiles) {
        try {
          // Validate file size (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            console.error(`File ${file.name} is too large (max 10MB)`)
            continue
          }

          // Validate file type
          if (!file.type.startsWith('image/')) {
            console.error(`File ${file.name} is not an image`)
            continue
          }

          // Generate unique filename
          const fileExt = file.name.split('.').pop()
          const timestamp = Date.now()
          const randomStr = Math.random().toString(36).substring(7)
          const fileName = `${businessId}/${timestamp}-${randomStr}.${fileExt}`
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('receipts')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            })

          if (error) {
            console.error('Upload error:', error.message)
            console.error('Full error details:', error)
            
            // Provide specific error messages
            if (error.message.includes('not found') || error.message.includes('does not exist')) {
              throw new Error('Storage bucket "receipts" does not exist. Please create it in Supabase dashboard.')
            }
            if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('JWT')) {
              throw new Error(`Permission denied: ${error.message}. Please check storage policies in Supabase dashboard.`)
            }
            
            throw new Error(`Upload failed: ${error.message}`)
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(data.path)

          uploadedUrls.push(publicUrl)
        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError)
          continue
        }
      }

      if (uploadedUrls.length === 0 && receiptFiles.length > 0) {
        throw new Error('Failed to upload any receipts. Please check storage configuration.')
      }

      return uploadedUrls
    } catch (error) {
      console.error('Failed to upload receipts:', error)
      
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to upload receipts.\n\n${errorMessage}\n\nPlease check:\n1. Storage bucket "receipts" exists\n2. Bucket is set to Public OR has proper RLS policies\n3. You are logged in\n\nSee browser console for details.`)
      return []
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      // Try to upload receipts, but don't fail if upload fails
      let receiptUrls: string[] = []
      if (receiptFiles.length > 0) {
        receiptUrls = await uploadReceipts()
        // If upload failed but user wants to continue, ask for confirmation
        if (receiptUrls.length === 0 && receiptFiles.length > 0) {
          const shouldContinue = window.confirm(
            'Receipt upload failed. Do you want to save the expense without receipts?'
          )
          if (!shouldContinue) {
            return
          }
        }
      }
      
      const expenseData = {
        business_id: businessId,
        category: data.category,
        amount: Number(data.amount),
        description: data.description || undefined,
        vendor: data.vendor || undefined,
        expense_date: format(data.expense_date, 'yyyy-MM-dd'),
        receipt_url: receiptUrls.length > 0 ? receiptUrls[0] : undefined, // Store first receipt URL
        recurring: data.recurring,
        recurring_frequency: data.recurring ? Number(data.recurring_frequency) : undefined,
        next_occurrence: data.recurring 
          ? format(
              new Date(data.expense_date.getTime() + (Number(data.recurring_frequency) * 24 * 60 * 60 * 1000)),
              'yyyy-MM-dd'
            )
          : undefined,
      }

      if (expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          updates: expenseData,
        })
      } else {
        await createExpense.mutateAsync(expenseData)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Failed to save expense:', error)
      alert('Failed to save expense. Please try again.')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {expense ? 'Edit Expense' : 'Record New Expense'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (NPR) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...form.register('amount')}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the expense..."
              rows={3}
              {...form.register('description')}
            />
          </div>

          {/* Vendor/Payee */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Payee</Label>
            <Input
              id="vendor"
              placeholder="Who was this paid to?"
              {...form.register('vendor')}
            />
          </div>

          {/* Expense Date */}
          <div className="space-y-2">
            <Label>Expense Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !form.watch('expense_date') && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch('expense_date') ? (
                    format(form.watch('expense_date'), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch('expense_date')}
                  onSelect={(date) => date && setValue('expense_date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.expense_date && (
              <p className="text-sm text-red-500">{form.formState.errors.expense_date.message}</p>
            )}
          </div>

          {/* Recurring Expense */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setValue('recurring', checked)}
              />
              <Label htmlFor="recurring">Recurring Expense</Label>
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurring_frequency">Repeat Every (days)</Label>
                <Select
                  value={form.watch('recurring_frequency')}
                  onValueChange={(value) => setValue('recurring_frequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Weekly (7 days)</SelectItem>
                    <SelectItem value="14">Bi-weekly (14 days)</SelectItem>
                    <SelectItem value="30">Monthly (30 days)</SelectItem>
                    <SelectItem value="90">Quarterly (90 days)</SelectItem>
                    <SelectItem value="365">Yearly (365 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Receipt Upload */}
          <div className="space-y-4">
            <Label>Receipt Photos (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
              <div className="text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="receipt-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload receipt photos
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG up to 10MB each (max 3 files)
                    </span>
                  </Label>
                  <Input
                    id="receipt-upload"
                    type="file"
                    multiple
                    accept="image/*,image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={(e) => handleReceiptUpload(e.target.files)}
                    disabled={receiptFiles.length >= 3}
                  />
                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    asChild
                    disabled={receiptFiles.length >= 3}
                  >
                    <Label htmlFor="receipt-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      {receiptFiles.length > 0 ? 'Add More' : 'Choose Files'}
                    </Label>
                  </Button>
                </div>
              </div>
            </div>

            {/* Receipt Previews */}
            {receiptPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {receiptPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-gray-300 transition-colors"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
                      onClick={() => removeReceipt(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs truncate max-w-[90%]">
                      {receiptFiles[index]?.name.slice(0, 15)}...
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            {isUploading && (
              <div className="text-center text-sm text-gray-600">
                Uploading receipts...
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || isUploading}
            >
              {form.formState.isSubmitting || isUploading
                ? 'Saving...'
                : expense
                ? 'Update Expense'
                : 'Record Expense'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}