#!/bin/bash
#
# run-full-backfill-all.sh - 자동 마지막 페이지 감지 + 전체 백필
#
# 사용법:
#   ./run-full-backfill-all.sh
#
# 특징:
#   - 크롤링 사이트의 실제 마지막 페이지를 자동 감지
#   - 200 단위로 자동 구간 분할
#   - 모든 구간을 순차 실행
#   - 예상 시간: 20-40분 (페이지 수에 따라)

set -e

# 스크립트 위치 기반 프로젝트 루트 계산
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

# 프로젝트 루트로 이동
cd "$PROJECT_ROOT"

echo ""
echo "========================================"
echo "자동 전체 백필 (Auto Full Backfill)"
echo "========================================"
echo ""
echo "특징:"
echo "- 실제 마지막 페이지 자동 감지"
echo "- 200 단위로 자동 구간 분할"
echo "- 모든 구간을 순차 실행"
echo ""
echo "예상 시간: 20-40분"
echo ""
read -p "계속하려면 Enter를 누르세요..."

echo ""

# full-backfill.js --auto 실행
if node scripts/full-backfill.js --auto; then
  echo ""
  echo "========================================"
  echo "✅ 자동 전체 백필 완료!"
  echo "========================================"
  echo ""
  echo "📊 결과: 크롤링 대상 사이트의 모든 매물이 등록되었습니다."
  echo "📋 로그: $PROJECT_ROOT/scripts/logs/full-backfill-*.log"
  echo ""
  echo "다음: 1시간마다 auto-sync.sh가 자동으로 신규 매물을 동기화합니다."
  echo ""
else
  EXIT_CODE=$?
  echo ""
  echo "========================================"
  echo "❌ 자동 백필 실패"
  echo "========================================"
  echo ""
  echo "로그 확인: $PROJECT_ROOT/scripts/logs/full-backfill-*.log"
  echo "체크포인트: $PROJECT_ROOT/scripts/logs/backfill-checkpoint.json"
  echo ""
  echo "다시 실행하세요:"
  echo "  ./scripts/run-full-backfill-all.sh"
  echo ""
  exit $EXIT_CODE
fi
