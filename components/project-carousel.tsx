'use client'

import { useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Project {
  title: string
  description: string
  tags: string[]
  image: string
  link: string
}

interface ProjectCarouselProps {
  projects: Project[]
}

export function ProjectCarousel({ projects }: ProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection
      if (nextIndex < 0) nextIndex = projects.length - 1
      if (nextIndex >= projects.length) nextIndex = 0
      return nextIndex
    })
  }

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x)

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1)
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1)
    }
  }

  if (!projects || projects.length === 0) return null

  return (
    <div className="relative">
      <div className="relative h-[420px] overflow-hidden rounded-3xl">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className="absolute inset-0"
          >
            <div className="h-full rounded-3xl overflow-hidden bg-white/5 border border-white/10">
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <Image
                  src={projects[currentIndex].image || "/placeholder.svg"}
                  alt={projects[currentIndex].title}
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3">
                  {projects[currentIndex].title}
                </h3>

                <p className="text-white/60 text-sm mb-4">
                  {projects[currentIndex].description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {projects[currentIndex].tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-md bg-white/5 text-white/80 border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={projects[currentIndex].link}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-cyan-500 hover:border-cyan-500 hover:text-black transition-all duration-300 min-h-[44px]"
                >
                  프로젝트 보기
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
        aria-label="Previous project"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px]"
        aria-label="Next project"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {projects.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1)
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center ${index === currentIndex ? 'bg-cyan-400' : 'bg-white/20'
              }`}
            aria-label={`Go to project ${index + 1}`}
          >
            <span className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-cyan-400' : 'bg-white/20'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
