'use client'

import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DashboardSection, FullWidthGrid } from '@/components/layout/dashboard-grid'
import { DashboardMetrics } from '@/components/dashboard/dashboard-metrics'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { useKeyboardShortcuts } from '@/components/dashboard/keyboard-shortcuts'
import { useBusinesses } from '@/hooks/use-businesses'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts()

  // Check if user has a business set up
  const { data: businesses, isLoading: businessesLoading } = useBusinesses(user?.id || '')
  const hasBusiness = businesses && businesses.length > 0

  return (
    <div className="space-y-8">
      <DashboardSection 
        title="Dashboard" 
        description="Welcome to your business management center"
      >
        {/* Business Metrics */}
        <DashboardMetrics />
      </DashboardSection>

      {/* Charts and Analytics */}
      <DashboardSection>
        <DashboardCharts />
      </DashboardSection>

      {/* Quick Actions */}
      <DashboardSection>
        <QuickActions />
      </DashboardSection>

      {/* Welcome Section - Show only for new users without business */}
      {!businessesLoading && !hasBusiness && (
        <DashboardSection>
          <FullWidthGrid>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Welcome to Vyapar Vision
                </CardTitle>
                <CardDescription>
                  You have successfully signed in to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>User ID:</strong> {user?.id}</p>
                  <p><strong>Email Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
                  <p><strong>Last Sign In:</strong> {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>
                  Complete your business setup to start using Vyapar Vision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Business Profile Setup</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Set up your business information to personalize your experience
                    </p>
                    <Button size="sm" onClick={() => router.push('/onboarding')}>
                      Complete Setup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FullWidthGrid>
        </DashboardSection>
      )}
    </div>
  )
}