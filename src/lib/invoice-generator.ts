import jsPDF from 'jspdf'
import { Business, Customer, Sale, Payment } from '@/types/database'
import { CartItem } from '@/components/pos/pos-interface'

interface InvoiceData {
  business: Business
  customer: Customer | null
  sale: Sale
  payments: Payment[]
  cartItems: CartItem[]
  discountAmount: number
  finalTotal: number
  changeAmount: number
}

export class InvoiceGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    this.pageWidth = this.pdf.internal.pageSize.getWidth()
    this.pageHeight = this.pdf.internal.pageSize.getHeight()
    this.margin = 20
  }

  generateInvoice(data: InvoiceData): jsPDF {
    this.addHeader(data.business)
    this.addInvoiceInfo(data.sale, data.customer)
    this.addItemsTable(data.cartItems)
    this.addTotals(data.sale, data.discountAmount, data.finalTotal)
    this.addPaymentDetails(data.payments, data.changeAmount)
    this.addFooter()

    return this.pdf
  }

  private addHeader(business: Business) {
    // Business name
    this.pdf.setFontSize(24)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text(business.business_name, this.margin, 30)

    // Business details
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    let yPos = 40

    if (business.address.street) {
      this.pdf.text(business.address.street, this.margin, yPos)
      yPos += 5
    }

    const cityLine = [
      business.address.city,
      business.address.district,
      business.address.province
    ].filter(Boolean).join(', ')

    if (cityLine) {
      this.pdf.text(cityLine, this.margin, yPos)
      yPos += 5
    }

    if (business.contact.phone) {
      this.pdf.text(`Phone: ${business.contact.phone}`, this.margin, yPos)
      yPos += 5
    }

    if (business.contact.email) {
      this.pdf.text(`Email: ${business.contact.email}`, this.margin, yPos)
      yPos += 5
    }

    if (business.vat_number) {
      this.pdf.text(`VAT No: ${business.vat_number}`, this.margin, yPos)
      yPos += 5
    }

    // Add line separator
    this.pdf.setLineWidth(0.5)
    this.pdf.line(this.margin, yPos + 5, this.pageWidth - this.margin, yPos + 5)
  }

  private addInvoiceInfo(sale: Sale, customer: Customer | null) {
    const startY = 80

    // Invoice title
    this.pdf.setFontSize(18)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('INVOICE', this.margin, startY)

    // Invoice details (left side)
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    let yPos = startY + 15

    this.pdf.text(`Invoice No: ${sale.invoice_number}`, this.margin, yPos)
    yPos += 6
    this.pdf.text(`Date: ${new Date(sale.sale_date).toLocaleDateString('en-GB')}`, this.margin, yPos)
    yPos += 6
    this.pdf.text(`Time: ${new Date(sale.created_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })}`, this.margin, yPos)

    // Customer details (right side)
    if (customer) {
      const rightX = this.pageWidth - this.margin - 80
      let customerY = startY + 15

      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Bill To:', rightX, customerY)
      customerY += 8

      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(customer.name, rightX, customerY)
      customerY += 6

      if (customer.phone) {
        this.pdf.text(customer.phone, rightX, customerY)
        customerY += 6
      }

      if (customer.email) {
        this.pdf.text(customer.email, rightX, customerY)
        customerY += 6
      }

      if (customer.address.street) {
        this.pdf.text(customer.address.street, rightX, customerY)
        customerY += 6
      }

      const customerCityLine = [
        customer.address.city,
        customer.address.district
      ].filter(Boolean).join(', ')

      if (customerCityLine) {
        this.pdf.text(customerCityLine, rightX, customerY)
      }
    }
  }

  private addItemsTable(cartItems: CartItem[]) {
    const startY = 140
    const tableWidth = this.pageWidth - (2 * this.margin)
    const colWidths = [80, 20, 30, 30, 30] // Item, Qty, Rate, Amount columns

    // Table header
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'bold')

    let xPos = this.margin
    this.pdf.text('Item', xPos, startY)
    xPos += colWidths[0]
    this.pdf.text('Qty', xPos, startY)
    xPos += colWidths[1]
    this.pdf.text('Rate', xPos, startY)
    xPos += colWidths[2]
    this.pdf.text('Amount', xPos, startY)

    // Header line
    this.pdf.setLineWidth(0.3)
    this.pdf.line(this.margin, startY + 2, this.pageWidth - this.margin, startY + 2)

    // Table rows
    this.pdf.setFont('helvetica', 'normal')
    let yPos = startY + 10

    cartItems.forEach((item) => {
      xPos = this.margin

      // Item name and variant
      let itemText = item.name
      if (item.variant) {
        const variantText = [
          item.variant.size,
          item.variant.color,
          item.variant.material
        ].filter(Boolean).join(', ')
        if (variantText) {
          itemText += ` (${variantText})`
        }
      }

      // Split long item names
      const itemLines = this.pdf.splitTextToSize(itemText, colWidths[0] - 5)
      this.pdf.text(itemLines, xPos, yPos)

      xPos += colWidths[0]
      this.pdf.text(item.quantity.toString(), xPos, yPos)

      xPos += colWidths[1]
      this.pdf.text(`NPR ${item.price.toLocaleString()}`, xPos, yPos)

      xPos += colWidths[2]
      const totalAmount = item.total ?? (item.price * item.quantity)
      this.pdf.text(`NPR ${totalAmount.toLocaleString()}`, xPos, yPos)

      yPos += Math.max(6, itemLines.length * 4)
    })

    // Bottom line
    this.pdf.setLineWidth(0.3)
    this.pdf.line(this.margin, yPos + 2, this.pageWidth - this.margin, yPos + 2)

    return yPos + 10
  }

  private addTotals(sale: Sale, discountAmount: number, finalTotal: number) {
    const startY = 200
    const rightX = this.pageWidth - this.margin - 60

    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')

    let yPos = startY

    // Subtotal
    this.pdf.text('Subtotal:', rightX - 40, yPos)
    this.pdf.text(`NPR ${sale.subtotal.toLocaleString()}`, rightX, yPos)
    yPos += 8

    // Discount
    if (discountAmount > 0) {
      this.pdf.setTextColor(0, 150, 0) // Green color
      this.pdf.text('Discount:', rightX - 40, yPos)
      this.pdf.text(`-NPR ${discountAmount.toLocaleString()}`, rightX, yPos)
      this.pdf.setTextColor(0, 0, 0) // Reset to black
      yPos += 8
    }

    // Tax (if applicable)
    if (sale.tax > 0) {
      this.pdf.text('Tax:', rightX - 40, yPos)
      this.pdf.text(`NPR ${sale.tax.toLocaleString()}`, rightX, yPos)
      yPos += 8
    }

    // Total line
    this.pdf.setLineWidth(0.5)
    this.pdf.line(rightX - 50, yPos, rightX + 30, yPos)
    yPos += 8

    // Final total
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Total:', rightX - 40, yPos)
    this.pdf.text(`NPR ${finalTotal.toLocaleString()}`, rightX, yPos)

    return yPos + 15
  }

  private addPaymentDetails(payments: Payment[], changeAmount: number) {
    const startY = 250

    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Payment Details:', this.margin, startY)

    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    let yPos = startY + 10

    payments.forEach((payment) => {
      const methodName = this.getPaymentMethodName(payment.payment_method)
      let paymentText = `${methodName}: NPR ${payment.amount.toLocaleString()}`

      if (payment.reference_number) {
        paymentText += ` (Ref: ${payment.reference_number})`
      }

      this.pdf.text(paymentText, this.margin, yPos)
      yPos += 6
    })

    // Change amount
    if (changeAmount > 0) {
      yPos += 4
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setTextColor(0, 150, 0) // Green color
      this.pdf.text(`Change: NPR ${changeAmount.toLocaleString()}`, this.margin, yPos)
      this.pdf.setTextColor(0, 0, 0) // Reset to black
    }
  }

  private addFooter() {
    const footerY = this.pageHeight - 40

    // Thank you message
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text('Thank you for your business!', this.margin, footerY)
    this.pdf.text('Visit us again soon', this.margin, footerY + 6)

    // Powered by
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(128, 128, 128) // Gray color
    this.pdf.text('Powered by Vyapar Vision', this.margin, footerY + 20)

    // QR code placeholder (can be enhanced later)
    const qrSize = 20
    const qrX = this.pageWidth - this.margin - qrSize
    this.pdf.setDrawColor(0, 0, 0)
    this.pdf.setLineWidth(0.5)
    this.pdf.rect(qrX, footerY - 5, qrSize, qrSize)

    this.pdf.setFontSize(6)
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('QR Code', qrX + 2, footerY + 12)
  }

  private getPaymentMethodName(method: string): string {
    const methodNames: Record<string, string> = {
      cash: 'Cash',
      esewa: 'eSewa',
      khalti: 'Khalti',
      ime_pay: 'IME Pay',
      bank_transfer: 'Bank Transfer',
      card: 'Card'
    }
    return methodNames[method] || method
  }

  downloadPDF(filename: string) {
    this.pdf.save(filename)
  }

  getPDFBlob(): Blob {
    return this.pdf.output('blob')
  }

  getPDFDataURL(): string {
    return this.pdf.output('dataurlstring')
  }
}

// Utility function to generate and download invoice
export async function generateAndDownloadInvoice(data: InvoiceData) {
  const generator = new InvoiceGenerator()
  const pdf = generator.generateInvoice(data)
  const filename = `Invoice-${data.sale.invoice_number}.pdf`
  generator.downloadPDF(filename)
  return pdf
}

// Utility function to generate invoice for sharing
export async function generateInvoiceForSharing(data: InvoiceData): Promise<Blob> {
  const generator = new InvoiceGenerator()
  generator.generateInvoice(data)
  return generator.getPDFBlob()
}