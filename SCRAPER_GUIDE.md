# PC천국 자동 크롤링 시스템 설정 가이드

## 개요
이 시스템은 PC천국의 매물을 자동으로 크롤링하여 당신의 사이트에 등록합니다.

## 파일 구조
```
scripts/
├── scraper.js              # 메인 크롤링 스크립트
├── setup-scheduler.bat     # Windows Task Scheduler 등록 배치
└── scraper.log             # 실행 로그 (자동 생성)
```

## 설치 순서

### 1단계: 필수 라이브러리 확인
프로젝트 디렉토리에서 다음을 실행했는지 확인:
```bash
npm install cheerio axios playwright
npx playwright install
```

### 2단계: 스크립트 설정
`scripts/scraper.js` 파일을 열어서 필요한 부분을 수정:

```javascript
const CONFIG = {
  headless: true,              // true: 브라우저 보이지 않음, false: 보임
  timeout: 30000,              // 타임아웃 (밀리초)
  startPage: 1,                // 시작 페이지
  endPage: 8,                  // 끝 페이지
};
```

### 3단계: Windows Task Scheduler 등록

#### 방법 1: 자동 등록 (추천)
1. `scripts/setup-scheduler.bat` 파일을 **우클릭**
2. **"관리자 권한으로 실행"** 선택
3. 실행 시간 입력 (예: 09:00)
4. 완료!

#### 방법 2: 수동 등록
1. Windows 작업 스케줄러 열기
   - 시작 메뉴에서 "작업 스케줄러" 검색
2. 오른쪽 패널에서 "기본 작업 만들기..." 클릭
3. 다음 정보 입력:
   - **이름**: PCBang-Auto-Scraper
   - **설명**: PC천국 매물 자동 크롤링

4. 트리거 설정:
   - **시작**: 일정
   - **되풀이**: 매일
   - **시간**: 원하는 시간 (예: 09:00 AM)

5. 작업 설정:
   - **프로그램/스크립트**: `C:\Users\B\Desktop\aass\node_modules\.bin\node.exe`
   - **인수 추가**: `C:\Users\B\Desktop\aass\scripts\scraper.js`
   - **시작 위치**: `C:\Users\B\Desktop\aass\scripts`

## 실행 및 모니터링

### 즉시 실행 테스트
```bash
node C:\Users\B\Desktop\aass\scripts\scraper.js
```

또는 Task Scheduler에서:
- 작업 찾기: PCBang-Auto-Scraper
- 우클릭 → **실행** 클릭

### 로그 확인
```
C:\Users\B\Desktop\aass\scripts\scraper.log
```

로그 파일에는 다음 정보가 기록됩니다:
- 실행 시간
- 스크래핑 성공/실패
- 추가된 매물 개수
- 오류 메시지

### 예시 로그
```
[2026. 5. 18. AM 09:00:00] [INFO] 크롤링 프로그램 시작
[2026. 5. 18. AM 09:00:01] [INFO] 설정: 페이지 1-8
[2026. 5. 18. AM 09:00:02] [INFO] 브라우저 시작 중...
[2026. 5. 18. AM 09:00:15] [INFO] Supabase 크롤링 API 호출 중...
[2026. 5. 18. AM 09:00:25] [SUCCESS] ✓ 크롤링 성공: 10개 매물 추가됨, 5개 중복 제외
```

## 트러블슈팅

### "크롤링이 0개 매물을 찾음"
- **원인**: 사이트 구조가 변경되었거나 셀렉터가 맞지 않음
- **해결**: 크롤러 로직 재검토 또는 개발자 문의

### "Task Scheduler에서 실행 안 됨"
- **확인사항**:
  1. 관리자 권한으로 `setup-scheduler.bat` 실행했는가?
  2. Node.js 설치 경로가 올바른가?
  3. 작업 스케줄러에서 작업 상태 확인 (마지막 실행 결과)

### "포트 3000 오류"
- **원인**: Next.js 개발 서버가 실행 중이지 않음
- **해결**: 먼저 웹 서버를 시작: `npm run dev`

## 고급 설정

### 실행 빈도 변경
Task Scheduler에서:
1. PCBang-Auto-Scraper 작업 우클릭
2. **속성** 클릭
3. **트리거** 탭 → **편집**
4. **고급 설정** 확인:
   - 매일 실행
   - 매주 실행 (요일 선택)
   - 매월 실행

### 여러 지역 크롤링
각 지역마다 별도의 작업 생성:
```bash
# 서울
startPage: 1, endPage: 2

# 경기
startPage: 3, endPage: 4

# 기타
```

### 더 자주 실행
```javascript
// 3시간마다 실행하려면:
// Task Scheduler → 고급 설정에서 반복 간격 설정
```

## 자동 삭제 (선택사항)

### 중복 매물 자동 제거
이미 API에서 중복 확인 로직이 있으므로, 기존 매물은 자동으로 제외됩니다.

### 오래된 로그 정리
주간 1회 로그 파일 정리 작업 추가:
```bash
# setup-cleanup.bat 생성 후 스케줄링
```

## 데이터 검증

### 추가된 매물 확인
1. 사이트에 로그인
2. `/listings` 페이지에서 최신 매물 확인
3. 관리자 대시보드에서 "활성 매물" 개수 확인

## 문제 해결 체크리스트

- [ ] 모든 라이브러리 설치됨
- [ ] Playwright 브라우저 다운로드됨 (`npx playwright install`)
- [ ] Task Scheduler 등록됨
- [ ] 테스트 실행 성공 (`node scraper.js`)
- [ ] 로그 파일 생성됨
- [ ] 매물이 실제로 추가됨

## 지원

문제가 발생하면:
1. 로그 파일 확인
2. 수동으로 스크립트 실행해서 에러 메시지 확인
3. 개발자에게 로그 파일과 함께 보고

---

**마지막 업데이트**: 2026-05-18
