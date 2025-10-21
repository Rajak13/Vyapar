import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  NotificationService, 
  NotificationSettings,
  saveNotificationSettings,
  loadNotificationSettings,
  checkLowStockAlerts
} from '@/lib/notifications'
import { useLowStockProducts } from '@/hooks/use-products'
import { toast } from 'sonner'
import type { LowStockProduct } from '@/types/database'

// Hook for managing notification settings
export function useNotificationSettings(businessId: string) {
  return useQuery({
    queryKey: ['notification-settings', businessId],
    queryFn: () => loadNotificationSettings(businessId),
    enabled: !!businessId,
  })
}

// Hook for saving notification settings
export function useSaveNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ businessId, settings }: { 
      businessId: string
      settings: NotificationSettings 
    }) => saveNotificationSettings(businessId, settings),
    onSuccess: (_, { businessId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ['notification-settings', businessId] 
      })
      toast.success('Notification settings saved successfully')
    },
    onError: (error) => {
      console.error('Failed to save notification settings:', error)
      toast.error('Failed to save notification settings')
    },
  })
}

// Hook for sending low stock notifications
export function useSendLowStockNotifications() {
  const notificationService = new NotificationService()

  return useMutation({
    mutationFn: async ({ 
      businessId,
      settings, 
      businessName, 
      lowStockProducts, 
      criticalProducts 
    }: {
      businessId: string
      settings: NotificationSettings
      businessName: string
      lowStockProducts: LowStockProduct[]
      criticalProducts: LowStockProduct[]
    }) => {
      return notificationService.sendLowStockNotifications(
        businessId,
        settings,
        businessName,
        lowStockProducts,
        criticalProducts
      )
    },
    onSuccess: (results) => {
      let message = 'Notifications sent: '
      const sent = []
      
      if (results.email) sent.push('Email')
      if (results.sms) sent.push('SMS')
      
      if (sent.length > 0) {
        message += sent.join(' and ')
        toast.success(message)
      } else {
        toast.error('Failed to send notifications')
      }
    },
    onError: (error) => {
      console.error('Failed to send notifications:', error)
      toast.error('Failed to send notifications')
    },
  })
}

// Hook for automatic low stock monitoring
export function useLowStockMonitoring(businessId: string, businessName: string) {
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState(false)
  
  const { data: lowStockProducts } = useLowStockProducts(businessId)
  const { data: settings } = useNotificationSettings(businessId)
  const sendNotifications = useSendLowStockNotifications()

  // Check for alerts every 5 minutes if auto alerts are enabled
  useEffect(() => {
    if (!autoAlertsEnabled || !settings || !lowStockProducts || !businessName) {
      return
    }

    const checkInterval = setInterval(() => {
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000
      
      // Don&apos;t send alerts more frequently than every 5 minutes
      if (now - lastAlertTime < fiveMinutes) {
        return
      }

      const { criticalProducts, lowProducts, needsAlert } = checkLowStockAlerts(
        lowStockProducts,
        settings
      )

      if (needsAlert) {
        sendNotifications.mutate({
          businessId,
          settings,
          businessName,
          lowStockProducts: lowProducts,
          criticalProducts
        })
        setLastAlertTime(now)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(checkInterval)
  }, [
    autoAlertsEnabled,
    settings,
    lowStockProducts,
    businessName,
    lastAlertTime,
    sendNotifications
  ])

  return {
    autoAlertsEnabled,
    setAutoAlertsEnabled,
    lastAlertTime,
  }
}

// Hook for getting low stock alert summary
export function useLowStockAlertSummary(businessId: string) {
  const { data: lowStockProducts, isLoading } = useLowStockProducts(businessId)
  const { data: settings } = useNotificationSettings(businessId)

  const summary = {
    totalAlerts: 0,
    criticalCount: 0,
    lowCount: 0,
    criticalProducts: [] as LowStockProduct[],
    lowProducts: [] as LowStockProduct[],
    needsAttention: false,
  }

  if (lowStockProducts && settings) {
    const { criticalProducts, lowProducts, needsAlert } = checkLowStockAlerts(
      lowStockProducts,
      settings
    )

    summary.criticalProducts = criticalProducts
    summary.lowProducts = lowProducts
    summary.criticalCount = criticalProducts.length
    summary.lowCount = lowProducts.length
    summary.totalAlerts = criticalProducts.length + lowProducts.length
    summary.needsAttention = needsAlert
  }

  return {
    ...summary,
    isLoading,
  }
}

// Hook for managing alert thresholds
export function useAlertThresholds(businessId: string) {
  const [globalThreshold, setGlobalThreshold] = useState(10)
  const [criticalThreshold, setCriticalThreshold] = useState(5)

  // Load thresholds from settings
  const { data: settings } = useNotificationSettings(businessId)
  
  useEffect(() => {
    if (settings) {
      setGlobalThreshold(settings.threshold)
      setCriticalThreshold(settings.criticalThreshold)
    }
  }, [settings])

  const saveThresholds = useSaveNotificationSettings()

  const updateThresholds = async (threshold: number, critical: number) => {
    if (!settings) return

    const updatedSettings: NotificationSettings = {
      ...settings,
      threshold,
      criticalThreshold: critical,
    }

    await saveThresholds.mutateAsync({
      businessId,
      settings: updatedSettings
    })

    setGlobalThreshold(threshold)
    setCriticalThreshold(critical)
  }

  return {
    globalThreshold,
    criticalThreshold,
    updateThresholds,
    isUpdating: saveThresholds.isPending,
  }
}