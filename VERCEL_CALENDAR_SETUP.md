# Vercel에서 Google Calendar 연결 설정하기

Vercel 배포 환경에서는 파일 시스템이 **읽기 전용(Read-Only)**이므로, Admin 페이지에서 "Google 자동 연결"을 해도 토큰 파일이 저장되지 않아 연결이 유지되지 않습니다.

따라서 **Environment Variables (환경 변수)**를 사용하여 연결해야 합니다.

---

## 1단계: 로컬에서 Refresh Token 생성하기

먼저 로컬 개발 환경에서 Admin 페이지를 통해 로그인을 수행하여 Refresh Token을 생성해야 합니다.

1. 로컬 개발 서버 실행:
   ```bash
   npm run dev
   ```
2. 웹 브라우저에서 `http://localhost:3000/admin` 접속
3. **[구글 캘린더]** 탭으로 이동
4. **"자동 연결"** 섹션에서 Client ID와 Secret을 입력하고 연결 진행
5. 연결이 성공하면 프로젝트 폴더의 `data/portfolio.json` 파일을 엽니다.
6. `calendar` 섹션 안의 `refreshToken` 값을 찾습니다.

```json
"calendar": {
  "refreshToken": "1//04.........."  <-- 이 값을 복사하세요!
}
```

---

## 3단계: Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 해당 프로젝트(**tong2-portfolio**) 선택
3. 상단 메뉴의 **Settings** -> **Environment Variables** 클릭
4. 아래 변수들을 추가합니다:

| Key | Value | 설명 |
|-----|-------|------|
| `GOOGLE_REFRESH_TOKEN` | 복사한 `refreshToken` 값 | **가장 중요!** |
| `GOOGLE_CLIENT_ID` | 사용한 Client ID | |
| `GOOGLE_CLIENT_SECRET` | 사용한 Client Secret | |
| `GOOGLE_CALENDAR_API_KEY` | (선택사항) API Key | 공개 캘린더용 |

5. **Save**를 눌러 저장합니다.

---

## 4단계: 배포 (재배포 필요)

환경 변수는 새로운 배포가 일어날 때 적용됩니다.
- 이미 배포된 상태라면 **Latest Deployment**에서 **Redeploy**를 하거나,
- Git에 새로운 커밋을 푸시하여 재배포를 트리거하세요.

---

## 5단계: Admin 페이지 설정

Vercel 배포 후 Admin 페이지에서는:
1. **캘린더 ID**만 입력하면 됩니다.
2. (환경 변수가 설정되어 있으므로) 별도의 로그인은 필요 없습니다.
3. 캘린더 ID 입력 후 **"설정 저장"**을 누르세요.

**끝! 이제 비공개 캘린더도 정상적으로 연동됩니다.**

---

## 문제 해결

### ❌ "redirect_uri_mismatch" 오류 (로컬 개발 시)

**원인**: Google Cloud Console에 등록된 리디렉션 URI와 실제 요청 URI가 일치하지 않음

**해결 방법**:

#### 1단계: 현재 사용 중인 Redirect URI 확인

Admin 페이지에서 "Google로 자동 연결하기" 버튼을 클릭하기 전에, 브라우저 개발자 도구(F12)를 열고 **Console** 탭을 확인하세요. 서버 로그에 다음과 같은 정보가 표시됩니다:

```
[Calendar Auth API] Final redirectUri: http://localhost:3000/api/calendar/callback
```

이 URI가 **정확히** Google Cloud Console에 등록되어 있어야 합니다.

#### 2단계: Google Cloud Console에서 URI 등록

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 (또는 새로 생성)
3. 좌측 메뉴에서 **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
4. OAuth 2.0 클라이언트 ID 목록에서 사용 중인 클라이언트 ID 클릭
5. **"승인된 리디렉션 URI"** 섹션 확인
6. 다음 URI들을 **정확히** 추가 (각각 한 줄씩):

   **로컬 개발용:**
   ```
   http://localhost:3000/api/calendar/callback
   ```

   **포트가 다르면 (예: 3001):**
   ```
   http://localhost:3001/api/calendar/callback
   ```

   **Vercel 배포용 (실제 배포 URL 사용):**
   ```
   https://tong2-portfolio.vercel.app/api/calendar/callback
   ```
   또는
   ```
   https://your-custom-domain.com/api/calendar/callback
   ```

7. **"저장"** 버튼 클릭
8. **5-10분 대기** (Google 서버에 반영되는데 시간이 걸림)

#### 3단계: 다시 시도

1. 브라우저 캐시 지우기 (`Ctrl + Shift + Delete`)
2. 개발 서버 재시작 (`npm run dev`)
3. Admin 페이지에서 다시 연결 시도

**⚠️ 중요 체크리스트**:
- ✅ URI는 **대소문자 구분**합니다 (`localhost`는 소문자)
- ✅ **슬래시(`/`) 위치**가 정확해야 합니다 (`/api/calendar/callback`)
- ✅ **포트 번호**가 정확해야 합니다 (`:3000`)
- ✅ `http://`와 `https://`를 구분합니다 (로컬은 `http://`, 배포는 `https://`)
- ✅ URI 끝에 **슬래시(`/`)가 없어야** 합니다 (`/callback` ✅, `/callback/` ❌)
- ✅ Google Cloud Console 저장 후 **5-10분 대기** 필요

**🔍 디버깅 팁**:
- 브라우저 개발자 도구(F12) → Network 탭에서 OAuth 요청 확인
- `redirect_uri` 파라미터 값을 확인하여 Google Cloud Console에 등록된 URI와 비교

### ❌ 로컬에서 500 에러 발생

**원인**: 파일 시스템 권한 문제 또는 데이터 읽기 실패

**해결 방법**:
1. `data/portfolio.json` 파일이 존재하는지 확인
2. 파일 읽기 권한 확인
3. 개발 서버 재시작: `npm run dev`
4. 에러 로그 콘솔에서 상세 에러 메시지 확인
