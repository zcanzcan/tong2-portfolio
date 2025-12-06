'use client'

import { Calendar, Clock, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SpotlightCard } from "@/components/spotlight-card"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

interface CalendarEvent {
  summary: string
  start: string
  end: string
  location?: string
  description?: string
}

export function GoogleCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarId, setCalendarId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { language, t } = useLanguage()

  useEffect(() => {
    // Get calendar ID from portfolio data
    fetch('/api/portfolio')
      .then(res => res.json())
      .then(data => {
        if (data?.calendar?.calendarId) {
          setCalendarId(data.calendar.calendarId)
          fetchMonthEvents(data.calendar.calendarId)
        } else {
          setLoading(false)
        }
      })
      .catch(console.error)
  }, [])

  const fetchMonthEvents = async (calId: string) => {
    console.log('[GoogleCalendar] ====== FETCH START ======')
    console.log('[GoogleCalendar] Calendar ID:', calId)

    try {
      setLoading(true)

      // Get API key from portfolio data if available
      console.log('[GoogleCalendar] Fetching portfolio data...')
      const portfolioRes = await fetch('/api/portfolio')
      const portfolioData = await portfolioRes.json()
      const apiKey = portfolioData?.calendar?.apiKey || ''

      console.log('[GoogleCalendar] Portfolio data:', {
        hasCalendar: !!portfolioData?.calendar,
        hasCalendarId: !!portfolioData?.calendar?.calendarId,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey.length
      })

      const url = `/api/calendar?calendarId=${encodeURIComponent(calId)}${apiKey ? `&apiKey=${encodeURIComponent(apiKey)}` : ''}`
      console.log('[GoogleCalendar] ====== CALLING API ======')
      console.log('[GoogleCalendar] Request URL:', url.replace(apiKey, 'API_KEY_HIDDEN'))

      const response = await fetch(url)

      console.log('[GoogleCalendar] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        console.error('[GoogleCalendar] HTTP Error:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()

      console.log('[GoogleCalendar] API Response:', {
        eventsCount: data.events?.length || 0,
        error: data.error,
        hasApiKey: data.hasApiKey,
        apiBlocked: data.apiBlocked,
        dateRange: data.dateRange,
        calendarId: data.calendarId,
        originalCalendarId: data.originalCalendarId,
        events: data.events?.slice(0, 3) // 처음 3개만 로깅
      })

      // 디버깅 정보 표시
      if (data.error && data.calendarId) {
        console.warn('[GoogleCalendar] Debug Info:', {
          attemptedCalendarId: data.calendarId,
          originalCalendarId: data.originalCalendarId,
          error: data.error,
          suggestion: '캘린더 ID를 확인하거나 새 캘린더를 만들어보세요'
        })
      }

      if (data.error) {
        console.error('[GoogleCalendar] API Error:', data.error)
        // 에러가 있어도 일정이 있으면 표시
        if (data.events && data.events.length > 0) {
          console.log('[GoogleCalendar] Events found despite error, showing them')
          setError(null)
          setEvents(data.events)
        } else {
          setError(data.error)
          setEvents([])
        }
      } else {
        setError(null)
        if (data.events && Array.isArray(data.events)) {
          console.log('[GoogleCalendar] Setting events:', data.events.length)
          setEvents(data.events)
        } else {
          console.log('[GoogleCalendar] No events in response')
          setEvents([])
        }
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      setError(error instanceof Error ? error.message : '일정을 불러오는 중 오류가 발생했습니다')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return language === 'ko' ? '오늘' : 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return language === 'ko' ? '내일' : 'Tomorrow'
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  const getCalendarEmbedUrl = (calId: string) => {
    // Google Calendar embed URL
    return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calId)}&ctz=Asia/Seoul`
  }

  if (!calendarId) {
    return (
      <SpotlightCard
        className="h-full border-white/10 bg-black/20 hover:border-white/20 transition-colors group"
        spotlightColor="rgba(255, 255, 255, 0.1)"
      >
        <div className="flex flex-col h-full p-4 items-center justify-center">
          <Calendar className="w-8 h-8 text-white/40 mb-2" />
          <p className="text-sm text-white/40 text-center">
            {t('no-calendar', '캘린더가 설정되지 않았습니다', 'Calendar not configured')}
          </p>
        </div>
      </SpotlightCard>
    )
  }

  return (
    <SpotlightCard
      className="h-full border-white/10 bg-black/20 hover:border-white/20 transition-colors group overflow-hidden"
      spotlightColor="rgba(255, 255, 255, 0.1)"
    >
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white" />
            <h3 className="text-sm font-bold text-white">
              {t('this-month', '이번 달 일정', 'This Month')}
            </h3>
          </div>
          <a
            href={getCalendarEmbedUrl(calendarId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white/40 text-sm animate-pulse">
              {t('loading', '로딩 중...', 'Loading...')}
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <Calendar className="w-8 h-8 text-red-400/60 mx-auto mb-2" />
              <p className="text-sm text-red-400/80 mb-2 font-semibold">
                {t('error-loading', '일정을 불러올 수 없습니다', 'Failed to load events')}
              </p>
              <p className="text-xs text-white/50 mb-3 px-2 leading-relaxed">
                {error}
              </p>
              <div className="text-xs text-white/40 space-y-1 mb-3">
                <p className="font-semibold text-yellow-400/80">확인 사항:</p>
                <p>1. Google Calendar에서 캘린더 공개 설정 확인</p>
                <p>2. "공개: 모든 세부정보 보기" 선택되어 있는지 확인</p>
                <p>3. 캘린더 ID가 올바른지 확인 (관리자 페이지에서 재확인)</p>
                <p>4. 이번 달에 실제 일정이 있는지 확인</p>
              </div>
              <div className="space-y-2">
                <a
                  href={getCalendarEmbedUrl(calendarId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline block"
                >
                  캘린더 직접 확인하기 →
                </a>
                <a
                  href={`https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline block"
                >
                  iCal Feed 직접 테스트 →
                </a>
              </div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <Calendar className="w-8 h-8 text-white/40 mx-auto mb-2" />
              <p className="text-sm text-white/40 mb-2">
                {t('no-events', '이번 달 일정이 없습니다', 'No events this month')}
              </p>
              <p className="text-xs text-white/30 mb-3">
                {t('check-calendar', '캘린더에 일정이 있는지 확인해주세요', 'Please check if there are events in your calendar')}
              </p>
              <a
                href={getCalendarEmbedUrl(calendarId)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
              >
                캘린더에서 일정 확인하기 →
              </a>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-[11rem]">
            {events.slice(0, 8).map((event, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white line-clamp-2 flex-1">
                    {event.summary}
                  </h4>
                  <span className="text-xs text-white/60 whitespace-nowrap">
                    {formatDate(event.start)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </span>
                </div>
                {event.location && (
                  <p className="text-xs text-white/50 mt-1 line-clamp-1">
                    📍 {event.location}
                  </p>
                )}
              </div>
            ))}
            {events.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-white/60 hover:text-white"
                  asChild
                >
                  <a
                    href={getCalendarEmbedUrl(calendarId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('view-all', '전체 보기', 'View All')} ({events.length})
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </SpotlightCard>
  )
}

