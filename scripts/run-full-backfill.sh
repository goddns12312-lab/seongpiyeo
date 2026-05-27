#!/bin/bash
#
# run-full-backfill.sh - Linux/서버용 전체 백필 실행 스크립트
#
# 사용법:
#   ./run-full-backfill.sh          - 기본 실행
#
# 주의: 처음 한 번만 실행하세요 (시간이 걸릴 수 있습니다)

set -e

# 스크립트 위치 기반 프로젝트 루트 계산
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# 프로젝트 루트로 이동
cd "$PROJECT_ROOT"

echo ""
echo "========================================"
echo "전체 백필 (Full Backfill) 시작"
echo "========================================"
echo ""
echo "주의: 이 작업은 시간이 걸릴 수 있습니다."
echo "중단하지 말고 완료될 때까지 기다려주세요."
echo ""

# Node.js 실행
node scripts/full-backfill.js

# 종료 코드 처리
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ 전체 백필 실패 (exit code: $EXIT_CODE)"
  echo "📋 로그: $PROJECT_ROOT/scripts/logs/full-backfill-*.log"
  exit $EXIT_CODE
else
  echo ""
  echo "========================================"
  echo "✅ 전체 백필 성공"
  echo "========================================"
  echo ""
  echo "📊 결과: 크롤링 대상 사이트의 모든 매물이 등록되었습니다."
  echo "📋 로그: $PROJECT_ROOT/scripts/logs/full-backfill-*.log"
  echo ""
  echo "다음: 1시간마다 auto-sync.sh가 자동으로 신규 매물을 동기화합니다."
fi
