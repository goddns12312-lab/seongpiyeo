# 🤖 PC방 매물 자동화 파이프라인 운영 가이드

## 개요
본 가이드는 PC방 매물 자동 수집, 정제, 임포트 시스템의 운영 방법을 설명합니다.

---

## 📋 파이프라인 단계

### 1️⃣ 웹 스크래핑 (auto-scraper.js)
**역할**: 피씨천국에서 게시글 자동 수집

```bash
npm run scrape              # 전체 스크래핑
npm run scrape:test        # 5개만 테스트
```

**특징**:
- ✅ 세션 기반 자동로그인 (playwright-auth.json)
- ✅ 12개 필드 정확 추출 (정규식 기반)
- ✅ 이미지 다운로드 (최소 1장)
- ✅ 전화번호 정규화 (010-5879-3568 형식)
- ✅ 지역 자동 추출 (화곡동 → 서울)
- ✅ 중복 체크 (idx 기반)
- ✅ robots.txt 준수 + 요청 딜레이 (1.5~3초)

**출력**:
```
scripts/output/
├── listings.json      # 스크래핑된 매물 JSON
├── listings.csv       # CSV 형식
├── scraped_ids.json   # 중복 방지용 idx 목록
└── images/{idx}/      # 다운로드된 이미지
```

---

### 2️⃣ 이미지 정제 (cleanup-images-final.js)
**역할**: 배너/로고/광고 이미지 제거 + 대표 이미지 설정

```bash
npm run cleanup
```

**특징**:
- ✅ 이미지 크기/비율 분석
- ✅ 배너형 이미지 자동 감지 (2.5:1 이상 가로)
- ✅ 로고 감지 (작은 크기 또는 정사각형)
- ✅ main_image_url, thumbnail_url 자동 설정 (첫 실제 사진)
- ✅ 실제 사진 0장이면 skip

**결과**:
- Supabase listing_images에서 배너/로고 삭제
- main_image_url, thumbnail_url 업데이트

---

### 3️⃣ Supabase 임포트 (import-to-supabase.js)
**역할**: 정제된 데이터를 Supabase에 저장

```bash
npm run import
```

**특징**:
- ✅ 이미지 Storage 업로드
- ✅ 한국어 가격 파싱 (2000만원 → 20000000 ❌, 2000 ✅)
- ✅ 가격 숫자형 통일 (number)
- ✅ idx 기준 upsert (중복 방지)
- ✅ 재시도 로직 (3회, exponential backoff)

**저장 필드**:
| 필드 | 값 | 예시 |
|------|-----|------|
| idx | string | "171322689" |
| title | string | "화곡동 PC방" |
| location | string | "화곡동" |
| region | string | "서울" |
| deposit | number | 2000 |
| premium_price | number | 2000 |
| monthly_rent | number | 120 |
| contact | string | "010-5879-3568" |
| business_license | string | "있음" / "없음" |
| administrative_record | string | "없음" |
| facilities | string | "PC7대,에어컨1대,..." |
| description | string | "12항목 이후 자유문장" |
| main_image_url | string | Supabase 공개 URL |
| thumbnail_url | string | Supabase 공개 URL |
| status | string | "active" |

---

### 4️⃣ 사진없는 매물 삭제 (delete-listings-without-images.js)
**역할**: 실제 사진이 0장인 매물 제거

```bash
node scripts/delete-listings-without-images.js
```

**조건**:
- main_image_url IS NULL → 삭제
- 또는 thumbnail_url도 NULL → 삭제

---

### 5️⃣ 이미지 URL 정규화 (fix-thumbnail-urls.js)
**역할**: 모든 매물의 main_image_url, thumbnail_url을 실제 사진으로 재설정

```bash
npm run fix-urls
```

---

## 🚀 전체 파이프라인 실행 (권장)

```bash
npm run full-pipeline
```

**실행 순서**:
1. 스크래핑
2. 이미지 정제
3. Supabase 임포트
4. 사진없는 매물 삭제
5. URL 정규화

**로그 저장**: `scripts/logs/pipeline-{timestamp}.log`

---

## 📊 검증 단계

### 스크래핑 후 확인
```bash
cat scripts/output/listings.json | jq '.[0]'  # 첫 번째 매물 확인
```

### 임포트 후 확인
```bash
# Supabase 대시보드 → listings 테이블
# - total count 확인
# - main_image_url 없는 행 0개 확인
# - contact 형식 "010-XXXX-XXXX" 확인
```

### 목록 페이지 확인
```
npm run dev
→ localhost:3001/listings
→ 모든 카드가 실제 PC방 실내 사진 확인
```

---

## ⚙️ 설정 & 유지보수

### 환경 변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### Playwright 세션 갱신
세션 만료 시 수동으로 다시 로그인:
```bash
node scripts/manual-login-capture.js
# 브라우저에서 로그인 후 완료 → playwright-auth.json 저장됨
```

### Supabase 마이그레이션
```bash
# 새로운 컬럼 추가 필요 시
# supabase/migrations/ 에 SQL 파일 추가
# Supabase 대시보드 → SQL Editor에서 실행
```

---

## 🔍 문제 해결

### 스크래핑 실패
1. robots.txt 확인
2. 세션 갱신 (playwright-auth.json)
3. 네트워크 연결 확인

### 이미지 다운로드 실패
1. CDN 접근성 확인 (cdn.imweb.me)
2. 이미지 URL 형식 확인
3. Storage 권한 확인

### Supabase 저장 실패
1. Service Role Key 확인
2. 테이블 스키마 확인
3. 마이그레이션 실행 여부 확인

---

## 📅 스케줄 실행 (선택사항)

### Cron 예시 (매일 오전 2시)
```bash
0 2 * * * cd /home/user/aass && npm run full-pipeline
```

### 또는 PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'scraper-pipeline',
    script: 'scripts/master-pipeline.js',
    cron_restart: '0 2 * * *',
    env: { NODE_ENV: 'production' }
  }]
};
```

---

## 📝 모니터링

### 로그 확인
```bash
tail -f scripts/logs/pipeline-*.log
```

### 매물 통계
```bash
# Supabase SQL
SELECT 
  status, 
  COUNT(*) as count,
  COUNT(CASE WHEN main_image_url IS NOT NULL THEN 1 END) as with_images
FROM listings
GROUP BY status;
```

---

## 🎯 운영 체크리스트

- [ ] 매월 1회: 로그 파일 정리 (scripts/logs)
- [ ] 매월 1회: 실패한 매물 확인 및 수동 추가
- [ ] 분기마다: Supabase Storage 정리 (불필요 이미지 삭제)
- [ ] 6개월마다: 세션 갱신 (playwright-auth.json)
- [ ] 연 1회: 지역 목록 업데이트

---

## 📞 지원

문제 발생 시:
1. 로그 파일 확인 (`scripts/logs/`)
2. 에러 메시지 검색
3. 수동 실행 후 상세 로그 확인

---

**마지막 업데이트**: 2026-05-18
**버전**: 1.0.0
