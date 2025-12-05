# 배포 가이드 (Deployment Guide)

포트폴리오 사이트를 배포하는 방법을 안내합니다.

## 🚀 추천 배포 플랫폼

### 1. Vercel (가장 추천) ⭐
Next.js를 만든 회사이므로 가장 간단하고 최적화되어 있습니다.

#### 배포 단계:

1. **GitHub에 코드 업로드**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Vercel 가입 및 배포**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인
   - "New Project" 클릭
   - GitHub 저장소 선택
   - 자동으로 빌드 설정 감지됨
   - "Deploy" 클릭

3. **도메인 연결**
   - Vercel 대시보드에서 프로젝트 선택
   - Settings > Domains
   - 구매한 도메인 입력
   - DNS 설정 안내에 따라 도메인 제공업체에서 설정

#### Vercel 장점:
- ✅ 무료 플랜 제공 (개인 프로젝트용)
- ✅ 자동 HTTPS
- ✅ 자동 배포 (Git push 시)
- ✅ Next.js 최적화
- ✅ 글로벌 CDN

---

### 2. Netlify

#### 배포 단계:

1. **GitHub에 코드 업로드** (위와 동일)

2. **Netlify 배포**
   - https://netlify.com 접속
   - GitHub 계정으로 로그인
   - "Add new site" > "Import an existing project"
   - GitHub 저장소 선택
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - "Deploy site" 클릭

3. **도메인 연결**
   - Site settings > Domain management
   - "Add custom domain" 클릭
   - 구매한 도메인 입력

---

### 3. 기타 옵션

- **AWS Amplify**: AWS 사용 시
- **Cloudflare Pages**: 빠른 CDN
- **Railway**: 간단한 배포
- **Render**: 무료 플랜 제공

---

## 📋 배포 전 체크리스트

### 1. 환경 변수 확인
현재 프로젝트는 환경 변수가 필요하지 않지만, 향후 추가 시:
- `.env.local` 파일 생성 (로컬 개발용)
- `.env.example` 파일 생성 (예시)
- 배포 플랫폼에서 환경 변수 설정

### 2. 빌드 테스트
```bash
npm run build
npm start
```
빌드가 성공하고 프로덕션 모드로 실행되는지 확인

### 3. 파일 업로드 경로 확인
- 현재: `/public/uploads/`, `/public/resume/` 사용
- 배포 시: 파일 업로드는 서버 파일 시스템에 저장됨
- **주의**: Vercel은 서버리스이므로 파일 업로드가 제한될 수 있음
  - 해결책: AWS S3, Cloudinary 등 외부 스토리지 사용 권장

### 4. API 라우트 확인
- `/api/portfolio` - 포트폴리오 데이터 읽기 ✅
- `/api/portfolio/update` - 포트폴리오 데이터 업데이트 ✅
- `/api/upload` - 이미지 업로드 ⚠️ (서버리스 환경에서 제한적)
- `/api/upload/resume` - 이력서 업로드 ⚠️ (서버리스 환경에서 제한적)

---

## 🔧 파일 업로드 문제 해결

### 문제: Vercel/Netlify는 서버리스 환경이라 파일 업로드가 제한됨

### 해결 방법:

#### 옵션 1: Cloudinary 사용 (추천)
이미지 업로드를 Cloudinary로 변경

#### 옵션 2: AWS S3 사용
파일을 S3에 저장

#### 옵션 3: VPS 사용
- DigitalOcean, AWS EC2 등
- Node.js 서버 직접 운영
- 파일 시스템 사용 가능

---

## 🌐 도메인 구매 및 연결

### 도메인 구매 사이트:
- **Namecheap**: https://www.namecheap.com
- **GoDaddy**: https://www.godaddy.com
- **Google Domains**: https://domains.google
- **Cloudflare**: https://www.cloudflare.com/products/registrar

### 도메인 연결 방법 (Vercel 기준):

1. **Vercel에서 도메인 추가**
   - 프로젝트 > Settings > Domains
   - 구매한 도메인 입력

2. **DNS 설정**
   - 도메인 제공업체의 DNS 설정으로 이동
   - Vercel이 제공하는 DNS 레코드 추가:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

3. **SSL 인증서**
   - Vercel이 자동으로 HTTPS 인증서 발급
   - 몇 분 내에 완료됨

---

## 📝 배포 후 확인사항

1. ✅ 홈페이지가 정상적으로 로드되는가?
2. ✅ 이미지가 정상적으로 표시되는가?
3. ✅ API 라우트가 작동하는가?
4. ✅ 관리자 페이지가 접근 가능한가?
5. ✅ 파일 업로드가 작동하는가? (서버리스 환경에서는 제한적)

---

## 🆘 문제 해결

### 빌드 에러 발생 시:
```bash
# 로컬에서 빌드 테스트
npm run build

# 에러 메시지 확인 및 수정
```

### 이미지가 표시되지 않을 때:
- 이미지 경로 확인 (`/public/` 폴더의 파일은 `/`로 시작)
- Next.js Image 컴포넌트 사용 확인

### API 라우트가 작동하지 않을 때:
- Vercel Functions 로그 확인
- 환경 변수 설정 확인

---

## 💡 추가 팁

1. **성능 최적화**
   - 이미지 최적화 (Next.js Image 컴포넌트 사용)
   - 코드 분할 (자동 적용됨)

2. **보안**
   - 관리자 페이지에 인증 추가 권장
   - API 라우트에 rate limiting 추가 고려

3. **모니터링**
   - Vercel Analytics 사용
   - 에러 추적 도구 추가 (Sentry 등)

---

## 📞 도움이 필요하시면

배포 중 문제가 발생하면:
1. 빌드 로그 확인
2. 브라우저 콘솔 확인
3. 네트워크 탭 확인
4. Vercel/Netlify 로그 확인

