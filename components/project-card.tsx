'use client'

import { motion } from "framer-motion"
import { ArrowUpRight } from 'lucide-react'
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

interface ProjectCardProps {
  title: string
  description: string
  tags: string[]
  image: string
  link: string
}

export function ProjectCard({ title, description, tags, image, link }: ProjectCardProps) {
  const { t } = useLanguage()
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors duration-500"
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          width={600}
          height={400}
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-cyan-500 hover:border-cyan-500 hover:text-black transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 ${!link ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            {t('view-project', '프로젝트 보기', 'View Project')}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>
        </div>

        <p className="text-white/60 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-md bg-white/5 text-white/80 border border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
