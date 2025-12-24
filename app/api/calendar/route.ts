import { NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

/**
 * Google Calendar API를 사용하여 이번 달 일정 가져오기
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const calendarIdParam = searchParams.get('calendarId')
    const apiKeyParam = searchParams.get('apiKey')

    // 0. DB에서 구글 설정 가져오기
    const supabase = getServiceSupabase();
    const { data: calendarConfig } = await supabase.from('calendar_config').select('*').limit(1).maybeSingle();

    // 우선순위: 요청 파라미터 > DB 데이터 > 환경 변수
    // (클라이언트가 연동 직후 최신 값을 보내는 경우를 대비)
    const calendarId = (calendarIdParam || calendarConfig?.calendar_id || process.env.GOOGLE_CALENDAR_ID || '').trim();
    const apiKey = (apiKeyParam || calendarConfig?.api_key || process.env.GOOGLE_CALENDAR_API_KEY || '').trim();
    const refreshToken = (calendarConfig?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN || '').trim();
    const clientId = (calendarConfig?.oauth_client_id || process.env.GOOGLE_CLIENT_ID || '').trim();
    const clientSecret = (calendarConfig?.oauth_client_secret || process.env.GOOGLE_CLIENT_SECRET || '').trim();

    if (!calendarId) {
      return NextResponse.json({ error: 'Calendar ID is required' }, { status: 400 })
    }

    // 캘린더 ID 정규화
    let normalizedCalendarId = calendarId;
    if (!calendarId.includes('@') && calendarId.startsWith('gen-lang-client-')) {
      normalizedCalendarId = `${calendarId}@group.calendar.google.com`;
    }

    // 이번 달 범위 계산
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    let accessToken: string | null = null;

    // 1. OAuth 토큰 갱신 시도
    if (refreshToken && clientId && clientSecret) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          accessToken = tokenData.access_token;
        } else {
          console.error('[Calendar API] Token refresh failed for GET:', await tokenRes.json().catch(() => ({})));
        }
      } catch (e) {
        console.error('[Calendar API] Token refresh error:', e);
      }
    }

    // 2. Google API 호출
    const eventsParams = new URLSearchParams({
      timeMin: startOfMonth,
      timeMax: endOfMonth,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '50'
    });

    if (apiKey && !accessToken) {
      eventsParams.append('key', apiKey);
    }

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events?${eventsParams.toString()}`;
    const headers: HeadersInit = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

    const response = await fetch(calendarUrl, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const events = (data.items || []).map((item: any) => ({
        summary: item.summary || '제목 없음',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        location: item.location || '',
        description: item.description || ''
      }));

      return NextResponse.json({ events, calendarId: normalizedCalendarId });
    }

    // API 호출 실패 시 에러 응답
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json({ 
      error: 'Google API 호출 실패', 
      details: errorData,
      calendarId: normalizedCalendarId 
    }, { status: response.status });

  } catch (error) {
    console.error('[Calendar API] Unexpected Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
