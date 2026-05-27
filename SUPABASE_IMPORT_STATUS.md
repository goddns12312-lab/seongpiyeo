# Supabase 연동 - 구현 현황 보고서

**작성일:** 2026-05-18  
**상태:** ✅ 준비 완료 (마이그레이션 적용 대기 중)

---

## 📋 완성된 것

### ✅ 1. 마이그레이션 파일
- **파일:** `supabase/migrations/001_add_scraped_fields.sql`
- **내용:** listings 테이블에 11개 컬럼 추가
  - `idx` (TEXT, UNIQUE) - 스크래핑 ID
  - `source_url` - 원본 URL
  - `contact` - 연락처
  - `thumbnail_url` - 대표 이미지
  - `location` - 위치 (원본)
  - `floor` - 층수
  - `facilities` - 시설
  - `available_date` - 입주가능일
  - `business_license` - 사업자
  - `administrative_record` - 행정처분
  - `premium_price` - 권리금
- **상태:** ✅ 작성 완료, ⏳ DB 적용 대기

### ✅ 2. 임포트 스크립트
- **파일:** `scripts/import-to-supabase.js`
- **기능:**
  - `scripts/output/listings.json` 읽기
  - 각 매물의 로컬 이미지 → Storage 업로드
  - 한국어 가격 파싱 (2000, 2천만원, 120만원 등)
  - 지역 추출 (강서구 → 서울)
  - DB upsert (idx 기준)
  - listing_images 재삽입
  - 실패 시 자동 재시도 (exponential backoff)
- **테스트:** ✅ --dry-run 성공 (5개 모두 파싱 정상)
- **실제 임포트:** ⏳ 마이그레이션 필요

### ✅ 3. TypeScript 타입 업데이트
- **파일:** `src/types/index.ts`
- **변경사항:**
  - `Listing` 타입에 필드 추가:
    - `idx?: string`
    - `source_url?: string`
    - `contact?: string`
    - `thumbnail_url?: string`
    - `location?: string`
  - `user_id` → 선택값으로 변경 (NULL 허용)
  - `business_license` 타입 → string (이전: 'yes' | 'no')

### ✅ 4. 환경변수 업데이트
- **파일:** `.env.example`
- **추가:** `SUPABASE_STORAGE_BUCKET=listings` 주석

### ✅ 5. 문서
- **`SUPABASE_MIGRATION_GUIDE.md`** - 마이그레이션 적용 방법 (가장 중요!)
- **`SUPABASE_IMPORT_STATUS.md`** - 현재 이 문서

---

## 🚨 다음 단계 (매우 중요)

### 1단계: Supabase 마이그레이션 적용

**가장 간단한 방법 (Supabase 대시보드):**

1. https://app.supabase.com → 프로젝트 선택
2. 왼쪽 메뉴 → **SQL Editor** → **New Query**
3. 아래 SQL을 모두 복사하여 붙여넣기:

```sql
-- Add missing columns to listings table for scraped data
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS idx TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS contact TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS floor TEXT,
  ADD COLUMN IF NOT EXISTS facilities TEXT,
  ADD COLUMN IF NOT EXISTS available_date TEXT,
  ADD COLUMN IF NOT EXISTS business_license TEXT,
  ADD COLUMN IF NOT EXISTS administrative_record TEXT,
  ADD COLUMN IF NOT EXISTS premium_price INTEGER;

-- Add UNIQUE constraint on idx for upsert operations
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_idx_unique;
ALTER TABLE listings ADD CONSTRAINT listings_idx_unique UNIQUE (idx);

-- Create index for fast idx lookups
CREATE INDEX IF NOT EXISTS listings_idx_idx ON listings(idx) WHERE idx IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_source_url_idx ON listings(source_url) WHERE source_url IS NOT NULL;
```

4. **RUN** 버튼 클릭
5. ✅ "Finished successfully" 확인

### 2단계: 임포트 실행

마이그레이션 완료 후:

```bash
# 테스트 (실제 DB 쓰기 없음)
node scripts/import-to-supabase.js --dry-run

# 실제 임포트
node scripts/import-to-supabase.js
```

### 3단계: 결과 확인

**Supabase 대시보드:**
- Table Editor → listings → 5개 행 확인
- 각 행에 idx, contact, thumbnail_url, source_url 등 저장됨

**Storage:**
- Storage → listings → {idx}/ 폴더 이미지 확인

**Next.js:**
```bash
npm run dev
# localhost:3001/listings 접속해 5개 매물 표시 확인
```

---

## 🔍 현재 상태 상세 분석

### ✅ 이미지 업로드
- 테스트 결과: 5개 매물, 총 44개 이미지
  ```
  171322689: 10개 ✓
  171321284: 5개  ✓
  171315260: 10개 ✓
  171314875: 10개 ✓
  171271874: 9개  ✓
  ```
- **상태:** ✅ 정상 (Storage에 업로드됨, DB 링크만 필요)

### ✅ 데이터 변환 (parsing)
- 테스트 결과: 모든 매물 정상 파싱
  ```
  171322689: 임차 2000만원 (권리금)
  171321284: 임차 2000만원 (권리금)
  171315260: 임차 1500만원 (보증금)
  171314875: 임차 1300만원 (권리금)
  171271874: 임차 850만원 (권리금)
  ```
- **파싱 로직:**
  - `premium` (권리금) → 우선순위 1
  - `monthly_rent` (월세) → 우선순위 2
  - `deposit` (보증금) → 우선순위 3
  - 모두 없으면 → 0
- **상태:** ✅ 정상

### ⏳ DB 저장
- **오류:** "Could not find the 'contact' column"
- **원인:** 마이그레이션이 DB에 아직 적용되지 않음
- **해결:** 위 "1단계" 수행하면 해결됨

---

## 📊 예상 임포트 결과

```
🚀 Supabase 임포트 시작

설정: [실제 임포트]
Supabase: https://lduahvskmxsrvamgieek.supabase.co
Storage Bucket: listings

총 5개 매물 발견

[1/5] 171322689 - 강서구화곡동
  📸 이미지 업로드: 10개
  🔄 데이터 변환: 임차 2000만원
  💾 DB 저장
  ✅ 완료

... (4개 더)

============================================================
📊 임포트 결과
============================================================
✅ 성공: 5
❌ 실패: 0
총: 5

완료! ✨
```

---

## 📝 파일 구조 확인

```
c:\Users\B\Desktop\aass\
├── supabase/
│   └── migrations/
│       └── 001_add_scraped_fields.sql          ✅
├── scripts/
│   ├── import-to-supabase.js                  ✅
│   ├── apply-migration.js                     ✅
│   ├── auto-scraper.js                        ✅ (기존)
│   └── output/
│       ├── listings.json                      ✅ (5개)
│       ├── listings.csv                       ✅
│       ├── scraped_ids.json                   ✅
│       └── images/                            ✅ (44개 파일)
├── src/
│   ├── types/
│   │   └── index.ts                           ✅ (업데이트)
│   └── ...
├── .env.example                               ✅ (업데이트)
├── .env.local                                 ✅ (기존)
├── SUPABASE_IMPORT_STATUS.md                  ✅ (현재 파일)
├── SUPABASE_MIGRATION_GUIDE.md                ✅
└── ...
```

---

## 🎯 체크리스트

- [ ] 1단계: Supabase 마이그레이션 적용 (CRITICAL)
- [ ] 2단계: `node scripts/import-to-supabase.js --dry-run` (테스트)
- [ ] 3단계: `node scripts/import-to-supabase.js` (실제 임포트)
- [ ] 4단계: Supabase 대시보드에서 listings 행 확인
- [ ] 5단계: Storage에서 {idx}/ 폴더 확인
- [ ] 6단계: Next.js `/listings` 페이지에서 5개 매물 표시 확인

---

## 📞 문제 해결

**Q: "Could not find the 'contact' column" 오류**
→ 마이그레이션을 아직 실행하지 않았습니다. 1단계를 다시 수행하세요.

**Q: "UNIQUE constraint violation on idx"**
→ 이미 같은 idx가 있습니다. 새로 임포트하면 자동으로 UPDATE됩니다.

**Q: 이미지는 업로드되었는데 DB에 안 들어갔어요**
→ 정상입니다. 마이그레이션 후 다시 `node scripts/import-to-supabase.js` 실행하세요.

---

## 🚀 최종 정리

**현재:** 95% 완료 (마이그레이션 적용만 남음)

**남은 작업:**
1. Supabase 대시보드 SQL Editor에서 마이그레이션 SQL 실행 (5분)
2. `node scripts/import-to-supabase.js` 실행 (2분)
3. 결과 확인 (1분)

**총 예상 시간:** 8분

---

**상태:** 🟡 마이그레이션 적용 대기 중
**다음 단계:** `SUPABASE_MIGRATION_GUIDE.md` 참고하여 1단계 수행
