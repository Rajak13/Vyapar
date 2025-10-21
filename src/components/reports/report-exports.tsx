'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Download, 
  FileText, 
  Mail, 
  Calendar,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useProducts } from '@/hooks/use-products'
import { useCustomers } from '@/hooks/use-customers'
import { useSales } from '@/hooks/use-sales'
import { useExpenses } from '@/hooks/use-expenses'

interface ReportExportsProps {
  businessId: string
  detailed?: boolean
}

type ReportType = 'financial' | 'products' | 'customers' | 'sales' | 'expenses' | 'inventory'
type ExportFormat = 'pdf' | 'excel' | 'csv'
type DateRange = '7d' | '30d' | '90d' | 'current_month' | 'last_month' | 'current_year' | 'custom'

interface ExportRequest {
  reportType: ReportType
  format: ExportFormat
  dateRange: DateRange
  customStartDate?: string
  customEndDate?: string
  includeCharts: boolean
  includeDetails: boolean
}

interface ScheduledReport {
  id: string
  name: string
  reportType: ReportType
  format: ExportFormat
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  lastSent: Date | null
  nextSend: Date
  active: boolean
}

export function ReportExports({ businessId, detailed = false }: ReportExportsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportRequest, setExportRequest] = useState<ExportRequest>({
    reportType: 'financial',
    format: 'pdf',
    dateRange: '30d',
    includeCharts: true,
    includeDetails: true
  })
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Mock scheduled reports data
  const [scheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Monthly Financial Report',
      reportType: 'financial',
      format: 'pdf',
      frequency: 'monthly',
      recipients: ['owner@business.com'],
      lastSent: new Date('2024-01-01'),
      nextSend: new Date('2024-02-01'),
      active: true
    },
    {
      id: '2',
      name: 'Weekly Sales Summary',
      reportType: 'sales',
      format: 'excel',
      frequency: 'weekly',
      recipients: ['manager@business.com', 'owner@business.com'],
      lastSent: new Date('2024-01-15'),
      nextSend: new Date('2024-01-22'),
      active: true
    }
  ])

  const { data: products } = useProducts(businessId)
  const { data: customers } = useCustomers(businessId)
  const { data: sales } = useSales(businessId, 1000)
  const { data: expenses } = useExpenses(businessId, 1000)

  const reportTypes = [
    { value: 'financial', label: 'Financial Reports', description: 'P&L, cash flow, expense analysis' },
    { value: 'products', label: 'Product Analytics', description: 'Sales performance, inventory turnover' },
    { value: 'customers', label: 'Customer Insights', description: 'Customer behavior, retention analysis' },
    { value: 'sales', label: 'Sales Reports', description: 'Transaction history, sales trends' },
    { value: 'expenses', label: 'Expense Reports', description: 'Expense breakdown, vendor analysis' },
    { value: 'inventory', label: 'Inventory Reports', description: 'Stock levels, movement history' }
  ]

  const exportFormats = [
    { value: 'pdf', label: 'PDF', description: 'Professional formatted report' },
    { value: 'excel', label: 'Excel', description: 'Spreadsheet with data and charts' },
    { value: 'csv', label: 'CSV', description: 'Raw data for analysis' }
  ]

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'current_month', label: 'Current month' },
    { value: 'last_month', label: 'Last month' },
    { value: 'current_year', label: 'Current year' },
    { value: 'custom', label: 'Custom range' }
  ]

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would call an API to generate the report
      const filename = `${exportRequest.reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.${exportRequest.format}`
      
      toast.success(`Report exported successfully as ${filename}`)
      
      // Simulate file download
      const link = document.createElement('a')
      link.href = '#' // In real implementation, this would be the file URL
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch {
      toast.error('Failed to export report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleEmailReport = async () => {
    if (!emailRecipients.trim()) {
      toast.error('Please enter at least one email recipient')
      return
    }

    setIsExporting(true)
    
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(`Report emailed to ${emailRecipients.split(',').length} recipient(s)`)
      setEmailDialogOpen(false)
      setEmailRecipients('')
      setEmailSubject('')
      setEmailMessage('')
      
    } catch {
      toast.error('Failed to send email. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'financial':
        return <FileText className="h-4 w-4" />
      case 'products':
        return <FileText className="h-4 w-4" />
      case 'customers':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800'
    }
    return <Badge className={colors[frequency as keyof typeof colors]}>{frequency}</Badge>
  }

  if (!detailed) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
        
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Report</DialogTitle>
              <DialogDescription>
                Send the current report via email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                <Input
                  id="recipients"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Business Report - [Date]"
                />
              </div>
              <div>
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Please find attached the business report..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmailReport} disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <Label className="text-base font-medium">Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {reportTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportRequest.reportType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setExportRequest(prev => ({ ...prev, reportType: type.value as ReportType }))}
                >
                  <div className="flex items-center space-x-3">
                    {getReportTypeIcon(type.value as ReportType)}
                    <div>
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-base font-medium">Export Format</Label>
              <Select 
                value={exportRequest.format} 
                onValueChange={(value: ExportFormat) => 
                  setExportRequest(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportFormats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-sm text-gray-600">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Date Range</Label>
              <Select 
                value={exportRequest.dateRange} 
                onValueChange={(value: DateRange) => 
                  setExportRequest(prev => ({ ...prev, dateRange: value }))
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {exportRequest.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={exportRequest.customStartDate || ''}
                  onChange={(e) => setExportRequest(prev => ({ ...prev, customStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={exportRequest.customEndDate || ''}
                  onChange={(e) => setExportRequest(prev => ({ ...prev, customEndDate: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Export Options */}
          <div>
            <Label className="text-base font-medium">Export Options</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={exportRequest.includeCharts}
                  onCheckedChange={(checked) => 
                    setExportRequest(prev => ({ ...prev, includeCharts: checked as boolean }))
                  }
                />
                <Label htmlFor="includeCharts">Include charts and visualizations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={exportRequest.includeDetails}
                  onCheckedChange={(checked) => 
                    setExportRequest(prev => ({ ...prev, includeDetails: checked as boolean }))
                  }
                />
                <Label htmlFor="includeDetails">Include detailed data tables</Label>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Report
            </Button>

            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Email Report</DialogTitle>
                  <DialogDescription>
                    Send the {exportRequest.reportType} report via email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipients">Recipients (comma-separated)</Label>
                    <Input
                      id="recipients"
                      value={emailRecipients}
                      onChange={(e) => setEmailRecipients(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={`${exportRequest.reportType} Report - ${format(new Date(), 'MMM dd, yyyy')}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Please find attached the business report..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEmailReport} disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Email
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Scheduled Reports</span>
            </div>
            <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Schedule New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Report</DialogTitle>
                  <DialogDescription>
                    Set up automatic report generation and delivery
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      placeholder="Monthly Financial Summary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Report Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="scheduleRecipients">Recipients</Label>
                    <Input
                      id="scheduleRecipients"
                      placeholder="email1@example.com, email2@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    toast.success('Scheduled report created successfully')
                    setScheduleDialogOpen(false)
                  }}>
                    Create Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduledReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${report.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="capitalize">{report.reportType}</span>
                      <span>{report.format.toUpperCase()}</span>
                      {getFrequencyBadge(report.frequency)}
                      <span>{report.recipients.length} recipient(s)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm">
                    {report.lastSent ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Last sent: {format(report.lastSent, 'MMM dd')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>Never sent</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Next: {format(report.nextSend, 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Financial Report - January 2024.pdf', date: new Date('2024-01-15'), size: '2.3 MB' },
              { name: 'Product Analytics - Q4 2023.xlsx', date: new Date('2024-01-10'), size: '1.8 MB' },
              { name: 'Customer Insights - December 2023.pdf', date: new Date('2024-01-05'), size: '1.5 MB' }
            ].map((export_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">{export_.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(export_.date, 'MMM dd, yyyy')} • {export_.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}