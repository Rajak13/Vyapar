import { POSInterface } from '@/components/pos/pos-interface'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Point of Sale - Vyapar Vision',
  description: 'Process sales transactions quickly and efficiently',
}

export default function POSPage() {
  return (
    <div className="h-full">
      <POSInterface />
    </div>
  )
}