import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Google OAuth 2.0 인증 시작
 * 사용자를 Google 인증 페이지로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  try {
    // 관리자 인증 확인
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 요청에서 Client ID와 Client Secret 가져오기
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const clientSecret = searchParams.get('clientSecret')

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID와 Client Secret이 필요합니다.' },
        { status: 400 }
      )
    }

    // 리다이렉트 URI 생성 (현재 도메인 기반)
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const baseUrl = origin ? new URL(origin).origin : 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/calendar/callback`

    // Google OAuth 2.0 인증 URL 생성
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')
    authUrl.searchParams.set('access_type', 'offline') // Refresh Token을 받기 위해 필요
    authUrl.searchParams.set('prompt', 'consent') // 항상 Refresh Token을 받기 위해 필요
    authUrl.searchParams.set('state', JSON.stringify({ clientId, clientSecret })) // 콜백에서 사용할 데이터

    // 인증 URL로 리다이렉트
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('[Calendar Auth API] Error:', error)
    return NextResponse.json(
      { 
        error: '인증 시작 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

