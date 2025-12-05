'use client'

import { useEffect, useState } from "react"
import { SpotlightCard } from "@/components/spotlight-card"
import { Button } from "@/components/ui/button"
import { BookText, ExternalLink } from 'lucide-react'
import { useLanguage } from "@/contexts/language-context"

export function BlogCard() {
    const [blog, setBlog] = useState<any>(null)
    const { language, t } = useLanguage()

    useEffect(() => {
        fetch('/api/portfolio')
            .then(res => res.json())
            .then(data => {
                if (data?.blog) {
                    setBlog({
                        ...data.blog,
                        title: language === 'ko' ? data.blog.title : (data.blog.titleEn || data.blog.title),
                        description: language === 'ko' ? data.blog.description : (data.blog.descriptionEn || data.blog.description)
                    })
                }
            })
            .catch(console.error)
    }, [language])

    if (!blog) {
        return (
            <SpotlightCard className="h-full border-green-500/30 bg-green-500/5 flex items-center justify-center" spotlightColor="rgba(34, 197, 94, 0.15)">
                <div className="text-green-400/40 animate-pulse">Loading Blog...</div>
            </SpotlightCard>
        )
    }

    return (
        <SpotlightCard
            className="h-full border-green-500/30 bg-green-500/5 hover:border-green-500/50 transition-colors group"
            spotlightColor="rgba(34, 197, 94, 0.15)"
        >
            <div className="flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                            <BookText className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-green-400">Tech Blog</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">
                        {blog.title}
                    </h3>

                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                        {blog.description}
                    </p>
                </div>

                <Button
                    variant="outline"
                    className="mt-6 w-full border-green-500/30 hover:bg-green-500/10 hover:text-green-400 text-zinc-300 group-hover:border-green-500/50"
                    asChild
                >
                    <a href={blog.url} target="_blank" rel="noopener noreferrer">
                        {t('visit-blog', '블로그 방문하기', 'Visit Blog')}
                        <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
                    </a>
                </Button>
            </div>
        </SpotlightCard>
    )
}
