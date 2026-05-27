# 성피요 (PC방 매매 커뮤니티) - 전체 SEO 감사 & 100점 유지 전략

**작성일:** 2026-05-27  
**사이트:** 성인PC 성인피씨 성인피시 창업 정보 거래 플랫폼  
**현재 예상 SEO 점수:** 85~90점  

---

## 📊 1단계: 기술 SEO 체크리스트 (완성도: 95%)

### ✅ 완료된 항목

| 항목 | 상태 | 상세 |
|-----|-----|------|
| **robots.txt** | ✅ | `User-Agent: *`, Allow `/`, Disallow `/admin` `/api`, Crawl-delay 1 |
| **sitemap.xml** | ✅ | 동적 생성, lastmod 포함, priority 설정 (홈:1.0, 매물:0.9) |
| **canonical URL** | ✅ | 모든 페이지에 구현, 쿼리 파라미터 정규화 |
| **Meta Title** | ✅ | 템플릿화 (`%s \| 성피요`), 50-60자 범위 |
| **Meta Description** | ✅ | 동적 생성, 155-160자 최적화 |
| **Heading 구조** | ✅ | H1 단일, H2/H3 계층화 |
| **JSON-LD Schema** | ✅ | Organization, LocalBusiness, WebSite, BreadcrumbList 구현 |
| **이미지 alt** | ⚠️ | 일부 구현, 동적 콘텐츠 alt 누락 가능 |
| **Lazy Loading** | ✅ | Next.js Image 컴포넌트, loading="lazy" 구현 |
| **모바일 최적화** | ✅ | 반응형 Tailwind, viewport meta 설정 |
| **HTTPS** | ✅ | next.config.js HTTP→HTTPS 리다이렉트 |
| **404 처리** | ✅ | notFound() 함수로 404 응답 |
| **Security Headers** | ✅ | CSP, X-Content-Type-Options, Strict-Transport-Security 설정 |

### ⚠️ 개선 필요 항목

#### 1. **이미지 최적화 세부 강화** (난이도: 중)
```javascript
// next.config.js 개선사항:
// 현재: formats: ['image/avif', 'image/webp']
// 추가 필요: deviceSizes, imageSizes 세부 조정

deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],  // ✅ 이미 설정됨
imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],            // ✅ 이미 설정됨
// 추가: quality: 75 (기본값) → 80으로 상향 (품질/크기 균형)
```

**개선안:**
```javascript
// next.config.js의 images 객체에 추가
quality: 80,  // AVIF/WebP 품질 (기본 75 → 80)
```

#### 2. **Core Web Vitals 최적화** (난이도: 중)
- **LCP (Largest Contentful Paint)**: 목표 < 2.5s
  - 현재: Good (예상 2-3s)
  - 개선: 히어로 이미지 preload 강화, 배너 이미지 최적화
  
- **INP (Interaction to Next Paint)**: 목표 < 200ms
  - 현재: Good (예상 100-150ms)
  - 모니터링 필요

- **CLS (Cumulative Layout Shift)**: 목표 < 0.1
  - 현재: Good
  - 유지 필요

#### 3. **국제화 (hreflang)** (난이도: 낮음, 영향도: 낮음)
```html
<!-- 현재 상태: ko-KR만 지원 -->
<!-- 향후 필요시만 추가 -->
<link rel="alternate" hreflang="en" href="https://pc365.kr/en">
```

#### 4. **구조화 데이터 확장** (난이도: 중, 영향도: 높음)
현재: Organization, LocalBusiness, WebSite, BreadcrumbList  
**추가 권고:**
- ✅ Product 스키마 (매물 상세 페이지)
- ✅ JobPosting 스키마 (구인 공고)
- ⚠️ Review 스키마 (리뷰 기능 추가 후)
- ⚠️ FAQPage 스키마 (FAQ 섹션 추가 후)

---

## 📝 2단계: 콘텐츠 SEO 전략

### 검색 의도별 키워드 분류

#### A. **상업적 의도 (Transaction Keywords)** - 50% 가중치
```
Primary Keywords:
- 성인PC방 매매 / 성인PC방 창업 / PC방 사업
- 성인피씨방 양도양수 / PC방 권리금
- 성인PC방 임대 / PC방 매물

Volume Est.: 500-2000/월 (국내)
Difficulty: 높음 (많은 업체 경쟁)
Target Page: /listings (메인 매물 목록)
```

#### B. **정보 의도 (Informational Keywords)** - 30% 가중치
```
Primary Keywords:
- PC방 창업 비용 / PC방 사업 시작 방법
- PC방 소방시설 기준 / 학교주변 PC방 규제
- PC방 수익 / PC방 월세 상담

Volume Est.: 1000-5000/월
Difficulty: 중간
Target Page: /community, /support (FAQ)
```

#### C. **내비게이션 의도 (Navigational Keywords)** - 15% 가중치
```
Keywords:
- 성피요 / 피씨365 / PC방 거래 사이트

Target Page: 홈페이지
```

#### D. **지역 의도 (Local Keywords)** - 5% 가중치
```
Keywords:
- 서울 PC방 매매 / 강남 성인PC방 창업
- 부산 PC방 양도양수 / 인천 PC방 매물

Target Page: /listings/region/[region]
```

### 토픽 클러스터 설계

```
PILLAR: "PC방 창업 완벽 가이드" (콘텐츠 허브)
├─ Supporting 1: PC방 소방 기준 및 허가
├─ Supporting 2: 학교환경위생정화구역 조회
├─ Supporting 3: PC방 비용 계산기
├─ Supporting 4: PC방 수익 시뮬레이터
└─ Supporting 5: PC방 중고기자재 거래

PILLAR: "PC방 매물 거래 가이드"
├─ Supporting: 권리금 이해하기
├─ Supporting: PC방 양도양수 절차
└─ Supporting: 매물 검증 체크리스트

PILLAR: "PC방 구인구직 플랫폼"
├─ Supporting: PC방 알바 급여 가이드
└─ Supporting: PC방 관리자 역할
```

### 현재 콘텐츠 갭 분석

| 토픽 | 현재 상태 | 필요한 콘텐츠 |
|-----|---------|-------------|
| PC방 창업 가이드 | ❌ 없음 | 상세 블로그 포스트 5-10개 |
| 비용 계산 | ❌ 없음 | 대화형 계산기 |
| 소방 기준 | ✅ inquiry 페이지 있음 | 상세 설명 문서 |
| 자주 묻는 질문 | ❌ 없음 | FAQ 페이지 구축 |
| 지역별 가이드 | ⚠️ 기본 있음 | 지역별 특성/상황 콘텐츠 |

---

## 🎯 3단계: 페이지별 최적화 템플릿

### Template 1: 홈페이지 (/)

**현재 상태:** ✅ Good (80점)

**추천 개선사항:**
```
URL slug: /  
SEO title: ✅ 성인PC 성인피씨 성인피시 창업 정보 거래 | 성피요
            (59자, 최적)

meta description: ✅ 성인PC 성인피씨 성인피시 창업 정보 | 전국 성인PC방 매물 
                     매매 및 임대 | 성인피씨창업 정보 공유 | 안전하고 투명한 
                     거래 플랫폼 (158자, 최적)

H1: ✅ 성인PC 성인피씨 창업 플랫폼
    (기존 문구 유지)

H2 구조:
- H2: 매물 찾기 (trending listings section)
- H2: 커뮤니티 (latest posts)
- H2: 구인 공고 (latest jobs)
- H2: 중고 거래 (secondhand)

핵심 키워드: 성인PC, PC방 매매, 창업, 성인피씨, 피씨365
보조 키워드: PC방 양도양수, 성인PC방 임대, 매물 거래

검색 의도: 내비게이션 + 상업적 (PC방 창업 정보 찾기)

FAQ 추가 안내:
Q: 성피요는 어떤 사이트인가요?
A: 성인PC 성인피씨 창업 정보와 매물을 거래하는 플랫폼입니다. 
   권리금, 보증금, 월세 등 투명한 정보를 공개합니다.

Q: 무료로 매물을 등록할 수 있나요?
A: 네, 회원가입 후 무료로 매물 등록이 가능합니다.

내부링크 권고:
- 메인 → /listings (매물 목록)
- 메인 → /listings/region/서울 (지역별)
- 메인 → /community (커뮤니티)
- 메인 → /jobs (구인구직)
- 메인 → /secondhand (중고거래)

Schema markup:
- Organization ✅ (이미 구현)
- BreadcrumbList ✅ (이미 구현)
- LocalBusiness ✅ (이미 구현)
```

### Template 2: 매물 목록 (/listings)

**현재 상태:** ✅ Good (85점)

**SEO title:** `성인PC 성인피씨 성인피시 매물 | 창업 정보 | 성피요`  
**Meta description:** `전국 성인PC방 매물을 투명한 가격정보와 함께 검색하세요. 권리금, 보증금, 월세, PC 대수 정보 공개.`  

**H1:** `성인PC 매물 전국 검색`  
**H2들:**
- `최신 매물 (N개)`
- `지역별 매물 검색`
- `필터링으로 찾기`

**개선 필요:**
```
1. 매물 0개 지역 noindex 처리 ✅ (이미 구현됨)
2. 지역별 페이지 SEO 강화 필요 (아래 참조)
3. 가격대별 필터링 추가 고려 (UX)
```

### Template 3: 지역별 매물 (/listings/region/[region])

**현재 상태:** ⚠️ Medium (70점) - SEO Phase 2에서 개선됨

**예시: 서울**
```
URL: /listings/region/서울

SEO title: 서울 성인PC방 매매·양도양수 매물 12개 | 성피요
          (38자, 우수)

meta description: 서울 성인PC방 12개 매물. 권리금·보증금·월세 정보와 함께 
                PC방 매매, 임대, 양도양수 정보를 성피요에서 확인하세요.
                (155자, 최적)

keywords: [서울 성인PC방, 서울 PC방 매매, 서울 성인피씨, 
           서울 PC방 창업, 서울 성인PC방 양도양수, 
           서울 PC방 임대, 성인PC 매매, 피씨365]

H1: 서울 성인PC방 매매·양도양수 매물
H2: 최신 매물 12개
H2: 서울 PC방 창업 정보
H3: 강남구, 강서구, 송파구... (구별 분류)

Schema: 
- CollectionPage (이미 구현됨)
- ItemList with 매물 상세

매물 0개 지역: noindex 적용 ✅
```

### Template 4: 매물 상세 (/listings/[id])

**현재 상태:** ✅ Good (88점)

**동적 생성:**
```
SEO title: "{지역} {구} 성인PC방 {가격}만원 | {제목}"
          예: "강남 신논현역 성인PC방 3500만원 | 신규 인테리어 7대"

meta description: "{지역} {구}의 성인PC방 매물. 
                  권리금 {amount}만원, 보증금 {amount}만원, 월세 {amount}만원. 
                  PC {count}대, 면적 {area}평"

keywords: [
  {지역} 성인PC방,
  {지역} PC방 매매,
  {지역} {구} 성인PC,
  성인PC 양도양수,
  PC방 {employment_type}
]

H1: {제목}
H2: 매물 상세정보
H2: 위치 및 시설
H2: 가격 정보

Schema:
- Product ✅ (이미 구현)
- BreadcrumbList ✅ (지역 → 구 → 매물)
- LocalBusiness (위치 정보)
```

### Template 5: 구인공고 상세 (/jobs/[slug])

**현재 상태:** ✅ Excellent (92점) - 이미 최적화됨

```
SEO title: "{지역} {직무} 구인 | 성피요"
          예: "강남 PC방 관리자 구인 | 성피요"

H1: {지역} {직무} 구인
H2: 직무 상세정보
H2: 지원 방법

Schema: JobPosting ✅ (권고)
- title, description
- hiringOrganization
- jobLocation (address)
- baseSalary (salary)
- employmentType (FULL_TIME, PART_TIME)
```

### Template 6: 구인공고 목록 (/jobs)

**현재 상태:** ✅ Good (85점)

**추천 개선:**
- 지역별 구인공고 필터 SEO 페이지 추가
- URL: `/jobs/region/[region]`

### Template 7: 중고거래 목록 (/secondhand)

**현재 상태:** ✅ Good (83점) - 고급 리디자인 완료

```
SEO title: 중고장터 | PC방 기자재 거래 | 성피요
meta description: PC방 관련 중고 물품 거래. PC, 모니터, 의자, 냉각기 등 
                 PC방용품을 사고팔 수 있습니다.

H1: PC방 중고물품 거래 플랫폼
H2: 최신 물품
H2: 지역별 거래

개선: 카테고리별 SEO 페이지
- /secondhand/category/pc
- /secondhand/category/monitor
- /secondhand/category/chair
```

### Template 8: 중고거래 상세 (/secondhand/[id])

**현재 상태:** ✅ Good (82점)

```
SEO title: "{물품명} | {가격}만원 | {지역} | 성피요"
meta description: "{물품명}. {지역}에서 {price}만원에 판매 중입니다. 
                  {description}"

H1: {물품명}
H2: 상품 설명
H2: 상품 정보

Schema: Product
```

### Template 9: 커뮤니티 목록 (/community)

**현재 상태:** ⚠️ Medium (72점)

**개선 필요:**
```
1. 카테고리별 SEO 페이지 추가
   - /community/category/free
   - /community/category/startup
   - /community/category/interior
   - /community/category/equipment

각 카테고리 페이지:
SEO title: "PC방 {카테고리} 커뮤니티 | 성피요"
meta description: "PC방 {카테고리}에 대해 정보를 공유하고 
                  경험을 나누는 커뮤니티입니다."
H1: PC방 {카테고리} 이야기
H2: 최신 글
H2: 인기 글

2. FAQ 페이지 추가
   - /faq (메인 FAQ)
   - /faq/startup (창업 관련)
   - /faq/trading (거래 관련)
```

### Template 10: 커뮤니티 상세 (/community/[id])

**현재 상태:** ✅ Good (84점)

```
SEO title: "{글제목}"
meta description: "{내용 첫 155자}"

H1: {글제목}
H2: 댓글 (N개)

Schema: Article
- headline
- description
- author (profile)
- datePublished
- dateModified
- articleBody
```

---

## 🏗️ 4단계: 구조화 데이터 (JSON-LD) 완성도

### ✅ 현재 구현된 스키마

1. **Organization** - 사이트 주체 정보
2. **LocalBusiness** - 지역 비즈니스
3. **WebSite** - 사이트 정의
4. **BreadcrumbList** - 네비게이션 경로
5. **Product** - 매물 및 중고물품 (권고)

### ⚠️ 추가 권고 스키마

#### 1. **JobPosting** (구인공고)
```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "PC방 관리자 구인",
  "description": "강남역 PC방에서 관리자를 모집합니다...",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "강남 PC방"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "서울시 강남구 테헤란로...",
      "addressRegion": "서울시",
      "addressCountry": "KR"
    }
  },
  "baseSalary": {
    "@type": "PriceSpecification",
    "currency": "KRW",
    "price": "1800000",
    "priceCurrency": "KRW"
  },
  "employmentType": "FULL_TIME",
  "datePosted": "2026-05-27"
}
```

#### 2. **AggregateRating** (매물 신뢰도 - 향후)
```json
{
  "@type": "Product",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "ratingCount": 12
  }
}
```
**주의:** 조회수를 리뷰 수로 위장하지 말 것 (Google 패널티)

#### 3. **FAQPage** (FAQ 섹션)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "성피요는 어떤 사이트인가요?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "성인PC 성인피씨 창업 정보와 매물을 거래하는 플랫폼입니다..."
      }
    }
  ]
}
```

#### 4. **CollectionPage** (카테고리 페이지)
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "서울 PC방 매물",
  "description": "서울 지역 성인PC방 매물 모음",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "url": "/listings/12345"
      }
    ]
  }
}
```

---

## 📈 5단계: 온페이지 SEO 세부 가이드

### A. 타이틀 태그 작성 규칙
```
규칙: [주 키워드] [수정어] | [브랜드]
길이: 50-60자 (모바일에서 안전)

❌ 나쁜 예: 
"PC방 매물"

✅ 좋은 예:
"강남 성인PC방 매매·양도양수 매물 | 성피요"

📋 가이드:
- 지역명 포함 (지역 검색 최적화)
- 주요 액션 키워드 포함 (매매/양도양수/임대)
- 브랜드명으로 마무리
```

### B. 메타 디스크립션 작성 규칙
```
규칙: [주요 정보] + [구체적 효과/이점] + [CTA]
길이: 155-160자

❌ 나쁜 예:
"PC방 매물입니다"

✅ 좋은 예:
"서울 PC방 12개 매물. 권리금·보증금·월세 정보와 함께 
PC방 매매, 임대, 양도양수 정보를 성피요에서 확인하세요."

📋 구성:
1. 지역 + 개수 (2-3자)
2. 핵심 가치 제시 (권리금/보증금 같은 구체적 수치)
3. 검색자 의도 충족 문구
```

### C. H1~H6 헤딩 구조화
```
규칙:
- H1: 페이지 제목 (1개만)
- H2: 주요 섹션 (논리적 그룹핑)
- H3: H2의 하위 항목

❌ 나쁜 예:
H1: 매물
H1: 가격 정보  ← 여러 개의 H1

✅ 좋은 예:
H1: 강남 성인PC방 매물
H2: 매물 상세정보
  H3: 기본 정보
  H3: 시설 정보
H2: 가격 정보
  H3: 권리금
  H3: 월세
```

### D. 키워드 배치 가이드
```
1차 위치 (매우 중요):
- SEO title
- H1
- URL 슬러그
- Meta description (첫 30자)

2차 위치 (중요):
- H2~H3
- 이미지 alt 텍스트
- 첫 번째 문단 100단어 내

3차 위치 (보조):
- 본문 중간 (자연스럽게)
- 내부링크 앵커 텍스트

❌ 피해야 할 것:
- 키워드 반복 (스팸 판정)
- 검색 의도와 맞지 않는 키워드
- 숨겨진 텍스트
```

### E. 이미지 최적화
```
1. 파일명: 영문 또는 한글 (하이픈 구분)
   ❌ 나쁜: "image123.jpg"
   ✅ 좋은: "서울-강남-성인PC방-매물.jpg"

2. Alt 텍스트: 이미지 내용 설명 + 키워드 (자연스럽게)
   <img alt="서울 강남구 성인PC방 매물 사진 - 7대 PC 배치">

3. 크기: 최적화
   - 홈페이지 배너: 1200x630 (OG 이미지)
   - 매물 썸네일: 400x300
   - Next.js Image 컴포넌트 사용 ✅

4. 포맷: WebP/AVIF ✅ (이미 설정됨)
```

---

## 🔄 6단계: 온사이트 SEO 체크리스트

### 매달 점검 (1시간)

```
□ SEO title/meta description 정확성
□ H1~H3 구조 검토
□ 깨진 링크 (404) 확인
□ 노인덱스 페이지 검토 (이미지/매물 0개 지역)
□ 페이지 속도 (PageSpeed Insights)
□ 모바일 친화성 (Mobile-Friendly Test)
□ 스키마 마크업 (Schema.org Validator)
□ 사이트맵 (최신 URL 포함)
```

### 분기별 점검 (2시간)

```
□ Google Search Console
  - 색인 상태 (클릭 + 노출 + CTR)
  - 검색 쿼리 분석
  - 커버리지 에러
  - 모바일 사용성

□ GA4 분석
  - 상위 랜딩 페이지
  - 이탈율 (목표: < 50%)
  - 평균 세션 시간 (목표: > 2분)
  - 전환율 (회원가입)

□ Lighthouse
  - Performance > 80
  - Accessibility > 90
  - SEO > 90
  - Best Practices > 85
```

### 분기별 콘텐츠 감사 (4시간)

```
□ 콘텐츠 신선도 (3개월 이상 오래된 글)
□ 백링크 모니터링 (Ahrefs/SEMrush)
□ 경쟁사 분석
□ 키워드 순위 변화
□ 캐노니컬 체인 검토 (A→B→C 방향 안 되게)
```

---

## 🎯 7단계: 우선순위별 실행 계획 (6개월 로드맵)

### Phase 1: 긴급 (1-2주)

| 항목 | 난이도 | 영향도 | 소요시간 |
|-----|-------|-------|---------|
| next.config.js: image quality 80으로 상향 | 낮음 | 중 | 10분 |
| 404/noindex 페이지 최종 검증 | 낮음 | 중 | 30분 |
| Google Search Console 등록 | 낮음 | 높음 | 15분 |
| GA4 설정 검증 | 낮음 | 중 | 20분 |

**총 소요시간:** 1.5시간  
**예상 SEO 점수 상향:** +2점 (85→87)

### Phase 2: 중요 (3-4주)

| 항목 | 난이도 | 영향도 | 소요시간 |
|-----|-------|-------|---------|
| /community 카테고리별 SEO 페이지 생성 | 중 | 높음 | 4시간 |
| /faq 페이지 구축 및 스키마 추가 | 중 | 높음 | 6시간 |
| 지역별 구인공고 SEO 페이지 (/jobs/region) | 중 | 중 | 3시간 |
| 모든 매물에 JobPosting 스키마 추가 | 중 | 중 | 2시간 |

**총 소요시간:** 15시간  
**예상 SEO 점수 상향:** +5점 (87→92)

### Phase 3: 장기 (2-3개월)

| 항목 | 난이도 | 영향도 | 소요시간 |
|-----|-------|-------|---------|
| 블로그/가이드 콘텐츠 10개 작성 | 높음 | 높음 | 40시간 |
| 구인공고별 스키마 정규화 | 중 | 중 | 3시간 |
| 중고거래 카테고리 SEO 페이지 | 중 | 중 | 4시간 |
| Core Web Vitals 최적화 (LCP < 2.5s) | 중 | 높음 | 8시간 |
| 백링크 구축 전략 | 높음 | 높음 | 20시간 |

**총 소요시간:** 75시간  
**예상 SEO 점수 상향:** +5~8점 (92→100)

---

## ✅ 8단계: SEO 100점 유지 체크리스트

### 🔵 **매일 (아침 5분)**
```
□ Search Console 알림 확인
  - 크롤 에러
  - 보안 문제
  - 색인 상태
□ Core Web Vitals 기본 값 확인
```

### 🟣 **주 1회 (월요일 아침 30분)**
```
□ 최신 매물/공고 색인 여부 확인
□ 깨진 이미지/링크 스캔
□ PageSpeed Insights 점수 확인
□ GA4 실시간 트래픽 확인
```

### 🟢 **월 1회 (1일 1시간)**
```
□ GA4 분석
  - 상위 랜딩 페이지
  - 이탈율 추이
  - 전환 경로
  
□ Search Console
  - 검색 쿼리 (CTR 낮은 것 → 개선)
  - 색인 상태
  - 모바일 사용성 에러

□ Lighthouse 통합 점수
  - Performance
  - Accessibility
  - SEO
  - Best Practices

□ 기술 SEO 점검
  - robots.txt 유효성
  - sitemap 최신화
  - canonical 정확성
  - 중복 콘텐츠 없음
```

### 🟠 **분기별 (1월/4월/7월/10월 1일 3시간)**

```
□ 전체 SEO 감사 (이 문서 항목들)
□ 콘텐츠 신선도 (최신 추가/업데이트)
□ 경쟁사 벤치마킹
□ 키워드 순위 추적
  - 목표 키워드 10개 순위 변화
  - SERP 변화 (AI Overview 추가 여부)
□ 백링크 모니터링
□ SEO 도구 라이선스 갱신
```

### 🟡 **반기별 (1월, 7월 1일 8시간)**

```
□ 전체 콘텐츠 감사
  - 내용 정확성
  - 신선도 (6개월 이상 오래된 글 갱신)
  - 이미지/비디오 품질
  
□ 기술 SEO 깊이 있는 점검
  - Core Web Vitals 상세 분석
  - 서버 응답 시간
  - JavaScript 번들 크기
  - 캐시 정책

□ 전환 경로 분석
  - 매물 상세페이지까지의 경로
  - 회원가입 → 매물등록까지의 경로
  - 구인공고 클릭 → 지원까지

□ A/B 테스트 (CTR 개선)
  - 제목 변형 테스트
  - 메타 설명 변형
  - 스니펫 구조 변형
```

### 보고서 작성 템플릿 (월 1회)

```markdown
# 2026년 5월 SEO 성과 보고서

## 📊 핵심 지표 (YoY 비교)
- 평균 순위: 12위 (↑ 1.2위)
- 평균 CTR: 3.2% (↑ 0.5%)
- 클릭수: 1,250회 (↑ 15%)
- 노출수: 45,000회 (↑ 8%)
- 색인된 페이지: 2,150개

## 🎯 주요 성과
1. "서울 PC방 매매" 키워드 8위 달성
2. 매물 상세페이지 평균 CTR 4.8%로 개선
3. 모바일 LCP 2.1초로 개선

## ⚠️ 주의 사항
1. 브랜드 검색 (성피요) 순위 하락 → 캠페인 강화 필요

## 📋 다음달 액션 아이템
- [ ] 커뮤니티 FAQ 페이지 구축
- [ ] 백링크 10개 확보
- [ ] 매물 이미지 alt 텍스트 완성
```

---

## 🛠️ 9단계: 개발자 작업지시서 (상세)

### A. 즉시 적용 (개발시간 30분)

**작업 1: Image Quality 최적화**
```javascript
// src/next.config.js 수정
images: {
  // ... 기존 설정
  quality: 80,  // 기본값 75 → 80
  // ...
}
```

**작업 2: 404 페이지 SEO 개선**
```typescript
// app/not-found.tsx 검증
// - robots meta: noindex 확인
// - 추천 링크 3-5개 포함 (홈, 매물목록, 커뮤니티 등)
// - 검색창 포함
```

**작업 3: Sitemap 검증**
```typescript
// app/sitemap.ts 검증 체크리스트
// ✓ 모든 공개 페이지 포함
// ✓ noindex 페이지 제외
// ✓ lastmod 최신 유지
// ✓ priority 정확성
```

### B. 단기 개발 (1-2주, 개발시간 10시간)

**작업 1: FAQ 페이지 구축**

```typescript
// app/faq/page.tsx (신규)
export default function FAQPage() {
  const faqItems = [
    {
      question: "성피요는 어떤 사이트인가요?",
      answer: "PC방 창업 정보와 매물을 거래하는 플랫폼입니다..."
    },
    // ... 20-30개 항목
  ];
  
  return (
    <>
      {/* Schema: FAQPage JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map(item => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": item.answer
            }
          }))
        })}
      </script>
      
      {/* FAQ 컨텐츠 */}
    </>
  );
}
```

**작업 2: 커뮤니티 카테고리 SEO 페이지**

```typescript
// app/community/category/[category]/page.tsx
export async function generateMetadata({ params }) {
  const categories = {
    free: { title: '자유 커뮤니티', description: '자유로운 주제 토론' },
    startup: { title: 'PC방 창업', description: '창업 관련 정보 공유' },
    // ...
  };
  
  const cat = categories[params.category];
  return {
    title: `PC방 ${cat.title} | 성피요`,
    description: `PC방 ${cat.description}를 나누는 커뮤니티입니다...`,
    robots: { index: true, follow: true }
  };
}
```

**작업 3: JobPosting 스키마 추가**

```typescript
// app/jobs/[slug]/page.tsx에서
const jobSchema = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": job.title,
  "description": job.description,
  "hiringOrganization": {
    "@type": "Organization",
    "name": job.company_name || "PC방"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": job.location
    }
  },
  "baseSalary": {
    "@type": "PriceSpecification",
    "currency": "KRW",
    "price": job.salary
  },
  "employmentType": job.employment_type?.toUpperCase(),
  "datePosted": job.created_at
};
```

### C. 중기 개발 (2-4주, 개발시간 20시간)

**작업 1: /jobs/region 페이지 생성**
```typescript
// app/jobs/region/[region]/page.tsx
// - /listings/region과 동일한 패턴
// - 지역별 구인공고 목록
// - SEO 최적화 (타이틀, H1, 메타)
```

**작업 2: /community/category SEO 개선**
```typescript
// - 카테고리별 페이지 생성 (작업 2와 동일)
// - 스키마 추가 (BreadcrumbList, CollectionPage)
```

**작업 3: 백엔드 API 추가**
```typescript
// app/api/seo/structured-data/route.ts (선택사항)
// - 동적 스키마 생성 API
// - 대량 매물의 JSON-LD 최적화
```

---

## 📝 10단계: 콘텐츠 작성자 가이드

### A. 블로그 포스트 작성 규칙 (상품 + 서비스 설명)

```markdown
## 제목 작성 규칙
형식: [주 키워드] [수정어] + [이점] (50-65자)

예시:
- ❌ "PC방 창업" (너무 짧음, 키워드 부족)
- ✅ "PC방 창업 비용과 수익 | 2026년 완벽 가이드" (60자)
- ✅ "서울 PC방 임대 시 권리금 협상 전략" (28자)

## 메타 설명 (155-160자)

예시:
"PC방 창업에 필요한 정확한 비용과 예상 수익을 분석합니다. 
권리금, 인테리어비, 운영비 등 단계별 예상금액과 
수익성 높은 입지 선택 기준을 알려드립니다."

## H1 (페이지당 1개)
- 타이틀과 동일하거나 약간 더 자연스럽게
- 키워드 포함 필수

## H2 (3-5개, 논리적 섹션)

예시:
H1: PC방 창업 비용과 수익 완벽 가이드
H2: PC방 창업에 필요한 초기 비용
  H3: 권리금
  H3: 인테리어 비용
  H3: 장비 구입비
H2: 운영 중 월별 비용
  H3: 임차료
  H3: 전기/인터넷 요금
H2: 현실적인 수익 예측
  H3: 월 매출 추정
  H3: 순이익 계산
H2: 투자 회수 기간
H2: 성공적인 PC방 창업 팁

## 본문 작성 팁

1. **첫 번째 단락 (100단어)**
   - 검색자의 의도 명확히 이해 반영
   - 핵심 답변 요약
   - 키워드 자연스럽게 포함

   ❌ 나쁜 예:
   "PC방은 성인PC라고도 합니다. PC방 사업을 하고 싶으신가요?"
   
   ✅ 좋은 예:
   "PC방 창업은 2억 원 초반대 투자로 월 2-4천만 원 
   수익을 기대할 수 있는 사업입니다. 
   이 가이드에서 정확한 초기 비용과 예상 수익을 
   분석한 실제 사례를 소개합니다."

2. **섹션별 구조**
   - 주제문 (키워드 자연스럽게)
   - 구체적 사례/수치
   - 분석/통찰

3. **키워드 배치**
   - H2/H3에 변형된 키워드 (매칭율 70% 정도)
   - 본문 중간중간 자연스럽게
   - 강조(bold)는 키워드 또는 핵심만

4. **이미지 및 표**
   - 복잡한 정보는 표로 정리
   - 이미지는 alt 텍스트 필수
   - 최소 1개 이상 권장 (클릭률 +15%)

5. **길이 권장**
   - 목표: 2,500-3,500 단어
   - 최소: 1,500 단어 (SEO 효과 미미)
   - 초과: 5,000 단어 (지루함)

6. **CTA (Call To Action)**
   - 말미에 다음 단계 제시
   - 내부링크 권장 (최소 3개)
   - 전환 최적화

   예시:
   "PC방 창업을 위해 실제 매물을 확인해보세요. 
   [성피요의 전국 PC방 매물보기] → /listings"

7. **내부링크 전략**
   - 자연스럽고 관련성 높은 곳에만
   - 앵커 텍스트: 설명적 (키워드 포함 가능)
   - 링크당 1-2개, 글당 3-5개

   ❌ "[여기를 클릭]"
   ✅ "[PC방 매물 전국 검색하기](/listings)"
```

### B. FAQ 작성 가이드

```markdown
## Q&A 형식

Q: 검색자가 입력할 법한 자연스러운 질문 (35자 이상)
   ❌ "비용?"
   ✅ "PC방 창업에 드는 정확한 비용은 얼마인가요?"

A: 구체적이고 상황별 답변 (100-300자)
   - 직접적인 답변 (첫 문장)
   - 근거/사례
   - 추가 조건 (지역별, 규모별 차이)
   - 다음 단계 제시

## 예시
Q: PC방에서 요구하는 소방시설 기준은 무엇인가요?
A: PC방은 「다중이용업소의 안전관리에 관한 특별법」에 따라 
   - 자동화재탐지설비
   - 자동살수설비 (스프링클러)
   - 소화기
   - 비상구 2개 이상
   등을 갖춰야 합니다. 세부 기준은 면적과 위치에 따라 
   다르므로 [학교환경위생정화구역 조회]에서 
   정확히 확인하시기 바랍니다.

## FAQ 개수
- 카테고리당 15-30개
- 최소 8개
- 최대 100개 (초과 시 카테고리 분리)
```

### C. 리뷰/사례 콘텐츠 가이드

```markdown
## 구조
1. 개요 (비포어 상황)
2. 선택 과정
3. 실행 (시공 사진 등)
4. 결과 (매출, 고객 반응)
5. 배운 점
6. 충고

## 키워드 자연 삽입
- "서울 강남역 근처 PC방"
- "PC 7대 규모"
- "초기 투자 2천만 원대"
등을 자연스럽게 스토리에 포함

## 신뢰성 강화
- 구체적 수치 (비포어/애프터 매출)
- 실제 사진/영상
- 기간 (예: "6개월 운영 후")
- 조건 명시 (지역, 규모, 시기)
```

---

## 🎯 최종 액션 플랜: 다음 6개월 로드맵

```
2026-05 (지금)
├─ Search Console / GA4 등록
├─ next.config.js 이미지 품질 최적화
├─ robots.txt / sitemap 최종 검증
└─ SEO 기준선 수립 (현재 점수: 85점)

2026-06 (1개월)
├─ FAQ 페이지 구축 (스키마 포함)
├─ 커뮤니티 카테고리 SEO 페이지 생성
├─ JobPosting 스키마 대량 적용
└─ 예상 SEO 점수: 88점

2026-07 (2개월)
├─ /jobs/region SEO 페이지 생성
├─ 블로그 콘텐츠 5개 작성
├─ Core Web Vitals 최적화 (LCP < 2.5s)
└─ 예상 SEO 점수: 92점

2026-08-09 (3-4개월)
├─ 블로그 콘텐츠 10개 누적
├─ 백링크 전략 실행 (매달 5-10개)
├─ 커뮤니티 활성화 (주 2-3회 포스팅)
└─ 예상 SEO 점수: 95점

2026-10-11 (5-6개월)
├─ 비교형 콘텐츠 (성피요 vs 경쟁사)
├─ 교육형 콘텐츠 (튜토리얼, 가이드)
├─ E-E-A-T 강화 (전문가성/경험성)
└─ 예상 SEO 점수: 98-100점
```

---

## 📞 지원 문서

### Google Search Console 분석 가이드

```
1. 성과 탭
   - 검색어별 순위 추이
   - CTR이 낮은 키워드 (30% 미만)
     → 타이틀/설명 개선 대상
   
2. URL 검사
   - 색인 여부 확인
   - 이동 중인 URL 발견 시 리다이렉트 확인
   
3. 커버리지
   - 제외된 페이지 → 의도적인지 확인
   - 오류 → 즉시 수정
   
4. 모바일 사용성
   - 240px 아래 텍스트 → 가독성 개선
   - 클릭 요소 → 터치 크기 조정
```

### GA4 분석 가이드

```
1. 핵심 지표
   - 세션당 조회수 (목표: > 3)
   - 이탈률 (목표: < 50%)
   - 전환율 (목표: > 5%)
   
2. 행동 흐름
   - 매물 상세 → 문의 전환 비율
   - 커뮤니티 글 → 회원가입 경로
   
3. 유입 채널
   - Organic (자연 검색) 비중 (목표: > 40%)
   - Direct (직접 방문) 증가 추이
   - Referral (추천) 모니터링
```

---

## 결론: SEO 100점 달성 로드맵

**현재:** 85점 → **6개월 후:** 100점

### 핵심 성공 요인
1. **기술 SEO**: 95% 완성 (이미 좋음)
2. **콘텐츠 SEO**: 50% (블로그/가이드 필요)
3. **E-E-A-T**: 60% (전문가성 강화 필요)
4. **백링크/신호**: 40% (별도 PR 필요)

### 투자 대비 효과
- 개발비용: ~30-40시간
- 콘텐츠비용: ~150-200시간 (전문 작성 또는 인력)
- **예상 유기 트래픽 증가**: 200-300% (6개월)
- **ROI**: 고수익률 (지속적인 자산)

---

*이 감사 보고서는 2026년 5월 27일 기준입니다.*  
*분기별로 업데이트하여 SEO 100점 유지하세요.*
