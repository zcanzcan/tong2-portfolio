# 보안 코드 구현 상세 가이드

이 문서는 프로젝트에 적용된 보안 코드의 구체적인 위치와 구현 내용을 설명합니다.

---

## 📁 파일별 보안 코드 위치

### 1. `next.config.mjs` - Security Headers 설정

**위치**: 프로젝트 루트

**적용된 보안 코드**:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        // XSS 보호
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        },
        // Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://www.googleapis.com https://calendar.google.com",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "upgrade-insecure-requests"
          ].join('; ')
        }
      ],
    },
  ]
}
```

**보안 효과**:
- 모든 HTTP 응답에 보안 헤더 자동 추가
- XSS, 클릭재킹, MIME 스니핑 공격 방지
- HTTPS 강제 및 리소스 로드 제한

---

### 2. `middleware.ts` - Rate Limiting 및 인증 미들웨어

**위치**: 프로젝트 루트

**적용된 보안 코드**:

#### 2-1. Rate Limiting 구현
```typescript
// API 라우트에 Rate Limiting 적용
if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    
    // 업로드 API는 더 엄격한 제한
    const isUploadAPI = pathname.includes('/upload')
    const maxRequests = isUploadAPI ? 10 : 100
    const windowMs = isUploadAPI ? 60000 : 60000 // 1분

    const rateLimit = checkRateLimit(clientIP, maxRequests, windowMs)

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
}
```

**보안 효과**:
- DoS 공격 방지
- API 남용 방지
- 서버 리소스 보호

#### 2-2. Admin 라우트 보호
```typescript
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
```

**보안 효과**:
- 인증되지 않은 사용자의 관리자 페이지 접근 차단
- 관리자 페이지에 추가 보안 헤더 적용

#### 2-3. CORS 헤더 추가
```typescript
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
```

**보안 효과**:
- Cross-Origin 요청 제어
- 허용된 Origin만 접근 가능

---

### 3. `lib/security.ts` - 보안 유틸리티 함수

**위치**: `lib/security.ts`

**적용된 보안 함수들**:

#### 3-1. Rate Limiting 함수
```typescript
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number }
```

**사용 위치**: `middleware.ts`

**보안 효과**: 요청 빈도 제한

#### 3-2. IP 주소 추출
```typescript
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
```

**사용 위치**: `middleware.ts`

**보안 효과**: 프록시 환경에서 실제 클라이언트 IP 추출

#### 3-3. Input Sanitization
```typescript
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // HTML 태그 제거
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}
```

**사용 위치**: `app/api/portfolio/update/route.ts`

**보안 효과**: XSS 공격 방지, 악성 스크립트 제거

#### 3-4. 파일명 Sanitization
```typescript
export function sanitizeFilename(filename: string): string {
  // 위험한 문자 제거
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255); // 파일명 길이 제한
}
```

**사용 위치**: `lib/upload-utils.ts`

**보안 효과**: 경로 탐색 공격 방지 (`../` 등)

#### 3-5. URL 검증
```typescript
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 허용된 프로토콜만
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

**보안 효과**: 피싱 공격 방지, 위험한 프로토콜 차단

#### 3-6. JSON 크기 검증
```typescript
export function validateJSONSize(json: any, maxSizeKB: number = 100): boolean {
  const jsonString = JSON.stringify(json);
  const sizeKB = Buffer.byteLength(jsonString, 'utf8') / 1024;
  return sizeKB <= maxSizeKB;
}
```

**사용 위치**: `app/api/portfolio/update/route.ts`

**보안 효과**: DoS 공격 방지 (과도한 데이터 전송 차단)

#### 3-7. CORS 헤더 생성
```typescript
export function getCORSHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  const isAllowed = origin && (
    allowedOrigins.includes('*') || 
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV === 'development'
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
```

**사용 위치**: `middleware.ts`

**보안 효과**: Cross-Origin 요청 제어

---

### 4. `app/api/portfolio/update/route.ts` - API 보안 강화

**위치**: `app/api/portfolio/update/route.ts`

**적용된 보안 코드**:

#### 4-1. 인증 확인
```typescript
// 인증 확인
if (!isAuthenticated(request)) {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}
```

**보안 효과**: 인증되지 않은 요청 차단

#### 4-2. JSON 크기 검증
```typescript
// JSON 크기 검증
if (!validateJSONSize(body, 500)) { // 500KB 제한
    return NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
    );
}
```

**보안 효과**: DoS 공격 방지

#### 4-3. Section 검증
```typescript
// Section 검증 (허용된 섹션만)
const allowedSections = [
    'profile', 'heroButtons', 'experience', 'skills', 
    'certifications', 'blog', 'publications', 'socials', 'calendar'
];

if (!allowedSections.includes(section)) {
    return NextResponse.json(
        { error: `Invalid section: ${section}` },
        { status: 400 }
    );
}
```

**보안 효과**: 무단 섹션 접근 방지

#### 4-4. Input Sanitization
```typescript
// 입력값 Sanitization
const sanitizedData = sanitizeInput(data);
```

**보안 효과**: XSS 공격 방지

---

### 5. `app/api/upload/route.ts` - 파일 업로드 보안

**위치**: `app/api/upload/route.ts`

**적용된 보안 코드**:

#### 5-1. 인증 확인
```typescript
// 인증 확인
if (!isAuthenticated(request)) {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}
```

**보안 효과**: 인증되지 않은 파일 업로드 차단

#### 5-2. 폴더명 검증
```typescript
// 폴더명 검증 (경로 탐색 공격 방지)
if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
    return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
    );
}
```

**보안 효과**: 경로 탐색 공격 방지 (`../../../etc/passwd` 등)

---

### 6. `app/api/upload/resume/route.ts` - 이력서 업로드 보안

**위치**: `app/api/upload/resume/route.ts`

**적용된 보안 코드**:

#### 6-1. 인증 확인
```typescript
// 인증 확인
if (!isAuthenticated(request)) {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}
```

**보안 효과**: 인증되지 않은 이력서 업로드 차단

---

### 7. `lib/upload-utils.ts` - 파일 업로드 유틸리티 보안

**위치**: `lib/upload-utils.ts`

**적용된 보안 코드**:

#### 7-1. 파일명 Sanitization
```typescript
import { sanitizeFilename } from './security';

// 파일명 Sanitization 적용
if (useOriginalNameAsBase) {
    const sanitizedOriginalName = sanitizeFilename(originalFileName);
    const baseName = path.basename(sanitizedOriginalName, ext) || 'file';
    savedFileName = `${baseName}_${timestamp}${ext}`;
} else if (filenamePrefix) {
    const sanitizedPrefix = sanitizeFilename(filenamePrefix);
    savedFileName = `${sanitizedPrefix}_${timestamp}${ext}`;
}

// 최종 파일명 검증
savedFileName = sanitizeFilename(savedFileName);
```

**보안 효과**: 
- 경로 탐색 공격 방지
- 특수 문자 제거
- 파일명 길이 제한

#### 7-2. 파일 타입 검증 (기존 코드)
```typescript
// 파일 타입 검증
if (allowedTypes && allowedTypes.length > 0) {
    const isMimeValid = allowedTypes.includes(file.type);
    
    if (!isMimeValid) {
        if (allowedExtensions && allowedExtensions.length > 0) {
            isValidType = allowedExtensions.includes(fileExtension) || file.type === '';
        } else {
            isValidType = false;
        }
    }
}
```

**보안 효과**: 허용되지 않은 파일 타입 차단

#### 7-3. 파일 크기 검증 (기존 코드)
```typescript
// 파일 크기 검증
if (maxSize && file.size > maxSize) {
    return {
        success: false,
        error: `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
        status: 400
    };
}
```

**보안 효과**: 과도한 파일 크기 업로드 방지

---

### 8. `app/api/admin/auth/route.ts` - 인증 보안

**위치**: `app/api/admin/auth/route.ts`

**적용된 보안 코드** (기존 코드, 확인):

#### 8-1. 쿠키 보안 설정
```typescript
cookieStore.set('admin_session', 'true', {
    httpOnly: true,  // JavaScript 접근 불가 (XSS 방지)
    secure: process.env.NODE_ENV === 'production',  // HTTPS에서만 전송
    sameSite: 'strict',  // CSRF 공격 방지
    maxAge: 60 * 60 * 24 // 1 day
});
```

**보안 효과**:
- XSS 공격으로 쿠키 탈취 방지
- CSRF 공격 방지
- 세션 자동 만료

---

## 🔍 보안 코드 적용 위치 요약

| 파일 경로 | 보안 기능 | 적용 라인 |
|----------|----------|----------|
| `next.config.mjs` | Security Headers | 전체 `headers()` 함수 |
| `middleware.ts` | Rate Limiting, 인증, CORS | 전체 미들웨어 함수 |
| `lib/security.ts` | 보안 유틸리티 함수 | 전체 파일 |
| `app/api/portfolio/update/route.ts` | 인증, 검증, Sanitization | POST 함수 내부 |
| `app/api/upload/route.ts` | 인증, 폴더명 검증 | POST 함수 시작 부분 |
| `app/api/upload/resume/route.ts` | 인증 | POST 함수 시작 부분 |
| `lib/upload-utils.ts` | 파일명 Sanitization | 파일명 생성 부분 |
| `app/api/admin/auth/route.ts` | 쿠키 보안 설정 | 쿠키 설정 부분 |

---

## 🛡️ 보안 계층 구조

```
1. 네트워크 레벨
   └─ Security Headers (next.config.mjs)
      └─ 모든 HTTP 응답에 자동 적용

2. 미들웨어 레벨
   └─ middleware.ts
      ├─ Rate Limiting
      ├─ CORS 제어
      └─ Admin 인증 확인

3. API 레벨
   └─ 각 API 라우트
      ├─ 인증 확인
      ├─ 입력값 검증
      └─ Sanitization

4. 유틸리티 레벨
   └─ lib/security.ts
      ├─ Input Sanitization
      ├─ 파일명 검증
      └─ URL/이메일 검증

5. 파일 업로드 레벨
   └─ lib/upload-utils.ts
      ├─ 파일 타입 검증
      ├─ 파일 크기 검증
      └─ 파일명 Sanitization
```

---

## 📝 코드 검색 가이드

특정 보안 기능을 찾으려면:

### Rate Limiting 찾기
```bash
grep -r "checkRateLimit" .
```

### 인증 확인 찾기
```bash
grep -r "isAuthenticated" .
```

### Sanitization 찾기
```bash
grep -r "sanitizeInput\|sanitizeFilename" .
```

### Security Headers 찾기
```bash
grep -r "X-Frame-Options\|X-Content-Type-Options" .
```

---

## 🔄 보안 코드 수정 가이드

### Rate Limiting 제한 변경
**파일**: `middleware.ts`
**위치**: Rate Limiting 부분
```typescript
const maxRequests = isUploadAPI ? 10 : 100  // 여기서 변경
```

### 허용된 섹션 추가
**파일**: `app/api/portfolio/update/route.ts`
**위치**: `allowedSections` 배열
```typescript
const allowedSections = [
    'profile', 'heroButtons', 'experience', 'skills', 
    'certifications', 'blog', 'publications', 'socials', 'calendar',
    'newSection'  // 여기에 추가
];
```

### Security Headers 수정
**파일**: `next.config.mjs`
**위치**: `headers()` 함수 내부

### CORS 설정 변경
**파일**: `lib/security.ts`
**위치**: `getCORSHeaders()` 함수

---

## ✅ 보안 코드 검증 체크리스트

각 파일의 보안 코드가 제대로 적용되었는지 확인:

- [ ] `next.config.mjs`에 Security Headers 설정됨
- [ ] `middleware.ts`에 Rate Limiting 적용됨
- [ ] `middleware.ts`에 Admin 인증 확인됨
- [ ] `lib/security.ts`에 모든 보안 함수 구현됨
- [ ] API 라우트에 인증 확인 추가됨
- [ ] API 라우트에 입력값 검증 추가됨
- [ ] 파일 업로드에 인증 확인 추가됨
- [ ] 파일명 Sanitization 적용됨

---

**작성일**: 2025년 1월
**버전**: 1.0
**최종 업데이트**: 보안 코드 적용 완료

