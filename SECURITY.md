# 보안 정책 및 가이드

이 문서는 포트폴리오 사이트에 적용된 보안 정책과 설정 방법을 설명합니다.

---

## 🔒 적용된 보안 기능

### 1. Security Headers (보안 헤더)

모든 HTTP 응답에 다음 보안 헤더가 자동으로 추가됩니다:

- **X-Frame-Options**: 클릭재킹 방지
- **X-Content-Type-Options**: MIME 타입 스니핑 방지
- **X-XSS-Protection**: XSS 공격 방지
- **Strict-Transport-Security**: HTTPS 강제
- **Referrer-Policy**: 리퍼러 정보 제한
- **Content-Security-Policy**: 스크립트 및 리소스 로드 제한
- **Permissions-Policy**: 브라우저 기능 접근 제한

**설정 위치**: `next.config.mjs`

---

### 2. Rate Limiting (요청 제한)

API 엔드포인트에 Rate Limiting이 적용되어 있습니다:

- **일반 API**: 1분당 100회 요청
- **업로드 API**: 1분당 10회 요청
- **제한 초과 시**: 429 Too Many Requests 응답

**구현 위치**: `middleware.ts`, `lib/security.ts`

---

### 3. 인증 및 인가

#### 관리자 페이지 보호
- `/admin` 경로는 쿠키 기반 인증 필요
- 인증되지 않은 사용자는 홈페이지로 리다이렉트

#### API 라우트 보호
- `/api/portfolio/update`: 관리자 인증 필요
- `/api/upload/*`: 관리자 인증 필요
- 인증되지 않은 요청은 401 Unauthorized 응답

**구현 위치**: `middleware.ts`, `app/api/*/route.ts`

---

### 4. Input Validation (입력값 검증)

모든 사용자 입력값이 검증 및 Sanitization됩니다:

- **HTML 태그 제거**: XSS 공격 방지
- **파일명 검증**: 경로 탐색 공격 방지
- **JSON 크기 제한**: DoS 공격 방지
- **URL 검증**: 피싱 공격 방지
- **이메일 검증**: 형식 검증

**구현 위치**: `lib/security.ts`

---

### 5. 파일 업로드 보안

파일 업로드 시 다음 검증이 수행됩니다:

- **파일 타입 검증**: 허용된 MIME 타입만 허용
- **파일 확장자 검증**: 이중 검증
- **파일 크기 제한**: 
  - 이미지: 20MB
  - 이력서: 50MB
- **파일명 Sanitization**: 특수 문자 제거
- **경로 탐색 방지**: `../` 등 위험한 경로 차단

**구현 위치**: `lib/upload-utils.ts`, `app/api/upload/*/route.ts`

---

### 6. CORS (Cross-Origin Resource Sharing)

CORS 설정이 적용되어 있습니다:

- **개발 환경**: 모든 Origin 허용
- **프로덕션**: 환경 변수로 허용된 Origin만 허용

**설정 방법**: 환경 변수 `ALLOWED_ORIGINS` 설정

---

## 🛡️ 환경 변수 보안

### 필수 환경 변수

프로덕션 배포 시 다음 환경 변수를 설정해야 합니다:

```bash
# 관리자 인증
ADMIN_ID=your_admin_id
ADMIN_PASSWORD=your_secure_password

# CORS 설정 (선택사항)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Google Calendar API (선택사항)
GOOGLE_CALENDAR_API_KEY=your_api_key
```

### 환경 변수 설정 방법 (Vercel)

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings > Environment Variables
4. 변수 추가 및 저장
5. 재배포 (자동 또는 수동)

### 보안 권장사항

- ✅ 강력한 비밀번호 사용 (최소 12자, 대소문자, 숫자, 특수문자 포함)
- ✅ 정기적으로 비밀번호 변경
- ✅ 환경 변수는 절대 코드에 커밋하지 않기
- ✅ `.env.local` 파일은 `.gitignore`에 포함되어 있는지 확인

---

## 🔐 쿠키 보안

관리자 세션 쿠키는 다음 보안 설정이 적용됩니다:

- **httpOnly**: JavaScript 접근 불가 (XSS 방지)
- **secure**: HTTPS에서만 전송 (프로덕션)
- **sameSite**: CSRF 공격 방지
- **maxAge**: 24시간 후 자동 만료

**구현 위치**: `app/api/admin/auth/route.ts`

---

## 📋 보안 체크리스트

배포 전 확인사항:

- [ ] 환경 변수 설정 완료
- [ ] 강력한 관리자 비밀번호 설정
- [ ] HTTPS 활성화 확인 (Vercel 자동)
- [ ] Security Headers 적용 확인
- [ ] Rate Limiting 작동 확인
- [ ] 파일 업로드 제한 확인
- [ ] 관리자 페이지 접근 제한 확인
- [ ] CORS 설정 확인 (프로덕션)

---

## 🚨 보안 취약점 신고

보안 취약점을 발견하셨다면:

1. 즉시 관리자에게 연락
2. 취약점 정보를 비공개로 전달
3. 공개 전 수정 완료 대기

---

## 📚 추가 보안 권장사항

### 1. 정기적인 업데이트
- Next.js 및 의존성 패키지 정기 업데이트
- 보안 패치 즉시 적용

### 2. 모니터링
- Vercel Analytics 사용
- 에러 로그 정기 확인
- 비정상적인 트래픽 패턴 모니터링

### 3. 백업
- 정기적인 데이터 백업
- GitHub에 코드 백업 (환경 변수 제외)

### 4. 접근 제어
- 관리자 계정 최소 권한 원칙
- 불필요한 API 엔드포인트 비활성화

---

## 🔍 보안 테스트

### 자동 보안 검사 도구

다음 도구로 보안을 테스트할 수 있습니다:

- **Mozilla Observatory**: https://observatory.mozilla.org
- **Security Headers**: https://securityheaders.com
- **SSL Labs**: https://www.ssllabs.com/ssltest/

### 수동 테스트 항목

- [ ] XSS 공격 시도 (스크립트 태그 입력)
- [ ] SQL Injection 시도 (현재는 JSON 파일 사용)
- [ ] 파일 업로드 공격 (실행 파일 업로드 시도)
- [ ] Rate Limiting 테스트 (과도한 요청)
- [ ] 인증 우회 시도 (쿠키 조작)

---

## 📞 보안 관련 문의

보안 관련 질문이나 문제가 있으면:

1. 프로젝트 이슈 트래커 사용
2. 관리자에게 직접 연락

---

**최종 업데이트**: 2025년 1월
**버전**: 1.0

