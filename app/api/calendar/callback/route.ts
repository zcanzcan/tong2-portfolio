import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Google OAuth 2.0 콜백 핸들러
 * Google에서 인증 코드를 받아서 토큰으로 교환하고 저장합니다.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  
  // Vercel 환경 감지 (가장 먼저)
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || url.hostname.includes('vercel.app')
  
  console.log('[Calendar Callback API] ====== CALLBACK START ======')
  console.log('[Calendar Callback API] Request URL:', request.url)
  console.log('[Calendar Callback API] Environment:', {
    isVercel,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    hostname: url.hostname,
    NODE_ENV: process.env.NODE_ENV
  })
  
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('[Calendar Callback API] Query params:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      codeLength: code?.length,
      stateLength: state?.length
    })

    // 사용자가 인증을 거부한 경우
    if (error) {
      console.log('[Calendar Callback API] User denied access')
      return NextResponse.redirect(`/admin?error=${encodeURIComponent(error)}&message=${encodeURIComponent('Google 인증이 취소되었습니다.')}`)
    }

    if (!code || !state) {
      console.error('[Calendar Callback API] Missing required params')
      return NextResponse.redirect('/admin?error=missing_params&message=' + encodeURIComponent('필수 파라미터가 없습니다.'))
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

    // 리다이렉트 URI 생성 (State에서 받은 redirectBaseUrl 우선 사용)
    let redirectUri: string
    
    if (redirectBaseUrl) {
      // State에서 받은 baseUrl 사용
      redirectUri = `${redirectBaseUrl}/api/calendar/callback`
    } else {
      // 현재 요청 URL 기반으로 생성
      let baseUrl = url.origin
      // 로컬 개발 환경 처리
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const port = url.port || '3000'
        baseUrl = `http://localhost:${port}`
      }
      redirectUri = `${baseUrl}/api/calendar/callback`
    }
    
    console.log('[Calendar Callback API] Redirect URI:', redirectUri)
    console.log('[Calendar Callback API] State redirectBaseUrl:', redirectBaseUrl)
    console.log('[Calendar Callback API] URL origin:', url.origin)

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

    console.log('[Calendar Callback API] Token received:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in
    })

    if (!refresh_token && !access_token) {
      console.error('[Calendar Callback API] No tokens received')
      return NextResponse.redirect('/admin?error=no_tokens&message=' + encodeURIComponent('토큰을 받지 못했습니다.'))
    }

    // 모든 환경에서 URL 파라미터로 토큰 전달
    // Vercel은 파일 시스템이 읽기 전용이고, 로컬에서도 안전하게 처리하기 위해
    // 항상 Admin 페이지에서 수동 저장하도록 함
    console.log('[Calendar Callback API] Returning tokens via URL params')
    const tokenParams = new URLSearchParams({
      success: 'tokens_received',
      message: '토큰을 성공적으로 받았습니다. 아래 필드에 자동으로 입력되었으니 "캘린더 설정 저장" 버튼을 클릭해주세요.',
      accessToken: access_token || '',
      refreshToken: refresh_token || '',
      clientId: clientId,
      clientSecret: clientSecret
    })
    const redirectUrl = `/admin?${tokenParams.toString()}&tab=calendar`
    console.log('[Calendar Callback API] Redirecting to admin page')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('[Calendar Callback API] ====== ERROR OCCURRED ======')
    console.error('[Calendar Callback API] Error type:', error?.constructor?.name)
    console.error('[Calendar Callback API] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[Calendar Callback API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[Calendar Callback API] =============================')
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorStack = error instanceof Error ? error.stack : ''
    
    // 에러가 발생해도 리다이렉트는 성공해야 함
    try {
      const stackParam = errorStack ? `&stack=${encodeURIComponent(errorStack.substring(0, 500))}` : ''
      const redirectUrl = `/admin?error=callback_error&details=${encodeURIComponent(errorMessage)}${stackParam}&tab=calendar`
      console.log('[Calendar Callback API] Redirecting to error page')
      return NextResponse.redirect(redirectUrl)
    } catch (redirectError) {
      // 리다이렉트도 실패하면 JSON 응답
      console.error('[Calendar Callback API] Failed to redirect:', redirectError)
      return NextResponse.json(
        { 
          error: '콜백 처리 중 오류가 발생했습니다',
          details: errorMessage,
          stack: errorStack?.substring(0, 500)
        },
        { status: 500 }
      )
    }
  }
}

