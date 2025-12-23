import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

// Refresh Token을 사용하여 새 액세스 토큰 발급
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ accessToken: string; expiresIn: number; error?: any } | null> {
  try {
    console.log('[Calendar Create API] Refreshing token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Calendar Create API] Token refresh failed response:', data)
      return { accessToken: '', expiresIn: 0, error: data };
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600, // 기본 1시간
    }
  } catch (error) {
    console.error('[Calendar Create API] Token refresh error:', error)
    return null
  }
}

// Google Calendar API를 사용하여 일정 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // DB에서 구글 설정 가져오기 (가장 정확한 소스)
    const supabase = getServiceSupabase();
    const { data: calendarConfig } = await supabase.from('calendar_config').select('*').limit(1).maybeSingle();

    let {
      calendarId,
      accessToken,
      refreshToken,
      oauthClientId,
      oauthClientSecret,
      summary,
      description,
      startDateTime,
      endDateTime,
      location
    } = body

    // DB 데이터가 있으면 우선적으로 사용 (클라이언트의 오래된 데이터 방지)
    calendarId = calendarId || calendarConfig?.calendar_id || process.env.GOOGLE_CALENDAR_ID
    oauthClientId = calendarConfig?.oauth_client_id || oauthClientId || process.env.GOOGLE_CLIENT_ID
    oauthClientSecret = calendarConfig?.oauth_client_secret || oauthClientSecret || process.env.GOOGLE_CLIENT_SECRET
    refreshToken = calendarConfig?.refresh_token || refreshToken || process.env.GOOGLE_REFRESH_TOKEN

    if (!calendarId || !summary || !startDateTime) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다: calendarId, summary, startDateTime' },
        { status: 400 }
      )
    }

    // OAuth 2.0 액세스 토큰 (요청에 있으면 사용, 없으면 DB/환경변수에서 갱신 시도)
    let token = accessToken;
    let refreshErrorDetail = null;

    // 토큰이 없거나 만료된 것으로 의심될 때 갱신 시도
    if (!token && refreshToken && oauthClientId && oauthClientSecret) {
      console.log('[Calendar Create API] Access token not found in request, attempting refresh with DB config...')
      const refreshed = await refreshAccessToken(refreshToken, oauthClientId, oauthClientSecret)
      if (refreshed?.accessToken) {
        token = refreshed.accessToken
      } else if (refreshed?.error) {
        refreshErrorDetail = refreshed.error;
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: 'OAuth 2.0 액세스 토큰이 필요합니다.',
          message: 'Google Calendar API로 일정을 생성하려면 OAuth 2.0 액세스 토큰 또는 Refresh Token이 필요합니다.',
          instructions: [
            '방법 1: OAuth 2.0 Playground에서 Access Token 발급',
            '방법 2: Refresh Token을 입력하면 자동으로 Access Token이 갱신됩니다 (권장)'
          ]
        },
        { status: 401 }
      )
    }

    // 캘린더 ID 정규화
    let normalizedCalendarId = calendarId
    if (!calendarId.includes('@') && calendarId.startsWith('gen-lang-client-')) {
      normalizedCalendarId = `${calendarId}@group.calendar.google.com`
    }

    // 일정 데이터 구성
    const eventData: any = {
      summary,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Seoul'
      },
      end: {
        dateTime: endDateTime || startDateTime,
        timeZone: 'Asia/Seoul'
      }
    }

    if (description) {
      eventData.description = description
    }

    if (location) {
      eventData.location = location
    }

    // Google Calendar API로 일정 생성
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`

    console.log('[Calendar Create API] Creating event:', {
      calendarId: normalizedCalendarId,
      summary,
      startDateTime,
      endDateTime
    })

    const response = await fetch(calendarUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('[Calendar Create API] Error response:', responseData)

      // 토큰 만료 또는 인증 오류 감지
      const errorMessage = responseData.error?.message || responseData.error || '알 수 없는 오류'
      const isAuthError = response.status === 401 ||
        errorMessage.includes('invalid authentication') ||
        errorMessage.includes('invalid credentials') ||
        errorMessage.includes('Invalid Credentials') ||
        responseData.error?.code === 401

      if (isAuthError) {
        // Refresh Token이 있으면 자동 갱신 시도
        if (refreshToken && oauthClientId && oauthClientSecret) {
          console.log('[Calendar Create API] Access token expired, attempting to refresh...')
          const refreshed = await refreshAccessToken(refreshToken, oauthClientId, oauthClientSecret)

          if (refreshed?.accessToken) {
            // 새 토큰으로 재시도
            console.log('[Calendar Create API] Retrying with refreshed token...')
            const retryResponse = await fetch(calendarUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${refreshed.accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(eventData)
            })

            const retryData = await retryResponse.json()

            if (retryResponse.ok) {
              console.log('[Calendar Create API] Event created successfully with refreshed token:', retryData.id)
              return NextResponse.json({
                success: true,
                message: '일정이 성공적으로 생성되었습니다. (토큰 자동 갱신됨)',
                eventId: retryData.id,
                event: {
                  id: retryData.id,
                  summary: retryData.summary,
                  start: retryData.start?.dateTime || retryData.start?.date,
                  end: retryData.end?.dateTime || retryData.end?.date,
                  htmlLink: retryData.htmlLink
                },
                newAccessToken: refreshed.accessToken // 새 토큰 반환하여 저장 가능
              })
            } else {
              refreshErrorDetail = retryData;
            }
          } else if (refreshed?.error) {
            refreshErrorDetail = refreshed.error;
          }
        }

        // Refresh Token으로도 실패하거나 Refresh Token이 없는 경우
        return NextResponse.json(
          {
            error: '인증 실패',
            details: refreshErrorDetail ? JSON.stringify(refreshErrorDetail) : 'OAuth 2.0 액세스 토큰이 만료되었거나 유효하지 않습니다.',
            message: refreshToken
              ? `Refresh Token으로 자동 갱신을 시도했지만 실패했습니다. (Error: ${refreshErrorDetail?.error || 'unknown'})`
              : '액세스 토큰이 만료되었습니다. Refresh Token을 설정하면 자동으로 갱신됩니다.',
            instructions: [
              '1. 구글 클라우드 콘솔에서 "앱 게시(Publish App)" 상태인지 확인',
              '2. 관리자 페이지에서 다시 한번 "구글 캘린더 연동" 클릭',
              '3. 완료 후 "캘린더 설정 저장" 클릭'
            ],
            code: responseData.error?.code || response.status
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          error: '일정 생성 실패',
          details: errorMessage,
          code: responseData.error?.code || response.status
        },
        { status: response.status }
      )
    }

    console.log('[Calendar Create API] Event created successfully:', responseData.id)

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 생성되었습니다.',
      eventId: responseData.id,
      event: {
        id: responseData.id,
        summary: responseData.summary,
        start: responseData.start?.dateTime || responseData.start?.date,
        end: responseData.end?.dateTime || responseData.end?.date,
        htmlLink: responseData.htmlLink
      }
    })

  } catch (error) {
    console.error('[Calendar Create API] Error:', error)
    return NextResponse.json(
      {
        error: '일정 생성 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}
