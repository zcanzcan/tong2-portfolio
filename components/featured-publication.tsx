'use client'

import { useState, useEffect } from 'react'
import { Book, ExternalLink, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { SpotlightCard } from "@/components/spotlight-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"

export function FeaturedPublication() {
  const [publications, setPublications] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [previewPublication, setPreviewPublication] = useState<any>(null)
  const { language, t } = useLanguage()

  // previewPublication 상태 변경 추적
  useEffect(() => {
    console.log('[FeaturedPublication] previewPublication state changed:', {
      previewPublication,
      isOpen: !!previewPublication,
      hasPurchaseLinks: previewPublication?.purchaseLinks?.length > 0,
      purchaseLinks: previewPublication?.purchaseLinks,
      purchaseLinksLength: previewPublication?.purchaseLinks?.length || 0
    })
    if (previewPublication) {
      console.log('[FeaturedPublication] Dialog should render with:', {
        title: previewPublication.title,
        purchaseLinks: previewPublication.purchaseLinks,
        purchaseLinksCount: previewPublication.purchaseLinks?.length || 0
      })
    }
  }, [previewPublication])

  useEffect(() => {
    console.log('[FeaturedPublication] useEffect triggered, language:', language)
    fetch('/api/portfolio')
      .then(res => {
        console.log('[FeaturedPublication] API response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('[FeaturedPublication] API response data:', data)
        console.log('[FeaturedPublication] Publications from API:', data?.publications)
        if (data?.publications) {
          const localized = data.publications.map((pub: any) => {
            console.log('[FeaturedPublication] Processing publication:', {
              id: pub.id,
              title: pub.title,
              purchaseLinks: pub.purchaseLinks,
              hasPurchaseLinks: !!pub.purchaseLinks,
              purchaseLinksLength: pub.purchaseLinks?.length || 0
            })
            return {
              ...pub,
              title: language === 'ko' ? pub.title : (pub.titleEn || pub.title),
              description: language === 'ko' ? pub.description : (pub.descriptionEn || pub.description),
              tag: language === 'ko' ? pub.tag : (pub.tagEn || pub.tag),
              purchaseLinks: pub.purchaseLinks || [] // purchaseLinks 포함
            }
          })
          console.log('[FeaturedPublication] Localized publications:', localized)
          console.log('[FeaturedPublication] First publication purchaseLinks:', localized[0]?.purchaseLinks)
          setPublications(localized)
        } else {
          console.warn('[FeaturedPublication] No publications found in API response')
        }
      })
      .catch(error => {
        console.error('[FeaturedPublication] API fetch error:', error)
      })
  }, [language])

  if (publications.length === 0) {
    return (
      <SpotlightCard className="h-full border-amber-500/30 bg-amber-500/5 flex items-center justify-center" spotlightColor="rgba(245, 158, 11, 0.15)">
        <div className="text-amber-400/40 animate-pulse">Loading Publications...</div>
      </SpotlightCard>
    )
  }

  const currentBook = publications[currentIndex]

  return (
    <>
      <SpotlightCard
        className="h-full border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors group"
        spotlightColor="rgba(245, 158, 11, 0.15)"
      >
        <div className="flex h-full gap-4">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 h-full relative overflow-hidden">
            {/* 3D Book Cover Placeholder */}
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500 pl-2">
              {currentBook.image ? (
                <div className="w-32 h-44 rounded-r-md rounded-l-sm shadow-2xl overflow-hidden relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                  <Image
                    src={currentBook.image}
                    alt={currentBook.title}
                    width={300}
                    height={400}
                    quality={100}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-32 h-44 bg-gradient-to-br from-amber-400 to-orange-600 rounded-r-md rounded-l-sm shadow-2xl flex items-center justify-center relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                  <div className="absolute inset-y-0 left-0 w-1 bg-white/20" />
                  <div className="text-center p-2">
                    <div className="text-[10px] font-bold text-amber-900 tracking-widest mb-1">{currentBook.tag || "NEW BOOK"}</div>
                    <h3 className="text-white font-bold text-sm leading-tight whitespace-pre-line">{currentBook.title}</h3>
                  </div>
                </div>
              )}
              {/* Book Pages Effect */}
              <div className="absolute top-1 right-2 w-32 h-42 bg-white/90 rounded-r-md z-0 transform translate-x-2 translate-y-1 shadow-md" />
              <div className="absolute top-2 right-4 w-32 h-40 bg-white/80 rounded-r-md -z-10 transform translate-x-4 translate-y-2 shadow-sm" />
            </div>

            <div className="flex flex-col justify-center text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                  {currentBook.tag || "대표 저서"}
                </span>
                <span className="text-zinc-500 text-xs">
                  {currentIndex + 1} / {publications.length}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors truncate w-full">
                {currentBook.title}
              </h3>

              <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">
                {currentBook.description}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 text-zinc-300 w-full sm:w-auto"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const bookToPreview = { ...currentBook }
                  setPreviewPublication(bookToPreview)
                }}
              >
                <Book className="w-4 h-4" />
                {t('preview', '미리보기', 'Preview')}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            </div>
          </div>

          {/* Right Sidebar Navigation (Playlist Style) */}
          {publications.length > 1 && (
            <div className="w-16 shrink-0 flex flex-col gap-2 py-2 border-l border-white/5 pl-2">
              <div className="text-[10px] text-zinc-500 font-bold text-center mb-1">LIST</div>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[160px] pr-1 items-center section-scrollbar">
                {publications.map((book, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-12 h-16 rounded-sm border transition-all relative group/btn shrink-0 overflow-hidden ${currentIndex === idx
                      ? 'border-amber-500 bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50'
                      : 'border-white/10 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10 opacity-60 hover:opacity-100'
                      }`}
                    title={book.title}
                  >
                    {book.image ? (
                      <Image
                        src={book.image}
                        alt="thumbnail"
                        width={100}
                        height={140}
                        quality={100}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${currentIndex === idx ? 'from-amber-400/80 to-orange-600/80' : 'from-zinc-700/50 to-zinc-900/50'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SpotlightCard>

      {/* Publication Preview Dialog */}
      <Dialog open={!!previewPublication} onOpenChange={(open) => !open && setPreviewPublication(null)}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">도서 상세 정보</DialogTitle>
          </DialogHeader>
          {previewPublication ? (
            <div className="mt-4">
              <div
                className="relative overflow-hidden rounded-3xl glass-card p-6 duration-300 h-full border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6 h-full relative">
                  {/* 3D Book Cover */}
                  <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                    {previewPublication.image ? (
                      <div className="w-32 h-44 rounded-r-md rounded-l-sm shadow-2xl overflow-hidden relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                        <Image
                          src={previewPublication.image}
                          alt={previewPublication.title || 'Publication'}
                          width={300}
                          height={400}
                          quality={100}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-44 bg-gradient-to-br from-amber-400 to-orange-600 rounded-r-md rounded-l-sm shadow-2xl flex items-center justify-center relative z-10 transform perspective-1000 rotate-y-12 border-l-4 border-amber-800">
                        <div className="absolute inset-y-0 left-0 w-1 bg-white/20" />
                        <div className="text-center p-2">
                          <div className="text-[10px] font-bold text-amber-900 tracking-widest mb-1">
                            {previewPublication.tag || "NEW BOOK"}
                          </div>
                          <h3 className="text-white font-bold text-sm leading-tight whitespace-pre-line">
                            {previewPublication.title || '제목 없음'}
                          </h3>
                        </div>
                      </div>
                    )}
                    {/* Book Pages Effect */}
                    <div className="absolute top-1 right-2 w-32 h-42 bg-white/90 rounded-r-md z-0 transform translate-x-2 translate-y-1 shadow-md" />
                    <div className="absolute top-2 right-4 w-32 h-40 bg-white/80 rounded-r-md -z-10 transform translate-x-4 translate-y-2 shadow-sm" />
                  </div>

                  <div className="flex flex-col justify-center text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30">
                        {previewPublication.tag || "대표 저서"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {previewPublication.title || '(제목 없음)'}
                    </h3>

                    <p className="text-zinc-400 text-sm mb-4 leading-relaxed break-words whitespace-pre-line">
                      {previewPublication.description || '(설명 없음)'}
                    </p>

                    {/* 구매 링크 버튼들 */}
                    {(previewPublication.purchaseLinks && previewPublication.purchaseLinks.length > 0) ? (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {previewPublication.purchaseLinks.map((link: any, linkIdx: number) => (
                          <a
                            key={linkIdx}
                            href={link.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 text-zinc-300 rounded text-sm transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {link.name || '구매하기'}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        ))}
                      </div>
                    ) : previewPublication.link && !previewPublication.link.startsWith('#') ? (
                      <a
                        href={previewPublication.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 text-zinc-300 rounded text-sm transition-colors"
                      >
                        <Book className="w-4 h-4" />
                        미리보기
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 text-white">로딩 중...</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
