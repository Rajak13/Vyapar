'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MessageSquare, 
  Send, 
  Calendar, 
  Gift,
  Heart,
  Star,
  Users,
  Phone,
  Mail,
  Sparkles,
  Bell,
  Clock
} from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import type { Customer } from '@/types/database'
import { toast } from 'sonner'

interface CustomerEngagementProps {
  businessId: string
}

interface Festival {
  name: string
  date: Date
  description: string
  messageTemplate: string
  category: 'major' | 'religious' | 'cultural' | 'seasonal'
}

// Nepal festivals for 2024-2025 (approximate dates)
const NEPAL_FESTIVALS: Festival[] = [
  {
    name: 'Dashain',
    date: new Date(2024, 9, 15), // October 15
    description: 'The biggest festival of Nepal',
    messageTemplate: 'Wishing you and your family a very Happy Dashain! May this festival bring prosperity and happiness to your life. Special Dashain offers available at our store!',
    category: 'major'
  },
  {
    name: 'Tihar',
    date: new Date(2024, 10, 1), // November 1
    description: 'Festival of lights',
    messageTemplate: 'Happy Tihar! May the festival of lights illuminate your life with joy and prosperity. Visit us for special Tihar collections!',
    category: 'major'
  },
  {
    name: 'Holi',
    date: new Date(2025, 2, 13), // March 13
    description: 'Festival of colors',
    messageTemplate: 'Happy Holi! May your life be filled with colors of joy and happiness. Check out our colorful Holi special offers!',
    category: 'major'
  },
  {
    name: 'New Year (Bikram Sambat)',
    date: new Date(2025, 3, 14), // April 14
    description: 'Nepali New Year',
    messageTemplate: 'Naya Barsa ko Shubhakamana! Wishing you a prosperous and happy New Year ahead. Special New Year discounts available!',
    category: 'major'
  },
  {
    name: 'Teej',
    date: new Date(2024, 8, 6), // September 6
    description: 'Festival for women',
    messageTemplate: 'Happy Teej! Celebrating the strength and beauty of women. Special Teej collection available with exclusive offers!',
    category: 'religious'
  },
  {
    name: 'Janai Purnima',
    date: new Date(2024, 7, 19), // August 19
    description: 'Sacred thread festival',
    messageTemplate: 'Happy Janai Purnima! May this sacred day bring blessings and good fortune to you and your family.',
    category: 'religious'
  }
]

const MESSAGE_TEMPLATES = {
  birthday: {
    formal: 'Dear {name}, Wishing you a very Happy Birthday! May this special day bring you joy, happiness, and all the wonderful things you deserve. As a birthday gift, enjoy a special discount on your next purchase!',
    casual: 'Happy Birthday {name}! 🎉 Hope your day is as amazing as you are! We have a special birthday surprise waiting for you at our store!',
    vip: 'Dear {name}, On this special day, we want to wish you a very Happy Birthday! As our valued VIP customer, please accept our exclusive birthday gift and special privileges.'
  },
  festival: {
    formal: 'Dear {name}, On the auspicious occasion of {festival}, we extend our warmest greetings to you and your family. May this festival bring prosperity, happiness, and good health to your life.',
    casual: 'Happy {festival} {name}! 🎊 Wishing you and your family lots of joy and celebration! Don&apos;t miss our special festival offers!',
    promotional: 'Happy {festival} {name}! Celebrate with our exclusive festival collection and enjoy special discounts up to 50% off!'
  },
  appreciation: {
    thankyou: 'Dear {name}, Thank you for being such a wonderful customer! Your continued support means the world to us. We look forward to serving you for many more years.',
    milestone: 'Congratulations {name}! You&apos;ve reached a special milestone with us. Thank you for your loyalty and trust in our business.',
    feedback: 'Dear {name}, We hope you&apos;re enjoying your recent purchase! Your feedback is valuable to us. Please let us know how we can serve you better.'
  }
}

export function CustomerEngagement({ businessId }: CustomerEngagementProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [messageType, setMessageType] = useState<'birthday' | 'festival' | 'appreciation' | 'custom'>('birthday')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null)
  const [communicationMethod, setCommunicationMethod] = useState<'sms' | 'whatsapp' | 'email'>('sms')
  const [scheduleDate, setScheduleDate] = useState('')
  const [isSending, setIsSending] = useState(false)

  const { data: customers, isLoading } = useCustomers(businessId)

  if (isLoading) {
    return <div>Loading customer engagement...</div>
  }

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground text-center">
            Add customers to start engagement campaigns.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Get upcoming festivals (next 60 days)
  const today = new Date()
  const upcomingFestivals = NEPAL_FESTIVALS.filter(festival => {
    const daysUntil = Math.ceil((festival.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 60
  }).sort((a, b) => a.date.getTime() - b.date.getTime())

  // Get customers with birthdays in next 30 days
  const upcomingBirthdays = customers.filter(customer => {
    if (!customer.date_of_birth) return false
    
    const birthday = new Date(customer.date_of_birth)
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilBirthday <= 30
  })

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map(c => c.id))
    }
  }

  const formatMessage = (template: string, customer: Customer, festival?: Festival) => {
    return template
      .replace(/{name}/g, customer.name)
      .replace(/{festival}/g, festival?.name || '')
      .replace(/{business_name}/g, 'Your Business Name') // This should come from business context
  }

  const handleSendMessages = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer')
      return
    }

    const message = messageType === 'custom' ? customMessage : messageTemplate
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSending(true)

    try {
      // Simulate sending messages (in real implementation, this would call SMS/WhatsApp/Email APIs)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id))
      
      // Log the messages that would be sent
      console.log('Sending messages via', communicationMethod, 'to:', selectedCustomerData.map(customer => ({
        customer: customer.name,
        contact: communicationMethod === 'email' ? customer.email : customer.phone,
        message: formatMessage(message, customer, selectedFestival || undefined)
      })))

      toast.success(`Messages sent to ${selectedCustomers.length} customer(s) via ${communicationMethod.toUpperCase()}`)
      setSelectedCustomers([])
      setCustomMessage('')
      
    } catch (error) {
      console.error('Failed to send messages:', error)
      toast.error('Failed to send messages')
    } finally {
      setIsSending(false)
    }
  }

  const getContactCount = (method: 'sms' | 'whatsapp' | 'email') => {
    if (method === 'email') {
      return customers.filter(c => c.email).length
    }
    return customers.filter(c => c.phone).length
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Birthdays</p>
                <p className="text-2xl font-bold">{upcomingBirthdays.length}</p>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </div>
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Festivals</p>
                <p className="text-2xl font-bold">{upcomingFestivals.length}</p>
                <p className="text-xs text-muted-foreground">Next 60 days</p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SMS Reachable</p>
                <p className="text-2xl font-bold">{getContactCount('sms')}</p>
                <p className="text-xs text-muted-foreground">Have phone numbers</p>
              </div>
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Reachable</p>
                <p className="text-2xl font-bold">{getContactCount('email')}</p>
                <p className="text-xs text-muted-foreground">Have email addresses</p>
              </div>
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Message Campaigns</TabsTrigger>
          <TabsTrigger value="festivals">Festival Calendar</TabsTrigger>
          <TabsTrigger value="birthdays">Birthday Reminders</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Recipients
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedCustomers.length === customers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCustomers.includes(customer.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleCustomerToggle(customer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">
                            {customer.phone && `📱 ${customer.phone}`}
                            {customer.email && ` • ✉️ ${customer.email}`}
                          </div>
                        </div>
                        <Checkbox 
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => {}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">
                    Selected: {selectedCustomers.length} customers
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Type */}
                <div className="space-y-2">
                  <Label>Message Type</Label>
                  <Select value={messageType} onValueChange={(value: 'birthday' | 'festival' | 'appreciation' | 'custom') => setMessageType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="birthday">Birthday Wishes</SelectItem>
                      <SelectItem value="festival">Festival Greetings</SelectItem>
                      <SelectItem value="appreciation">Customer Appreciation</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Festival Selection */}
                {messageType === 'festival' && (
                  <div className="space-y-2">
                    <Label>Select Festival</Label>
                    <Select 
                      value={selectedFestival?.name || ''} 
                      onValueChange={(value) => {
                        const festival = upcomingFestivals.find(f => f.name === value)
                        setSelectedFestival(festival || null)
                        if (festival) {
                          setMessageTemplate(festival.messageTemplate)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a festival" />
                      </SelectTrigger>
                      <SelectContent>
                        {upcomingFestivals.map((festival) => (
                          <SelectItem key={festival.name} value={festival.name}>
                            {festival.name} - {format(festival.date, 'MMM dd')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Template Selection */}
                {messageType !== 'custom' && (
                  <div className="space-y-2">
                    <Label>Message Template</Label>
                    <Select 
                      value={messageTemplate} 
                      onValueChange={setMessageTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {messageType === 'birthday' && Object.entries(MESSAGE_TEMPLATES.birthday).map(([key, template]) => (
                          <SelectItem key={key} value={template}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </SelectItem>
                        ))}
                        {messageType === 'festival' && Object.entries(MESSAGE_TEMPLATES.festival).map(([key, template]) => (
                          <SelectItem key={key} value={template}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </SelectItem>
                        ))}
                        {messageType === 'appreciation' && Object.entries(MESSAGE_TEMPLATES.appreciation).map(([key, template]) => (
                          <SelectItem key={key} value={template}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Message Content */}
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  {messageType === 'custom' ? (
                    <Textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your custom message..."
                      rows={6}
                    />
                  ) : (
                    <Textarea
                      value={messageTemplate}
                      onChange={(e) => setMessageTemplate(e.target.value)}
                      rows={6}
                    />
                  )}
                </div>

                {/* Communication Method */}
                <div className="space-y-2">
                  <Label>Send Via</Label>
                  <Select value={communicationMethod} onValueChange={(value: 'sms' | 'whatsapp' | 'email') => setCommunicationMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS ({getContactCount('sms')} reachable)</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp ({getContactCount('whatsapp')} reachable)</SelectItem>
                      <SelectItem value="email">Email ({getContactCount('email')} reachable)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schedule Option */}
                <div className="space-y-2">
                  <Label>Schedule (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>

                {/* Preview */}
                {selectedCustomers.length > 0 && (messageTemplate || customMessage) && (
                  <div className="space-y-2">
                    <Label>Preview (for {customers.find(c => c.id === selectedCustomers[0])?.name})</Label>
                    <div className="p-3 bg-gray-50 border rounded-lg text-sm">
                      {formatMessage(
                        messageType === 'custom' ? customMessage : messageTemplate,
                        customers.find(c => c.id === selectedCustomers[0])!,
                        selectedFestival || undefined
                      )}
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <Button 
                  onClick={handleSendMessages}
                  disabled={selectedCustomers.length === 0 || isSending || (!messageTemplate && !customMessage)}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 
                   scheduleDate ? `Schedule for ${selectedCustomers.length} customers` :
                   `Send to ${selectedCustomers.length} customers`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="festivals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Festivals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingFestivals.map((festival) => {
                  const daysUntil = Math.ceil((festival.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={festival.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{festival.name}</h3>
                          <p className="text-sm text-muted-foreground">{festival.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={daysUntil <= 7 ? 'destructive' : 'outline'}>
                            {daysUntil === 0 ? 'Today!' : 
                             daysUntil === 1 ? 'Tomorrow' : 
                             `${daysUntil} days`}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(festival.date, 'MMMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setMessageType('festival')
                            setSelectedFestival(festival)
                            setMessageTemplate(festival.messageTemplate)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Create Campaign
                        </Button>
                        <Button variant="outline" size="sm">
                          <Bell className="h-4 w-4 mr-1" />
                          Set Reminder
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="birthdays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Upcoming Birthdays
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBirthdays.length > 0 ? (
                <div className="space-y-4">
                  {upcomingBirthdays.map((customer) => {
                    const birthday = new Date(customer.date_of_birth!)
                    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
                    
                    if (thisYearBirthday < today) {
                      thisYearBirthday.setFullYear(today.getFullYear() + 1)
                    }
                    
                    const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    return (
                      <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(thisYearBirthday, 'MMMM dd')} • {customer.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={daysUntil <= 3 ? 'destructive' : 'outline'}>
                            {daysUntil === 0 ? 'Today!' : 
                             daysUntil === 1 ? 'Tomorrow' : 
                             `${daysUntil} days`}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setMessageType('birthday')
                              setSelectedCustomers([customer.id])
                              setMessageTemplate(MESSAGE_TEMPLATES.birthday.casual)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Send Wishes
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4" />
                  <p>No upcoming birthdays in the next 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(MESSAGE_TEMPLATES).map(([category, templates]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(templates).map(([type, template]) => (
                    <div key={type} className="p-3 border rounded-lg">
                      <div className="font-medium capitalize mb-2">{type}</div>
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {template}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setMessageType(category as 'birthday' | 'festival' | 'appreciation' | 'custom')
                          setMessageTemplate(template)
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}