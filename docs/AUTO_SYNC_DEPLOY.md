# 자동 동기화 배포 가이드

크롤링 대상 사이트의 매물을 Supabase에 자동으로 동기화하는 파이프라인 배포 가이드입니다.

## 🎯 동기화 구조

```
1️⃣  초기 세팅 (처음 한 번)
   node scripts/full-backfill.js
   → 모든 매물을 수집 (끝페이지 → 1페이지)
   → Supabase에 전부 업로드
   → 신규는 status='active', 기존은 update
   → 실행 시간: 5-10분

2️⃣  자동 운영 (1시간마다)
   node scripts/auto-sync.js
   → 최신 10페이지만 크롤링
   → 신규/변경 매물만 반영
   → 신규도 status='active'로 바로 공개
   → 실행 시간: 1-2분
```

---

## 📋 목차

1. [로컬 개발 환경 (Windows)](#로컬-개발-환경-windows)
2. [서버 배포 (Linux)](#서버-배포-linux)
3. [로그 확인 및 모니터링](#로그-확인-및-모니터링)
4. [트러블슈팅](#트러블슈팅)

---

## 로컬 개발 환경 (Windows)

### 1단계: 사전 요구사항

```powershell
# Node.js 버전 확인 (18.0 이상 권장)
node --version

# npm 확인
npm --version
```

### 2단계: 환경 변수 설정

`.env.local` 파일이 있는지 확인하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

### 3단계: Playwright 세션 확인

```bash
ls scripts/playwright-auth.json
```

없으면 재인증:

```bash
node scripts/login-playwright.js
```

### 4단계: 초기 백필 실행 (처음 한 번만)

```bash
# 방법 1: 직접 실행
node scripts/full-backfill.js

# 방법 2: 배치 파일 더블클릭
scripts/run-full-backfill.bat
```

실행 시간: **약 5-10분** (모든 페이지 크롤링)

**로그 확인**:
```bash
type scripts/logs/full-backfill-2026-05-19.log
```

### 5단계: 로그 확인

```bash
# 가장 최신 로그
Get-Content scripts/logs/full-backfill-*.log | Select-Object -Last 50
```

### 6단계: 자동 동기화 테스트 (선택)

```bash
# 수동 실행으로 테스트
node scripts/auto-sync.js

# 또는
scripts/run-auto-sync.bat
```

실행 시간: **약 1-2분** (최신 10페이지만)

### 7단계: Windows 작업 스케줄러로 자동화 (선택)

```powershell
# 관리자 권한으로 PowerShell 실행 후:
$action = New-ScheduledTaskAction -Execute "C:\path\to\node.exe" -Argument "C:\path\to\scripts\full-backfill.js"
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 1) -At "00:00" -Daily
Register-ScheduledTask -TaskName "PC방 증분 동기화" -Action $action -Trigger $trigger -RunLevel Highest
```

---

## 서버 배포 (Linux)

### 1단계: 프로젝트 배포

```bash
git clone <repository> /var/www/pc-bang
cd /var/www/pc-bang
npm install --production
```

### 2단계: 환경 변수 설정

```bash
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_BASE_URL=https://your-domain.com
EOF

chmod 600 .env.local
```

### 3단계: Playwright 세션 준비

**방법 1: 로컬 세션 파일 복사 (권장)**

로컬에서:
```bash
scp scripts/playwright-auth.json user@server:/var/www/pc-bang/scripts/
```

서버에서:
```bash
chmod 600 /var/www/pc-bang/scripts/playwright-auth.json
```

**방법 2: 서버에서 직접 로그인**

```bash
cd /var/www/pc-bang
node scripts/login-playwright.js
```

### 4단계: 스크립트 권한 설정

```bash
chmod +x scripts/run-full-backfill.sh
chmod +x scripts/run-auto-sync.sh
chmod +x scripts/full-backfill.js
chmod +x scripts/auto-sync.js
```

### 5단계: 초기 백필 실행 (처음 한 번)

```bash
cd /var/www/pc-bang
./scripts/run-full-backfill.sh
```

실행 시간: **약 5-10분**

**로그 확인**:
```bash
tail -f scripts/logs/full-backfill-*.log
```

### 6단계: Cron 설정 (1시간마다 증분 동기화)

```bash
crontab -e
```

다음 라인 추가 (1시간마다, 매시간 정각):

```bash
0 * * * * /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1
```

**다른 주기 예시**:

```bash
# 30분마다
*/30 * * * * /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1

# 아침 8시, 점심 12시, 저녁 6시
0 8,12,18 * * * /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1

# 주중(월-금) 매시간
0 * * * 1-5 /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1
```

### 7단계: Cron 설정 확인

```bash
crontab -l
```

---

## 로그 확인 및 모니터링

### 로그 파일 위치

- **백필 로그**: `scripts/logs/full-backfill-YYYY-MM-DD.log` (초기 실행용)
- **증분 로그**: `scripts/logs/auto-sync-YYYY-MM-DD.log` (1시간마다)
- **Cron 로그**: `scripts/logs/cron.log` (자동 실행 기록)

### 실시간 모니터링

```bash
# 가장 최신 로그 실시간 감시
tail -f scripts/logs/auto-sync-$(date +%Y-%m-%d).log

# 또는 Cron 로그
tail -f scripts/logs/cron.log
```

### 오류 확인

```bash
# 오류 라인만 필터링
grep "❌\|Error\|실패" scripts/logs/auto-sync-*.log

# 최근 100줄 보기
tail -100 scripts/logs/auto-sync-*.log
```

### Supabase 결과 확인

```bash
# 최근 업로드된 매물 (Supabase 대시보드)
# 1. https://your-project.supabase.co/
# 2. Table Editor → listings
# 3. created_at 최신순 정렬
# 4. status='active' 매물 확인
```

---

## 트러블슈팅

### 1. 백필 중간에 실패함

**증상**: "Failed to start server" 또는 "EADDRINUSE"

**해결**:

```bash
# 포트 사용 프로세스 종료
lsof -ti:3001 | xargs kill -9

# 또는 재시도
./scripts/run-full-backfill.sh
```

### 2. Playwright 세션 만료

**증상**: "Error: connect ECONNREFUSED" 또는 로그인 실패

**해결**:

```bash
# 재인증
node scripts/login-playwright.js

# 또는 기존 파일 삭제 후 재로그인
rm scripts/playwright-auth.json
node scripts/login-playwright.js
```

### 3. 환경 변수 누락

**증상**: "환경변수 오류: NEXT_PUBLIC_SUPABASE_URL 필수"

**해결**:

```bash
# .env.local 확인
cat .env.local

# 또는 환경 변수 직접 설정
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."
node scripts/full-backfill.js
```

### 4. Cron이 실행되지 않음

**증상**: 로그 파일이 생성되지 않음

**해결**:

```bash
# 1. Cron 데몬 확인
sudo systemctl status cron
# 또는
sudo service cron status

# 2. Crontab 문법 확인
crontab -l

# 3. 수동으로 명령어 실행 가능한지 확인
/var/www/pc-bang/scripts/run-auto-sync.sh

# 4. 시스템 로그 확인
sudo journalctl -u cron --since today
# 또는
sudo grep CRON /var/log/syslog
```

### 5. 매물이 업로드되지 않음

**확인 순서**:

```bash
# 1. 로그 확인
tail -50 scripts/logs/full-backfill-*.log | grep "신규\|이미지\|스킵"

# 2. listings.json 확인
cat scripts/output/listings.json | jq '.[] | {idx, title, images}' | head -20

# 3. Supabase 확인
# - 대시보드 → listings 테이블
# - status='active' 매물 개수 확인

# 4. 쿼리 테스트
node scripts/debug-listings-status.js
```

### 6. 실행 권한 오류

**증상**: "Permission denied: scripts/run-auto-sync.sh"

**해결**:

```bash
chmod +x scripts/run-full-backfill.sh
chmod +x scripts/run-auto-sync.sh
chmod +x scripts/full-backfill.js
chmod +x scripts/auto-sync.js

# 확인
ls -la scripts/run-*.sh
```

### 7. Node.js 버전 호환성

**증상**: "SyntaxError: Unexpected token"

**해결**:

```bash
# 버전 확인
node --version

# 18 이상 필요 (권장 18 이상)
nvm install 20
nvm use 20
```

---

## 운영 팁

### 자동 로그 정리

30일 이상 된 로그 정리 (crontab에 추가):

```bash
0 0 * * * find /var/www/pc-bang/scripts/logs -name "*.log" -mtime +30 -delete
```

### 메일 알림 설정

실패 시 이메일 알림:

```bash
MAILTO=admin@example.com
0 * * * * /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1
```

### 성능 모니터링

```bash
# 실시간 CPU/메모리 사용량
watch -n 1 'ps aux | grep node'

# 또는 자세한 정보
top -u appuser
```

---

## 명령어 요약

### 로컬 (Windows)

```bash
# 초기 백필 (처음 한 번)
node scripts/full-backfill.js

# 또는
scripts/run-full-backfill.bat

# 수동 증분 동기화
node scripts/auto-sync.js

# 또는
scripts/run-auto-sync.bat

# 상태 확인
node scripts/debug-listings-status.js
```

### 서버 (Linux)

```bash
# 초기 백필 (처음 한 번)
./scripts/run-full-backfill.sh

# Cron 자동 실행 (1시간마다)
crontab -e
# → 다음 라인 추가:
# 0 * * * * /var/www/pc-bang/scripts/run-auto-sync.sh >> /var/www/pc-bang/scripts/logs/cron.log 2>&1

# 로그 확인
tail -f scripts/logs/auto-sync-*.log
tail -f scripts/logs/cron.log

# Cron 설정 확인
crontab -l
```

---

**최종 확인**: 

1. ✅ 초기 백필 완료 (full-backfill.js)
2. ✅ 모든 매물이 Supabase에 등록됨 (status='active')
3. ✅ Cron 설정 완료 (1시간마다 auto-sync.js)
4. ✅ 새로운 매물이 올라올 때마다 자동으로 동기화됨

이제 더 이상의 수동 작업이 필요 없습니다! 🎉
