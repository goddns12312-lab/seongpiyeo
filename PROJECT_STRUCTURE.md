# 프로젝트 파일 구조 및 설명

## 설정 파일 (root)

```
package.json              # 프로젝트 의존성 및 스크립트
.env.example             # 환경변수 템플릿
tsconfig.json            # TypeScript 설정
tsconfig.node.json       # TypeScript (node) 설정
tailwind.config.ts       # TailwindCSS 설정
next.config.ts           # Next.js 설정
postcss.config.js        # PostCSS 설정
ecosystem.config.js      # PM2 설정
.gitignore               # Git 무시 파일
README.md                # 프로젝트 소개
DEPLOYMENT.md            # 배포 가이드
PROJECT_STRUCTURE.md     # 이 파일
```

## 소스 코드 (src/)

### App Routes (src/app/)

#### 인증 페이지 (src/app/(auth)/)
```
(auth)/
├── login/
│   └── page.tsx          # 로그인 페이지
└── register/
    └── page.tsx          # 회원가입 페이지
```

#### 매물 (src/app/listings/)
```
listings/
├── page.tsx              # 매물 목록 (전체, 필터링)
├── new/
│   └── page.tsx          # 매물 등록 페이지
├── [id]/
│   └── page.tsx          # 매물 상세 페이지 (동적 메타태그)
└── region/
    └── [region]/
        └── page.tsx      # 지역별 매물 페이지 (SEO)
```

#### 커뮤니티 (src/app/community/)
```
community/
├── page.tsx              # 게시판 목록 (카테고리별)
├── new/
│   └── page.tsx          # 게시글 작성 페이지
└── [id]/
    └── page.tsx          # 게시글 상세 페이지
```

#### 마이페이지 (src/app/mypage/)
```
mypage/
└── page.tsx              # 사용자 프로필, 매물, 게시글 관리
```

#### 관리자 (src/app/admin/)
```
admin/
├── page.tsx              # 관리자 대시보드
├── listings/
│   └── page.tsx          # 매물 승인/관리
├── posts/
│   └── page.tsx          # 게시글 관리
├── users/
│   └── page.tsx          # 회원 관리
└── banners/
    └── page.tsx          # 배너 관리
```

#### 루트 및 SEO
```
layout.tsx               # 루트 레이아웃 (Header, Footer)
page.tsx                 # 메인 홈페이지
sitemap.ts              # SEO sitemap 생성
robots.ts               # SEO robots.txt
globals.css             # 글로벌 CSS + Tailwind
```

### Components (src/components/)

#### UI 컴포넌트 (src/components/ui/)
```
ui/
├── Button.tsx           # 기본 버튼 컴포넌트
└── Badge.tsx            # 뱃지/태그 컴포넌트
```

#### 레이아웃 컴포넌트 (src/components/layout/)
```
layout/
├── Header.tsx           # 상단 네비게이션 + 모바일 메뉴
└── Footer.tsx           # 하단 푸터
```

#### 매물 컴포넌트 (src/components/listings/)
```
listings/
├── ListingCard.tsx      # 매물 카드 (목록용)
├── ListingGrid.tsx      # 매물 그리드 레이아웃
└── ListingForm.tsx      # 매물 등록/수정 폼 (이미지 업로드)
```

#### 커뮤니티 컴포넌트 (src/components/community/)
```
community/
├── PostCard.tsx         # 게시글 카드
└── CommentSection.tsx   # 댓글 섹션 (작성 + 목록)
```

### Utilities (src/lib/)

#### Supabase 클라이언트 (src/lib/supabase/)
```
supabase/
├── client.ts            # 브라우저용 Supabase 클라이언트
└── server.ts            # 서버용 Supabase 클라이언트
```

#### 유틸리티 함수
```
utils.ts                 # formatPrice, formatDate, slugify 등
```

### 타입 정의 (src/types/)
```
index.ts                 # TypeScript 타입 정의
                         # - Profile, Listing, Post, Comment, Banner
                         # - REGIONS, CATEGORY_LABELS, PRICE_TYPE_LABELS
```

### 데이터베이스 (supabase/)
```
schema.sql               # Supabase 테이블 정의 및 RLS 정책
```

## 파일별 주요 기능

### 페이지 파일 (page.tsx)

| 파일 | 기능 | 인증 | 역할 |
|------|------|------|------|
| `/page.tsx` | 홈 페이지 | 불필요 | 최신매물, 배너, 통계 |
| `/listings/page.tsx` | 매물 목록 | 불필요 | 전체 매물 + 지역 필터 |
| `/listings/new/page.tsx` | 매물 등록 | 필수 | 사용자 |
| `/listings/[id]/page.tsx` | 매물 상세 | 불필요 | 모두 |
| `/listings/region/[region]/page.tsx` | 지역별 매물 | 불필요 | SEO |
| `/community/page.tsx` | 게시판 | 불필요 | 카테고리별 게시글 |
| `/community/new/page.tsx` | 게시글 작성 | 필수 | 사용자 |
| `/community/[id]/page.tsx` | 게시글 상세 | 불필요 | 모두 |
| `/mypage/page.tsx` | 마이페이지 | 필수 | 사용자 |
| `/admin/page.tsx` | 관리자 대시보드 | 필수 | 관리자 |
| `/admin/listings/page.tsx` | 매물 관리 | 필수 | 관리자 |
| `/admin/posts/page.tsx` | 게시글 관리 | 필수 | 관리자 |
| `/admin/users/page.tsx` | 회원 관리 | 필수 | 관리자 |
| `/admin/banners/page.tsx` | 배너 관리 | 필수 | 관리자 |
| `/(auth)/login/page.tsx` | 로그인 | 불필요 | 비회원 |
| `/(auth)/register/page.tsx` | 회원가입 | 불필요 | 비회원 |

## 컴포넌트 재사용 흐름

```
Button (UI)
└─ ListingForm, CommentSection, Header 등 모든 폼에서 사용

Badge (UI)
└─ ListingCard, PostCard, Header 등에서 사용

Header (Layout)
└─ layout.tsx에 포함 (모든 페이지에 표시)

Footer (Layout)
└─ layout.tsx에 포함 (모든 페이지 하단)

ListingCard → ListingGrid
└─ /listings, /listings/region/[region], /mypage에서 사용

ListingForm
└─ /listings/new에서 사용

PostCard
└─ /community, /mypage에서 사용

CommentSection
└─ /community/[id]에서 사용
```

## 데이터 흐름

### 매물 (Listings)

```
사용자가 /listings/new 접속
  ↓
ListingForm 렌더링
  ↓
사용자 입력 → 이미지 업로드 (Supabase Storage)
  ↓
listings 테이블에 INSERT (status: 'pending')
  ↓
관리자가 /admin/listings에서 승인
  ↓
status → 'active'
  ↓
/listings, /listings/region/[region] 목록에 표시
  ↓
사용자가 클릭 → /listings/[id] 상세페이지
```

### 게시글 (Posts)

```
사용자가 /community/new 접속
  ↓
폼 작성 및 제출
  ↓
posts 테이블에 INSERT (status: 'active')
  ↓
/community 목록에 즉시 표시
  ↓
사용자가 클릭 → /community/[id] 상세페이지
  ↓
CommentSection에서 댓글 작성 (comments 테이블)
```

## 환경변수 목록

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase 익명 키 (공개 가능)
SUPABASE_SERVICE_ROLE_KEY         # Supabase 서비스 역할 키 (비공개!)
NEXT_PUBLIC_BASE_URL              # 배포된 서버 URL (SEO 용)
```

## Supabase 테이블

### profiles (사용자)
- id, email, nickname, phone, role, created_at

### listings (매물)
- id, user_id, title, description, price_type, price, deposit, monthly_rent
- region, district, address, area_sqm, pc_count, monthly_revenue, monthly_profit
- status, view_count, created_at, updated_at

### listing_images (매물 이미지)
- id, listing_id, url, is_primary, order_num, created_at

### posts (게시글)
- id, user_id, category, title, content, view_count, status, created_at, updated_at

### comments (댓글)
- id, post_id, user_id, content, status, created_at, updated_at

### banners (배너)
- id, title, image_url, link_url, position, is_active, order_num, created_at

## 주요 라이브러리

- **@supabase/supabase-js**: 데이터베이스 + 스토리지 + 인증
- **@supabase/auth-helpers-nextjs**: Next.js용 인증 헬퍼
- **next**: 웹 프레임워크
- **react**: UI 라이브러리
- **tailwindcss**: CSS 프레임워크

## 배포 과정

1. **로컬 개발**: `npm run dev`
2. **빌드**: `npm run build`
3. **PM2 시작**: `pm2 start ecosystem.config.js`
4. **Nginx 설정**: 3000 포트 프록시
5. **접속**: http://185.100.85.208
