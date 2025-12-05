# 환경 변수 설정 가이드

## 🔒 민감한 정보 관리

### ✅ Git에 올라가지 않는 정보

다음 정보들은 **Git에 올라가지 않습니다**:

1. **관리자 아이디/비밀번호** (`ADMIN_ID`, `ADMIN_PASSWORD`)
   - `.env.local` 파일에 저장
   - `.gitignore`에 포함되어 있어 Git에 올라가지 않음

2. **Google API 키** (`GOOGLE_CALENDAR_API_KEY`)
   - `.env.local` 파일에 저장
   - Git에 올라가지 않음

### ⚠️ Git에 올라가는 정보

다음 정보들은 **Git에 올라갑니다** (공개됨):

- `data/portfolio.json`의 일반 정보:
  - 캘린더 ID (공개 캘린더이므로 문제없음)
  - 프로필 정보
  - 프로젝트 정보
  - 등등

**주의**: `data/portfolio.json`에 민감한 정보(비밀번호, API 키 등)를 넣지 마세요!

---

## 📝 로컬 개발 환경 설정

### 1. `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 만드세요:

```bash
# 프로젝트 루트 디렉토리에서
# .env.local.example 파일을 참고하여 .env.local 파일 생성
```

### 2. 환경 변수 입력

`.env.local` 파일에 다음 내용을 입력:

```bash
# 관리자 인증 정보
ADMIN_ID=your_admin_id
ADMIN_PASSWORD=your_admin_password

# Google Calendar API (선택사항)
GOOGLE_CALENDAR_API_KEY=your_api_key
GOOGLE_CALENDAR_ACCESS_TOKEN=your_access_token
```

### 3. 관리자 아이디/비밀번호 수정

**로컬에서 수정하는 방법:**

1. `.env.local` 파일 열기
2. `ADMIN_ID`와 `ADMIN_PASSWORD` 값 변경
3. 개발 서버 재시작 (`npm run dev`)

**주의**: 
- `.env.local` 파일은 Git에 올라가지 않습니다
- 각 개발자마다 다른 값을 사용할 수 있습니다

---

## 🚀 프로덕션 배포 (Vercel) 환경 설정

### Vercel에서 환경 변수 설정

1. Vercel 대시보드 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 클릭
4. 다음 변수 추가:

```
ADMIN_ID = your_admin_id
ADMIN_PASSWORD = your_secure_password
GOOGLE_CALENDAR_API_KEY = your_api_key (선택사항)
ALLOWED_ORIGINS = https://yourdomain.com (선택사항)
```

5. **Save** 클릭
6. 재배포 (자동 또는 수동)

### 프로덕션에서 관리자 비밀번호 수정

**Vercel 대시보드에서 수정:**

1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. `ADMIN_PASSWORD` 변수 찾기
3. "Edit" 클릭
4. 새 비밀번호 입력
5. Save 클릭
6. 자동으로 재배포됨

**로컬에서 수정 후 재배포:**

1. 로컬 `.env.local` 수정 (테스트용)
2. Vercel 대시보드에서도 동일하게 수정
3. GitHub에 Push하면 자동 재배포

---

## 🔍 현재 설정 확인

### 로컬 환경 변수 확인

```bash
# .env.local 파일이 있는지 확인
ls -la .env.local

# 파일 내용 확인 (터미널에서)
cat .env.local
```

### Git에 올라가지 않는지 확인

```bash
# Git에 추적되는 파일 확인
git ls-files | grep env

# .env.local이 목록에 없어야 함
```

---

## ⚠️ 주의사항

### 절대 하지 말아야 할 것:

1. ❌ `.env.local` 파일을 Git에 커밋하지 마세요
2. ❌ 비밀번호를 코드에 하드코딩하지 마세요
3. ❌ `data/portfolio.json`에 민감한 정보를 넣지 마세요
4. ❌ GitHub에 비밀번호를 공개하지 마세요

### 안전한 방법:

1. ✅ `.env.local` 파일 사용 (로컬)
2. ✅ Vercel Environment Variables 사용 (프로덕션)
3. ✅ `.gitignore`에 `.env*.local` 포함 확인
4. ✅ 민감한 정보는 항상 환경 변수로 관리

---

## 📋 체크리스트

배포 전 확인:

- [ ] `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] `data/portfolio.json`에 민감한 정보가 없는지 확인
- [ ] Vercel에 환경 변수가 설정되어 있는지 확인
- [ ] 관리자 비밀번호가 강력한지 확인 (최소 12자, 대소문자, 숫자, 특수문자)

---

## 💡 팁

### 환경 변수 사용 방법

코드에서 환경 변수 사용:
```typescript
// ✅ 올바른 방법
const adminId = process.env.ADMIN_ID
const password = process.env.ADMIN_PASSWORD

// ❌ 잘못된 방법 (하드코딩)
const adminId = "admin123"
```

### 여러 환경 관리

- **로컬 개발**: `.env.local` 파일 사용
- **프로덕션**: Vercel Environment Variables 사용
- **테스트**: `.env.test.local` 파일 사용 (선택사항)

---

**작성일**: 2025년 1월
**버전**: 1.0


