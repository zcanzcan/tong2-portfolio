'use client'

import { Coffee, Mail } from 'lucide-react'
import { SpotlightCard } from "@/components/spotlight-card"
import { Button } from "@/components/ui/button"

export function CoffeeChatCard() {
    return (
        <SpotlightCard
            className="h-full border-amber-700/30 bg-amber-900/5 hover:border-amber-600/50 transition-colors group"
            spotlightColor="rgba(217, 119, 6, 0.15)"
        >
            <div className="flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        <Coffee className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-500/80 tracking-widest uppercase border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/5">
                        Contact
                    </span>
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                        커피챗 요청
                    </h3>
                    <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                        기술적인 고민이나<br />
                        협업 제안을 기다립니다.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 text-zinc-300"
                    asChild
                >
                    <a href="mailto:your.email@example.com">
                        메일 보내기
                        <Mail className="w-3 h-3 opacity-50" />
                    </a>
                </Button>
            </div>
        </SpotlightCard>
    )
}
