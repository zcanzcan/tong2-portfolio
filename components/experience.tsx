"use client"

import { useEffect, useState } from "react"
import { SpotlightCard } from "@/components/spotlight-card"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/contexts/language-context"

export function Experience() {
  const [experiences, setExperiences] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const { language, t } = useLanguage()

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        if (data?.experience) {
          // Get localized experience data
          const localized = data.experience.map((exp: any) => ({
            ...exp,
            role: language === 'ko' ? exp.role : (exp.roleEn || exp.role),
            company: language === 'ko' ? exp.company : (exp.companyEn || exp.company),
            period: language === 'ko' ? exp.period : (exp.periodEn || exp.period)
          }))
          setExperiences(localized)
        }
      })
      .catch(console.error)
  }, [language])

  useEffect(() => {
    if (experiences.length === 0) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % experiences.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [experiences])

  if (experiences.length === 0) {
    return (
      <SpotlightCard className="h-full overflow-hidden flex items-center justify-center" spotlightColor="rgba(168, 85, 247, 0.1)">
        <div className="text-white/40 animate-pulse">Loading Experience...</div>
      </SpotlightCard>
    )
  }

  return (
    <SpotlightCard className="h-full overflow-visible" spotlightColor="rgba(168, 85, 247, 0.1)">
      <h2 className="text-xl font-bold mb-3 text-white/90 flex items-center gap-2">
        <span className="w-8 h-[2px] bg-purple-400 inline-block"></span>
        {t('experience-title', '경력', 'Experience')}
      </h2>

      <div className="relative h-[200px] w-full overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 overflow-visible"
          >
            <div className="flex flex-col h-full justify-start pt-2 group cursor-pointer overflow-visible">
              <div className="flex items-baseline gap-1 mb-0 overflow-visible">
                <span className="text-6xl font-bold text-white/10 group-hover:text-white/20 transition-colors leading-none overflow-visible">
                  0{currentIndex + 1}
                </span>
                <span className={`text-sm font-medium ${experiences[currentIndex].color || 'text-white'} opacity-60`}>
                  {experiences[currentIndex].period}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-0 mt-1 group-hover:text-purple-400 transition-colors">
                {experiences[currentIndex].role}
              </h3>

              <p className="text-lg text-white/60 mt-0.5">
                {experiences[currentIndex].company}
              </p>

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-full overflow-hidden mt-auto">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-purple-500/50"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SpotlightCard>
  )
}
