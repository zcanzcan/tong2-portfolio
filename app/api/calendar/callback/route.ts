import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPortfolioData, savePortfolioData } from '@/lib/data'

export const dynamic = 'force-dynamic'

/**
 * Google OAuth 2.0 콜백 핸들러
 * Google에서 인증 코드를 받아서 토큰으로 교환하고 저장합니다.
 */
export async function GET(request: Request) {
  try {
    // 관리자 인증 확인
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    
    if (!adminSession || adminSession.value !== 'true') {
      return NextResponse.redirect('/admin?error=unauthorized')
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // 사용자가 인증을 거부한 경우
    if (error) {
      return NextResponse.redirect(`/admin?error=${encodeURIComponent(error)}&message=${encodeURIComponent('Google 인증이 취소되었습니다.')}`)
    }

    if (!code || !state) {
      return NextResponse.redirect('/admin?error=missing_params')
    }

    // State에서 Client ID와 Secret 복원
    let clientId: string
    let clientSecret: string
    try {
      const stateData = JSON.parse(state)
      clientId = stateData.clientId
      clientSecret = stateData.clientSecret
    } catch {
      return NextResponse.redirect('/admin?error=invalid_state')
    }

    // 리다이렉트 URI 생성
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const baseUrl = origin ? new URL(origin).origin : 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/calendar/callback`

    // 인증 코드를 토큰으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('[Calendar Callback API] Token exchange failed:', errorData)
      return NextResponse.redirect(`/admin?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(errorData))}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!refresh_token && !access_token) {
      return NextResponse.redirect('/admin?error=no_tokens')
    }

    // 포트폴리오 데이터 읽기
    const portfolioData = await getPortfolioData()
    if (!portfolioData) {
      return NextResponse.redirect('/admin?error=read_failed')
    }

    // 캘린더 설정 업데이트
    if (!portfolioData.calendar) {
      portfolioData.calendar = {}
    }

    portfolioData.calendar.oauthClientId = clientId
    portfolioData.calendar.oauthClientSecret = clientSecret
    if (access_token) {
      portfolioData.calendar.accessToken = access_token
    }
    if (refresh_token) {
      portfolioData.calendar.refreshToken = refresh_token
    }

    // 데이터 저장
    const success = await savePortfolioData(portfolioData)
    if (!success) {
      return NextResponse.redirect('/admin?error=save_failed')
    }

    console.log('[Calendar Callback API] Tokens saved successfully')

    // 성공 메시지와 함께 Admin 페이지로 리다이렉트
    return NextResponse.redirect('/admin?success=calendar_connected&tab=calendar')
  } catch (error) {
    console.error('[Calendar Callback API] Error:', error)
    return NextResponse.redirect(`/admin?error=callback_error&details=${encodeURIComponent(error instanceof Error ? error.message : '알 수 없는 오류')}`)
  }
}

