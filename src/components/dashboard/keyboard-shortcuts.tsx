'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      description: 'New Sale (Ctrl+N)',
      action: () => router.push('/pos'),
    },
    {
      key: 'e',
      description: 'Add Expense (Ctrl+E)',
      action: () => router.push('/expenses/new'),
    },
    {
      key: 'i',
      description: 'Inventory (Ctrl+I)',
      action: () => router.push('/inventory'),
    },
    {
      key: 'c',
      description: 'Customers (Ctrl+C)',
      action: () => router.push('/customers'),
    },
    {
      key: 'r',
      description: 'Reports (Ctrl+R)',
      action: () => router.push('/reports'),
    },
    {
      key: 'd',
      description: 'Dashboard (Ctrl+D)',
      action: () => router.push('/dashboard'),
    },
  ]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger on Ctrl+Key combinations
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return
      }

      // Prevent shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return
      }

      const shortcut = shortcuts.find(s => s.key === event.key.toLowerCase())
      if (shortcut) {
        event.preventDefault()
        shortcut.action()
        toast.success(`Navigating via keyboard shortcut: ${shortcut.description}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return shortcuts
}

export function KeyboardShortcutsHelp() {
  const shortcuts = useKeyboardShortcuts()

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-muted-foreground">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.key} className="flex justify-between">
            <span>{shortcut.description.split(' (')[0]}</span>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
              Ctrl+{shortcut.key.toUpperCase()}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}