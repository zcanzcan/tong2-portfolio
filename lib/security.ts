/**
 * 보안 관련 유틸리티 함수
 */

// Rate Limiting을 위한 간단한 메모리 기반 저장소
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limiting 체크
 * @param identifier 요청 식별자 (IP 주소 등)
 * @param maxRequests 최대 요청 수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns 제한 초과 여부
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 기본 1분
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // 새 레코드 생성 또는 리셋
    const resetTime = now + windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    
    // 오래된 레코드 정리 (메모리 누수 방지)
    if (rateLimitStore.size > 10000) {
      for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    }

    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

/**
 * IP 주소 추출 (프록시 환경 고려)
 */
export function getClientIP(request: Request & { ip?: string | null }): string {
  // Next.js 제공 IP 우선 사용 (미들웨어에서 접근 가능)
  const directIP = request.ip;
  if (directIP) {
    return directIP;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }

  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}

/**
 * 입력값 검증 및 Sanitization
 */
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

/**
 * 파일명 검증 및 Sanitization
 */
export function sanitizeFilename(filename: string): string {
  // 위험한 문자 제거
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .substring(0, 255); // 파일명 길이 제한
}

/**
 * URL 검증
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 허용된 프로토콜만
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 이메일 검증
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * JSON 크기 제한 검증
 */
export function validateJSONSize(json: any, maxSizeKB: number = 100): boolean {
  const jsonString = JSON.stringify(json);
  const sizeKB = Buffer.byteLength(jsonString, 'utf8') / 1024;
  return sizeKB <= maxSizeKB;
}

/**
 * CORS 헤더 생성
 */
export function getCORSHeaders(origin: string | null): Record<string, string> {
  // 프로덕션에서는 특정 도메인만 허용
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

