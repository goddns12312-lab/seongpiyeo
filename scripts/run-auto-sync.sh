#!/bin/bash
#
# run-auto-sync.sh - Linux/서버용 자동 동기화 실행 스크립트
#
# 사용법:
#   ./run-auto-sync.sh                    - 기본 실행 (cron)
#   ./run-auto-sync.sh --start-page=5    - 시작 페이지 지정
#
# cron 설정 (1시간마다 실행):
#   0 * * * * /path/to/project/scripts/run-auto-sync.sh >> /path/to/project/scripts/logs/cron.log 2>&1

set -e

# 스크립트 위치 기반 프로젝트 루트 계산
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# 프로젝트 루트로 이동
cd "$PROJECT_ROOT"

# Node.js 실행 (인자 전달)
node scripts/auto-sync.js "$@"

# 종료 코드 처리
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ 자동 동기화 실패 (exit code: $EXIT_CODE)"
  echo "📋 로그: $PROJECT_ROOT/scripts/logs/auto-sync-*.log"
  exit $EXIT_CODE
else
  echo "✅ 자동 동기화 성공"
  echo "📋 로그: $PROJECT_ROOT/scripts/logs/auto-sync-*.log"
fi
