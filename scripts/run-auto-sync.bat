@echo off
REM run-auto-sync.bat - Windows용 자동 동기화 실행 스크립트
REM
REM 사용법:
REM   run-auto-sync.bat                    - 기본 실행
REM   run-auto-sync.bat --start-page=5    - 시작 페이지 지정

setlocal enabledelayedexpansion

REM 스크립트 디렉토리를 현재 디렉토리로 변경
cd /d "%~dp0.."

REM node scripts/auto-sync.js 실행 (인자 전달)
node scripts/auto-sync.js %*

REM 종료 코드 확인
if %errorlevel% neq 0 (
  echo.
  echo ❌ 자동 동기화 실패 (exit code: %errorlevel%)
  echo 📋 로그: scripts/logs/auto-sync-*.log
  pause
  exit /b %errorlevel%
) else (
  echo.
  echo ✅ 자동 동기화 성공
  echo 📋 로그: scripts/logs/auto-sync-*.log
)

endlocal
