import type { LowStockProduct } from '@/types/database'

export interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  emailAddress?: string
  phoneNumber?: string
  threshold: number
  criticalThreshold: number
}

export interface EmailNotificationData {
  to: string
  subject: string
  html: string
}

export interface SMSNotificationData {
  to: string
  message: string
}

// Email notification service
export class EmailNotificationService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || ''
    this.baseUrl = process.env.NEXT_PUBLIC_EMAIL_API_URL || ''
  }

  async sendLowStockAlert(
    businessId: string,
    emailAddress: string,
    businessName: string,
    lowStockProducts: LowStockProduct[],
    criticalProducts: LowStockProduct[]
  ): Promise<boolean> {
    try {
      const emailData: EmailNotificationData = {
        to: emailAddress,
        subject: `Low Stock Alert - ${businessName}`,
        html: this.generateLowStockEmailHTML(businessName, lowStockProducts, criticalProducts)
      }

      // In a real implementation, this would call your email service API
      // For now, we'll simulate the API call
      console.log('Sending email notification:', emailData)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Log the notification attempt
      const { notificationQueries } = await import('@/lib/database/queries')
      await notificationQueries.logNotification(businessId, {
        notification_type: 'email',
        recipient: emailAddress,
        subject: emailData.subject,
        message: `Low stock alert sent for ${lowStockProducts.length + criticalProducts.length} products`,
        status: 'sent',
        low_stock_count: lowStockProducts.length,
        critical_stock_count: criticalProducts.length,
      })
      
      return true
    } catch (error) {
      console.error('Failed to send email notification:', error)
      
      // Log the failed attempt
      try {
        const { notificationQueries } = await import('@/lib/database/queries')
        await notificationQueries.logNotification(businessId, {
          notification_type: 'email',
          recipient: emailAddress,
          subject: `Low Stock Alert - ${businessName}`,
          message: `Failed to send low stock alert`,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          low_stock_count: lowStockProducts.length,
          critical_stock_count: criticalProducts.length,
        })
      } catch (logError) {
        console.error('Failed to log notification error:', logError)
      }
      
      return false
    }
  }

  private generateLowStockEmailHTML(
    businessName: string,
    lowStockProducts: LowStockProduct[],
    criticalProducts: LowStockProduct[]
  ): string {
    const totalProducts = lowStockProducts.length + criticalProducts.length

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Low Stock Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .alert-critical { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; }
            .alert-low { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
            .product-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Low Stock Alert</h1>
              <p><strong>${businessName}</strong></p>
              <p>You have <strong>${totalProducts}</strong> products with low stock levels that need attention.</p>
            </div>

            ${criticalProducts.length > 0 ? `
              <div class="alert-critical">
                <h2>🔴 Critical Stock Alert (${criticalProducts.length} products)</h2>
                <p>These products are critically low and need immediate restocking:</p>
                ${criticalProducts.map(product => `
                  <div class="product-item">
                    <strong>${product.name}</strong>
                    ${product.category ? `<span style="color: #6b7280;"> - ${product.category}</span>` : ''}
                    <br>
                    <span style="color: #dc2626;">Current Stock: ${product.current_stock}</span> | 
                    <span>Minimum: ${product.min_stock_level}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${lowStockProducts.length > 0 ? `
              <div class="alert-low">
                <h2>🟡 Low Stock Alert (${lowStockProducts.length} products)</h2>
                <p>These products are running low and should be restocked soon:</p>
                ${lowStockProducts.map(product => `
                  <div class="product-item">
                    <strong>${product.name}</strong>
                    ${product.category ? `<span style="color: #6b7280;"> - ${product.category}</span>` : ''}
                    <br>
                    <span style="color: #f59e0b;">Current Stock: ${product.current_stock}</span> | 
                    <span>Minimum: ${product.min_stock_level}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="footer">
              <p>This is an automated alert from your Vyapar Vision inventory management system.</p>
              <p>Please log in to your dashboard to take action on these alerts.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

// SMS notification service
export class SMSNotificationService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.NEXT_PUBLIC_SMS_API_KEY || ''
    this.baseUrl = process.env.NEXT_PUBLIC_SMS_API_URL || 'https://api.sparrowsms.com/v2/'
  }

  async sendLowStockAlert(
    businessId: string,
    phoneNumber: string,
    businessName: string,
    totalLowStock: number,
    criticalCount: number
  ): Promise<boolean> {
    try {
      const message = this.generateLowStockSMSMessage(businessName, totalLowStock, criticalCount)
      
      const smsData: SMSNotificationData = {
        to: phoneNumber,
        message
      }

      // In a real implementation, this would call Sparrow SMS API
      console.log('Sending SMS notification:', smsData)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Log the notification attempt
      const { notificationQueries } = await import('@/lib/database/queries')
      await notificationQueries.logNotification(businessId, {
        notification_type: 'sms',
        recipient: phoneNumber,
        message: message,
        status: 'sent',
        low_stock_count: totalLowStock - criticalCount,
        critical_stock_count: criticalCount,
      })
      
      return true
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
      
      // Log the failed attempt
      try {
        const { notificationQueries } = await import('@/lib/database/queries')
        await notificationQueries.logNotification(businessId, {
          notification_type: 'sms',
          recipient: phoneNumber,
          message: `Failed to send low stock SMS alert`,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          low_stock_count: totalLowStock - criticalCount,
          critical_stock_count: criticalCount,
        })
      } catch (logError) {
        console.error('Failed to log notification error:', logError)
      }
      
      return false
    }
  }

  private generateLowStockSMSMessage(
    businessName: string,
    totalLowStock: number,
    criticalCount: number
  ): string {
    let message = `🚨 ${businessName} - Low Stock Alert!\n\n`
    
    if (criticalCount > 0) {
      message += `🔴 ${criticalCount} products critically low\n`
    }
    
    message += `📦 ${totalLowStock} total products need restocking\n\n`
    message += `Login to your dashboard to view details and take action.`
    
    return message
  }
}

// Main notification service that coordinates email and SMS
export class NotificationService {
  private emailService: EmailNotificationService
  private smsService: SMSNotificationService

  constructor() {
    this.emailService = new EmailNotificationService()
    this.smsService = new SMSNotificationService()
  }

  async sendLowStockNotifications(
    businessId: string,
    settings: NotificationSettings,
    businessName: string,
    lowStockProducts: LowStockProduct[],
    criticalProducts: LowStockProduct[]
  ): Promise<{ email: boolean; sms: boolean }> {
    const results = { email: false, sms: false }

    // Send email notification
    if (settings.emailEnabled && settings.emailAddress) {
      results.email = await this.emailService.sendLowStockAlert(
        businessId,
        settings.emailAddress,
        businessName,
        lowStockProducts,
        criticalProducts
      )
    }

    // Send SMS notification
    if (settings.smsEnabled && settings.phoneNumber) {
      results.sms = await this.smsService.sendLowStockAlert(
        businessId,
        settings.phoneNumber,
        businessName,
        lowStockProducts.length + criticalProducts.length,
        criticalProducts.length
      )
    }

    return results
  }
}

// Utility function to check if products need alerts
export function checkLowStockAlerts(
  products: LowStockProduct[],
  settings: NotificationSettings
): {
  criticalProducts: LowStockProduct[]
  lowProducts: LowStockProduct[]
  needsAlert: boolean
} {
  const criticalProducts = products.filter(
    product => product.current_stock <= settings.criticalThreshold
  )
  
  const lowProducts = products.filter(
    product => product.current_stock > settings.criticalThreshold && 
               product.current_stock <= product.min_stock_level
  )

  return {
    criticalProducts,
    lowProducts,
    needsAlert: criticalProducts.length > 0 || lowProducts.length > 0
  }
}

// Function to save notification settings
export async function saveNotificationSettings(
  businessId: string,
  settings: NotificationSettings
): Promise<boolean> {
  try {
    const { notificationQueries } = await import('@/lib/database/queries')
    
    await notificationQueries.upsert(businessId, {
      email_enabled: settings.emailEnabled,
      sms_enabled: settings.smsEnabled,
      email_address: settings.emailAddress,
      phone_number: settings.phoneNumber,
      threshold: settings.threshold,
      critical_threshold: settings.criticalThreshold,
    })
    
    return true
  } catch (error) {
    console.error('Failed to save notification settings:', error)
    return false
  }
}

// Function to load notification settings
export async function loadNotificationSettings(
  businessId: string
): Promise<NotificationSettings> {
  try {
    const { notificationQueries } = await import('@/lib/database/queries')
    
    const data = await notificationQueries.getByBusinessId(businessId)
    
    return {
      emailEnabled: data.email_enabled || false,
      smsEnabled: data.sms_enabled || false,
      emailAddress: data.email_address || undefined,
      phoneNumber: data.phone_number || undefined,
      threshold: data.threshold || 10,
      criticalThreshold: data.critical_threshold || 5,
    }
  } catch (error) {
    console.error('Failed to load notification settings:', error)
    return {
      emailEnabled: false,
      smsEnabled: false,
      threshold: 10,
      criticalThreshold: 5,
    }
  }
}