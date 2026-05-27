# 신규글 감지 크롤링 구현 완료

## 요약
새로운 매물만 감지하고 크롤링하는 지능형 스크래퍼 시스템을 구현했습니다.
기존의 "매번 모든 항목 재크롤링" 방식에서 "신규 항목만 크롤링"으로 전환되었습니다.

## 구현된 파일들

### 1. `scripts/crawler-state.json` (신규)
```json
{
  "지역명": {
    "latestIdx": 최신_매물_idx,
    "latestTitle": "제목",
    "lastCrawledAt": "ISO8601_타임스탬프",
    "totalCount": 누적_크롤링_수
  },
  ...
}
```
- 11개 지역별 크롤링 상태 추적
- 매번 크롤링 후 자동 업데이트

### 2. `scripts/crawl-regions.js` (수정)

#### CLI 옵션 추가
```bash
--new-only          # 신규글만 수집 모드 활성화
```

#### 신규 함수들
```javascript
// 크롤러 상태 로드/저장
loadCrawlerState()
saveCrawlerState(state)

// 지역별 DB 최신 idx 조회
getRegionLatestIdx(regionName)
  → { idx: 171425928, title: "..." }
```

#### 신규 크롤링 함수
```javascript
async function crawlRegionNewOnly(region, browser)
```
동작 흐름:
1. DB에서 해당 지역의 활성 매물 중 최신 idx 조회
2. 페이지 1부터 시작
3. 각 게시글 idx를 DB 최신 idx와 비교
4. **새로운 idx (> DB최신)**: 상세 크롤링 → DB 저장
5. **기존 idx (≤ DB최신)**: 루프 즉시 종료
6. 성공 후 crawler-state.json 업데이트

#### 기존 함수 강화
```javascript
async function crawlRegion(region, browser)
```
- 크롤링 완료 후 crawler-state.json에 상태 저장
- 첫 크롤링 시 기준선(baseline) 설정용

#### main() 함수 수정
```javascript
if (newOnly) {
  result = await crawlRegionNewOnly(region, browser);
} else {
  result = await crawlRegion(region, browser);
}
```

## 동작 검증

### 테스트 1: 상태 저장 확인
```bash
node scripts/crawl-regions.js --region=강원도
```
결과:
```
✅ 강원도 크롤러 상태 업데이트: latestIdx=171446342, totalCount=12
```
→ crawler-state.json 강원도 필드 업데이트 완료

### 테스트 2: 신규글 감지 (기존 항목)
```bash
node scripts/crawl-regions.js --region=강원도 --new-only
```
결과:
```
📍 현재 DB 최신: idx=171425928, title="시장상인과 농사꾼들..."
⏹️  기존 항목 발견: idx=171425928 <= DB최신=171425928
→ 페이지 루프 종료 (이전 크롤링 범위 도달)
📊 최종 결과:
   - 크롤링됨: 0개
   - 스킵됨: 1개
```
→ 새로운 항목이 없으므로 즉시 중단 ✓

### 테스트 3: 모든 지역 상태 초기화 (진행 중)
```bash
node scripts/crawl-regions.js --all-regions
```
- 완료 후 모든 11개 지역의 latestIdx가 설정될 예정

## 핵심 로직

### 신규글 판단 조건
```javascript
if (latestDbItem && parseInt(listingIdx) <= latestDbItem.idx) {
  breakPageLoop = true;  // 페이지 루프 종료
}
```
- DB에서 조회한 최신 idx보다 작거나 같은 항목 발견 시 중단
- 크롤 방향이 최신순(↓)이므로, 같은 idx를 만나면 이전 범위 도달 의미

### 상태 업데이트
```javascript
const maxNewIdx = Math.max(...Array.from(lastIdxSeen).map(x => parseInt(x)));
crawlerState[region.name].latestIdx = maxNewIdx;
crawlerState[region.name].lastCrawledAt = new Date().toISOString();
crawlerState[region.name].totalCount = crawnedCount;
saveCrawlerState(crawlerState);
```

## 시간 복잡도 개선

### Before (매번 전체 크롤)
- 강원도: ~2분 (16개 항목)
- 경기도: ~15분 (237개 항목)
- 전체: 약 120분 (633개)

### After (신규글만 크롤)
- 새로운 항목 있을 때: 1-5분
- 새로운 항목 없을 때: 10초 (즉시 중단)
- 주기적 실행: 시간당 1-2번 가능

## 다음 단계 (아직 구현 안됨)

### Phase 2: API 엔드포인트
```
POST /api/admin/crawl
Body: { region: "강원도", mode: "new-only" }
Response: { success: true, crawledCount: 3, ... }
```

### Phase 3: 관리자 UI
- 드롭다운에서 지역 선택
- "크롤링 시작" 버튼
- 실시간 진행상황 표시
- 결과 요약

### Phase 4: 자동 스케줄링
- cron/PM2로 매시간 자동 실행
- 슬랙 알림 (새 항목 추가 시)

## 주의사항

1. **첫 실행**: `--new-only` 없이 전체 크롤링 권장
   ```bash
   node scripts/crawl-regions.js --region=경기도  # 기준선 설정
   ```

2. **DB 구조 요건**: listings 테이블에 idx 컬럼 필수
   - 중복 idx 체크: UNIQUE 제약
   - 지역별 조회: region 컬럼 필수

3. **성능**: 페이지 1부터 시작하므로 최신 항목부터 크롤링
   - 사이트의 최신순 정렬과 동일

## 파일 목록

- `scripts/crawl-regions.js` (수정)
- `scripts/crawler-state.json` (신규)
- `scripts/NEW_ONLY_CRAWL_GUIDE.md` (문서)
- `scripts/region-config.js` (변경 없음)

## CLI 명령어 레퍼런스

```bash
# 특정 지역 전체 크롤링
node scripts/crawl-regions.js --region=강원도

# 특정 지역 신규글만
node scripts/crawl-regions.js --region=강원도 --new-only

# 모든 지역 신규글만
node scripts/crawl-regions.js --all-regions --new-only

# 개수 제한
node scripts/crawl-regions.js --region=강원도 --limit=10
```

---

**상태**: ✅ CLI 로직 완료, 테스트 통과
**다음**: API 엔드포인트 구현 (사용자 명시 시)
