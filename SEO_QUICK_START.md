# SEO 100점 달성 - 빠른 시작 가이드

> **현재 예상 점수:** 85점 → **목표:** 100점 (6개월)

---

## 🚀 Phase 1: 즉시 적용 (오늘~이번주) - 30분

### 1. Image Quality 최적화 ✅
```javascript
// next.config.js 찾아서 수정
images: {
  quality: 80,  // 변경: 기본값 75 → 80
}
```
**효과:** 이미지 품질 개선 (LCP 점수 +2)  
**소요시간:** 5분

### 2. Search Console / GA4 등록 ✅
```
Google Search Console:
1. search.google.com 접속
2. URL 추가: http://localhost:3002 (또는 실제 도메인)
3. DNS 검증 또는 HTML 파일 업로드
4. 포기하면 안 됨 (매달 점검 필요)

Google Analytics (GA4):
1. analytics.google.com 접속
2. 계정 생성 후 추적 코드 획득
3. 현재: gtag 스크립트가 layout.tsx에 추가되어야 함
```
**효과:** SEO 기준선 수립 (점수 +0, 하지만 필수)  
**소요시간:** 15분

### 3. Sitemap / Robots 최종 검증 ✅
```
확인 사항:
□ http://localhost:3002/robots.txt 열림
  - User-Agent: *
  - Allow: /
  - Disallow: /admin /api

□ http://localhost:3002/sitemap.xml 열림
  - 홈페이지 포함
  - 매물 목록 포함
  - lastmod 최신
```
**효과:** 크롤링 효율성 (점수 +1)  
**소요시간:** 10분

---

## 📚 Phase 2: 핵심 개선 (1-2주) - 4시간

### 1. FAQ 페이지 구축
```typescript
// app/faq/page.tsx 신규 생성

내용:
- 카테고리: 창업 / 거래 / 기술 지원
- 항목: 최소 20개
- 스키마: FAQPage JSON-LD 포함

추천 질문 톱 10:
1. "성피요는 어떤 사이트인가요?"
2. "매물을 등록하는 비용은 드나요?"
3. "PC방 창업에 드는 비용은 얼마인가요?"
4. "권리금이란 무엇인가요?"
5. "소방 시설 기준은 무엇인가요?"
6. "학교 주변에서 PC방을 운영할 수 있나요?"
7. "PC방 구인공고를 올리는 방법은?"
8. "중고 기자재를 어디서 구할 수 있나요?"
9. "매매 계약서 양식이 있나요?"
10. "취소/환불 정책은?"
```
**효과:** SEO 점수 +3 (FAQ 스키마 + 키워드 커버리지)  
**개발시간:** 2시간  
**콘텐츠 작성시간:** 2시간

**구현 예시:**
```typescript
export default function FAQPage() {
  const faqs = [
    {
      q: "성피요는 어떤 사이트인가요?",
      a: "성인PC 성인피씨 창업 정보와 매물을 거래하는 플랫폼입니다..."
    },
    // ... 20개 이상
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a }
    }))
  };

  return (
    <>
      <Helmet>
        <title>자주 묻는 질문 | 성피요</title>
        <meta name="description" content="PC방 창업, 매물 거래, 기술 지원 FAQ"/>
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      </Helmet>
      {/* FAQ 리스트 렌더링 */}
    </>
  );
}
```

### 2. 커뮤니티 카테고리 페이지
```
생성 페이지:
- /community/category/free (자유)
- /community/category/startup (창업)
- /community/category/interior (인테리어)
- /community/category/equipment (장비)

각 페이지:
- SEO title: "PC방 {카테고리} | 성피요"
- Meta description: 카테고리 설명
- H1: "PC방 {카테고리} 커뮤니티"
- 최신글 + 인기글 표시
```
**효과:** SEO 점수 +2 (새 인덱싱 페이지 + 내부링크)  
**개발시간:** 1.5시간

---

## 🎯 Phase 3: 콘텐츠 전략 (2-8주) - 50시간

### 블로그 콘텐츠 작성 (월 2-3개)

**월 1: PC방 창업 가이드 (5개)**
```
1. "PC방 창업 완벽 가이드 | 초기비용부터 수익까지 2026년 최신판"
   - H2: 초기비용 (권리금, 인테리어, 장비)
   - H2: 월별 운영비
   - H2: 수익성 분석
   - 타겟: "PC방 창업 비용"

2. "PC방 창업 시 소방 기준 | 학교주변 규제부터 시설까지"
   - H2: 소방 시설 필수 조건
   - H2: 학교주변 규제 (50m/200m)
   - H2: 소방 검사 절차
   - 타겟: "PC방 소방 기준"

3. "PC방 양도양수 절차 | 권리금 협상부터 계약까지"
   - H2: 권리금이란
   - H2: 협상 전략
   - H2: 계약 체크리스트
   - 타겟: "PC방 양도양수"

4. "성인PC방 임대 시 월세 상담 | 지역별 평균 임차료"
   - H2: 지역별 평균 월세
   - H2: 임차료 협상 팁
   - H2: 임차료 이외 비용
   - 타겟: "PC방 월세"

5. "PC방 구인구직 가이드 | 알바부터 관리자까지"
   - H2: PC방 직급 체계
   - H2: 급여 기준
   - H2: 채용 팁
   - 타겟: "PC방 구인"
```

**월 2: 심화 콘텐츠 (3개)**
```
1. "PC방 수익 시뮬레이터 | 당신의 투자 회수 기간은?"
   - 대화형 계산기 (JavaScript)
   - 입력값: 지역, PC 대수, 월세, 운영시간
   - 출력값: 월 수익, 투자 회수 기간

2. "PC방 인테리어 비용 절감 팁 | 초보자 가이드"
   - H2: 기본 vs 고급 인테리어
   - H2: 중고 기자재 활용
   - H2: 비용 절감 체크리스트

3. "PC방 운영 실패 사례 분석 | 피해야 할 5가지 실수"
   - 사례 1: 입지 선택 실패
   - 사례 2: 초기 자본 부족
   - 사례 3: 손님 관리 미흡
   - 사례 4: 기자재 품질 외면
   - 사례 5: 세금 준비 부족
```

**월 3: 지역별 가이드 (2개)**
```
1. "서울 강남역 PC방 창업 | 강남구 특성 분석"
2. "부산 PC방 매물 가이드 | 지역 시장 분석"
```

**글작성 체크리스트 (각 글마다):**
```
□ SEO 제목 (50-65자, 키워드 포함)
□ Meta 설명 (155-160자)
□ H1 (1개)
□ H2 (3-5개)
□ 단어 수 (2,500-3,500)
□ 이미지 (최소 2개, alt 텍스트 포함)
□ 표/차트 (복잡한 정보)
□ 내부링크 (3-5개)
□ CTA (마지막에 다음 단계 제시)
□ FAQ 답변형 섹션 (1-2개)
```

**예상 효과:**
- 월 5개 콘텐츠 × 5개월 = 25개
- 각 글당 평균 +0.5 점수
- **총 +12점** (점수: 85→97)

---

## 🔧 Phase 4: 기술 SEO 심화 (3-4주) - 15시간

### 1. 모든 매물에 JobPosting 스키마 추가
```typescript
// app/jobs/[slug]/page.tsx
const jobSchema = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": job.title,
  "description": job.description,
  "hiringOrganization": {
    "@type": "Organization",
    "name": job.company_name || "구인처"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": job.location,
      "addressRegion": job.region,
      "addressCountry": "KR"
    }
  },
  "baseSalary": {
    "@type": "PriceSpecification",
    "currency": "KRW",
    "price": job.salary || "미정",
    "priceCurrency": "KRW"
  },
  "employmentType": job.employment_type?.toUpperCase() || "FULL_TIME",
  "datePosted": job.created_at,
  "description": job.description
};
```
**효과:** 구인공고 SERP 리치 스니펫 (CTR +20%)  
**소요시간:** 2시간

### 2. /jobs/region 카테고리 페이지 추가
```typescript
// app/jobs/region/[region]/page.tsx
// 기존 /listings/region 패턴 복제

// 페이지 목록:
- /jobs/region/서울
- /jobs/region/경기
- /jobs/region/인천
... (11개 지역)

각 페이지:
- SEO title: "{지역} PC방 구인공고 | 성피요"
- H1: "{지역} 구인공고"
- 매물별 JobPosting 스키마
```
**효과:** 지역별 구인공고 검색 노출 (+3점)  
**소요시간:** 3시간

### 3. Core Web Vitals 최적화
```
목표:
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1

확인:
1. PageSpeed Insights 실행
   https://pagespeed.web.dev/
   
2. Lighthouse 실행 (DevTools)
   - Performance > 80점 목표
   
3. 개선 액션:
   - 히어로 이미지 preload
   - 불필요한 JS 제거
   - 번들 크기 최적화
```
**효과:** SEO 신호 +2점, UX 개선  
**소요시간:** 4시간

### 4. 이미지 최적화 완성
```
체크리스트:
□ 모든 img 태그에 alt 텍스트 추가
  예: alt="서울 강남 성인PC방 7대 배치 사진"
  
□ 이미지 크기 최적화
  - 썸네일: 300x225px 이상
  - 배너: 1200x630px
  - Next.js Image 컴포넌트 사용
  
□ WebP/AVIF 형식 ✅ (이미 설정됨)

□ lazy loading ✅ (이미 설정됨)
```
**효과:** SEO 점수 +1, 페이지 속도 개선  
**소요시간:** 3시간

---

## 📊 Phase 5: 모니터링 & 유지보수 (지속)

### 월별 체크리스트 (30분)

```
□ Google Search Console
  └─ 클릭 수, 노출 수, CTR 검토
  └─ 색인 상태 (제외된 페이지 확인)
  └─ 모바일 사용성 에러

□ Google Analytics
  └─ 상위 랜딩 페이지 (유기 검색)
  └─ 이탈률 (목표: < 50%)
  └─ 전환율 (회원가입 / 매물 조회)

□ Lighthouse
  └─ Performance > 80?
  └─ SEO > 90?
  └─ Accessibility > 85?
```

### 분기별 체크리스트 (2시간)

```
□ 키워드 순위 추적
  └─ 목표 10개 키워드의 순위 변화
  └─ 신규 진입 키워드
  └─ 하락 키워드

□ 콘텐츠 신선도
  └─ 6개월 이상 오래된 글 업데이트
  └─ 최신 정보 반영 여부

□ 기술 SEO 감사
  └─ 깨진 링크 스캔
  └─ 리다이렉트 체인 확인
  └─ 무한 리다이렉트 없음

□ 경쟁사 벤치마킹
  └─ 상위 3개 사이트 분석
  └─ 콘텐츠 갭 발견
  └─ 백링크 전략 학습
```

---

## 💰 예상 ROI (6개월)

| 단계 | 투자 | 점수 변화 | 예상 효과 |
|-----|------|---------|---------|
| Phase 1 | 0.5시간 | 85→86 | 기준선 수립 |
| Phase 2 | 4시간 | 86→90 | FAQ/카테고리 신규 페이지 |
| Phase 3 | 50시간 | 90→97 | 블로그 콘텐츠 (25개) |
| Phase 4 | 15시간 | 97→99 | 스키마 강화 |
| Phase 5 | 지속 | 99→100 | 유지보수 + 최적화 |
| **합계** | **70시간** | **85→100** | **유기 트래픽 200-300%** |

**비용 추정 (외주 기준):**
- 개발 (70시간 × 5만 원): 350만 원
- 콘텐츠 작성 (25개 글 × 50만 원): 1,250만 원
- **총 투자:** ~1,600만 원
- **예상 월 수익 증대:** 3-5천만 원 (매물 문의 증가)
- **ROI:** 3-5개월 내 회수

---

## 🎯 이번 주 액션 아이템

### Monday (오늘)
- [ ] next.config.js image quality 수정 (5분)
- [ ] Google Search Console 등록 (10분)

### Tuesday
- [ ] FAQ 페이지 첫 10개 항목 작성 (2시간)

### Wednesday
- [ ] FAQ 나머지 10개 항목 작성 (2시간)
- [ ] FAQ 페이지 개발 (1시간)

### Thursday
- [ ] 커뮤니티 카테고리 페이지 개발 (2시간)

### Friday
- [ ] 첫 블로그 포스트 구성 작성 (1시간)
- [ ] GA4 설정 (30분)

---

## 📞 FAQ

**Q: 현재 SEO 점수가 100이 아닌가?**  
A: 예상 점수는 85점입니다. 기술 SEO는 95% 완성되었으나, 콘텐츠(블로그) 부족과 E-E-A-T(전문가성) 신호가 부족합니다.

**Q: 가장 빠른 개선은?**  
A: 블로그 콘텐츠 5개 작성으로 +7점 (85→92)을 기대할 수 있습니다.

**Q: 백링크는 필수?**  
A: SEO 100점을 위해서는 권장되지만, 0점에서 시작하므로 기타 개선 후 진행해도 됩니다.

**Q: GA4 설정 없어도 SEO 점수에 영향?**  
A: Google은 GA4를 직접 점수에 반영하지 않으나, 데이터 부족으로 최적화 기회를 놓칩니다.

---

**다음 단계:** [SEO_AUDIT_COMPREHENSIVE.md](/SEO_AUDIT_COMPREHENSIVE.md) 참조  
**마지막 업데이트:** 2026-05-27
