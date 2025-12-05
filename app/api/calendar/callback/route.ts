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
    const url = new URL(request.url)
    const redirectUri = `${url.origin}/api/calendar/callback`
    
    console.log('[Calendar Callback API] Current URL:', request.url)
    console.log('[Calendar Callback API] Redirect URI:', redirectUri)
    console.log('[Calendar Callback API] State redirectBaseUrl:', redirectBaseUrl)

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
      return NextResponse.redirect('/admin?error=no_tokens')
    }

    // 포트폴리오 데이터 읽기
    let portfolioData
    try {
      portfolioData = await getPortfolioData()
      if (!portfolioData) {
        console.error('[Calendar Callback API] Failed to read portfolio data: getPortfolioData returned null')
        return NextResponse.redirect('/admin?error=read_failed')
      }
    } catch (readError) {
      console.error('[Calendar Callback API] Error reading portfolio data:', readError)
      return NextResponse.redirect(`/admin?error=read_failed&details=${encodeURIComponent(readError instanceof Error ? readError.message : '알 수 없는 오류')}`)
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

    // 데이터 저장 - Vercel에서는 파일 시스템이 읽기 전용이므로 API를 통해 저장 시도
    let success = false
    try {
      // 먼저 파일 시스템에 저장 시도
      success = await savePortfolioData(portfolioData)
      
      // 파일 저장 실패 시 직접 파일에 쓰기 시도 (Vercel에서는 작동하지 않을 수 있음)
      // 하지만 일단 시도해보고, 실패하면 에러 메시지로 안내
      if (!success) {
        console.log('[Calendar Callback API] File save failed')
        // Vercel에서는 파일 시스템이 읽기 전용이므로 저장이 실패할 수 있음
        // 이 경우 사용자에게 Admin 페이지에서 수동으로 저장하도록 안내
        console.warn('[Calendar Callback API] Vercel file system is read-only. User needs to save manually.')
      }
      
      if (!success) {
        console.error('[Calendar Callback API] File save failed')
        // Vercel에서는 파일 저장이 실패하지만, 토큰은 성공적으로 받았으므로
        // 사용자에게 Admin 페이지에서 수동으로 저장하도록 안내
        // 토큰 정보를 URL 파라미터로 전달 (보안상 좋지 않지만 임시 방편)
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
      const errorMsg = saveError instanceof Error ? saveError.message : '알 수 없는 오류'
      return NextResponse.redirect(`/admin?error=save_failed&details=${encodeURIComponent(errorMsg)}`)
    }

    console.log('[Calendar Callback API] Tokens saved successfully')

    // 성공 메시지와 함께 Admin 페이지로 리다이렉트
    return NextResponse.redirect('/admin?success=calendar_connected&tab=calendar')
  } catch (error) {
    console.error('[Calendar Callback API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[Calendar Callback API] Error stack:', errorStack)
    
    // 상세한 에러 정보를 포함한 리다이렉트
    return NextResponse.redirect(`/admin?error=callback_error&details=${encodeURIComponent(errorMessage)}&stack=${encodeURIComponent(errorStack.substring(0, 200))}`)
  }
}

