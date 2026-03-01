"use client"

import { SpotlightCard } from "@/components/spotlight-card"
import { Github, Linkedin, AtSign, BookText, Link as LinkIcon } from 'lucide-react'
import Link from "next/link"
import { getIcon as getLucideIcon } from "@/components/icon-map"

import { usePortfolioData } from "@/contexts/portfolio-data-context"

export function Connect() {
  const { data } = usePortfolioData()
  const socials = data?.socials || []

  const getIcon = (iconName: string) => {
    return getLucideIcon(iconName, LinkIcon)
  }

  return (
    <SpotlightCard className="h-full flex flex-col justify-center" spotlightColor="rgba(255, 255, 255, 0.1)">
      <div className="grid grid-cols-2 gap-4">
        {socials.map((social) => {
          const Icon = getIcon(social.icon)
          return (
            <Link
              key={social.id}
              href={social.url}
              target="_blank"
              className={`flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 transition-all duration-300 hover:scale-105 hover:bg-white/10 ${social.color || 'hover:text-white'}`}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium text-white/60">{social.name}</span>
            </Link>
          )
        })}
      </div>
    </SpotlightCard>
  )
}
