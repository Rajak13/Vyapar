import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Setup - Vyapar Vision',
  description: 'Set up your business profile to get started with Vyapar Vision',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}