# PC방 지역별 자동 크롤러 사용 가이드

## 📋 개요
- **목적**: 피씨천국 사이트에서 PC방 매물을 자동으로 수집하여 Supabase에 저장
- **지역**: 11개 지역 (서울, 경기도, 강원도, 인천, 충청 2개, 경상 2개, 전라 2개, 제주)
- **저장 방식**: Upsert (신규/기존 자동 구분)
- **이미지**: 자동 업로드 (Supabase Storage)
- **월세**: 설명글에서 자동 추출

## 🚀 기본 사용법

### 1. 인증 갱신 (최초 또는 세션 만료 시)
```bash
node scripts/capture-auth.js
```
브라우저가 열리면 로그인하고 2FA/captcha 완료.
완료 후 자동으로 `auth_state.json` 저장됨.

### 2. 단일 지역 크롤링
```bash
# 서울의 모든 매물 수집
node scripts/crawl-regions.js --region=서울

# 경기도에서 최대 20개만
node scripts/crawl-regions.js --region=경기도 --limit=20
```

### 3. 모든 지역 크롤링
```bash
# 전국 모든 지역 순회 (시간 소요)
node scripts/crawl-regions.js --all-regions

# 총 100개만 수집 (테스트용)
node scripts/crawl-regions.js --all-regions --limit=100
```

## 📊 크롤링 결과

### 저장되는 정보
- **기본**: 제목, 설명, 지역
- **가격**: 월세, 보증금, 권리금
- **매물**: PC대수, 평수, 위치
- **이미지**: 1-10장 (자동 업로드)
- **상태**: 'active' (즉시 공개)

### 자동 필터링
- ❌ 이미지 0장 → 스킵
- ❌ 설명 100자 미만 → 스킵
- ✅ 월세/설명 있으면 저장

## 💾 데이터베이스 구조

### listings 테이블
```
- id: UUID (자동)
- idx: 게시글 번호 (원본 사이트)
- title: 제목
- description: 설명글
- region: 지역명
- monthly_rent: 월세 (만원)
- status: 'active' (즉시 공개)
- created_at: 저장 시간
- thumbnail_url: 대표 이미지
```

### listing_images 테이블
```
- listing_id: 매물 FK
- url: 이미지 URL (Supabase Storage)
- order_num: 순서 (0부터)
- is_primary: 대표 이미지 여부
```

## ⚙️ 기술 상세

### 크롤링 흐름
1. **인증 로드**: `auth_state.json` 읽기
2. **페이지 순회**: `lastPage` → 1 (역순, 오래된 순)
3. **목록 추출**: 각 페이지의 게시글 링크
4. **상세 접속**: 각 게시글 클릭 → 상세 페이지 로드
5. **이미지 수집**: `.fr-dii._img_light_gallery` 선택자
6. **데이터 추출**:
   - 설명글: `.board_txt_area.fr-view`
   - 월세: 정규식 `/7\.\s*월세\s*[:：]\s*([^\n]+)/`
7. **이미지 업로드**: Supabase Storage → `listings/{idx}/{1-10}.jpg`
8. **DB 저장**: Upsert (idx 기준)

### 오류 처리
- **404/모달 오류**: 자동 스킵
- **이미지 다운로드 실패**: 정상 이미지만 저장
- **네트워크 오류**: 재시도 3회
- **Browser 닫힘**: 작업 중단 (향후 자동 재시작 가능)

## 🔍 디버깅

### 진행상황 확인
```bash
# 로그 파일로 저장 (권장)
node scripts/crawl-regions.js --all-regions >> crawl.log 2>&1

# 실시간 모니터링
tail -f crawl.log
```

### 데이터 검증
```bash
node scripts/check-listings.js  # 저장된 매물 확인
```

### 인증 테스트
```bash
node scripts/test-auth.js       # 세션 유효성 확인
```

## 📈 성능 통계 (테스트 결과)

- **테스트 규모**: Seoul 8개 페이지 (45개 매물)
- **수집 시간**: ~3분
- **이미지 업로드**: 평균 3-7장/매물
- **성공률**: 100% (유효한 매물 기준)
- **월세 추출**: 100% 정확도

## ⚡ 최적화 팁

### 대량 크롤링
1. **시간대 선택**: 트래픽 적은 시간대 (야간)
2. **작은 배치**: `--limit=50` 단위로 나누기
3. **지역 순서**: 페이지 적은 지역부터 시작
   - 제주(1p) → 강원(2p) → ... → 경기(27p)

### 자동화
향후 cron 스케줄 예정:
```bash
# 매일 자정에 새 매물 수집
0 0 * * * /path/to/crawl-regions.js --all-regions
```

## ⚠️ 주의사항

1. **인증 갱신**: 세션 만료 시 `capture-auth.js` 재실행
2. **Rate Limiting**: 사이트 차단 방지 위해 자동 딜레이 포함
3. **중복 방지**: idx로 자동 관리 (같은 번호는 update)
4. **이미지 필수**: 이미지 없으면 자동 스킵
5. **Supabase 권한**: SERVICE_ROLE_KEY 필요

## 📞 문제 해결

### "auth_state.json 없음"
→ `node scripts/capture-auth.js` 실행

### "이미지 0개"
→ 사이트의 이미지 클래스가 변경됐을 수 있음
→ `scripts/crawl-detail-page.js`의 선택자 확인

### "Browser closed"
→ 메모리 부족 또는 Playwright 리소스 한계
→ `--limit` 줄여서 재시도

### "월세 추출 실패"
→ 설명 형식이 다를 수 있음
→ 정규식 패턴 확인: `/7\.\s*월세/`
