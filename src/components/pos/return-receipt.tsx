'use client'

import { forwardRef } from 'react'
import { ReturnExchange, Business, Customer } from '@/types/database'

interface ReturnReceiptProps {
  returnData: ReturnExchange & {
    business?: Business
    customer?: Customer
    original_sale?: {
      invoice_number: string
      sale_date: string
    }
  }
}

export const ReturnReceipt = forwardRef<HTMLDivElement, ReturnReceiptProps>(
  ({ returnData }, ref) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatCurrency = (amount: number) => {
      return `NPR ${amount.toLocaleString()}`
    }

    const getReasonLabel = (reason: string) => {
      const labels = {
        defective: 'Defective Product',
        wrong_size: 'Wrong Size',
        wrong_color: 'Wrong Color',
        customer_changed_mind: 'Customer Changed Mind',
        damaged: 'Damaged Product',
        other: 'Other'
      }
      return labels[reason as keyof typeof labels] || reason
    }

    return (
      <div ref={ref} className="max-w-md mx-auto bg-white p-6 text-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">
            {returnData.business?.business_name || 'Business Name'}
          </h1>
          {returnData.business?.address && (
            <div className="text-gray-600 text-xs">
              {returnData.business.address.street && <div>{returnData.business.address.street}</div>}
              {returnData.business.address.city && returnData.business.address.district && (
                <div>{returnData.business.address.city}, {returnData.business.address.district}</div>
              )}
              {returnData.business.contact?.phone && <div>Phone: {returnData.business.contact.phone}</div>}
            </div>
          )}
        </div>

        {/* Return/Exchange Header */}
        <div className="text-center mb-6 border-b border-dashed pb-4">
          <h2 className="text-lg font-semibold uppercase">
            {returnData.return_type === 'return' ? 'Return Receipt' : 'Exchange Receipt'}
          </h2>
          <div className="text-xs text-gray-600 mt-1">
            {returnData.return_number}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{formatDate(returnData.return_date)}</span>
          </div>
          
          {returnData.customer && (
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span>{returnData.customer.name}</span>
            </div>
          )}
          
          {returnData.original_sale && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Invoice:</span>
                <span>{returnData.original_sale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Date:</span>
                <span>{formatDate(returnData.original_sale.sale_date)}</span>
              </div>
            </>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">Reason:</span>
            <span>{getReasonLabel(returnData.reason)}</span>
          </div>
          
          {returnData.reason_description && (
            <div className="flex justify-between">
              <span className="text-gray-600">Details:</span>
              <span className="text-right max-w-32">{returnData.reason_description}</span>
            </div>
          )}
        </div>

        {/* Returned Items */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 border-b pb-1">
            {returnData.return_type === 'return' ? 'Returned Items' : 'Items Returned'}
          </h3>
          
          <div className="space-y-2">
            {returnData.returned_items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.product_name}</div>
                  {item.variant && (
                    <div className="text-xs text-gray-600">
                      {Object.entries(item.variant)
                        .filter(([_, value]) => value)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-600">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.total_price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exchange Items (if applicable) */}
        {returnData.return_type === 'exchange' && returnData.exchange_items.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 border-b pb-1">Items Given</h3>
            
            <div className="space-y-2">
              {returnData.exchange_items.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.product_name}</div>
                    {item.variant && (
                      <div className="text-xs text-gray-600">
                        {Object.entries(item.variant)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-gray-600">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(item.total_price)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="border-t border-dashed pt-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Original Amount:</span>
              <span>{formatCurrency(returnData.original_amount)}</span>
            </div>
            
            {returnData.return_type === 'return' && (
              <div className="flex justify-between font-semibold">
                <span>Refund Amount:</span>
                <span>{formatCurrency(returnData.refund_amount)}</span>
              </div>
            )}
            
            {returnData.return_type === 'exchange' && (
              <>
                <div className="flex justify-between">
                  <span>Exchange Value:</span>
                  <span>{formatCurrency(returnData.exchange_items.reduce((sum, item) => sum + item.total_price, 0))}</span>
                </div>
                
                {returnData.exchange_difference !== 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>
                      {returnData.exchange_difference > 0 ? 'Amount Due:' : 'Refund Due:'}
                    </span>
                    <span>
                      {formatCurrency(Math.abs(returnData.exchange_difference))}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
            Status: {returnData.status.toUpperCase()}
          </div>
        </div>

        {/* Notes */}
        {returnData.notes && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Notes:</h3>
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {returnData.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
          <div>Thank you for your business!</div>
          <div className="mt-2">
            Generated on {formatDate(new Date().toISOString())}
          </div>
          {returnData.processed_by && (
            <div className="mt-1">
              Processed by: {returnData.processed_by}
            </div>
          )}
        </div>

        {/* Print Instructions */}
        <div className="text-center text-xs text-gray-400 mt-4 print:hidden">
          <div>Please keep this receipt for your records</div>
        </div>
      </div>
    )
  }
)

ReturnReceipt.displayName = 'ReturnReceipt'