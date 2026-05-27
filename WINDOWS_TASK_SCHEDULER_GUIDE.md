# Windows 작업 스케줄러 자동 크롤링 설정 가이드

## 📋 개요

Windows 서버에서 작업 스케줄러를 사용하여 매시간 자동으로 신규글을 크롤링합니다.

## 🛠️ 준비 사항

### 1. Node.js 설치 확인

```powershell
node --version
npm --version
```

### 2. 배치 파일 준비

`scripts/auto-crawl.bat` 파일이 있는지 확인

### 3. 로그 디렉토리 생성

```powershell
New-Item -ItemType Directory -Path "C:\path\to\scripts\logs" -Force
```

## 📅 작업 스케줄러 설정

### 단계 1: 작업 스케줄러 열기

#### 방법 A: GUI (권장)
1. Windows 시작 메뉴에서 "작업 스케줄러" 검색
2. "작업 스케줄러" 실행

#### 방법 B: PowerShell
```powershell
taskschd.msc
```

#### 방법 C: 명령 프롬프트
```cmd
taskkill /IM tasksched.exe /F
taskschd.msc
```

### 단계 2: 새 작업 만들기

1. 오른쪽 패널에서 "작업 만들기" 클릭
2. "일반" 탭에서 설정:
   - **이름**: `PC방 신규글 자동 크롤링`
   - **설명**: `매시간 신규 매물만 자동으로 크롤링합니다`
   - **보안 옵션**:
     - ✓ 사용자가 로그온되어 있지 않아도 실행
     - ✓ 최고 권한으로 실행

### 단계 3: 트리거 설정

1. "트리거" 탭 클릭
2. "새로 만들기" 버튼 클릭
3. 설정:
   - **트리거 시작 방식**: `일정`
   - **반복**: `매일`
   - **시간**: 실행 시간 선택
   - **반복 간격**: `1시간`
   - **반복 기간**: `무제한`

#### 옵션 A: 매시간 정각 실행
```
- 시작 시간: 00:00:00
- 반복 간격: 1시간
- 지속 기간: 23:59:59 (거의 하루 종일)
```

#### 옵션 B: 특정 시간에만 실행
```
- 시작 시간: 03:00:00 (오전 3시)
- 반복 간격: 3시간
- 반복 시간: 03:00, 06:00, 09:00, ..., 00:00
```

### 단계 4: 작업 설정

1. "작업" 탭 클릭
2. "새로 만들기" 버튼 클릭
3. 설정:
   - **동작**: `프로그램 시작`
   - **프로그램/스크립트**: 
     ```
     C:\path\to\scripts\auto-crawl.bat
     ```
   - **시작 위치** (선택):
     ```
     C:\path\to\scripts
     ```

### 단계 5: 조건 설정 (선택)

"조건" 탭에서:
- ☐ 컴퓨터가 유휴 상태인 경우에만 실행
- ☐ 컴퓨터를 절전 모드에서 깨우기
- ☐ 네트워크 연결이 필요함 (필요시)

### 단계 6: 설정

"설정" 탭에서:
- ✓ 작업이 실패한 경우 다시 시도
  - 재시도 간격: `5분`
  - 재시도 횟수: `3회`
- ☐ 작업이 이미 실행 중인 경우 새 인스턴스를 시작하지 않음
- ☐ 작업 시간 제한: `1시간` (필요시)

### 단계 7: 저장

1. "확인" 버튼 클릭
2. 관리자 비밀번호 입력 (필요시)
3. 작업이 목록에 추가됨 확인

## 🔍 작업 상태 확인

### GUI에서 확인
1. 작업 스케줄러 열기
2. 왼쪽 트리에서 "작업 스케줄러 라이브러리" → "Microsoft" 또는 루트 폴더
3. 작업 목록에서 "PC방 신규글 자동 크롤링" 찾기
4. 마우스 우클릭 → "실행" 또는 "속성" 확인

### PowerShell에서 확인
```powershell
# 작업 목록 조회
Get-ScheduledTask -TaskName "PC방 신규글 자동 크롤링"

# 마지막 실행 결과
Get-ScheduledTaskInfo -TaskName "PC방 신규글 자동 크롤링"

# 실행 기록
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" `
  -FilterXPath "*[System[Provider[@Name='Microsoft-Windows-TaskScheduler/Operational'] and EventID=201]]" | 
  Where-Object { $_.Message -match "PC방 신규글" } | 
  Select-Object TimeCreated, Message -First 10
```

## 📊 로그 확인

### 로그 파일 위치
```
C:\path\to\scripts\logs\auto-crawl-YYYY-MM-DD.log
```

### 로그 파일 보기
```powershell
# 최신 로그 확인
Get-Content "C:\path\to\scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log" -Tail 30

# 실시간 로그 추적
Get-Content "C:\path\to\scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log" -Wait -Tail 20
```

## 🧪 테스트

### 1단계: 수동 실행

```powershell
# PowerShell에서
C:\path\to\scripts\auto-crawl.bat

# 또는
cmd /c "C:\path\to\scripts\auto-crawl.bat"
```

### 2단계: 로그 확인

```powershell
Get-Content "C:\path\to\scripts\logs\auto-crawl-$(Get-Date -Format 'yyyy-MM-dd').log"
```

### 3단계: 작업 스케줄러에서 수동 실행

1. 작업 스케줄러 열기
2. 작업 찾기
3. 마우스 우클릭 → "실행"
4. 상태 확인 (완료/실패)

## 🐛 문제 해결

### 문제 1: 작업이 실행되지 않음

**확인 사항**:
- [ ] 작업이 활성화되어 있는가?
- [ ] 트리거 시간이 올바른가?
- [ ] 배치 파일 경로가 정확한가?
- [ ] Node.js가 설치되어 있는가?

**진단**:
```powershell
# 작업 상태 확인
Get-ScheduledTask -TaskName "PC방 신규글 자동 크롤링" | Select-Object State

# 마지막 실행 시간 확인
Get-ScheduledTaskInfo -TaskName "PC방 신규글 자동 크롤링" | Select-Object LastRunTime, LastTaskResult

# 결과 코드 확인
# 0: 성공
# 1: 실패
# 2: 작업 찾을 수 없음
# 3: 접근 권한 없음
```

**해결 방법**:
```powershell
# 작업 활성화
Enable-ScheduledTask -TaskName "PC방 신규글 자동 크롤링"

# 작업 비활성화 (테스트 중)
Disable-ScheduledTask -TaskName "PC방 신규글 자동 크롤링"

# 작업 다시 실행
Start-ScheduledTask -TaskName "PC방 신규글 자동 크롤링"
```

### 문제 2: 로그 파일이 생성되지 않음

**원인**:
- 로그 디렉토리가 없음
- 쓰기 권한 없음
- 배치 파일 실행 실패

**해결**:
```powershell
# 로그 디렉토리 생성
New-Item -ItemType Directory -Path "C:\path\to\scripts\logs" -Force

# 권한 확인 및 설정
$acl = Get-Acl "C:\path\to\scripts\logs"
$acl | Format-List
```

### 문제 3: "0x1" 오류

**의미**: 프로그램이 오류로 종료됨

**확인**:
```powershell
# 배치 파일을 cmd.exe로 실행
cmd /c "C:\path\to\scripts\auto-crawl.bat"

# 로그 확인
Get-Content "C:\path\to\scripts\logs\auto-crawl-*.log" -Tail 50
```

### 문제 4: 중복 실행 방지가 안됨

**원인**: lock 파일이 제거되지 않음

**확인**:
```powershell
Get-ChildItem "C:\path\to\scripts\.auto-crawl.lock"

# Lock 파일 수동 제거
Remove-Item "C:\path\to\scripts\.auto-crawl.lock" -Force -ErrorAction Ignore
```

## 📈 모니터링

### Windows Event Log 확인

```powershell
# 마지막 20개 이벤트
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" -MaxEvents 20 | 
  Format-Table TimeCreated, Id, Message

# 작업 실패 이벤트만
Get-WinEvent -LogName "Microsoft-Windows-TaskScheduler/Operational" |
  Where-Object { $_.Id -eq 203 } |
  Format-Table TimeCreated, Message -AutoSize
```

### 이메일 알림 (선택)

1. 작업 속성 → "조건" 탭
2. "작업이 실패한 경우" 옆에 "작업 완료" 설정
3. 별도의 배치/PowerShell 스크립트로 이메일 발송

## ✅ 설정 체크리스트

Windows에서:
- [ ] Node.js v18 이상 설치
- [ ] auto-crawl.bat 파일 생성
- [ ] 로그 디렉토리 생성
- [ ] 작업 스케줄러에서 작업 생성
- [ ] 수동 테스트 성공
- [ ] 로그 파일 생성 확인
- [ ] 중복 실행 방지 확인
- [ ] 정기 실행 확인 (24시간 대기)

## 🚀 설정 예시

### 표준 설정 (매시간 정각)
```
프로그램/스크립트: C:\Users\ubuntu\pc-bang\scripts\auto-crawl.bat
시작 위치: C:\Users\ubuntu\pc-bang\scripts
트리거: 매일 00:00:00부터 1시간 간격
```

### 개발 환경 (30분마다)
```
프로그램/스크립트: C:\Users\dev\pc-bang\scripts\auto-crawl.bat
시작 위치: C:\Users\dev\pc-bang\scripts
트리거: 매일 00:00:00부터 30분 간격
```

### 프로덕션 (밤 3시만)
```
프로그램/스크립트: C:\Users\ubuntu\pc-bang\scripts\auto-crawl.bat
시작 위치: C:\Users\ubuntu\pc-bang\scripts
트리거: 매일 03:00:00, 반복 없음
```

## 📚 참고 자료

- [Microsoft Task Scheduler Documentation](https://docs.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)
- [PowerShell ScheduledTask Module](https://docs.microsoft.com/en-us/powershell/module/scheduledtasks)
- [Event Viewer for Task Scheduler Logs](https://docs.microsoft.com/en-us/windows/win32/taskschd/event-viewer)

---

**상태**: ✅ Windows 설정 완료
**테스트**: 🧪 작업 스케줄러에서 수동 실행 후 확인
**모니터링**: 📊 로그 파일과 Event Viewer로 추적
