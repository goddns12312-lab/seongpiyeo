@echo off
REM run-full-backfill.bat - Windows용 전체 백필 실행 스크립트
REM
REM 사용법:
REM   run-full-backfill.bat        - 기본 실행
REM
REM 주의: 처음 한 번만 실행하세요 (시간이 걸릴 수 있습니다)

setlocal enabledelayedexpansion

REM 스크립트 디렉토리를 현재 디렉토리로 변경
cd /d "%~dp0.."

echo.
echo ========================================
echo 전체 백필 (Full Backfill) 시작
echo ========================================
echo.
echo 주의: 이 작업은 시간이 걸릴 수 있습니다.
echo 중단하지 말고 완료될 때까지 기다려주세요.
echo.
pause

REM node scripts/full-backfill.js 실행
node scripts/full-backfill.js

REM 종료 코드 확인
if %errorlevel% neq 0 (
  echo.
  echo ❌ 전체 백필 실패 (exit code: %errorlevel%)
  echo 📋 로그: scripts/logs/full-backfill-*.log
  pause
  exit /b %errorlevel%
) else (
  echo.
  echo ========================================
  echo ✅ 전체 백필 성공
  echo ========================================
  echo.
  echo 📊 결과: 크롤링 대상 사이트의 모든 매물이 등록되었습니다.
  echo 📋 로그: scripts/logs/full-backfill-*.log
  echo.
  echo 다음: 1시간마다 auto-sync.js가 자동으로 신규 매물을 동기화합니다.
)

endlocal
