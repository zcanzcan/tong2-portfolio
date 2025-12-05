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

    // Google Calendar Public Feed URL (iCal format)
    // 공개 캘린더의 경우 이 방법을 사용
    const timeMin = startOfMonth.toISOString()
    const timeMax = endOfMonth.toISOString()
    
    // 캘린더 ID 정규화
    // gen-lang-client-xxxxx 형식은 @group.calendar.google.com 접미사가 필요할 수 있음
    let normalizedCalendarId = calendarId
    if (!calendarId.includes('@') && !calendarId.includes('%40')) {
      // gen-lang-client로 시작하는 경우 @group.calendar.google.com 추가 시도
      if (calendarId.startsWith('gen-lang-client-')) {
        normalizedCalendarId = `${calendarId}@group.calendar.google.com`
        console.log('[Calendar API] Normalized calendar ID:', normalizedCalendarId)
      }
      // 그 외의 경우는 그대로 사용
    }
    
    // API 키 우선순위: 1) 관리자 페이지에서 입력한 키, 2) 환경 변수
    const apiKey = apiKeyParam || process.env.GOOGLE_CALENDAR_API_KEY
    
    // Google Calendar Public Feed (iCal format)
    // 공개 캘린더 ID를 사용하여 이벤트 가져오기
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`
    
    console.log('[Calendar API] ====== API CALL PREPARATION ======')
    console.log('[Calendar API] Request details:', {
      originalCalendarId: calendarId,
      normalizedCalendarId: normalizedCalendarId,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NONE',
      timeMin,
      timeMax,
      calendarUrl: calendarUrl.replace(apiKey || '', 'API_KEY_HIDDEN')
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
              console.log(`[iCal Feed] Response length for ${name}:`, icalText.length)
              console.log(`[iCal Feed] Response preview for ${name}:`, icalText.substring(0, 500))
              
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
                  console.log(`[iCal Feed] Total events in calendar: ${totalEvents}`)
                  if (totalEvents > 0) {
                    return { success: false, error: `캘린더에 ${totalEvents}개의 일정이 있지만 이번 달 일정이 없습니다.` }
                  }
                }
              } else if (icalText.includes('404') || icalText.includes('Not Found')) {
                console.log(`[iCal Feed] 404 Not Found for ${name}`)
              } else if (icalText.includes('403') || icalText.includes('Forbidden')) {
                console.log(`[iCal Feed] 403 Forbidden for ${name} - 캘린더가 공개로 설정되지 않았습니다`)
                return { success: false, error: '캘린더가 공개로 설정되지 않았습니다. Google Calendar에서 "공개: 모든 세부정보 보기"를 선택해주세요.' }
              } else {
                console.log(`[iCal Feed] Invalid iCal format for ${name}, preview:`, icalText.substring(0, 200))
              }
            } else {
              const errorText = await icalResponse.text().catch(() => '')
              console.log(`[iCal Feed] Failed for ${name}:`, icalResponse.status, icalResponse.statusText, errorText.substring(0, 200))
              
              if (icalResponse.status === 403) {
                return { success: false, error: '캘린더가 공개로 설정되지 않았습니다. Google Calendar에서 "공개: 모든 세부정보 보기"를 선택해주세요.' }
              } else if (icalResponse.status === 404) {
                return { success: false, error: '캘린더 ID가 잘못되었거나 캘린더를 찾을 수 없습니다.' }
              }
            }
          } catch (fetchError) {
            console.error(`[iCal Feed] Fetch error for ${name}:`, fetchError)
          }
        }
        
        return { 
          success: false, 
          error: '모든 iCal URL 형식이 실패했습니다. 캘린더 ID와 공개 설정을 확인해주세요.' 
        }
      } catch (error) {
        console.error('[iCal Feed] Unexpected error:', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : '알 수 없는 오류' 
        }
      }
    }
    
    if (apiKey) {
      // Google Calendar API 사용
      const params = new URLSearchParams({
        key: apiKey,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '20'
      })
      
      const fullUrl = `${calendarUrl}?${params.toString()}`
      console.log('[Calendar API] ====== FETCHING FROM GOOGLE API ======')
      console.log('[Calendar API] Full URL (key hidden):', fullUrl.replace(apiKey, 'API_KEY_HIDDEN'))
      
      try {
        console.log('[Calendar API] Starting fetch request...')
        const response = await fetch(fullUrl, {
          headers: {
            'Accept': 'application/json',
          },
        })
        
        console.log('[Calendar API] ====== GOOGLE API RESPONSE ======')
        console.log('[Calendar API] Response status:', response.status, response.statusText)
        console.log('[Calendar API] Response headers:', Object.fromEntries(response.headers.entries()))
        
        const responseText = await response.text()
        console.log('[Calendar API] Response text length:', responseText.length)
        console.log('[Calendar API] Response text preview (first 500 chars):', responseText.substring(0, 500))
        
        if (response.ok) {
          try {
            const data = JSON.parse(responseText)
            events = (data.items || []).map((item: any) => ({
              summary: item.summary || 'No title',
              start: item.start?.dateTime || item.start?.date || '',
              end: item.end?.dateTime || item.end?.date || '',
              location: item.location || '',
              description: item.description || ''
            }))
            console.log(`[Calendar API] Successfully fetched ${events.length} events`)
            if (events.length > 0) {
              console.log('[Calendar API] First event:', events[0])
            }
          } catch (parseError) {
            console.error('[Calendar API] Parse error:', parseError)
            // 파싱 에러 시 iCal feed 시도
            const icalResult = await tryICalFeed(normalizedCalendarId)
            if (!icalResult.success) {
              errorMessage = '응답을 파싱할 수 없습니다'
            }
          }
        } else {
          try {
            const errorData = JSON.parse(responseText)
            const detailedError = errorData.error
            
            // 404 오류 처리
            if (response.status === 404 || detailedError?.status === 'NOT_FOUND') {
              console.error('[Calendar API] ====== 404 NOT FOUND ERROR ======')
              console.error('[Calendar API] Attempted calendar ID:', normalizedCalendarId)
              console.error('[Calendar API] Original calendar ID:', calendarId)
              console.error('[Calendar API] Full error object:', JSON.stringify(detailedError, null, 2))
              console.error('[Calendar API] Error message:', detailedError?.message)
              console.error('[Calendar API] Error reason:', detailedError?.reason)
              console.error('[Calendar API] Error status:', detailedError?.status)
              
              // 404 오류의 가능한 원인들
              const possibleCauses = []
              if (!calendarId.includes('@')) {
                possibleCauses.push('캘린더 ID에 @가 없습니다. 이메일 형식이어야 합니다.')
              }
              if (calendarId === 'zcan7898@gmail.com') {
                possibleCauses.push('기본 캘린더 ID를 사용 중입니다. 새 캘린더를 만들어 사용하는 것을 권장합니다.')
              }
              
              errorMessage = `캘린더를 찾을 수 없습니다 (404).\n시도한 ID: ${normalizedCalendarId}\n\n가능한 원인:\n${possibleCauses.length > 0 ? possibleCauses.join('\n') : '- 캘린더 ID가 잘못되었습니다\n- 캘린더가 존재하지 않습니다\n- 새 캘린더를 만들어 사용해보세요'}`
              
              // iCal feed로 대체 시도
              console.log('[Calendar API] Trying iCal feed as fallback...')
              const icalResult = await tryICalFeed(normalizedCalendarId)
              if (icalResult.success) {
                console.log('[Calendar API] iCal feed succeeded!')
                errorMessage = null
              } else {
                console.error('[Calendar API] iCal feed also failed:', icalResult.error)
                errorMessage = `캘린더를 찾을 수 없습니다 (404).\n시도한 ID: ${normalizedCalendarId}\n\n해결 방법:\n1. Google Calendar에서 새 캘린더 만들기\n2. 새 캘린더의 ID를 사용\n3. 새 캘린더를 공개로 설정\n\n${icalResult.error || ''}`
              }
            } else if (detailedError?.message?.includes('blocked') || 
                detailedError?.message?.includes('Requests to this API') ||
                detailedError?.status === 'PERMISSION_DENIED') {
              apiBlocked = true
              console.log('[Calendar API] API blocked, trying iCal feed...')
              
              // iCal feed로 대체 시도
              const icalResult = await tryICalFeed(normalizedCalendarId)
              if (icalResult.success) {
                // 성공하면 에러 메시지 없음
                errorMessage = null
              } else {
                errorMessage = `API가 차단되었고 iCal feed도 실패했습니다. ${icalResult.error || '캘린더가 공개로 설정되어 있는지 확인해주세요.'}`
              }
            } else {
              errorMessage = detailedError?.message || detailedError?.reason || `API Error: ${response.status}`
              if (detailedError?.reason) {
                errorMessage += ` (${detailedError.reason})`
              }
              console.error('[Calendar API] Error:', detailedError)
            }
          } catch (parseError) {
            console.error('[Calendar API] Error parsing error response:', parseError)
            // 에러 응답 파싱 실패 시에도 iCal feed 시도
            const icalSuccess = await tryICalFeed(normalizedCalendarId)
            if (!icalSuccess) {
              errorMessage = `API Error: ${response.status} ${response.statusText}`
            }
          }
        }
      } catch (fetchError) {
        console.error('[Calendar API] Fetch error:', fetchError)
        // 네트워크 에러 시 iCal feed 시도
        const icalResult = await tryICalFeed(normalizedCalendarId)
        if (!icalResult.success) {
          errorMessage = 'API 호출 실패. 네트워크를 확인해주세요.'
        }
      }
    }
    
    // API 키가 없거나 API가 실패한 경우 iCal feed 사용
    if (events.length === 0) {
      console.log('[Calendar API] No events found, trying iCal feed...')
      const icalResult = await tryICalFeed(normalizedCalendarId)
      if (!icalResult.success && !apiKey) {
        // API 키가 없을 때만 에러 메시지 표시
        errorMessage = `캘린더를 불러올 수 없습니다. ${icalResult.error || '캘린더가 공개로 설정되어 있는지 확인해주세요.'}`
      } else if (!icalResult.success && apiKey) {
        // API 키가 있지만 차단된 경우는 이미 에러 메시지가 있음
        console.log('[Calendar API] API blocked and iCal feed also failed')
      }
    }

    // 최종 결과 로깅
    console.log('[Calendar API] ====== FINAL RESULT ======')
    console.log('[Calendar API] Final result:', {
      eventsCount: events.length,
      hasError: !!errorMessage,
      errorMessage,
      calendarId: normalizedCalendarId,
      originalCalendarId: calendarId,
      hasApiKey: !!apiKey,
      apiBlocked
    })
    console.log('[Calendar API] ====== REQUEST END ======')

    return NextResponse.json({ 
      events, 
      error: errorMessage || null,
      calendarId: normalizedCalendarId,
      originalCalendarId: calendarId,
      hasApiKey: !!apiKey,
      apiBlocked,
      dateRange: {
        start: timeMin,
        end: timeMax
      }
    })
  } catch (error) {
    console.error('[Calendar API] ====== UNEXPECTED ERROR ======')
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { message: 'Unknown error', error }
    
    console.error('[Calendar API] Error details:', errorDetails)
    console.error('[Calendar API] ====== ERROR END ======')
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar events', 
        details: errorDetails.message,
        events: []
      },
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
  let totalEvents = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      currentEvent = {}
      totalEvents++
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
          console.error('[parseICal] Date parsing error:', dateError, 'for date:', currentEvent.start)
        }
      }
      inEvent = false
      currentEvent = null
    } else if (inEvent && currentEvent) {
      // 여러 줄에 걸친 필드 처리
      if (line.startsWith('SUMMARY:')) {
        currentEvent.summary = line.substring(8)
      } else if (line.startsWith('SUMMARY;')) {
        // SUMMARY;LANGUAGE=ko:제목 형식 처리
        const parts = line.split(':')
        if (parts.length > 1) {
          currentEvent.summary = parts.slice(1).join(':')
        }
      } else if (line.startsWith('DTSTART:')) {
        currentEvent.start = line.substring(8)
      } else if (line.startsWith('DTSTART;')) {
        // DTSTART;VALUE=DATE:20240101 형식 처리
        const parts = line.split(':')
        if (parts.length > 1) {
          currentEvent.start = parts[parts.length - 1]
        }
      } else if (line.startsWith('DTEND:')) {
        currentEvent.end = line.substring(6)
      } else if (line.startsWith('DTEND;')) {
        const parts = line.split(':')
        if (parts.length > 1) {
          currentEvent.end = parts[parts.length - 1]
        }
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9)
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12)
      } else if (line.startsWith(' ') && currentEvent.summary) {
        // 연속된 줄 처리 (iCal 형식)
        currentEvent.summary += line.substring(1)
      }
    }
  }
  
  console.log(`[parseICal] Parsed ${events.length} events from ${totalEvents} total events (date range: ${startDate.toISOString()} to ${endDate.toISOString()})`)
  
  return events.sort((a, b) => {
    try {
      const dateA = parseICalDate(a.start)
      const dateB = parseICalDate(b.start)
      return dateA.getTime() - dateB.getTime()
    } catch (error) {
      return 0
    }
  })
}

function parseICalDate(dateString: string): Date {
  // iCal 날짜 형식: YYYYMMDDTHHMMSS 또는 YYYYMMDD
  const cleanDate = dateString.replace(/[TZ]/g, '')
  const year = parseInt(cleanDate.substring(0, 4))
  const month = parseInt(cleanDate.substring(4, 6)) - 1
  const day = parseInt(cleanDate.substring(6, 8))
  const hour = cleanDate.length > 8 ? parseInt(cleanDate.substring(9, 11) || '0') : 0
  const minute = cleanDate.length > 10 ? parseInt(cleanDate.substring(11, 13) || '0') : 0
  const second = cleanDate.length > 12 ? parseInt(cleanDate.substring(13, 15) || '0') : 0
  
  return new Date(year, month, day, hour, minute, second)
}

