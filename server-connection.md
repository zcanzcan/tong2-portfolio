# 서버 연결 가이드 (Vercel 배포)

포트폴리오 사이트를 Vercel에 배포하는 전체 과정을 단계별로 안내합니다.

---

## 📋 사전 준비사항

- [ ] GitHub 계정 (없으면 https://github.com 에서 가입)
- [ ] Node.js 설치 확인 (`node --version` 명령어로 확인)
- [ ] 프로젝트 폴더 준비 완료

---

## 1단계: Git 초기화 및 GitHub 연결

### 1-1. Git 설치 확인

터미널(또는 PowerShell)에서 확인:
```bash
git --version
```

Git이 설치되어 있지 않다면: https://git-scm.com/downloads 에서 다운로드

### 1-2. 프로젝트 폴더로 이동

```bash
cd C:\Users\BSJ\Desktop\developer-portfolio
```

### 1-3. Git 초기화

```bash
git init
```

### 1-4. .gitignore 파일 확인

프로젝트 루트에 `.gitignore` 파일이 있는지 확인합니다. 없으면 생성:

```bash
# .gitignore 파일 내용
node_modules/
.next/
.env.local
.env*.local
.DS_Store
*.log
```

### 1-5. 모든 파일 추가

```bash
git add .
```

### 1-6. 첫 커밋 생성

```bash
git commit -m "Initial commit: Portfolio website"
```

### 1-7. GitHub 저장소 생성

1. https://github.com 접속
2. 우측 상단 "+" 버튼 클릭 > "New repository"
3. Repository name 입력 (예: `tong2-portfolio`)
4. Description 입력 (선택사항)
5. Public 선택 (무료로 사용하려면 Public 권장)
6. "Create repository" 클릭

### 1-8. GitHub 저장소 연결

GitHub에서 생성된 저장소 페이지에서 표시되는 명령어를 사용하거나:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

예시:
```bash
git remote add origin https://github.com/tong2/tong2-portfolio.git
```

### 1-9. 코드 업로드 (Push)

```bash
git branch -M main
git push -u origin main
```

**주의**: GitHub 인증이 필요할 수 있습니다.
- Personal Access Token 사용 권장
- 또는 GitHub Desktop 사용

---

## 2단계: Vercel 계정 생성 및 프로젝트 연결

### 2-1. Vercel 가입

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. "Continue with GitHub" 선택 (GitHub 계정으로 로그인 권장)
4. GitHub 계정 인증

### 2-2. 새 프로젝트 생성

1. Vercel 대시보드에서 "Add New..." 클릭
2. "Project" 선택
3. "Import Git Repository" 선택
4. GitHub 저장소 목록에서 방금 업로드한 저장소 선택
5. "Import" 클릭

### 2-3. 프로젝트 설정

Vercel이 자동으로 Next.js 프로젝트를 감지합니다. 확인사항:

#### Framework Preset
- ✅ Next.js (자동 감지됨)

#### Root Directory
- `./` (기본값, 변경 불필요)

#### Build Command
- `npm run build` (자동 설정됨)

#### Output Directory
- `.next` (자동 설정됨)

#### Install Command
- `npm install` (자동 설정됨)

### 2-4. 환경 변수 설정 (선택사항)

관리자 페이지를 사용한다면 환경 변수 추가:

1. "Environment Variables" 섹션 클릭
2. 다음 변수 추가:

```
ADMIN_ID = your_admin_id
ADMIN_PASSWORD = your_admin_password
```

**주의**: 실제 관리자 아이디와 비밀번호를 입력하세요.

### 2-5. 배포 시작

1. "Deploy" 버튼 클릭
2. 빌드 진행 상황 확인 (약 2-5분 소요)
3. 배포 완료 대기

---

## 3단계: 배포 확인

### 3-1. 배포 완료 확인

배포가 완료되면:
- ✅ "Congratulations!" 메시지 표시
- ✅ 프로젝트 URL 자동 생성됨

### 3-2. 생성된 URL 확인

예시:
```
https://tong2-portfolio-abc123.vercel.app
```

이 URL로 접속하면 사이트가 정상적으로 작동하는지 확인할 수 있습니다.

### 3-3. 사이트 테스트

1. 생성된 URL로 접속
2. 홈페이지가 정상적으로 로드되는지 확인
3. 관리자 페이지 접속 테스트 (`/admin`)
4. 이미지가 정상적으로 표시되는지 확인
5. API가 정상 작동하는지 확인

---

## 4단계: 자동 배포 설정 확인

### 4-1. 자동 배포 활성화

기본적으로 자동 배포가 활성화되어 있습니다:
- GitHub에 코드를 Push하면 자동으로 재배포됩니다
- Pull Request를 생성하면 Preview 배포가 생성됩니다

### 4-2. 배포 알림 설정 (선택사항)

1. 프로젝트 Settings > Notifications
2. 이메일 알림 설정 가능

---

## 5단계: 나중에 도메인 연결하기

### 5-1. 도메인 구매

#### 추천 도메인 구매 사이트:

1. **Namecheap** (https://www.namecheap.com)
   - 가격: $8.88/년부터 (.com)
   - 사용하기 쉬움

2. **GoDaddy** (https://www.godaddy.com)
   - 가격: $11.99/년부터 (.com)
   - 한국어 지원

3. **Cloudflare Registrar** (https://www.cloudflare.com/products/registrar)
   - 가격: $8.57/년 (.com, 원가)
   - 가장 저렴

4. **가비아** (한국, https://www.gabia.com)
   - .co.kr: 약 ₩15,000/년
   - 한국어 지원

#### 도메인 구매 단계:

1. 원하는 도메인 이름 검색 (예: `tong2.com`)
2. 사용 가능 여부 확인
3. 장바구니에 추가
4. 결제 완료

### 5-2. Vercel에 도메인 추가

1. Vercel 대시보드에서 프로젝트 선택
2. Settings 탭 클릭
3. 왼쪽 메뉴에서 "Domains" 선택
4. "Add Domain" 버튼 클릭
5. 구매한 도메인 입력 (예: `tong2.com`)
6. "Add" 클릭

### 5-3. DNS 설정

Vercel이 DNS 설정 방법을 안내합니다.

#### 방법 1: Vercel 네임서버 사용 (추천)

1. 도메인 제공업체(예: Namecheap)에 로그인
2. 도메인 관리 페이지로 이동
3. "Nameservers" 또는 "DNS" 설정 찾기
4. Vercel이 제공하는 네임서버로 변경:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

5. 저장 후 24-48시간 대기 (보통 몇 분 내 완료)

#### 방법 2: DNS 레코드 직접 추가

도메인 제공업체에서 DNS 레코드를 직접 추가:

**A 레코드 (루트 도메인용)**:
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto (또는 3600)
```

**CNAME 레코드 (www 서브도메인용)**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto (또는 3600)
```

### 5-4. SSL 인증서 자동 발급

- Vercel이 자동으로 HTTPS 인증서를 발급합니다
- DNS 설정이 완료되면 몇 분 내에 자동 적용됩니다
- "Valid" 상태가 되면 완료입니다

### 5-5. 도메인 연결 확인

1. 브라우저에서 `tong2.com` 접속
2. 사이트가 정상적으로 로드되는지 확인
3. HTTPS가 적용되었는지 확인 (주소창에 자물쇠 아이콘)

---

## 6단계: 서브도메인 추가 (선택사항)

여러 프로젝트를 하나의 도메인으로 관리하려면:

### 예시:
- `tong2.com` → 메인 포트폴리오
- `blog.tong2.com` → 블로그
- `admin.tong2.com` → 관리자 페이지

### 설정 방법:

1. Vercel 프로젝트 Settings > Domains
2. "Add Domain" 클릭
3. 서브도메인 입력 (예: `blog.tong2.com`)
4. DNS 설정:
   - Type: CNAME
   - Name: blog
   - Value: cname.vercel-dns.com

---

## 7단계: 문제 해결

### 문제 1: 빌드 실패

**증상**: 배포가 실패하고 에러 메시지 표시

**해결 방법**:
1. Vercel 대시보드에서 "Deployments" 탭 확인
2. 실패한 배포 클릭하여 로그 확인
3. 로컬에서 빌드 테스트:
   ```bash
   npm run build
   ```
4. 에러 수정 후 다시 Push

### 문제 2: 이미지가 표시되지 않음

**해결 방법**:
1. 이미지 경로 확인 (`/public/` 폴더의 파일은 `/`로 시작)
2. Next.js Image 컴포넌트 사용 확인
3. `next.config.mjs`에서 이미지 설정 확인

### 문제 3: API가 작동하지 않음

**해결 방법**:
1. API 라우트 경로 확인 (`/api/...`)
2. Vercel Functions 로그 확인
3. 환경 변수 설정 확인

### 문제 4: 도메인이 연결되지 않음

**해결 방법**:
1. DNS 설정이 올바른지 확인 (24-48시간 대기)
2. DNS 전파 확인: https://www.whatsmydns.net 사용
3. Vercel의 도메인 설정 페이지에서 에러 메시지 확인

---

## 8단계: 코드 업데이트 및 재배포

### 8-1. 로컬에서 코드 수정

```bash
# 코드 수정 후
git add .
git commit -m "Update: 설명을 추가"
git push origin main
```

### 8-2. 자동 재배포 확인

1. GitHub에 Push하면 자동으로 Vercel이 재배포 시작
2. Vercel 대시보드에서 배포 진행 상황 확인
3. 배포 완료 후 자동으로 사이트 업데이트됨

---

## 9단계: 프로덕션 환경 확인

### 9-1. 환경 변수 확인

프로덕션 환경에서만 필요한 환경 변수가 있다면:
1. Vercel 프로젝트 Settings > Environment Variables
2. Production 환경에 변수 추가

### 9-2. 성능 모니터링

Vercel Analytics 사용 (무료 플랜 포함):
1. 프로젝트 Settings > Analytics
2. 활성화하면 방문자 통계 확인 가능

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Git 초기화 완료
- [ ] GitHub에 코드 업로드 완료
- [ ] Vercel 계정 생성 완료
- [ ] 프로젝트 연결 완료
- [ ] 빌드 성공 확인
- [ ] 사이트 정상 작동 확인
- [ ] 관리자 페이지 접속 확인
- [ ] (선택) 도메인 구매 완료
- [ ] (선택) 도메인 연결 완료
- [ ] (선택) SSL 인증서 발급 확인

---

## 🔗 유용한 링크

- Vercel 대시보드: https://vercel.com/dashboard
- Vercel 문서: https://vercel.com/docs
- GitHub: https://github.com
- DNS 전파 확인: https://www.whatsmydns.net

---

## 💡 팁

1. **자동 배포 활용**: 코드를 수정할 때마다 자동으로 배포되므로 수동 작업 불필요
2. **Preview 배포**: Pull Request를 만들면 Preview URL이 자동 생성되어 테스트 가능
3. **환경 변수**: 민감한 정보는 환경 변수로 관리
4. **도메인 관리**: 여러 프로젝트를 하나의 도메인으로 관리 가능 (서브도메인 사용)

---

## ❓ 자주 묻는 질문

### Q: 무료 플랜으로 충분한가요?
A: 개인 포트폴리오 사이트라면 무료 플랜으로 충분합니다. 월 100GB 트래픽과 100시간 빌드 시간이 제공됩니다.

### Q: 도메인을 나중에 추가할 수 있나요?
A: 네, 언제든지 도메인을 추가할 수 있습니다. 배포 후에도 도메인을 연결할 수 있습니다.

### Q: 여러 프로젝트를 하나의 도메인으로 관리할 수 있나요?
A: 네, 서브도메인을 사용하면 가능합니다. 예: `tong2.com`, `blog.tong2.com`, `shop.tong2.com`

### Q: 코드를 수정하면 자동으로 업데이트되나요?
A: 네, GitHub에 Push하면 자동으로 재배포됩니다.

---

## 📞 문제 발생 시

1. Vercel 대시보드의 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. 로컬에서 빌드 테스트 (`npm run build`)
4. Vercel 커뮤니티 포럼: https://github.com/vercel/vercel/discussions

---

**작성일**: 2025년 1월
**프로젝트**: Tong2 Portfolio
**버전**: 1.0

