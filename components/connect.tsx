"use client"

import { useEffect, useState } from "react"
import { SpotlightCard } from "@/components/spotlight-card"
import { Github, Linkedin, AtSign, BookText, Link as LinkIcon } from 'lucide-react'
import Link from "next/link"
import * as Icons from 'lucide-react'

export function Connect() {
  const [socials, setSocials] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        if (data?.socials) setSocials(data.socials)
      })
      .catch(console.error)
  }, [])

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || LinkIcon
    return Icon
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
