import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

/**
 * Refresh Token을 사용하여 새 액세스 토큰 발급
 */
async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ accessToken: string; expiresIn: number; error?: any } | null> {
  try {
    // 공백 제거 (매우 중요)
    const rToken = refreshToken.trim();
    const cId = clientId.trim();
    const cSecret = clientSecret.trim();

    console.log('[Calendar Create API] Attempting token refresh...');

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
      console.error('[Calendar Create API] Token refresh failed. Google responded with:', data);
      return { accessToken: '', expiresIn: 0, error: data };
    }

    console.log('[Calendar Create API] Token refreshed successfully');
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
    }
  } catch (error) {
    console.error('[Calendar Create API] Unexpected error during token refresh:', error);
    return null;
  }
}

/**
 * Google Calendar API를 사용하여 일정 생성
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // DB에서 최신 구글 설정 가져오기 (가장 신뢰할 수 있는 소스)
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

    // 우선순위: DB 데이터 > Body 데이터 > 환경 변수
    // DB에 데이터가 있다면 무조건 DB 값을 우선시하여 클라이언트의 잘못된/오래된 데이터를 방지합니다.
    const finalCalendarId = (calendarConfig?.calendar_id || calendarId || process.env.GOOGLE_CALENDAR_ID || '').trim();
    const finalClientId = (calendarConfig?.oauth_client_id || oauthClientId || process.env.GOOGLE_CLIENT_ID || '').trim();
    const finalClientSecret = (calendarConfig?.oauth_client_secret || oauthClientSecret || process.env.GOOGLE_CLIENT_SECRET || '').trim();
    const finalRefreshToken = (calendarConfig?.refresh_token || refreshToken || process.env.GOOGLE_REFRESH_TOKEN || '').trim();

    if (!finalCalendarId || !summary || !startDateTime) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다: calendarId, summary, startDateTime' },
        { status: 400 }
      )
    }

    // 액세스 토큰 (현재 유효할 것으로 기대되는 토큰)
    let currentToken = accessToken || '';
    let refreshErrorDetail = null;

    // 1. 토큰이 아예 없으면 리프레시 토큰으로 즉시 갱신 시도
    if (!currentToken && finalRefreshToken && finalClientId && finalClientSecret) {
      console.log('[Calendar Create API] No access token provided, trying to refresh using DB config...');
      const refreshed = await refreshAccessToken(finalRefreshToken, finalClientId, finalClientSecret);
      if (refreshed?.accessToken) {
        currentToken = refreshed.accessToken;
      } else if (refreshed?.error) {
        refreshErrorDetail = refreshed.error;
      }
    }

    // 2. 여전히 토큰이 없다면 에러 반환
    if (!currentToken) {
      return NextResponse.json(
        {
          error: '인증 실패',
          details: refreshErrorDetail ? `Google Error: ${JSON.stringify(refreshErrorDetail)}` : 'OAuth 2.0 액세스 토큰이 필요합니다.',
          message: finalRefreshToken 
            ? '자동 토큰 갱신에 실패했습니다. 관리자 페이지에서 다시 연동해 주세요.' 
            : '인증 정보가 부족합니다. 구글 캘린더 연동을 진행해 주세요.',
          instructions: [
            '1. 관리자 페이지에서 다시 한번 "구글 캘린더 연동" 클릭',
            '2. 반드시 "캘린더 설정 저장" 버튼 클릭'
          ]
        },
        { status: 401 }
      )
    }

    // 캘린더 ID 정규화
    let normalizedCalendarId = finalCalendarId;
    if (!finalCalendarId.includes('@') && finalCalendarId.startsWith('gen-lang-client-')) {
      normalizedCalendarId = `${finalCalendarId}@group.calendar.google.com`;
    }

    // 일정 데이터 구성
    const eventData = {
      summary,
      description: description || '',
      location: location || '',
      start: { dateTime: startDateTime, timeZone: 'Asia/Seoul' },
      end: { dateTime: endDateTime || startDateTime, timeZone: 'Asia/Seoul' }
    };

    // 3. Google Calendar API로 일정 생성 시도
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`;

    const makeRequest = async (token: string) => {
      return fetch(calendarUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
    };

    let response = await makeRequest(currentToken);
    let responseData = await response.json();

    // 4. 만약 토큰 만료 에러(401)가 나면 한 번 더 리프레시 시도
    if (response.status === 401 && finalRefreshToken && finalClientId && finalClientSecret) {
      console.log('[Calendar Create API] Access token expired during API call, retrying refresh...');
      const refreshed = await refreshAccessToken(finalRefreshToken, finalClientId, finalClientSecret);
      
      if (refreshed?.accessToken) {
        console.log('[Calendar Create API] Retrying API call with newly refreshed token...');
        response = await makeRequest(refreshed.accessToken);
        responseData = await response.json();
        
        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: '일정이 성공적으로 생성되었습니다. (토큰 자동 갱신됨)',
            eventId: responseData.id,
            newAccessToken: refreshed.accessToken
          });
        }
      }
      refreshErrorDetail = refreshed?.error || responseData;
    }

    // 5. 최종 결과 처리
    if (!response.ok) {
      console.error('[Calendar Create API] Final API Call failed:', responseData);
      return NextResponse.json(
        {
          error: '인증 실패',
          details: `Google API Error: ${JSON.stringify(responseData)}`,
          message: '인증 정보가 만료되었거나 올바르지 않습니다. 다시 연동해 주세요.',
          instructions: [
            '1. 구글 클라우드 콘솔에서 "앱 게시" 상태인지 확인',
            '2. 관리자 페이지에서 "구글 캘린더 연동" 다시 수행',
            '3. "캘린더 설정 저장" 클릭'
          ]
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '일정이 성공적으로 생성되었습니다.',
      eventId: responseData.id
    });

  } catch (error) {
    console.error('[Calendar Create API] Unexpected Server Error:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
