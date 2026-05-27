#!/bin/bash

################################################################################
# 자동 신규글 크롤링 스크립트
#
# 용도: 서버에서 정기적으로(cron) 신규글만 크롤링
#
# 기능:
#   - 모든 지역 신규글 크롤링 (--new-only)
#   - 중복 실행 방지 (lock file)
#   - 성공/실패 로그 저장
#   - 실행 시간 측정
#   - 신규글 개수 통계
#
# 사용:
#   ./scripts/auto-crawl.sh
#   또는 cron으로: 0 * * * * /path/to/auto-crawl.sh >> /path/to/cron.log 2>&1
#
################################################################################

set -e

# 색상 코드 (콘솔 출력용)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOCK_FILE="$SCRIPT_DIR/.auto-crawl.lock"
LOG_DIR="$SCRIPT_DIR/logs"
CRAWL_SCRIPT="$SCRIPT_DIR/crawl-regions.js"

# 로그 파일 (날짜별)
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')
LOG_FILE="$LOG_DIR/auto-crawl-$DATE.log"

# ============================================================================
# 함수 정의
# ============================================================================

# 로그 출력 (파일 + 콘솔)
log() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  local log_line="$timestamp [$level] $message"

  echo "$log_line" >> "$LOG_FILE"

  case $level in
    SUCCESS)
      echo -e "${GREEN}✓ $message${NC}"
      ;;
    ERROR)
      echo -e "${RED}✗ $message${NC}"
      ;;
    INFO)
      echo -e "${BLUE}ℹ $message${NC}"
      ;;
    WARN)
      echo -e "${YELLOW}⚠ $message${NC}"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# 로그 디렉토리 생성
setup_log_dir() {
  if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    log INFO "로그 디렉토리 생성: $LOG_DIR"
  fi
}

# Lock file 확인 (중복 실행 방지)
check_lock() {
  if [ -f "$LOCK_FILE" ]; then
    local lock_age=$(($(date +%s) - $(stat -f%m "$LOCK_FILE" 2>/dev/null || echo 0)))
    # lock file이 30분 이상 된 경우는 강제 진행 (프로세스 크래시 대비)
    if [ $lock_age -lt 1800 ]; then
      log WARN "다른 크롤링이 진행 중입니다. 건너뜁니다."
      exit 0
    else
      log WARN "이전 lock file이 30분 이상 유지 중입니다. 강제 진행합니다."
      rm -f "$LOCK_FILE"
    fi
  fi
}

# Lock file 생성
create_lock() {
  touch "$LOCK_FILE"
  log INFO "Lock file 생성됨: $LOCK_FILE"
}

# Lock file 제거
remove_lock() {
  rm -f "$LOCK_FILE"
  log INFO "Lock file 제거됨"
}

# 실행 시간 측정
format_duration() {
  local seconds=$1
  local hours=$((seconds / 3600))
  local minutes=$(((seconds % 3600) / 60))
  local secs=$((seconds % 60))

  if [ $hours -gt 0 ]; then
    echo "${hours}시간 ${minutes}분 ${secs}초"
  elif [ $minutes -gt 0 ]; then
    echo "${minutes}분 ${secs}초"
  else
    echo "${secs}초"
  fi
}

# 크롤링 로그에서 신규글 개수 추출
extract_stats() {
  local crawl_log=$1
  local crawled=$(grep -oP '크롤링됨: \K\d+(?=개)' "$crawl_log" | tail -1)
  local skipped=$(grep -oP '스킵됨: \K\d+(?=개)' "$crawl_log" | tail -1)

  echo "crawled:$crawled:skipped:$skipped"
}

# ============================================================================
# 메인 로직
# ============================================================================

main() {
  local start_time=$(date +%s)
  local start_timestamp=$(date '+%Y-%m-%d %H:%M:%S')

  # 로그 디렉토리 설정
  setup_log_dir

  log INFO "======================================================================"
  log INFO "신규글 자동 크롤링 시작: $start_timestamp"
  log INFO "======================================================================"

  # 중복 실행 확인
  check_lock

  # Lock file 생성
  create_lock
  trap remove_lock EXIT

  # 프로젝트 루트로 이동
  cd "$PROJECT_ROOT"

  # Node.js 실행 가능 여부 확인
  if ! command -v node &> /dev/null; then
    log ERROR "Node.js를 찾을 수 없습니다"
    return 1
  fi

  # 크롤링 스크립트 확인
  if [ ! -f "$CRAWL_SCRIPT" ]; then
    log ERROR "크롤링 스크립트를 찾을 수 없습니다: $CRAWL_SCRIPT"
    return 1
  fi

  log INFO "Node.js 버전: $(node --version)"
  log INFO "크롤링 스크립트: $CRAWL_SCRIPT"
  log INFO "모드: 신규글만 수집 (--all-regions --new-only)"
  log INFO ""

  # 임시 로그 파일
  local temp_crawl_log="/tmp/crawl-output-$$.log"

  # 크롤링 실행
  if node "$CRAWL_SCRIPT" --all-regions --new-only > "$temp_crawl_log" 2>&1; then
    log SUCCESS "크롤링 완료"

    # 크롤링 로그를 메인 로그에 추가
    log INFO "크롤링 상세 로그:"
    while IFS= read -r line; do
      log INFO "  $line"
    done < "$temp_crawl_log"

    # 통계 추출
    local stats=$(extract_stats "$temp_crawl_log")
    IFS=':' read -r _ crawled _ skipped <<< "$stats"

    # 임시 로그 삭제
    rm -f "$temp_crawl_log"

    # 최종 통계
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_str=$(format_duration $duration)

    log INFO ""
    log INFO "======================================================================"
    log INFO "완료 통계:"
    log INFO "  - 신규 저장: ${crawled:-0}개"
    log INFO "  - 스킵됨: ${skipped:-0}개"
    log INFO "  - 실행 시간: $duration_str"
    log INFO "======================================================================"

    return 0
  else
    log ERROR "크롤링 실패"

    # 에러 로그를 메인 로그에 추가
    log INFO "크롤링 에러 로그:"
    while IFS= read -r line; do
      log INFO "  $line"
    done < "$temp_crawl_log"

    # 임시 로그 삭제
    rm -f "$temp_crawl_log"

    # 실행 시간
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_str=$(format_duration $duration)

    log ERROR "실행 시간: $duration_str"
    log ERROR "======================================================================"

    return 1
  fi
}

# 스크립트 실행
main
exit $?
