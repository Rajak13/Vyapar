import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - Vyapar Vision',
  description: 'Sign in or create your Vyapar Vision account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
    </div>
  )
}