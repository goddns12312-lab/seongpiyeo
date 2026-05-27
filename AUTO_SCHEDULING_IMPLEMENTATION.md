# ✅ Phase 3: 자동 스케줄링 구현 완료

## 📦 구현 내용

### 생성된 파일

1. **Linux/Mac용 스크립트**
   - `scripts/auto-crawl.sh` - Bash 스크립트
   - 기능:
     - 중복 실행 방지 (lock file)
     - 실시간 로그 저장
     - 실행 시간 측정
     - 신규글 개수 통계

2. **Windows용 스크립트**
   - `scripts/auto-crawl.bat` - Batch 파일
   - 작업 스케줄러 호환

3. **설정 문서**
   - `CRON_SETUP_GUIDE.md` - Linux/Mac Cron 설정
   - `WINDOWS_TASK_SCHEDULER_GUIDE.md` - Windows 작업 스케줄러 설정

## 🎯 구현된 요구사항

| 요구사항 | 구현 |
|---------|------|
| 1. scripts/auto-crawl.sh 생성 | ✅ |
| 2. 내부적으로 node crawl-regions.js 실행 | ✅ |
| 3. cron 설정 문서 작성 | ✅ |
| 4. 실패 로그 저장 | ✅ |
| 5. 성공 로그 저장 | ✅ |
| 6. 중복 실행 방지 (lock file) | ✅ |
| 7. 실행 시간 측정 | ✅ |
| 8. 신규글 개수 로그 출력 | ✅ |

## 🏗️ 기술 구현

### Linux/Mac (auto-crawl.sh)

**기능**:
```bash
1. 로그 디렉토리 자동 생성
2. Lock file로 중복 실행 방지
   - 30분 이상 유지 시 자동 강제 진행
3. child_process로 crawl-regions.js 실행
   - --all-regions --new-only 플래그
4. stdout/stderr 수집 및 로그 저장
5. 신규글/스킵 개수 추출 및 표시
6. 실행 시간 계산 (시간:분:초 형식)
7. 완료 후 lock file 자동 제거
```

**로그 위치**:
```
scripts/logs/auto-crawl-YYYY-MM-DD.log
```

### Windows (auto-crawl.bat)

**기능**:
```batch
1. 로그 디렉토리 자동 생성
2. Lock file로 중복 실행 방지
3. Node.js 실행 및 결과 로그 저장
4. 에러 처리 및 로그 기록
5. Lock file 제거
```

**사용 방법**:
```
Windows 작업 스케줄러에서 정기적으로 실행
```

## 📊 로그 형식

### 성공 로그 예시

```
2026-05-26 03:00:00 [INFO] ======================================================================
2026-05-26 03:00:00 [INFO] 신규글 자동 크롤링 시작: 2026-05-26 03:00:00
2026-05-26 03:00:00 [INFO] ======================================================================
2026-05-26 03:00:01 [INFO] Lock file 생성됨: /path/to/scripts/.auto-crawl.lock
2026-05-26 03:00:01 [INFO] Node.js 버전: v18.16.0
2026-05-26 03:00:01 [INFO] 크롤링 스크립트: /path/to/scripts/crawl-regions.js
2026-05-26 03:00:01 [INFO] 모드: 신규글만 수집 (--all-regions --new-only)
2026-05-26 03:00:01 [INFO] 
2026-05-26 03:00:02 [INFO] 크롤링 상세 로그:
2026-05-26 03:00:02 [INFO]   🚀 지역별 크롤링 시작
2026-05-26 03:00:02 [INFO]   📍 설정:
2026-05-26 03:00:02 [INFO]      범위: 전체 지역 (11개)
...
2026-05-26 03:05:30 [SUCCESS] 크롤링 완료
2026-05-26 03:05:31 [INFO] 
2026-05-26 03:05:31 [INFO] ======================================================================
2026-05-26 03:05:31 [INFO] 완료 통계:
2026-05-26 03:05:31 [INFO]   - 신규 저장: 12개
2026-05-26 03:05:31 [INFO]   - 스킵됨: 45개
2026-05-26 03:05:31 [INFO]   - 실행 시간: 5분 30초
2026-05-26 03:05:31 [INFO] ======================================================================
2026-05-26 03:05:32 [INFO] Lock file 제거됨
```

### 에러 로그 예시

```
2026-05-26 04:00:00 [INFO] ======================================================================
2026-05-26 04:00:00 [INFO] 신규글 자동 크롤링 시작: 2026-05-26 04:00:00
2026-05-26 04:00:00 [INFO] ======================================================================
2026-05-26 04:00:00 [WARN] 다른 크롤링이 진행 중입니다. 건너뜁니다.
```

## 🚀 설정 방법

### Linux/Mac (Cron)

#### 1단계: 스크립트 권한 설정
```bash
chmod +x /path/to/scripts/auto-crawl.sh
```

#### 2단계: Crontab 편집
```bash
crontab -e
```

#### 3단계: 설정 추가
```bash
# 매시간 정각 실행
0 * * * * /path/to/scripts/auto-crawl.sh

# 매시간 + 로그 저장
0 * * * * /path/to/scripts/auto-crawl.sh >> /path/to/scripts/logs/cron.log 2>&1

# 매일 오전 3시만 실행
0 3 * * * /path/to/scripts/auto-crawl.sh

# 매 30분마다 실행
*/30 * * * * /path/to/scripts/auto-crawl.sh
```

#### 4단계: 설정 확인
```bash
crontab -l
```

### Windows (작업 스케줄러)

#### 1단계: 작업 스케줄러 열기
```
시작 메뉴 → "작업 스케줄러" 검색
```

#### 2단계: 새 작업 만들기
- 이름: `PC방 신규글 자동 크롤링`
- 최고 권한으로 실행: ✓
- 사용자가 로그온되지 않아도 실행: ✓

#### 3단계: 트리거 설정
- 시작: 매시간 정각 (또는 선택한 시간)
- 반복: 1시간 (또는 선택한 간격)

#### 4단계: 작업 설정
- 프로그램: `C:\path\to\scripts\auto-crawl.bat`
- 시작 위치: `C:\path\to\scripts`

#### 5단계: 저장

## 📈 모니터링

### 로그 확인 (Linux/Mac)
```bash
# 최신 로그 확인
tail -f scripts/logs/auto-crawl-$(date +%Y-%m-%d).log

# 실시간 모니터링
watch -n 1 "tail -20 scripts/logs/auto-crawl-\$(date +\%Y-\%m-\%d).log"
```

### 로그 확인 (Windows)
```powershell
# 최신 로그 확인
Get-Content "scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 30

# 실시간 모니터링
Get-Content "scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log" -Wait -Tail 20
```

### Cron 시스템 로그 (Linux)
```bash
# CentOS/RHEL
grep CRON /var/log/cron

# Ubuntu/Debian
sudo journalctl -u cron

# 마지막 10개 항목
sudo journalctl -u cron -n 10
```

## 🔐 중복 실행 방지

### Lock File 메커니즘

```
시작 → Lock file 존재? → 없음 → 생성 → 크롤링 → 삭제
           ↓
        30분 이상?
           ↓
         예 → 강제 진행 (크래시 복구)
           ↓
         아니오 → 종료
```

**Lock file 위치**: `scripts/.auto-crawl.lock`

**30분 규칙**: 이전 프로세스가 크래시되었을 가능성이 있으므로 자동 복구

## 🧪 테스트 방법

### Linux/Mac 테스트

#### 1단계: 수동 실행
```bash
./scripts/auto-crawl.sh
```

#### 2단계: 로그 확인
```bash
cat scripts/logs/auto-crawl-$(date +%Y-%m-%d).log
```

#### 3단계: Cron 설정
```bash
crontab -e
# 추가: 0 * * * * /absolute/path/to/scripts/auto-crawl.sh
```

#### 4단계: 정기 실행 확인
```bash
# 다음 시간 정각까지 기다린 후
crontab -l
tail -f scripts/logs/auto-crawl-$(date +%Y-%m-%d).log
```

### Windows 테스트

#### 1단계: 수동 실행
```powershell
C:\path\to\scripts\auto-crawl.bat
```

#### 2단계: 로그 확인
```powershell
Get-Content "C:\path\to\scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log"
```

#### 3단계: 작업 스케줄러에서 수동 실행
- 작업 스케줄러 열기
- 작업 찾기
- 우클릭 → "실행"

#### 4단계: 정기 실행 확인
```powershell
Get-ScheduledTaskInfo -TaskName "PC방 신규글 자동 크롤링" | 
  Select-Object LastRunTime, LastTaskResult
```

## ⚙️ 실행 전략

### 전략 1: 매시간 (권장)
```
매시간 00분에 신규글 크롤링
- 장점: 가장 최신 유지
- 단점: 리소스 지속 사용
```

### 전략 2: 업무 시간 (8시~20시)
```
매일 08:00, 09:00, ..., 20:00에 실행
- 장점: 리소스 절감
- 단점: 야간/주말 항목 누락
```

### 전략 3: 오프피크 (야간)
```
매일 00:00, 03:00, 06:00에 실행
- 장점: 서버 부하 최소화
- 단점: 신규 항목 발견 지연
```

### 전략 4: 30분 간격 (고빈도)
```
매 30분마다 실행
- 장점: 거의 실시간 발견
- 단점: 리소스 많이 사용
```

## 📝 파일 목록

| 파일 | 설명 |
|------|------|
| `scripts/auto-crawl.sh` | Linux/Mac 자동 크롤링 스크립트 |
| `scripts/auto-crawl.bat` | Windows 자동 크롤링 스크립트 |
| `CRON_SETUP_GUIDE.md` | Linux/Mac Cron 설정 가이드 |
| `WINDOWS_TASK_SCHEDULER_GUIDE.md` | Windows 작업 스케줄러 설정 가이드 |
| `scripts/logs/` | 로그 디렉토리 (자동 생성) |
| `scripts/.auto-crawl.lock` | Lock file (중복 실행 방지) |

## 🔄 CLI/UI/자동화 통합

```
┌─────────────────────────────────────┐
│   CLI                               │
│  ./scripts/crawl-regions.js         │
│  --region=강원도 --new-only         │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   UI (관리자 페이지)                 │
│  /admin/crawl                       │
│  POST /api/admin/crawl              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│   자동화 (Cron/Task Scheduler)      │
│  ./scripts/auto-crawl.sh            │
│  --all-regions --new-only (자동)    │
└─────────────────────────────────────┘
```

## 📊 성능 예상치

| 시나리오 | 실행 시간 | 신규글 개수 |
|---------|----------|-----------|
| 신규글 없음 | 1~2분 | 0~5개 |
| 신규글 약간 | 3~5분 | 5~20개 |
| 신규글 많음 | 5~10분 | 20~50개 |

## ✅ 설정 체크리스트

- [ ] Node.js v18 이상 설치
- [ ] auto-crawl.sh (Linux) 또는 auto-crawl.bat (Windows) 준비
- [ ] 스크립트 권한 설정 (Linux: chmod +x)
- [ ] 로그 디렉토리 생성
- [ ] 수동 테스트 성공
- [ ] 스케줄 설정 (Cron 또는 Task Scheduler)
- [ ] 정기 실행 확인 (24시간 대기)
- [ ] 로그 모니터링 설정

## 🎓 학습 포인트

### 구현 기술
1. **Bash Scripting** - 크로스 플랫폼 자동화
2. **Lock File Pattern** - 동시성 제어
3. **Log Management** - 날짜별 자동 로깅
4. **Process Management** - 실행 시간 측정

### 시스템 통합
1. **Cron** - Linux 정기 작업
2. **Task Scheduler** - Windows 정기 작업
3. **Signal Handling** - 프로세스 정상 종료

## 🚀 다음 단계

### 선택사항
- [ ] Slack 알림 추가
- [ ] Email 알림 추가
- [ ] 로그 순환 설정 (매월 이전 로그 삭제)
- [ ] 모니터링 대시보드

---

**상태**: ✅ Phase 3 완료
**테스트**: 🧪 수동 실행 후 스케줄 설정
**배포**: 📦 Linux 또는 Windows 선택하여 구성
**모니터링**: 📊 로그 파일로 자동 추적

## 최종 요약

✅ **완전한 자동화 파이프라인 구현**
- CLI 방식: 수동 사용 가능
- UI 방식: 웹 기반 관리 가능
- 자동화 방식: Cron/Task Scheduler로 정기 실행

✅ **중복 실행 방지** - Lock file 메커니즘

✅ **상세한 로그** - 성공/실패 모두 기록

✅ **실행 시간 측정** - 성능 모니터링

✅ **신규글 개수 통계** - 자동 추출 및 로그

✅ **크로스 플랫폼** - Linux, Mac, Windows 모두 지원
