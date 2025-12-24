import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

/**
 * Refresh Token을 사용하여 새 액세스 토큰 발급
 */
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ accessToken: string; expiresIn: number; error?: any } | null> {
  try {
    const rToken = refreshToken.trim();
    const cId = clientId.trim();
    const cSecret = clientSecret.trim();

    console.log('[Calendar Create API] Refreshing token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: cId,
        client_secret: cSecret,
        refresh_token: rToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Calendar Create API] Token refresh failed:', data);
      return { accessToken: '', expiresIn: 0, error: data };
    }

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
    }
  } catch (error) {
    console.error('[Calendar Create API] Token refresh error:', error);
    return null;
  }
}

/**
 * Google Calendar API를 사용하여 일정 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // DB에서 설정을 가져오되, 요청 본문(body)에 값이 있으면 그것을 최우선으로 사용합니다.
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

    // 우선순위: 요청 본문(Body) > DB 데이터 > 환경 변수
    // 사용자가 연동 직후 '저장'을 누르기 전에도 테스트가 가능하도록 본문 값을 먼저 봅니다.
    const finalCalendarId = (calendarId || calendarConfig?.calendar_id || process.env.GOOGLE_CALENDAR_ID || '').trim();
    const finalClientId = (oauthClientId || calendarConfig?.oauth_client_id || process.env.GOOGLE_CLIENT_ID || '').trim();
    const finalClientSecret = (oauthClientSecret || calendarConfig?.oauth_client_secret || process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const finalRefreshToken = (refreshToken || calendarConfig?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN || '').trim();

    console.log('[Calendar Create API] Using credentials:', {
      hasCalendarId: !!finalCalendarId,
      hasClientId: !!finalClientId,
      hasClientSecret: !!finalClientSecret,
      hasRefreshToken: !!finalRefreshToken,
      source: oauthClientId ? 'request_body' : (calendarConfig ? 'database' : 'env_vars')
    });

    if (!finalCalendarId || !summary || !startDateTime) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다: calendarId, summary, startDateTime' },
        { status: 400 }
      )
    }

    let currentToken = accessToken || '';
    let refreshErrorDetail = null;

    // 1. 토큰이 없으면 즉시 리프레시 시도
    if (!currentToken && finalRefreshToken && finalClientId && finalClientSecret) {
      const refreshed = await refreshAccessToken(finalRefreshToken, finalClientId, finalClientSecret);
      if (refreshed?.accessToken) {
        currentToken = refreshed.accessToken;
      } else if (refreshed?.error) {
        refreshErrorDetail = refreshed.error;
      }
    }

    // 2. Google Calendar API 호출 함수
    const eventData = {
      summary,
      description: description || '',
      location: location || '',
      start: { dateTime: startDateTime, timeZone: 'Asia/Seoul' },
      end: { dateTime: endDateTime || startDateTime, timeZone: 'Asia/Seoul' }
    };

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(finalCalendarId)}/events`;

    const makeApiCall = async (token: string) => {
      return fetch(calendarUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
    };

    // 3. 첫 번째 시도
    let response = await makeApiCall(currentToken);
    
    // 4. 실패 시 (401 에러) 리프레시 후 재시도
    if (response.status === 401 && finalRefreshToken && finalClientId && finalClientSecret) {
      console.log('[Calendar Create API] 401 Unauthorized, attempting token refresh...');
      const refreshed = await refreshAccessToken(finalRefreshToken, finalClientId, finalClientSecret);
      
      if (refreshed?.accessToken) {
        console.log('[Calendar Create API] Retrying with refreshed token...');
        response = await makeApiCall(refreshed.accessToken);
        
        if (response.ok) {
          const resultData = await response.json();
          return NextResponse.json({
            success: true,
            message: '일정이 생성되었습니다. (토큰 자동 갱신됨)',
            eventId: resultData.id,
            newAccessToken: refreshed.accessToken
          });
        }
      }
      refreshErrorDetail = refreshed?.error || await response.json().catch(() => ({}));
    }

    // 5. 최종 결과 반환
    const finalData = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[Calendar Create API] Final failure:', finalData);
      return NextResponse.json({
        error: '인증 실패',
        details: JSON.stringify(finalData),
        message: '구글 인증 정보가 올바르지 않습니다. 다시 연동해 주세요.',
        googleError: finalData.error?.message || 'Unknown Google Error'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 생성되었습니다.',
      eventId: finalData.id
    });

  } catch (error) {
    console.error('[Calendar Create API] Critical Error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
