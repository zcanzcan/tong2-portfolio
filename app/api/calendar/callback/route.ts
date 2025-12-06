import { NextResponse } from 'next/server'
import { getPortfolioData, savePortfolioData } from '@/lib/data'

export const dynamic = 'force-dynamic'

/**
 * Google OAuth 2.0 콜백 핸들러
 * Google에서 인증 코드를 받아서 토큰으로 교환하고 저장합니다.
 */
export async function GET(request: Request) {
  try {
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
    let redirectBaseUrl: string
    try {
      // State는 URL 인코딩되어 있으므로 디코딩 필요
      const decodedState = decodeURIComponent(state)
      console.log('[Calendar Callback API] Decoded state:', decodedState.substring(0, 100) + '...')
      
      const stateData = JSON.parse(decodedState)
      clientId = stateData.clientId
      clientSecret = stateData.clientSecret
      redirectBaseUrl = stateData.redirectBaseUrl || 'https://tong2-portfolio.vercel.app'
      
      console.log('[Calendar Callback API] Parsed state data:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length,
        clientSecretLength: clientSecret?.length,
        redirectBaseUrl
      })
    } catch (parseError) {
      console.error('[Calendar Callback API] State parse error:', parseError)
      console.error('[Calendar Callback API] State value (raw):', state)
      console.error('[Calendar Callback API] State value (decoded):', decodeURIComponent(state))
      return NextResponse.redirect('/admin?error=invalid_state&details=' + encodeURIComponent(`State 파싱 실패: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`))
    }

    // 리다이렉트 URI 생성 (현재 요청 URL 기반으로 정확히 생성)
    // State에서 받은 redirectBaseUrl을 우선 사용하되, 없으면 현재 URL 기반으로 생성
    const url = new URL(request.url)
    let redirectUri: string
    
    if (redirectBaseUrl) {
      // State에서 받은 baseUrl 사용
      redirectUri = `${redirectBaseUrl}/api/calendar/callback`
    } else {
      // 현재 요청 URL 기반으로 생성
      let baseUrl = url.origin
      // 로컬 개발 환경 처리
      if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        const port = url.port || '3000'
        baseUrl = `http://localhost:${port}`
      }
      redirectUri = `${baseUrl}/api/calendar/callback`
    }
    
    console.log('[Calendar Callback API] Current URL:', request.url)
    console.log('[Calendar Callback API] Redirect URI:', redirectUri)
    console.log('[Calendar Callback API] State redirectBaseUrl:', redirectBaseUrl)
    console.log('[Calendar Callback API] URL origin:', url.origin)
    console.log('[Calendar Callback API] URL port:', url.port)

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
      const errorText = await tokenResponse.text()
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      console.error('[Calendar Callback API] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      })
      return NextResponse.redirect(`/admin?error=token_exchange_failed&details=${encodeURIComponent(JSON.stringify(errorData, null, 2))}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!refresh_token && !access_token) {
      return NextResponse.redirect('/admin?error=no_tokens&message=' + encodeURIComponent('토큰을 받지 못했습니다.'))
    }

    // Vercel 환경 감지
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV || url.hostname.includes('vercel.app')
    
    console.log('[Calendar Callback API] Environment:', {
      isVercel,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hostname: url.hostname
    })

    // Vercel 환경에서는 파일 저장이 불가능하므로 항상 URL 파라미터로 토큰 전달
    if (isVercel) {
      console.log('[Calendar Callback API] Vercel environment detected - returning tokens via URL params')
      const tokenParams = new URLSearchParams({
        success: 'tokens_received',
        message: '토큰을 성공적으로 받았습니다. 아래 필드에 자동으로 입력되었으니 "캘린더 설정 저장" 버튼을 클릭해주세요.',
        accessToken: access_token || '',
        refreshToken: refresh_token || '',
        clientId: clientId,
        clientSecret: clientSecret
      })
      return NextResponse.redirect(`/admin?${tokenParams.toString()}&tab=calendar`)
    }

    // 로컬 개발 환경: 파일 시스템에 저장 시도
    let portfolioData
    try {
      portfolioData = await getPortfolioData()
      // 파일이 없거나 읽기 실패 시 빈 객체로 시작
      if (!portfolioData) {
        console.warn('[Calendar Callback API] Portfolio data not found, creating new structure')
        portfolioData = { calendar: {} } as any
      }
    } catch (readError) {
      console.error('[Calendar Callback API] Error reading portfolio data:', readError)
      // 읽기 실패 시에도 토큰은 전달해야 하므로 빈 객체로 시작
      portfolioData = { calendar: {} } as any
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

    // 로컬 환경에서 파일 저장 시도
    try {
      const success = await savePortfolioData(portfolioData)
      if (success) {
        console.log('[Calendar Callback API] Tokens saved successfully to file')
        return NextResponse.redirect('/admin?success=calendar_connected&tab=calendar')
      } else {
        console.warn('[Calendar Callback API] File save failed, returning tokens via URL params')
        // 파일 저장 실패 시 URL 파라미터로 토큰 전달
        const tokenParams = new URLSearchParams({
          success: 'tokens_received',
          message: '토큰을 성공적으로 받았습니다. 아래 필드에 자동으로 입력되었으니 "캘린더 설정 저장" 버튼을 클릭해주세요.',
          accessToken: access_token || '',
          refreshToken: refresh_token || '',
          clientId: clientId,
          clientSecret: clientSecret
        })
        return NextResponse.redirect(`/admin?${tokenParams.toString()}&tab=calendar`)
      }
    } catch (saveError) {
      console.error('[Calendar Callback API] Error saving portfolio data:', saveError)
      // 저장 실패해도 토큰은 전달해야 함
      const tokenParams = new URLSearchParams({
        success: 'tokens_received',
        message: '토큰을 성공적으로 받았습니다. 아래 필드에 자동으로 입력되었으니 "캘린더 설정 저장" 버튼을 클릭해주세요.',
        accessToken: access_token || '',
        refreshToken: refresh_token || '',
        clientId: clientId,
        clientSecret: clientSecret
      })
      return NextResponse.redirect(`/admin?${tokenParams.toString()}&tab=calendar`)
    }
  } catch (error) {
    console.error('[Calendar Callback API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[Calendar Callback API] Error stack:', errorStack)
    
    // 상세한 에러 정보를 포함한 리다이렉트
    const stackParam = errorStack ? `&stack=${encodeURIComponent(errorStack.substring(0, 200))}` : ''
    return NextResponse.redirect(`/admin?error=callback_error&details=${encodeURIComponent(errorMessage)}${stackParam}`)
  }
}

