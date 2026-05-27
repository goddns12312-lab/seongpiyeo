# Description 필드 UI 수정 완료

## 문제 분석
description 필드에 facilities 데이터가 저장되어 있었습니다.
- 예: `PC7대,에어컨1대,냉난방기1대,...` (시설 정보)
- 원래 목표: `2차선대로변 이라서 손님은 꾸준히 있구요. 주차가능합니다...` (사용자 작성 텍스트)

## 근본 원인
`scripts/auto-scraper.js`의 `extractPostDetails` 함수에서 12항목 이후의 자유문장을 제대로 추출하지 못했습니다.
- 잘못된 정규식: `/^\\d+\\.\\s*[가-힣]/` (리터럴 백슬래시로 인한 오류)
- 잘못된 로직: `descriptionStartIdx` 설정 불완전

## 수정 사항

### 1. ✅ auto-scraper.js 수정
**파일**: `scripts/auto-scraper.js` (라인 259-330)

**변경 내용**:
- `lastItemIndex` 추적 방식으로 변경: 마지막으로 찾은 12항목의 라인 위치 기록
- 정규식 수정: `/^\\d+\\.\\s*[가-힣]/` → `/^\d+\.\s*[가-힣]/`
- 라인 조인 방식 개선: `join(' ')` → `join('\n')` (줄바꿈 보존)

### 2. ✅ 데이터베이스 초기화 (2026-05-18)
**스크립트**: `scripts/clear-description-fields.js`

모든 5개 매물의 description 필드를 초기화했습니다:
```
✅ 남구로역 5번출구 판매합니다
✅ 상계동(수락산역 근처) 성인 PC방 매물 등록합니다.
✅ 서울 동대문구pc
✅ 성인PC방 매매
✅ 강서구화곡동
```

**현재 상태**:
- description: NULL (사용자 작성 텍스트로 채워질 예정)
- facilities: 시설정보 (PC7대,에어컨1대,... 등)

### 3. ✅ 상세 페이지 UI 수정
**파일**: `src/app/listings/[id]/page.tsx`

**변경 사항**:

#### 매물강점(Facilities) 표시 개선
- 불필요한 emoji 매핑 로직 제거
- 텍스트 기반 시설정보를 칩/태그로 표시
- 각 시설명을 쉼표로 구분하여 개별 태그로 표시

```tsx
// Before: emoji 매핑 시도
{listing.facilities.split(',').map((facility) => {
  const emojiData = STRENGTH_EMOJIS.find(item => item.emoji === trimmed);
  return <span>{trimmed} {emojiData?.label}</span>;
})}

// After: 텍스트 직접 표시
{listing.facilities.split(',').map((facility) => (
  <span className="bg-gold/20 border border-gold/30 text-gold px-3 py-1 rounded-full text-sm">
    {facility.trim()}
  </span>
))}
```

#### Description 섹션
- 조건부 렌더링: description이 있을 때만 표시
- `whitespace-pre-wrap` 사용으로 원본 줄바꿈 보존
- 현재는 모든 매물이 NULL이므로 표시 안 됨

## 다음 단계

### 1단계: 올바른 description 데이터 재추출
```bash
# 수정된 auto-scraper.js로 재스크래핑
node scripts/auto-scraper.js --update
```

### 2단계: Supabase 재임포트
```bash
npm run import
# 또는
node scripts/import-to-supabase.js
```

## 검증 방법

### UI 확인
```bash
npm run dev
→ http://localhost:3001/listings/[id]
→ 상세 페이지에서:
  - 매물강점: 시설정보가 태그로 표시 (예: PC7대, 에어컨1대, ...)
  - 설명: 사용자가 작성한 자유문장 표시 (또는 비어있음)
```

### 데이터베이스 검증
```bash
node scripts/check-description-fields.js
# 결과:
# ✅ Description (설명): (사용자 텍스트 또는 없음)
# ✅ Facilities (매물강점): 시설정보 (PC7대, 에어컨1대, ...)
```

## 파일 변경 요약

| 파일 | 변경사항 | 상태 |
|------|--------|------|
| scripts/auto-scraper.js | extractPostDetails 함수 수정 (description 추출 로직 개선) | ✅ 완료 |
| scripts/clear-description-fields.js | 신규 - 기존 데이터 초기화 | ✅ 실행완료 |
| src/app/listings/[id]/page.tsx | 매물강점 표시 로직 개선, STRENGTH_EMOJIS 제거 | ✅ 완료 |

## 주의사항

⚠️ **아직 해야할 일**:
1. auto-scraper.js가 이미지 추출 실패로 인해 현재 새 데이터를 저장하지 못하고 있습니다.
2. 이미지 필터링 로직 재검토 필요
3. 이 문제 해결 후 --update 플래그로 기존 데이터 덮어쓰기

---

**최종 업데이트**: 2026-05-18
**상태**: description/facilities 분리 완료, UI 수정 완료, 데이터 초기화 완료
**다음**: 이미지 추출 문제 해결 후 재스크래핑
