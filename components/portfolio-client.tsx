'use client'

import { motion } from "framer-motion"
import { HeroCard } from "@/components/hero-card"
import { TechStack } from "@/components/tech-stack"
import { Connect } from "@/components/connect"
import { Experience } from "@/components/experience"
import { BottomNav } from "@/components/bottom-nav"
import { FeaturedPublication } from "@/components/featured-publication"
import { BlogCard } from "@/components/blog-card"
import { GoogleCalendar } from "@/components/google-calendar"
import { LanguageToggle } from "@/components/language-toggle"
import { ProjectsSection } from "@/components/projects-section"

export default function PortfolioClient() {
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
                                staggerChildren: 0.03,
                                delayChildren: 0
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

                    {/* Blog Card */}
                    <div className="col-span-1 md:col-span-1 row-span-1">
                        <BlogCard />
                    </div>

                    {/* Google Calendar */}
                    <div className="col-span-1 md:col-span-1 row-span-1">
                        <GoogleCalendar />
                    </div>

                    {/* Featured Publication */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1">
                        <FeaturedPublication />
                    </div>

                    <ProjectsSection />
                </motion.div>
            </div>

            <BottomNav />
        </main>
    )
}
