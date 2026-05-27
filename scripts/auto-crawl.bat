@echo off
REM ============================================================================
REM 자동 신규글 크롤링 스크립트 (Windows)
REM
REM 용도: Windows 서버에서 작업 스케줄러로 정기 실행
REM
REM 사용:
REM   1. 이 파일을 C:\path\to\scripts\auto-crawl.bat로 저장
REM   2. Windows 작업 스케줄러에서 이 배치 파일을 실행하도록 설정
REM ============================================================================

setlocal enabledelayexpansion
setlocal enableextensions

REM 현재 스크립트 디렉토리
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM 로그 설정
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set mydate=%%d-%%b-%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

set LOG_DIR=%SCRIPT_DIR%logs
set LOG_FILE=%LOG_DIR%\auto-crawl-%mydate%.log

REM Lock 파일
set LOCK_FILE=%SCRIPT_DIR%.auto-crawl.lock

REM ============================================================================
REM 함수
REM ============================================================================

REM 로그 디렉토리 생성
if not exist "%LOG_DIR%" (
  mkdir "%LOG_DIR%"
  echo [INFO] 로그 디렉토리 생성: %LOG_DIR% >> "%LOG_FILE%"
)

REM Lock 파일 확인
if exist "%LOCK_FILE%" (
  echo [WARN] 다른 크롤링이 진행 중입니다. 건너뜁니다. >> "%LOG_FILE%"
  exit /b 0
)

REM ============================================================================
REM 메인 로직
REM ============================================================================

REM 시작 시간 기록
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)

echo. >> "%LOG_FILE%"
echo ====================================================================== >> "%LOG_FILE%"
echo [INFO] 신규글 자동 크롤링 시작: %mydate% %mytime% >> "%LOG_FILE%"
echo ====================================================================== >> "%LOG_FILE%"

REM Lock 파일 생성
echo. > "%LOCK_FILE%"
echo [INFO] Lock 파일 생성됨: %LOCK_FILE% >> "%LOG_FILE%"

REM Node.js 확인
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js를 찾을 수 없습니다 >> "%LOG_FILE%"
  goto :error
)

REM Node.js 버전
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js 버전: %NODE_VERSION% >> "%LOG_FILE%"

REM 크롤링 스크립트 확인
if not exist "%SCRIPT_DIR%crawl-regions.js" (
  echo [ERROR] 크롤링 스크립트를 찾을 수 없습니다: %SCRIPT_DIR%crawl-regions.js >> "%LOG_FILE%"
  goto :error
)

echo [INFO] 크롤링 스크립트: %SCRIPT_DIR%crawl-regions.js >> "%LOG_FILE%"
echo [INFO] 모드: 신규글만 수집 ^(--all-regions --new-only^) >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM 크롤링 실행
cd /d "%PROJECT_ROOT%"

echo [INFO] 크롤링 시작... >> "%LOG_FILE%"
node "%SCRIPT_DIR%crawl-regions.js" --all-regions --new-only >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
  echo [ERROR] 크롤링 실패 >> "%LOG_FILE%"
  goto :error
)

echo [SUCCESS] 크롤링 완료 >> "%LOG_FILE%"

REM 최종 통계 (로그에서 마지막 라인 출력)
for /f "tokens=*" %%a in ('find "크롤링됨" "%LOG_FILE%"') do (set lastline=%%a)
if not "%lastline%"=="" (
  echo %lastline% >> "%LOG_FILE%"
)

echo. >> "%LOG_FILE%"
echo ====================================================================== >> "%LOG_FILE%"
echo [INFO] 신규글 자동 크롤링 완료 >> "%LOG_FILE%"
echo ====================================================================== >> "%LOG_FILE%"

REM Lock 파일 제거
del /f /q "%LOCK_FILE%"
echo [INFO] Lock 파일 제거됨 >> "%LOG_FILE%"

exit /b 0

:error
del /f /q "%LOCK_FILE%"
echo [ERROR] 자동 크롤링 중 오류 발생. 로그를 확인하세요: %LOG_FILE% >> "%LOG_FILE%"
exit /b 1
