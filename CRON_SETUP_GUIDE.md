# 자동 신규글 크롤링 설정 가이드 (Cron)

## 📋 개요

서버에서 매시간 자동으로 신규글만 크롤링하도록 cron 작업으로 설정합니다.

## 🛠️ 준비 사항

### 1. 스크립트 권한 설정

```bash
chmod +x /path/to/scripts/auto-crawl.sh
```

### 2. 로그 디렉토리 준비

```bash
mkdir -p /path/to/scripts/logs
chmod 755 /path/to/scripts/logs
```

### 3. Node.js 설치 확인

```bash
node --version  # v18 이상 권장
npm --version
```

## 📅 Cron 설정

### 단계 1: Crontab 편집

```bash
crontab -e
```

### 단계 2: Cron 작업 추가

#### 옵션 A: 매시간 정각 실행 (권장)
```bash
# 매시간 00분에 실행
0 * * * * /path/to/scripts/auto-crawl.sh
```

#### 옵션 B: 매시간 정각 + 로그 저장
```bash
# 매시간 + cron 로그 추적
0 * * * * /path/to/scripts/auto-crawl.sh >> /path/to/cron.log 2>&1
```

#### 옵션 C: 특정 시간에만 실행
```bash
# 매일 오전 3시 (크롤링 이후 불황 시간)
0 3 * * * /path/to/scripts/auto-crawl.sh

# 매일 오전 3시, 오후 3시, 밤 9시
0 3,15,21 * * * /path/to/scripts/auto-crawl.sh
```

#### 옵션 D: 매 30분마다 실행
```bash
# 매 30분마다 (00분, 30분)
*/30 * * * * /path/to/scripts/auto-crawl.sh
```

#### 옵션 E: 분산 실행 (5분 간격으로 서버 부하 분산)
```bash
# 매시간 05분에 실행 (트래픽 피크 이후)
5 * * * * /path/to/scripts/auto-crawl.sh
```

### 절대 경로 사용 필수

```bash
# ❌ 틀림 (상대 경로)
0 * * * * auto-crawl.sh

# ✅ 올바름 (절대 경로)
0 * * * * /home/user/project/scripts/auto-crawl.sh
```

## 🔍 Cron 설정 확인

### 현재 설정 조회
```bash
crontab -l
```

### 설정 제거
```bash
crontab -r
```

### 특정 명령 제거
편집 모드에서 해당 라인 삭제 후 저장

## 📊 로그 확인

### 성공 로그
```bash
tail -f /path/to/scripts/logs/auto-crawl-2026-05-26.log
```

### 실시간 모니터링
```bash
watch -n 1 "tail -20 /path/to/scripts/logs/auto-crawl-$(date +\%Y-\%m-\%d).log"
```

### Cron 시스템 로그 (Linux)
```bash
# CentOS/RHEL
grep CRON /var/log/cron

# Ubuntu/Debian
grep CRON /var/log/syslog
# 또는
sudo journalctl -u cron

# macOS
log stream --predicate 'process == "cron"'
```

## 💡 실행 전략

### 전략 1: 매시간 자동 (권장)
```bash
0 * * * * /path/to/scripts/auto-crawl.sh
```
- 장점: 가장 최신 항목 항상 유지
- 단점: 시스템 리소스 지속 사용

### 전략 2: 정기적 실행 (3시간 간격)
```bash
0 0,3,6,9,12,15,18,21 * * * /path/to/scripts/auto-crawl.sh
```
- 장점: 리소스와 최신성의 균형
- 단점: 최대 3시간 지연

### 전략 3: 업무 시간만 (8시~20시)
```bash
0 8-20 * * * /path/to/scripts/auto-crawl.sh
```
- 장점: 리소스 절감
- 단점: 야간/주말 항목 누락

### 전략 4: 오프피크 시간 실행 (밤 12시, 3시, 6시)
```bash
0 0,3,6 * * * /path/to/scripts/auto-crawl.sh
```
- 장점: 서버 부하 최소화
- 단점: 신규 항목 발견 지연

## 🔐 보안 고려사항

### 1. 파일 권한
```bash
# 스크립트 권한
chmod 755 /path/to/scripts/auto-crawl.sh

# 로그 디렉토리 권한
chmod 755 /path/to/scripts/logs

# 로그 파일 권한 (읽기만)
chmod 644 /path/to/scripts/logs/*.log
```

### 2. 사용자 권한
```bash
# 특정 사용자로만 실행
0 * * * * /path/to/scripts/auto-crawl.sh  # 현재 사용자

# root 권한이 필요한 경우
0 * * * * root /path/to/scripts/auto-crawl.sh  # /etc/crontab에서만 가능
```

### 3. 환경 변수
```bash
# cron에서 환경변수 설정 (필요시)
0 * * * * cd /path/to/project && /path/to/scripts/auto-crawl.sh
```

## 🐛 문제 해결

### 문제 1: Cron이 실행되지 않음

**원인 확인**:
```bash
# Cron 데몬 실행 확인
ps aux | grep cron

# Cron 로그 확인
sudo journalctl -u cron -n 50
```

**해결 방법**:
```bash
# Cron 재시작
sudo systemctl restart cron

# 또는
sudo service cron restart
```

### 문제 2: 스크립트가 실행되지 않음

**확인 사항**:
- [ ] 절대 경로 사용했는가?
- [ ] 스크립트 권한이 755인가? (`chmod +x`)
- [ ] shebang 줄이 있는가? (`#!/bin/bash`)
- [ ] 스크립트 문법 오류가 없는가? (`bash -n auto-crawl.sh`)

**테스트 방법**:
```bash
# 수동으로 실행해보기
/path/to/scripts/auto-crawl.sh

# 결과 확인
tail -20 /path/to/scripts/logs/auto-crawl-$(date +\%Y-\%m-\%d).log
```

### 문제 3: 중복 실행 방지가 안됨

**원인**: lock file이 제거되지 않음
**해결**:
```bash
# lock file 수동 제거
rm /path/to/scripts/.auto-crawl.lock

# 참고: 30분 이상 유지되면 자동 제거됨
```

### 문제 4: 로그가 저장되지 않음

**확인**:
```bash
# 로그 디렉토리 확인
ls -la /path/to/scripts/logs/

# 권한 확인
stat /path/to/scripts/logs/

# 디스크 용량 확인
df -h /path/to/scripts/
```

**해결**:
```bash
# 로그 디렉토리 재생성
mkdir -p /path/to/scripts/logs
chmod 755 /path/to/scripts/logs
```

## 📈 모니터링

### 자동 로그 순환 (선택사항)

매월 1일 00시 이전 로그 삭제:
```bash
# crontab에 추가
0 0 1 * * find /path/to/scripts/logs -name "auto-crawl-*.log" -mtime +30 -delete
```

### 이메일 알림 (실패 시)

```bash
# crontab에 추가 (MAILTO 설정)
MAILTO=admin@example.com
0 * * * * /path/to/scripts/auto-crawl.sh
```

### Slack 알림 (선택)

스크립트에 Webhook 추가:
```bash
# auto-crawl.sh 끝에 추가
curl -X POST $SLACK_WEBHOOK \
  -d '{"text":"크롤링 완료: 신규 '${crawled}'개"}'
```

## 📝 로그 형식

### 성공 로그
```
2026-05-26 20:00:00 [INFO] ======================================================================
2026-05-26 20:00:00 [INFO] 신규글 자동 크롤링 시작: 2026-05-26 20:00:00
2026-05-26 20:00:00 [INFO] ======================================================================
2026-05-26 20:00:01 [INFO] 로그 디렉토리 생성: /path/to/scripts/logs
2026-05-26 20:00:01 [INFO] Lock file 생성됨: /path/to/scripts/.auto-crawl.lock
2026-05-26 20:00:01 [INFO] Node.js 버전: v18.16.0
2026-05-26 20:00:01 [INFO] 크롤링 스크립트: /path/to/scripts/crawl-regions.js
2026-05-26 20:00:01 [INFO] 모드: 신규글만 수집 (--all-regions --new-only)
2026-05-26 20:00:01 [INFO] 
2026-05-26 20:00:01 [INFO] 크롤링 상세 로그:
2026-05-26 20:00:02 [INFO]   🚀 지역별 크롤링 시작
...
2026-05-26 20:05:30 [SUCCESS] 크롤링 완료
2026-05-26 20:05:31 [INFO] 
2026-05-26 20:05:31 [INFO] ======================================================================
2026-05-26 20:05:31 [INFO] 완료 통계:
2026-05-26 20:05:31 [INFO]   - 신규 저장: 5개
2026-05-26 20:05:31 [INFO]   - 스킵됨: 45개
2026-05-26 20:05:31 [INFO]   - 실행 시간: 5분 30초
2026-05-26 20:05:31 [INFO] ======================================================================
```

### 에러 로그
```
2026-05-26 21:00:00 [INFO] ======================================================================
2026-05-26 21:00:00 [INFO] 신규글 자동 크롤링 시작: 2026-05-26 21:00:00
2026-05-26 21:00:00 [INFO] ======================================================================
2026-05-26 21:00:00 [WARN] 다른 크롤링이 진행 중입니다. 건너뜁니다.
```

## ✅ 설정 체크리스트

- [ ] Node.js v18 이상 설치
- [ ] 스크립트 권한 설정 (`chmod +x`)
- [ ] 로그 디렉토리 생성
- [ ] Crontab 설정 추가
- [ ] 절대 경로 사용 확인
- [ ] 수동 테스트 성공
- [ ] 로그 파일 생성 확인
- [ ] 중복 실행 방지 확인

## 🚀 설정 예시

### 표준 설정 (매시간 정각)
```bash
# crontab -e에서 아래 추가
0 * * * * /home/ubuntu/pc-bang/scripts/auto-crawl.sh >> /home/ubuntu/pc-bang/scripts/logs/cron.log 2>&1
```

### 개발 환경 (30분마다 테스트)
```bash
*/30 * * * * /home/dev/pc-bang/scripts/auto-crawl.sh >> /home/dev/pc-bang/scripts/logs/cron.log 2>&1
```

### 프로덕션 (밤 3시만 실행)
```bash
0 3 * * * /home/ubuntu/pc-bang/scripts/auto-crawl.sh >> /home/ubuntu/pc-bang/scripts/logs/cron.log 2>&1
```

## 📚 참고 자료

- [Crontab Guru](https://crontab.guru/) - Cron 표현식 검증
- [man crontab](https://linux.die.net/man/5/crontab) - Linux crontab 설명서
- [Linux Cron Tutorial](https://www.cyberciti.biz/faq/how-do-i-add-jobs-to-cron-under-linux-or-unix-oses/) - Cron 상세 가이드

---

**상태**: ✅ 설정 완료
**테스트**: 🧪 수동 실행 후 cron 등록 권장
**모니터링**: 📊 로그 파일로 자동 추적
