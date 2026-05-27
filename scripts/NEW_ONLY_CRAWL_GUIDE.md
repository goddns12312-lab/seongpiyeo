# 신규글만 크롤링 (New-Only Crawl) 가이드

## 개요
`--new-only` 플래그를 사용하면 지역별로 이미 수집된 최신 매물 이후의 새로운 항목만 크롤링할 수 있습니다.

## 크롤러 상태 추적
`scripts/crawler-state.json` 파일에서 각 지역의 상태를 추적합니다:
- `latestIdx`: 가장 최근에 크롤링된 매물의 idx
- `lastCrawledAt`: 마지막 크롤링 시간
- `totalCount`: 누적 크롤링 매물 수

## 기본 사용법

### 1. 특정 지역 전체 크롤링 (상태 저장)
```bash
node scripts/crawl-regions.js --region=강원도
```
결과:
- 강원도의 모든 페이지를 크롤링
- 유효한 매물들을 DB에 저장
- 최고 idx를 `crawler-state.json`에 저장

### 2. 특정 지역 신규글만 크롤링 (기준선부터 시작)
```bash
node scripts/crawl-regions.js --region=서울 --new-only
```
동작:
1. DB에서 현재 지역의 최신 idx 조회 (status='active' 필터)
2. 페이지 1부터 시작하여 크롤링
3. 각 게시글 idx와 DB 최신 idx 비교
4. **새로운 항목 (idx > DB최신)**: 계속 크롤링
5. **기존 항목 (idx ≤ DB최신)**: 루프 종료
6. 성공 시 `crawler-state.json` 업데이트

### 3. 모든 지역 신규글만 크롤링
```bash
node scripts/crawl-regions.js --all-regions --new-only
```

### 4. 모든 지역 전체 크롤링
```bash
node scripts/crawl-regions.js --all-regions
```

## 제한 옵션

### 개별 항목 개수 제한
```bash
node scripts/crawl-regions.js --region=경기도 --limit=10
```
- 최대 10개 매물만 크롤링 후 종료
- 글로벌 제한이므로 모든 지역에 적용됨

## 로그 해석

### 신규글만 크롤링 시작
```
📍 현재 DB 최신: idx=171425928, title="시장상인과 농사꾼들..."
```
- DB에 저장된 최신 매물의 idx와 제목을 표시

### 기존 항목 발견 시 (루프 종료)
```
⏹️  기존 항목 발견: idx=171425928 <= DB최신=171425928
→ 페이지 루프 종료 (이전 크롤링 범위 도달)
```
- 더 이상 새로운 항목이 없으므로 중단

### 크롤러 상태 업데이트
```
✅ 강원도 크롤러 상태 업데이트: latestIdx=171446342, totalCount=12
```
- 크롤링 완료 후 상태 파일 업데이트 성공

## 예상 시나리오

### 시나리오 1: 처음 지역 크롤링
```bash
node scripts/crawl-regions.js --region=강원도
# → crawler-state.json의 강원도 latestIdx가 설정됨
```

### 시나리오 2: 새로운 매물이 추가된 경우
```bash
# 1시간 후, 강원도에 3개의 새로운 매물 추가됨
node scripts/crawl-regions.js --region=강원도 --new-only
# → 3개만 크롤링하고 중단
# → latestIdx가 가장 최신의 새 idx로 업데이트됨
```

### 시나리오 3: 새로운 매물이 없는 경우
```bash
node scripts/crawl-regions.js --region=강원도 --new-only
# → 페이지 1의 첫 번째 매물 = 이미 DB의 최신 매물
# → 즉시 루프 종료
# → 크롤링됨: 0개, 스킵됨: 1개
```

## 향후 기능 (아직 구현 안됨)
- API 엔드포인트: `/api/crawl?region=강원도&mode=new-only`
- 관리자 UI: 웹 인터페이스에서 크롤링 트리거

## 주의사항
- `--new-only` 플래그는 크롤러 상태(`crawler-state.json`)가 이미 초기화된 상태에서만 의미가 있습니다
- 첫 번째 실행은 `--new-only` 없이 전체 크롤링을 권장합니다
- DB 최신 idx는 `listings` 테이블에서 `region=지역명, status='active'` 조건으로 조회됩니다
