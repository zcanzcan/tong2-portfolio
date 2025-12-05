'use client'

import { useEffect, useState } from "react"
import { SpotlightCard } from "@/components/spotlight-card"
import {
  Code2, Globe, Terminal, Layout, Server, Database, Smartphone, Layers, Cpu,
  FileJson, Cloud, GitBranch, Command, Hash, Monitor, Wifi, Box, Award, ExternalLink
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import * as Icons from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"
import { motion } from "framer-motion"

export function TechStack() {
  const [skills, setSkills] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])
  const { language, t } = useLanguage()

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        if (data?.skills) setSkills(data.skills)
        if (data?.certifications) {
          const localized = data.certifications.map((cert: any) => ({
            ...cert,
            name: language === 'ko' ? cert.name : (cert.nameEn || cert.name),
            issuer: language === 'ko' ? cert.issuer : (cert.issuerEn || cert.issuer)
          }))
          setCertifications(localized)
        }
      })
      .catch(console.error)
  }, [language])

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Code2
    return Icon
  }

  return (
    <SpotlightCard className="h-full flex flex-col" spotlightColor="rgba(6, 182, 212, 0.1)">
      {/* 기술 스택 섹션 - 최대 높이 제한 및 스크롤 가능 */}
      <div className="flex flex-col min-h-0" style={{ maxHeight: '50%' }}>
        <h2 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2 flex-shrink-0">
          <span className="w-8 h-[2px] bg-cyan-400 inline-block"></span>
          {t('tech-stack-title', '기술 스택', 'Tech Stack')}
        </h2>

        <div className="overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <TooltipProvider delayDuration={0}>
              {skills.map((tech, index) => {
                const Icon = getIcon(tech.icon)
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 group cursor-help">
                        <Icon className={`w-5 h-5 ${tech.color} transition-transform duration-300 group-hover:scale-110`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-black/90 border-white/10 text-white">
                      <p>{tech.name}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* 자격증 섹션 - 최대 2개만 보이고 나머지는 스크롤 */}
      <div className="flex flex-col min-h-0 mt-6 flex-1">
        <h2 className="text-xl font-bold mb-4 text-white/90 flex items-center gap-2 flex-shrink-0">
          <span className="w-8 h-[2px] bg-yellow-400 inline-block"></span>
          {t('certifications-title', '자격증', 'Certifications')}
        </h2>

        {certifications.length === 0 ? (
          <div className="text-white/40 text-sm animate-pulse">
            {t('no-certifications', '자격증 정보가 없습니다', 'No certifications')}
          </div>
        ) : (
          <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar" style={{ maxHeight: '140px' }}>
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                    {cert.name}
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    {cert.issuer} {cert.date ? `· ${cert.date}` : ''}
                  </p>
                </div>
                {cert.url && (
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400/60 hover:text-yellow-400 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </SpotlightCard>
  )
}
