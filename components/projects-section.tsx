'use client'

import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { ProjectCard } from "@/components/project-card"
import { ProjectCarousel } from "@/components/project-carousel"
import { useLanguage } from "@/contexts/language-context"
import { usePortfolioData } from "@/contexts/portfolio-data-context"

export function ProjectsSection() {
    const [projects, setProjects] = useState<any[]>([])
    const { language, t } = useLanguage()
    const { data } = usePortfolioData()

    useEffect(() => {
        if (data?.projects) {
            const localized = data.projects.map((proj: any) => ({
                ...proj,
                title: language === 'ko' ? proj.title : (proj.titleEn || proj.title),
                description: language === 'ko' ? proj.description : (proj.descriptionEn || proj.description)
            }))
            setProjects(localized)
        }
    }, [language, data])

    return (
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
    )
}
