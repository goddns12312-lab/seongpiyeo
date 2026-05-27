# PC방거래 - 성인 PC방 매매 커뮤니티 플랫폼

Next.js App Router + Supabase 기반 성인 PC방 매매 커뮤니티 플랫폼 MVP입니다.

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **백엔드**: Supabase (Auth, Database, Storage)
- **배포**: PM2 + Nginx
- **데이터베이스**: PostgreSQL (Supabase 제공)

## 프로젝트 구조

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   │   ├── login/
│   │   └── register/
│   ├── listings/            # 매물 관련
│   │   ├── page.tsx         # 전체 매물 목록
│   │   ├── new/             # 매물 등록
│   │   ├── [id]/            # 매물 상세
│   │   └── region/[region]/ # 지역별 매물
│   ├── community/           # 커뮤니티 게시판
│   │   ├── page.tsx         # 게시판 목록
│   │   ├── new/             # 게시글 작성
│   │   └── [id]/            # 게시글 상세
│   ├── mypage/              # 마이페이지
│   ├── admin/               # 관리자 페이지
│   │   ├── listings/
│   │   ├── posts/
│   │   ├── users/
│   │   └── banners/
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 메인 페이지
│   ├── sitemap.ts           # SEO
│   └── robots.ts            # SEO
├── components/              # React 컴포넌트
│   ├── ui/                  # 기본 UI 컴포넌트
│   ├── layout/              # 레이아웃 컴포넌트
│   ├── listings/            # 매물 컴포넌트
│   └── community/           # 커뮤니티 컴포넌트
├── lib/                     # 유틸리티
│   ├── supabase/            # Supabase 클라이언트
│   └── utils.ts             # 헬퍼 함수
├── types/                   # TypeScript 타입 정의
└── globals.css              # 글로벌 스타일
```

## 초기 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 내용을 입력합니다:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=http://185.100.85.208
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL 에디터에서 `supabase/schema.sql` 실행
3. Storage에서 `listings` bucket 생성 (Public으로 설정)
4. Auth 설정에서 Site URL과 Redirect URL 설정:
   - Site URL: `http://185.100.85.208`
   - Redirect URLs: `http://185.100.85.208/**`

### 3. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 4. 빌드

```bash
npm run build
npm run start
```

## 배포 (서버에 배포)

### 1. 서버 준비

```bash
# Node.js와 npm 설치 확인
node --version
npm --version

# PM2 설치
npm install -g pm2
```

### 2. 프로젝트 클론 및 설정

```bash
# 서버에 프로젝트 클론
git clone <repository-url> /home/user/pc-bang-community
cd /home/user/pc-bang-community

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 수정 (Supabase 키 입력)

# 의존성 설치
npm install
```

### 3. Next.js 빌드 및 PM2로 실행

```bash
# 프로덕션 빌드
npm run build

# PM2로 시작
pm2 start ecosystem.config.js
pm2 save
```

### 4. Nginx 설정

```nginx
# /etc/nginx/sites-available/pc-bang
server {
    listen 80;
    server_name 185.100.85.208;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/pc-bang /etc/nginx/sites-enabled/

# Nginx 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 5. 시스템 재부팅 시 자동 시작

```bash
# PM2 startup 설정
pm2 startup
pm2 save

# 또는 systemd 서비스 생성
sudo nano /etc/systemd/system/pc-bang.service
```

## 주요 기능

### 사용자 기능
- ✅ 회원가입/로그인 (Supabase Auth)
- ✅ 매물 등록 (이미지 업로드 포함)
- ✅ 매물 검색 (지역별)
- ✅ 커뮤니티 게시판
- ✅ 게시글 작성 및 댓글
- ✅ 마이페이지

### 관리자 기능
- ✅ 매물 승인/삭제
- ✅ 게시글 관리
- ✅ 회원 관리
- ✅ 배너 관리

### SEO
- ✅ Next.js Metadata API
- ✅ Dynamic sitemap.xml
- ✅ robots.txt
- ✅ Open Graph
- ✅ 지역별 SEO URL
- ✅ 동적 메타태그

## 관리자 계정 생성

Supabase 대시보드에서 직접 프로필 업데이트:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## 커스터마이징

### 색상 테마 변경

`tailwind.config.ts`에서 colors 수정:

```ts
colors: {
  gold: '#c9a227',  // 여기 수정
}
```

### 지역 목록 추가

`src/types/index.ts`의 `REGIONS` 배열 수정.

### 카테고리 추가

`src/types/index.ts`의 `CATEGORY_LABELS` 객체 수정.

## 트러블슈팅

### Supabase 연결 오류

- URL과 Key 확인
- Supabase 프로젝트가 활성화되어 있는지 확인

### 이미지 업로드 오류

- Storage bucket 존재 여부 확인
- RLS 정책 확인

### 메타데이터 생성 오류

- Node.js 버전 확인 (14.0 이상)
- `npm run build` 재실행

## 성능 최적화

1. **이미지 최적화**
   - Supabase Storage에서 CDN 활용
   - Next.js Image 컴포넌트 사용 권장

2. **데이터베이스 최적화**
   - 인덱스 생성 (이미 schema.sql에 포함)
   - RLS 정책 활용

3. **캐싱**
   - Next.js 기본 캐싱 활용
   - ISR (Incremental Static Regeneration) 활용

## 보안 주의사항

1. 환경 변수는 `.env.local`에만 저장 (git 제외)
2. SUPABASE_SERVICE_ROLE_KEY는 서버에서만 사용
3. RLS 정책 정기적 검토
4. 관리자 계정 권한 제한

## 라이센스

MIT

## 지원

문제 발생 시 GitHub Issues 참고.
