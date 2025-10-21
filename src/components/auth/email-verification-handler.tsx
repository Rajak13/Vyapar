'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface EmailVerificationHandlerProps {
  email: string
  type: 'signup' | 'email_change'
  onBack?: () => void
}

export function EmailVerificationHandler({ email, type, onBack }: EmailVerificationHandlerProps) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isResending, setIsResending] = useState(false)
  const { user, session, resendOtp } = useAuth()
  const router = useRouter()

  // Check if user is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      setIsCheckingStatus(true)

      // If user is already signed in and verified, redirect
      if (user && user.email_confirmed_at) {
        toast.success('Email already verified!')
        if (type === 'signup') {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
        return
      }

      setIsCheckingStatus(false)
    }

    checkVerificationStatus()
  }, [user, session, type, router])

  const handleCheckEmail = () => {
    // Try to detect email provider and open appropriate link
    const domain = email.split('@')[1]?.toLowerCase()
    let emailUrl = 'https://mail.google.com'

    if (domain?.includes('gmail')) {
      emailUrl = 'https://mail.google.com'
    } else if (domain?.includes('yahoo')) {
      emailUrl = 'https://mail.yahoo.com'
    } else if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
      emailUrl = 'https://outlook.live.com'
    } else {
      // Generic email client
      emailUrl = `mailto:${email}`
    }

    window.open(emailUrl, '_blank')
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const { error } = await resendOtp(email, type)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verification email sent! Please check your inbox.')
      }
    } catch {
      toast.error('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const handleSkipVerification = () => {
    toast.success('Proceeding without email verification')
    if (type === 'signup') {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  if (isCheckingStatus) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Checking Status...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        </div>
        <CardDescription className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="h-4 w-4" />
            <span>We sent a verification link to</span>
          </div>
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Click the link in your email to verify your account</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCheckEmail}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Email App
            </Button>

            <Button
              onClick={handleResendEmail}
              className="w-full"
              variant="outline"
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Email
                </>
              )}
            </Button>

            <Button
              onClick={handleSkipVerification}
              className="w-full"
            >
              Continue to App
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try resending.
            <br />
            You can also continue to use the app without verification.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}