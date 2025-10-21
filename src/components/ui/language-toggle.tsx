'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'
import type { Locale } from '@/i18n/config'

const languages = [
  { code: 'en' as Locale, name: 'English', nativeName: 'English' },
  { code: 'ne' as Locale, name: 'Nepali', nativeName: 'नेपाली' },
]

export function LanguageToggle() {
  const { locale, setLocale, isLoading } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLocale(language.code)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              <span className="text-sm text-muted-foreground">
                {language.nativeName}
              </span>
            </div>
            {locale === language.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}