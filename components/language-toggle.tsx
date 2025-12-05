'use client'

import { useLanguage } from '@/contexts/language-context'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-2">
      <Languages className="w-4 h-4 text-white/60" />
      <button
        onClick={() => setLanguage('ko')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          language === 'ko'
            ? 'bg-cyan-600 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        한국어
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-cyan-600 text-white'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        English
      </button>
    </div>
  )
}










