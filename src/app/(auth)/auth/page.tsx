'use client'

import { useState } from 'react'
import { SignInForm } from '@/components/auth/signin-form'
import { SignUpForm } from '@/components/auth/signup-form'
import { EmailVerificationHandler } from '@/components/auth/email-verification-handler'

type AuthView = 'signin' | 'signup' | 'verify-email'

export default function AuthPage() {
  const [currentView, setCurrentView] = useState<AuthView>('signin')
  const [verificationEmail, setVerificationEmail] = useState('')

  const handleSignUpSuccess = (email: string) => {
    setVerificationEmail(email)
    setCurrentView('verify-email')
  }

  const handleBackToSignUp = () => {
    setCurrentView('signup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {currentView === 'signin' && (
          <SignInForm
            onSwitchToSignUp={() => setCurrentView('signup')}
          />
        )}
        
        {currentView === 'signup' && (
          <SignUpForm
            onSuccess={handleSignUpSuccess}
            onSwitchToSignIn={() => setCurrentView('signin')}
          />
        )}
        
        {currentView === 'verify-email' && (
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