'use client'

import { useState } from 'react'
import { SignUpForm } from '@/components/auth/signup-form'
import { EmailVerificationHandler } from '@/components/auth/email-verification-handler'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const [showVerification, setShowVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const router = useRouter()

  const handleSignUpSuccess = (email: string) => {
    setVerificationEmail(email)
    setShowVerification(true)
  }

  const handleBackToSignUp = () => {
    setShowVerification(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {!showVerification ? (
          <SignUpForm
            onSuccess={handleSignUpSuccess}
            onSwitchToSignIn={() => router.push('/auth')}
          />
        ) : (
          <EmailVerificationHandler
            email={verificationEmail}
            type="signup"
            onBack={handleBackToSignUp}
          />
        )}
      </div>
    </div>
  )
}