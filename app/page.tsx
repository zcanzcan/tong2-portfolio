'use client'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { HeroCard } from "@/components/hero-card"
import { TechStack } from "@/components/tech-stack"
import { ProjectCard } from "@/components/project-card"
import { Connect } from "@/components/connect"
import { Experience } from "@/components/experience"
import { BottomNav } from "@/components/bottom-nav"
import { ProjectCarousel } from "@/components/project-carousel"
import { FeaturedPublication } from "@/components/featured-publication"
import { BlogCard } from "@/components/blog-card"
import { GithubCalendar } from "@/components/github-calendar"
import { GoogleCalendar } from "@/components/google-calendar"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/contexts/language-context"

export default function Portfolio() {
  const [projects, setProjects] = useState<any[]>([])
  const { language, t } = useLanguage()

  useEffect(() => {
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        if (data?.projects) {
          // Get localized project data
          const localized = data.projects.map((proj: any) => ({
            ...proj,
            title: language === 'ko' ? proj.title : (proj.titleEn || proj.title),
            description: language === 'ko' ? proj.description : (proj.descriptionEn || proj.description)
          }))
          setProjects(localized)
        }
      })
      .catch(console.error)
  }, [language])

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 lg:p-12 overflow-hidden relative selection:bg-cyan-500/30 selection:text-cyan-200 pb-24 md:pb-8">
      <LanguageToggle />
      <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]"
        >
          <div id="hero" className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 scroll-mt-4">
            <HeroCard />
          </div>

          <div id="contact" className="col-span-1 md:col-span-1 row-span-1 scroll-mt-4">
            <Connect />
          </div>

          <div id="skills" className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2 scroll-mt-4">
            <TechStack />
          </div>

          {/* Experience */}
          <div className="col-span-1 md:col-span-1 row-span-1">
            <Experience />
          </div>

          {/* Blog Card - New Section */}
          <div className="col-span-1 md:col-span-1 row-span-1">
            <BlogCard />
          </div>

          {/* Google Calendar - New Section */}
          <div className="col-span-1 md:col-span-1 row-span-1">
            <GoogleCalendar />
          </div>

          {/* Featured Publication - New Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1">
            <FeaturedPublication />
          </div>

          <div id="projects" className="col-span-1 md:col-span-3 lg:col-span-4 row-span-auto mt-4 scroll-mt-4">
            <h2 className="text-2xl font-bold mb-6 text-white/90 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-cyan-400 inline-block"></span>
              {t('projects-title', '주요 프로젝트', 'Featured Projects')}
            </h2>

            <div className="md:hidden">
              <ProjectCarousel projects={projects} />
            </div>

            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                // Loading State
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[400px] rounded-3xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center">
                    <div className="text-white/20">Loading Project...</div>
                  </div>
                ))
              ) : (
                projects.map((project, index) => (
                  <ProjectCard key={index} {...project} />
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </main>
  )
}
