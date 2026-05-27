# 관리자 신규글 크롤링 UI 구현 가이드

## 📋 개요
관리자 페이지에서 신규글만 크롤링을 실행할 수 있도록 웹 UI와 API를 구현했습니다.

## 🏗️ 구현 구조

### 1. API 엔드포인트 (`src/app/api/admin/crawl/route.ts`)
- **POST /api/admin/crawl**
- 요청: `{ region?: string, allRegions?: boolean }`
- 응답: NDJSON 스트림 (실시간 로그)

#### 동작 흐름
```
1. 요청 받음 (region 또는 allRegions)
2. child_process.spawn으로 crawl-regions.js 실행
3. stdout/stderr 수신
4. 각 라인을 JSON으로 변환
5. ReadableStream으로 클라이언트에 전송
```

#### 응답 형식 (NDJSON)
```json
{"type":"log","message":"🚀 지역별 크롤링 시작","timestamp":"2026-05-25T..."}
{"type":"log","message":"📍 설정:","timestamp":"2026-05-25T..."}
...
{"type":"complete","crawledCount":5,"skippedCount":2,"timestamp":"2026-05-25T..."}
```

### 2. 크롤러 상태 API (`src/app/api/admin/crawler-state/route.ts`)
- **GET /api/admin/crawler-state**
- 응답: `crawler-state.json` 내용
- UI에서 각 지역의 latestIdx, lastCrawledAt 표시용

### 3. 관리자 UI (`src/app/admin/crawl/page.tsx`)
- 지역 선택 드롭다운 (또는 전체 지역 체크박스)
- "신규글만 크롤링" 모드 표시 (고정)
- 크롤링 시작 버튼
- 실시간 로그 표시 (자동 스크롤)
- 지역별 상태 정보 (최신 idx, 마지막 크롤링 시간)
- 완료 통계 (신규 저장 개수, 스킵됨 개수)

## 🎯 주요 기능

### 1. 지역 선택
```
- 단일 지역: 드롭다운에서 선택
- 모든 지역: "전체 지역 선택" 체크박스
- 선택 시 현재 상태 표시
```

### 2. 실시간 로그
```
- stdout/stderr를 실시간으로 표시
- 색상 구분: 일반(회색), 에러(빨강), 완료(초록), 상태(골드)
- 자동 스크롤 (가장 최신 로그가 보임)
- 높이 제한 (h-96, 약 384px)
```

### 3. 크롤링 상태
```
- 실행 중: 버튼 비활성화 + "크롤링 진행 중..." 표시
- 완료: 통계 카드 표시 (초록 배경)
- 에러: 에러 메시지 표시 (빨강)
```

### 4. 지역별 정보
```
현재 지역 상태 (단일 지역 선택 시):
- 최신 idx: 가장 최근에 크롤링된 매물의 번호
- 누적 크롤링: 지금까지 크롤링한 매물 수
- 마지막 크롤링: 지역별 마지막 크롤링 시간
```

## 🚀 사용 방법

### 1. 단일 지역 크롤링
```
1. 드롭다운에서 "강원도" 선택
2. 화면에 다음 정보 표시:
   - 최신 idx: 171446342
   - 누적 크롤링: 12개
   - 마지막 크롤링: 2026-05-25 20:05:27
3. "크롤링 시작" 버튼 클릭
4. 로그 실시간 표시
5. 완료 후 통계 표시:
   - 신규 저장: 0개 (새로운 항목 없음)
   - 스킵됨: 1개
```

### 2. 전체 지역 크롤링
```
1. "전체 지역 선택" 체크박스 활성화
   - 드롭다운 자동 비활성화
   - 지역별 정보 미표시
2. "크롤링 시작" 클릭
3. 11개 지역을 순차적으로 크롤링
4. 각 지역별 로그 표시
5. 최종 통계 표시
```

## 📊 API 호출 예시

### 단일 지역 크롤링
```bash
curl -X POST http://localhost:3002/api/admin/crawl \
  -H "Content-Type: application/json" \
  -d '{"region":"강원도"}'
```

### 모든 지역 크롤링
```bash
curl -X POST http://localhost:3002/api/admin/crawl \
  -H "Content-Type: application/json" \
  -d '{"allRegions":true}'
```

### 응답 처리 (클라이언트 코드)
```typescript
const response = await fetch('/api/admin/crawl', {
  method: 'POST',
  body: JSON.stringify({ region: '경기도' }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const lines = decoder.decode(value).split('\n');
  lines.forEach(line => {
    if (line) {
      const log = JSON.parse(line);
      console.log(log);
    }
  });
}
```

## 🔌 API 상세 스펙

### POST /api/admin/crawl

#### 요청
```typescript
{
  region?: string;      // "강원도", "경기도" 등
  allRegions?: boolean; // true일 경우 모든 11개 지역
}
```

#### 응답 (NDJSON)
각 라인은 다음 형식의 JSON:
```typescript
{
  type: 'log' | 'error' | 'complete' | 'status';
  message?: string;           // 로그/에러 메시지
  crawledCount?: number;      // 신규 저장된 매물 수
  skippedCount?: number;      // 스킵된 매물 수
  timestamp: string;          // ISO 8601 타임스탐프
}
```

#### 에러 응답
```json
{
  "error": "지역을 지정하거나 allRegions를 true로 설정해야 합니다"
}
```
(HTTP 400)

### GET /api/admin/crawler-state

#### 응답
```json
{
  "지역명": {
    "latestIdx": 171446342,
    "latestTitle": "시장상인과 농사꾼들...",
    "lastCrawledAt": "2026-05-25T20:05:27.764Z",
    "totalCount": 12
  },
  ...
}
```

## 🎨 UI 컴포넌트 구성

```
AdminCrawlPage
├── Header
│   ├── 제목: "신규글 크롤링"
│   └── 설명
├── ControlPanel (bg-[#111111])
│   ├── 모드 표시: "신규글만 수집 모드"
│   ├── 지역 선택
│   │   ├── 전체 지역 체크박스
│   │   └── 지역 드롭다운
│   ├── 지역별 상태 정보
│   │   ├── 최신 idx
│   │   ├── 누적 크롤링
│   │   └── 마지막 크롤링 시간
│   └── 크롤링 시작 버튼
├── 완료 통계 (조건부, 초록 배경)
│   ├── 신규 저장
│   └── 스킵됨
└── 로그 출력
    └── 높이 고정, 스크롤 가능
```

## 🔐 보안

### 인증 요구사항 (향후 추가 예정)
- 현재: 보안 제한 없음 (테스트 모드)
- 향후: 관리자 인증 추가
  ```typescript
  // API에서
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  ```

## ⚠️ 주의사항

1. **동시 실행 불가**
   - 크롤링 중에 다른 크롤링 시작 불가
   - 버튼 자동 비활성화

2. **프로세스 타임아웃**
   - 브라우저 타임아웃: 일반적으로 5분 정도
   - 장시간 크롤링 시 커스텀 타임아웃 설정 필요 (향후)

3. **상태 갱신**
   - 크롤링 완료 후 자동으로 crawler-state 다시 로드
   - UI 상태 정보 자동 업데이트

## 🐛 문제 해결

### 로그가 표시되지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. 네트워크 탭에서 `/api/admin/crawl` 요청 상태 확인
3. 백엔드 로그에서 프로세스 오류 확인

### 크롤링이 시작되지 않는 경우
1. 지역이 선택되었는지 확인
2. 백엔드에서 `crawl-regions.js` 파일 존재 확인
3. Node.js 경로 확인

### 크롤링이 진행 중일 때 페이지 새로고침
- 백엔드에서는 계속 실행됨
- UI 로그만 초기화됨
- 재요청하면 새로운 크롤링 시작

## 📈 향후 개선 사항

1. **프로세스 취소**
   - 진행 중인 크롤링 중단 버튼
   - SIGTERM 신호 전송

2. **스케줄링**
   - 정기적 자동 실행 (예: 매 1시간)
   - 크론 설정 UI

3. **이력 관리**
   - 크롤링 이력 저장 (DB)
   - 지역별 이력 조회

4. **고급 옵션**
   - limit 설정
   - 이미지 다운로드 옵션
   - 필터 설정

## 📝 파일 목록

- `src/app/api/admin/crawl/route.ts` - 크롤링 API
- `src/app/api/admin/crawler-state/route.ts` - 상태 조회 API
- `src/app/admin/crawl/page.tsx` - 관리자 UI
- `src/app/admin/page.tsx` (수정) - 대시보드에 링크 추가

---

**상태**: ✅ 관리자 UI & API 구현 완료
**다음**: 자동 스케줄링 (선택사항)
