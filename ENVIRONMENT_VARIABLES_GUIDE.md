# 환경변수 설정 가이드

## 📋 변수 요약표

| 변수명 | 값 | 클라이언트 | 서버 | 설명 |
|--------|-----|----------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your_project.supabase.co` | ✅ | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_your_anon_key` | ✅ | ✅ | Supabase 공개 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key` | ❌ | ✅ | Supabase 서버 키 (비밀) |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3002` (로컬) | ✅ | ✅ | 배포 도메인 |

---

## 1️⃣ Supabase 환경변수

### NEXT_PUBLIC_SUPABASE_URL
```
https://your_project.supabase.co
```
- **용도**: 모든 Supabase API 요청
- **로컬**: `.env.local`에 포함
- **Vercel**: Environment Variables → Production, Preview, Development 모두에 추가
- **접근성**: 클라이언트와 서버 모두 사용

### NEXT_PUBLIC_SUPABASE_ANON_KEY
```
sb_publishable_your_anon_key
```
- **용도**: 클라이언트 Supabase 인증 및 API 호출
- **로컬**: `.env.local`에 포함
- **Vercel**: Environment Variables → Production, Preview, Development 모두에 추가
- **접근성**: 클라이언트와 서버 모두 사용
- **보안**: 이 키는 공개 키이므로 노출되어도 괜찮음 (RLS 정책으로 보호)

### SUPABASE_SERVICE_ROLE_KEY ⚠️
```
your_service_role_key
```
- **용도**: 서버에서만 RLS 정책 우회하여 데이터 관리
- **로컬**: `.env.local`에 포함
- **Vercel**: Environment Variables → **Production만** 체크
  - Preview나 Development에는 추가하지 않음
- **접근성**: 서버에서만 사용 (`/api/` routes, SSR pages)
- **보안**: 🔴 매우 중요 - 클라이언트에 노출되면 안 됨!

**사용 위치 (안전함):**
- `/api/upload-job-image/route.ts` (서버 API)
- `/api/jobs/create/route.ts` (서버 API)
- `/jobs/[slug]/page.tsx` (서버 컴포넌트 조회수 증가)

---

## 2️⃣ 배포 도메인 환경변수

### NEXT_PUBLIC_BASE_URL

#### 로컬 개발
```
http://localhost:3002
```

#### Vercel 배포 (예시)
```
https://pc365.vercel.app
```
또는 커스텀 도메인 연결 후:
```
https://pc365.example.com
```

**설정 위치:**
1. Vercel Dashboard → Project Settings
2. Environment Variables → `NEXT_PUBLIC_BASE_URL`
3. Value: 배포 URL 입력
4. Scopes: Production, Preview, Development 모두 체크

**사용처:**
- OG 메타 태그 (소셜 미디어 공유)
- Sitemap, robots.txt
- 이메일 링크
- 리다이렉트 URL

---

## 3️⃣ 크롤러 환경변수 (선택사항)

### CRAWL_BASE_URL
```
https://www.xn--3e0b036btifksj.com
```

### CRAWL_LOGIN_URL
```
https://www.xn--3e0b036btifksj.com/
```

### CRAWL_LIST_URL
```
https://www.xn--3e0b036btifksj.com/40/
```

### CRAWL_LIST_FILTERED_URL
```
https://www.xn--3e0b036btifksj.com/40/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9&page=1
```

**설정 위치:**
- **로컬**: `.env.local`에 포함 (필수)
- **Vercel**: 추가 불필요 (로컬 스크립트에서만 사용)

**사용처:**
- `scripts/auto-sync.js` (크롤링 자동화)
- `scripts/run-scraper.js` (수동 크롤링)

**주의:**
- Vercel 서버리스 함수에서는 실행 불가 (10초 제한 초과)
- 로컬 Windows에서만 실행 가능

---

## 4️⃣ Vercel 환경변수 설정 단계

### Step 1: Vercel Dashboard 접속
```
https://vercel.com → 프로젝트 선택 → Settings
```

### Step 2: Environment Variables로 이동
```
Settings → Environment Variables
```

### Step 3: 변수 추가

#### 공개 변수 (NEXT_PUBLIC_*)
```
변수명: NEXT_PUBLIC_SUPABASE_URL
값: https://your_project.supabase.co
스코프: Production, Preview, Development (모두 체크)
```

```
변수명: NEXT_PUBLIC_SUPABASE_ANON_KEY
값: sb_publishable_your_anon_key
스코프: Production, Preview, Development (모두 체크)
```

```
변수명: NEXT_PUBLIC_BASE_URL
값: https://your-domain.com (배포 URL로 변경)
스코프: Production, Preview, Development (모두 체크)
```

#### 비밀 변수 (서버만)
```
변수명: SUPABASE_SERVICE_ROLE_KEY
값: your_service_role_key
스코프: Production만 체크 ⚠️ (Preview/Development 체크 해제)
```

### Step 4: 변수 확인
- 모든 변수가 리스트에 표시됨
- 각 변수의 스코프 확인
- Save 또는 자동 저장됨

---

## 5️⃣ 환경별 변수 적용 방식

### 로컬 개발 (npm run dev)
```
.env.local 파일 읽음
↓
localhost:3002에서 실행
```

파일 예시:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3002
CRAWL_BASE_URL=https://www.xn--3e0b036btifksj.com
```

### Vercel Preview (PR/Branch 배포)
```
GitHub → Push to branch
↓
Vercel이 자동 감지
↓
Environment Variables (Preview 스코프) 적용
↓
https://[branch]-[project].vercel.app 배포
```

스코프 설정:
- `NEXT_PUBLIC_*`: Preview ✅
- `SUPABASE_SERVICE_ROLE_KEY`: Preview ❌ (체크 해제)

### Vercel Production (Main 배포)
```
GitHub main → Push
↓
Vercel이 자동 감지
↓
Environment Variables (Production 스코프) 적용
↓
https://pc365.vercel.app (또는 커스텀 도메인) 배포
```

스코프 설정:
- `NEXT_PUBLIC_*`: Production ✅
- `SUPABASE_SERVICE_ROLE_KEY`: Production ✅

---

## 6️⃣ SERVICE_ROLE_KEY 보안 체크

### ✅ 안전한 사용 위치

**API Routes** (서버에서만 실행)
```typescript
// src/app/api/upload-job-image/route.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ✅ 안전
);
```

**Server Components** (서버에서 렌더링)
```typescript
// src/app/jobs/[slug]/page.tsx
export default async function JobDetailPage() {
  const supabase = createServerClient(...);
  const { data } = await supabase.from('jobs').select(...);
  // ✅ 안전 (클라이언트에 전송 안 됨)
}
```

### ❌ 위험한 사용 위치

**Client Components**
```typescript
'use client';
// ❌ 절대 사용 금지!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // 🔴 브라우저에 노출됨!
);
```

**환경변수 직접 노출**
```typescript
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);  // ❌ 로그에 노출
```

---

## 7️⃣ 트러블슈팅

### "SUPABASE_SERVICE_ROLE_KEY is undefined" 에러

**원인:**
- Vercel Environment Variables에 추가 안 됨
- 스코프가 잘못 설정됨

**해결:**
1. Vercel Dashboard → Settings → Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 확인
3. Production 스코프만 체크되어 있는지 확인
4. 재배포 (Redeploy)

### "RLS policy error" (로컬에서는 작동, Vercel에서는 안 됨)

**원인:**
- Supabase RLS 정책이 로컬과 Vercel에서 다름
- 또는 SERVICE_ROLE_KEY가 Preview에만 적용됨

**해결:**
1. Supabase Dashboard → RLS 정책 확인
2. Vercel 환경변수 스코프 확인
3. 로컬 `.env.local`과 Vercel vars 내용 일치 확인

### "API request failed" on Vercel

**원인:**
- `NEXT_PUBLIC_SUPABASE_URL` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 누락
- 또는 잘못된 값

**확인:**
1. Vercel Logs (Deployments → 배포 선택 → Logs)
2. 환경변수 값 확인
3. 로컬에서 동일한 값으로 테스트

---

## 8️⃣ 환경변수 검증 스크립트

다음 명령으로 환경변수가 올바르게 설정되었는지 확인할 수 있습니다:

```bash
# 로컬에서 확인
node -e "
console.log('로컬 환경변수 확인:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL ? '✅' : '❌');
"
```

---

## 9️⃣ 환경변수 복사-붙여넣기 용

### Vercel Dashboard에 한 번에 추가할 변수 목록

```
🔓 공개 변수 (Public - 모든 환경에서)

NEXT_PUBLIC_SUPABASE_URL
https://your_project.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
sb_publishable_your_anon_key

NEXT_PUBLIC_BASE_URL
https://your-domain.com

---

🔐 비밀 변수 (Production만)

SUPABASE_SERVICE_ROLE_KEY
your_service_role_key
```

---

## 🔟 최종 체크리스트

- [ ] Supabase 프로젝트 정보 확인
  - [ ] Project URL 복사됨
  - [ ] Anon Key 복사됨
  - [ ] Service Role Key 복사됨 (안전하게 보관)

- [ ] 로컬 `.env.local` 작성
  - [ ] `.env.local` 파일 생성
  - [ ] 4개 변수 추가
  - [ ] `.gitignore`에 포함되어 있는지 확인

- [ ] Vercel 환경변수 설정
  - [ ] 3개 공개 변수 추가 (모든 환경)
  - [ ] 1개 비밀 변수 추가 (Production만)
  - [ ] 각 변수의 스코프 확인

- [ ] 배포 후 확인
  - [ ] Vercel Logs에서 에러 확인
  - [ ] API 요청 정상 작동 확인
  - [ ] 로그인 기능 작동 확인
  - [ ] 파일 업로드 작동 확인

