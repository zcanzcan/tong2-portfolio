import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Google Calendar API를 사용하여 이번 달 일정 가져오기
export async function GET(request: Request) {
  console.log('[Calendar API] ====== REQUEST START ======')
  console.log('[Calendar API] Request URL:', request.url)

  try {
    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')
    const apiKeyParam = searchParams.get('apiKey') // 관리자 페이지에서 입력한 API 키

    console.log('[Calendar API] Parameters:', {
      calendarId: calendarId || 'MISSING',
      hasApiKey: !!apiKeyParam,
      apiKeyLength: apiKeyParam?.length || 0
    })

    if (!calendarId) {
      console.error('[Calendar API] ERROR: Calendar ID is missing')
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 })
    }

    // 이번 달 시작일과 종료일 계산 (로컬 시간 기준)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // 이번 달 1일 00:00:00 (로컬 시간)
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0)

    // 다음 달 0일 = 이번 달 마지막 날 23:59:59 (로컬 시간)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

    console.log('[Calendar API] Date calculation:', {
      now: now.toISOString(),
      localTime: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      year,
      month: month + 1 // 1-based month
    })

    // 날짜 범위 ISO 문자열
    const timeMin = startOfMonth.toISOString()
    const timeMax = endOfMonth.toISOString()

    // 캘린더 ID 정규화
    let normalizedCalendarId = calendarId
    if (!calendarId.includes('@') && !calendarId.includes('%40')) {
      if (calendarId.startsWith('gen-lang-client-')) {
        normalizedCalendarId = `${calendarId}@group.calendar.google.com`
        console.log('[Calendar API] Normalized calendar ID:', normalizedCalendarId)
      }
    }

    // 1. OAuth 2.0 토큰 사용 시도 (환경 변수)
    // Vercel 환경에서는 파일 시스템이 읽기 전용이므로 환경 변수를 통해 Refresh Token을 제공해야 함
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    let accessToken: string | null = null

    if (refreshToken && clientId && clientSecret) {
      console.log('[Calendar API] Found OAuth credentials in environment variables, attempting to refresh token...')
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        })

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          accessToken = tokenData.access_token
          console.log('[Calendar API] Successfully refreshed access token')
        } else {
          const errorText = await tokenResponse.text()
          console.error('[Calendar API] Failed to refresh token:', errorText)
        }
      } catch (error) {
        console.error('[Calendar API] Error refreshing token:', error)
      }
    }

    // 2. API 키 (기존 방식 fallback)
    const apiKey = apiKeyParam || process.env.GOOGLE_CALENDAR_API_KEY

    // Google Calendar API URL
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`

    console.log('[Calendar API] ====== API CALL PREPARATION ======')
    console.log('[Calendar API] Request details:', {
      normalizedCalendarId,
      hasAccessToken: !!accessToken,
      hasApiKey: !!apiKey,
      timeMin,
      timeMax
    })

    let events: any[] = []
    let errorMessage: string | null = null
    let apiBlocked = false

    // iCal feed를 사용하는 헬퍼 함수
    const tryICalFeed = async (calId: string): Promise<{ success: boolean, error?: string }> => {
      try {
        // 여러 형식 시도
        const baseId = calId.replace('@group.calendar.google.com', '')
        const icalUrls = [
          { url: `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`, name: 'full ID with basic' },
          { url: `https://calendar.google.com/calendar/ical/${encodeURIComponent(baseId)}/public/basic.ics`, name: 'base ID with basic' },
          { url: `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/full.ics`, name: 'full ID with full' },
          { url: `https://calendar.google.com/calendar/ical/${encodeURIComponent(baseId)}/public/full.ics`, name: 'base ID with full' },
        ]

        for (const { url, name } of icalUrls) {
          console.log(`[iCal Feed] Trying ${name}:`, url)
          try {
            const icalResponse = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              redirect: 'follow'
            })

            console.log(`[iCal Feed] Response status for ${name}:`, icalResponse.status, icalResponse.statusText)

            if (icalResponse.ok) {
              const icalText = await icalResponse.text()

              if (icalText && icalText.includes('BEGIN:VCALENDAR')) {
                const parsedEvents = parseICal(icalText, startOfMonth, endOfMonth)
                console.log(`[iCal Feed] Successfully parsed ${parsedEvents.length} events from ${name}`)
                if (parsedEvents.length > 0) {
                  events = parsedEvents
                  return { success: true }
                } else {
                  console.log(`[iCal Feed] No events in date range for ${name}`)
                  // 일정이 있지만 날짜 범위 밖일 수 있음
                  // 전체 일정 개수 확인
                  const allEventsMatch = icalText.match(/BEGIN:VEVENT/g)
                  const totalEvents = allEventsMatch ? allEventsMatch.length : 0
                  if (totalEvents > 0) {
                    return { success: false, error: `캘린더에 ${totalEvents}개의 일정이 있지만 이번 달 일정이 없습니다.` }
                  }
                }
              } else {
                // 성공 응답이지만 iCal 형식이 아님
                console.log(`[iCal Feed] Invalid iCal format for ${name}`)
              }
            } else {
              // 응답 실패
              if (icalResponse.status === 403) {
                return { success: false, error: '캘린더가 공개로 설정되지 않았습니다.' }
              } else if (icalResponse.status === 404) {
                // 다음 URL 시도
              }
            }
          } catch (fetchError) {
            console.error(`[iCal Feed] Fetch error for ${name}:`, fetchError)
          }
        }

        return {
          success: false,
          error: 'iCal 피드를 가져올 수 없습니다. 캘린더 ID와 공개 설정을 확인해주세요.'
        }
      } catch (error) {
        console.error('[iCal Feed] Unexpected error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }
    }

    // Google Calendar API 호출 (Access Token 또는 API Key 사용)
    if (accessToken || apiKey) {
      const params = new URLSearchParams({
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '20'
      })

      if (apiKey && !accessToken) {
        params.append('key', apiKey)
      }

      const fullUrl = `${calendarUrl}?${params.toString()}`
      const headers: HeadersInit = { 'Accept': 'application/json' }
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      try {
        console.log('[Calendar API] Fetching from Google API...')
        const response = await fetch(fullUrl, { headers })

        if (response.ok) {
          const data = await response.json()
          events = (data.items || []).map((item: any) => ({
            summary: item.summary || 'No title',
            start: item.start?.dateTime || item.start?.date || '',
            end: item.end?.dateTime || item.end?.date || '',
            location: item.location || '',
            description: item.description || ''
          }))
          console.log(`[Calendar API] Successfully fetched ${events.length} events via API`)
        } else {
          // API 호출 실패 시 에러 처리 및 iCal 폴백 시도
          const errorData = await response.json().catch(() => ({}))
          console.error('[Calendar API] API Error:', response.status, errorData)

          if (response.status === 403 || response.status === 404) {
            errorMessage = `API Error: ${response.status}. ${errorData.error?.message || ''}`
            const icalResult = await tryICalFeed(normalizedCalendarId)
            if (!icalResult.success) {
              errorMessage += `. iCal Feed Error: ${icalResult.error}`
            } else {
              errorMessage = null // iCal 성공시 에러 클리어
            }
          } else {
            errorMessage = errorData.error?.message || `API Error: ${response.status}`
          }
        }
      } catch (fetchError) {
        console.error('[Calendar API] Fetch error:', fetchError)
        const icalResult = await tryICalFeed(normalizedCalendarId)
        if (!icalResult.success) {
          errorMessage = 'API call failed and iCal fallback failed.'
        }
      }
    } else {
      // 인증 정보 없음, 바로 iCal 시도
      console.log('[Calendar API] No credentials, trying iCal feed...')
      const icalResult = await tryICalFeed(normalizedCalendarId)
      if (!icalResult.success) {
        errorMessage = `캘린더를 불러올 수 없습니다. ${icalResult.error}`
      }
    }

    return NextResponse.json({
      events,
      error: errorMessage || null,
      calendarId: normalizedCalendarId,
      dateRange: { start: timeMin, end: timeMax }
    })
  } catch (error) {
    console.error('[Calendar API] ====== UNEXPECTED ERROR ======')
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events', details: error instanceof Error ? error.message : 'Unknown error', events: [] },
      { status: 500 }
    )
  }
}

// 간단한 iCal 파서 (기본 구현)
function parseICal(icalText: string, startDate: Date, endDate: Date): any[] {
  const events: any[] = []
  const lines = icalText.split('\n')

  let currentEvent: any = null
  let inEvent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      currentEvent = {}
    } else if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.start) {
        try {
          const eventStart = parseICalDate(currentEvent.start)
          // 날짜 범위 체크
          if (eventStart >= startDate && eventStart < endDate) {
            events.push({
              summary: currentEvent.summary || 'No title',
              start: currentEvent.start,
              end: currentEvent.end || currentEvent.start,
              location: currentEvent.location || '',
              description: currentEvent.description || ''
            })
          }
        } catch (dateError) {
          // ignore bad dates
        }
      }
      inEvent = false
      currentEvent = null
    } else if (inEvent && currentEvent) {
      if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8)
      else if (line.startsWith('DTSTART:')) currentEvent.start = line.substring(8)
      else if (line.startsWith('DTEND:')) currentEvent.end = line.substring(6)
      else if (line.startsWith('LOCATION:')) currentEvent.location = line.substring(9)
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start))
}

function parseICalDate(dateString: string): Date {
  const cleanDate = dateString.replace(/[TZ]/g, '')
  const year = parseInt(cleanDate.substring(0, 4))
  const month = parseInt(cleanDate.substring(4, 6)) - 1
  const day = parseInt(cleanDate.substring(6, 8))
  const hour = cleanDate.length > 8 ? parseInt(cleanDate.substring(9, 11) || '0') : 0
  const minute = cleanDate.length > 10 ? parseInt(cleanDate.substring(11, 13) || '0') : 0
  const second = cleanDate.length > 12 ? parseInt(cleanDate.substring(13, 15) || '0') : 0
  return new Date(year, month, day, hour, minute, second)
}
