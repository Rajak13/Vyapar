'use client'

import { SignInForm } from '@/components/auth/signin-form'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <SignInForm
          onSwitchToSignUp={() => router.push('/signup')}
        />
      </div>
    </div>
  )
}