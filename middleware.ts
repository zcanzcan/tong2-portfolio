import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, getCORSHeaders } from '@/lib/security'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    const pathname = request.nextUrl.pathname

    // CORS 헤더 추가
    const origin = request.headers.get('origin')
    const corsHeaders = getCORSHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
    })

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: corsHeaders })
    }

    // API 라우트에 Rate Limiting 적용
    if (pathname.startsWith('/api/')) {
        const clientIP = getClientIP(request)
        
        // 업로드 API는 더 엄격한 제한
        const isUploadAPI = pathname.includes('/upload')
        const maxRequests = isUploadAPI ? 10 : 100
        const windowMs = isUploadAPI ? 60000 : 60000 // 1분

        // API 종류별로 별도 버킷을 사용해 다른 엔드포인트 호출량이 업로드 제한에 영향을 주지 않도록 함
        const rateLimitKey = `${clientIP}:${isUploadAPI ? 'upload' : 'api'}`
        const rateLimit = checkRateLimit(rateLimitKey, maxRequests, windowMs)

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { 
                    error: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
                },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
                        ...corsHeaders
                    }
                }
            )
        }

        // Rate limit 헤더 추가
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
        response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())
    }

    // Admin 라우트 보호
    if (pathname.startsWith('/admin')) {
        const adminSession = request.cookies.get('admin_session')

        if (!adminSession) {
            // Redirect to home page if not authenticated
            return NextResponse.redirect(new URL('/', request.url))
        }

        // Admin 세션 보안 헤더 추가
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
    }

    // 보안 헤더 추가
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*',
    ],
}
