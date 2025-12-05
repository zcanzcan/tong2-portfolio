'use client'

import { Github } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SpotlightCard } from "@/components/spotlight-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function GithubCalendar() {
    // Mock data for contribution graph visual
    const weeks = 16
    const days = 7

    // Generate random contribution levels (0-4)
    const [contributions, setContributions] = useState<number[]>([])

    useEffect(() => {
        setContributions(Array.from({ length: weeks * days }, () => {
            const rand = Math.random()
            if (rand > 0.8) return 4 // High
            if (rand > 0.6) return 3 // Medium
            if (rand > 0.4) return 2 // Low
            if (rand > 0.2) return 1 // Minimal
            return 0 // None
        }))
    }, [])

    const getColor = (level: number) => {
        switch (level) {
            case 4: return "bg-green-500"
            case 3: return "bg-green-500/80"
            case 2: return "bg-green-500/60"
            case 1: return "bg-green-500/40"
            default: return "bg-white/5"
        }
    }

    return (
        <SpotlightCard
            className="h-full border-white/10 bg-black/20 hover:border-white/20 transition-colors group"
            spotlightColor="rgba(255, 255, 255, 0.1)"
        >
            <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Github className="w-5 h-5 text-white" />
                        <h3 className="text-sm font-bold text-white">Contributions</h3>
                    </div>
                    <span className="text-xs text-white/40">Last Year</span>
                </div>

                <div className="flex-1 flex items-center justify-center overflow-hidden">
                    <TooltipProvider delayDuration={0}>
                        <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: `repeat(${days}, minmax(0, 1fr))` }}>
                            {contributions.map((level, i) => (
                                <Tooltip key={i}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`w-2.5 h-2.5 rounded-sm ${getColor(level)} hover:ring-1 hover:ring-white/50 transition-all`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-xs">
                                        {level === 0 ? "No contributions" : `${level} contributions`}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </TooltipProvider>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-white/40">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500/40" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500/80" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </SpotlightCard>
    )
}
