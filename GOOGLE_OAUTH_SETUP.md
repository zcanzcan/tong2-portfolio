# Google OAuth 2.0 설정 가이드

Google Calendar 자동 연결 기능을 사용하기 위해 필요한 OAuth 2.0 Client ID와 Client Secret을 생성하는 방법입니다.

---

## 1단계: Google Cloud Console 접속

1. **Google Cloud Console** 접속: https://console.cloud.google.com/
2. Google 계정으로 로그인

---

## 2단계: 프로젝트 생성 또는 선택

1. 상단의 **프로젝트 선택** 드롭다운 클릭
2. **새 프로젝트** 클릭 (또는 기존 프로젝트 선택)
3. 프로젝트 이름 입력 (예: `tong2-portfolio`)
4. **만들기** 클릭
5. 프로젝트가 생성될 때까지 대기 (몇 초 소요)

---

## 3단계: Google Calendar API 활성화

1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"라이브러리"** 클릭
2. 검색창에 **"Google Calendar API"** 입력
3. **"Google Calendar API"** 클릭
4. **"사용 설정"** 또는 **"Enable"** 버튼 클릭
5. API가 활성화될 때까지 대기

**⚠️ 중요**: 이 단계를 먼저 해야 OAuth 클라이언트를 만들 수 있습니다!

---

## 4단계: OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"OAuth 동의 화면"** 클릭
2. **사용자 유형** 선택:
   - **외부** 선택 (개인 프로젝트인 경우)
   - **만들기** 클릭
3. **앱 정보** 입력:
   - **앱 이름**: `Tong2 Portfolio` (또는 원하는 이름)
   - **사용자 지원 이메일**: 본인 이메일 선택
   - **앱 로고**: 선택사항
   - **앱 도메인**: 선택사항
   - **개발자 연락처 정보**: 본인 이메일 입력
4. **저장 후 계속** 클릭
5. **범위** 단계에서 **저장 후 계속** 클릭 (기본 범위 사용)
6. **테스트 사용자** 단계에서:
   - **사용자 추가** 클릭
   - 본인 Google 이메일 주소 입력
   - **저장 후 계속** 클릭
7. **요약** 단계에서 **대시보드로 돌아가기** 클릭

---

## 5단계: OAuth 2.0 클라이언트 ID 생성

1. 왼쪽 메뉴에서 **"API 및 서비스"** → **"사용자 인증 정보"** 클릭
2. 상단의 **"+ 사용자 인증 정보 만들기"** 클릭
3. **"OAuth 클라이언트 ID"** 선택

### 클라이언트 ID 설정:

4. **애플리케이션 유형**: **"웹 애플리케이션"** 선택

5. **이름**: `Tong2 Portfolio Calendar` (또는 원하는 이름)

6. **승인된 리디렉션 URI** 섹션에서 **"+ URI 추가"** 클릭하여 다음 URI들을 추가:

   **로컬 개발용:**
   ```
   http://localhost:3000/api/calendar/callback
   ```

   **Vercel 배포용:**
   ```
   https://tong2-portfolio.vercel.app/api/calendar/callback
   ```

   **도메인을 구매한 경우:**
   ```
   https://yourdomain.com/api/calendar/callback
   ```

   > 💡 **참고**: 나중에 도메인을 추가하면 여기에 URI를 추가하면 됩니다.

7. **만들기** 클릭

---

## 6단계: Client ID와 Client Secret 확인

생성 완료 후 팝업 창이 나타납니다:

### ✅ **OAuth 클라이언트 ID** (Client ID)
- 형식: `736669320223-xxxxxxxxxxxxx.apps.googleusercontent.com`
- 이 값을 복사하여 Admin 페이지에 입력

### ✅ **클라이언트 보안 비밀번호** (Client Secret)
- 형식: `GOCSPX-xxxxxxxxxxxxx`
- **⚠️ 중요**: 이 값은 한 번만 표시됩니다!
- 즉시 복사하여 안전한 곳에 보관하세요
- 이 값을 복사하여 Admin 페이지에 입력

### 팝업을 닫은 경우:

1. **"사용자 인증 정보"** 페이지로 돌아가기
2. 방금 생성한 **OAuth 2.0 클라이언트 ID** 클릭
3. **"클라이언트 ID"**와 **"클라이언트 보안 비밀번호"** 확인
   - Client Secret이 보이지 않으면 **"비밀번호 다시 만들기"** 클릭하여 새로 생성

---

## 7단계: Admin 페이지에 입력

1. Admin 페이지 접속: `https://tong2-portfolio.vercel.app/admin`
2. **"구글 캘린더"** 탭 클릭
3. **"자동 연결 (권장)"** 섹션에서:
   - **OAuth 2.0 Client ID**: Google Cloud Console에서 복사한 Client ID 입력
   - **OAuth 2.0 Client Secret**: Google Cloud Console에서 복사한 Client Secret 입력
4. **"Google로 자동 연결하기"** 버튼 클릭
5. Google 계정 선택 및 권한 승인
6. 자동으로 토큰이 저장됩니다!

---

## 문제 해결

### ❌ "redirect_uri_mismatch" 오류

**원인**: Google Cloud Console에 등록된 리디렉션 URI와 실제 요청 URI가 일치하지 않음

**해결 방법**:
1. Google Cloud Console → 사용자 인증 정보 → OAuth 클라이언트 ID 클릭
2. **"승인된 리디렉션 URI"** 확인
3. 현재 사용 중인 도메인의 정확한 URI가 있는지 확인
4. 없으면 추가하고 저장

### ❌ "invalid_client" 오류

**원인**: Client ID 또는 Client Secret이 잘못됨

**해결 방법**:
1. Google Cloud Console에서 Client ID와 Secret 다시 확인
2. Admin 페이지에 정확히 복사하여 입력 (공백 없이)
3. Client Secret이 만료되었으면 새로 생성

### ❌ "access_denied" 오류

**원인**: 사용자가 권한을 거부함

**해결 방법**:
1. 다시 시도하여 권한 승인
2. OAuth 동의 화면에서 테스트 사용자로 본인 이메일이 추가되어 있는지 확인

### ❌ "invalid_scope" 오류

**원인**: Google Calendar API가 활성화되지 않음

**해결 방법**:
1. Google Cloud Console → API 및 서비스 → 라이브러리
2. "Google Calendar API" 검색
3. **"사용 설정"** 클릭하여 활성화

---

## 보안 주의사항

⚠️ **중요**:
- **Client Secret은 절대 공개하지 마세요!**
- Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있음)
- 다른 사람과 공유하지 마세요
- 유출되면 즉시 "비밀번호 다시 만들기"로 새로 생성하세요

---

## 참고 링크

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Calendar API 문서](https://developers.google.com/calendar/api)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)



