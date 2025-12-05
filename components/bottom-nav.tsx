'use client'

import { Home, Briefcase, Code2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { icon: Home, label: '홈', href: '#hero' },
  { icon: Briefcase, label: '프로젝트', href: '#projects' },
  { icon: Code2, label: '스킬', href: '#skills' },
  { icon: Mail, label: '연락', href: '#contact' },
]

export function BottomNav() {
  const handleNavClick = (href: string) => {
    const element = document.querySelector(href)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      <div className="mx-4 mb-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavClick(item.href)}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl hover:bg-white/10 active:bg-white/20 transition-colors min-w-[44px] min-h-[44px]"
              aria-label={item.label}
            >
              <item.icon className="w-5 h-5 text-white/70" />
              <span className="text-[10px] text-white/60 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  )
}
