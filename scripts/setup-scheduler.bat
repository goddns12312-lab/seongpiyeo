@echo off
REM PC천국 자동 크롤링 - Windows Task Scheduler 등록
REM 관리자 권한으로 실행해야 합니다

setlocal enabledelayedexpansion

echo.
echo ====================================
echo PC천국 자동 크롤링 스케줄 설정
echo ====================================
echo.

REM 작업 이름
set TASK_NAME=PCBang-Auto-Scraper

REM 스크립트 경로
set SCRIPT_PATH=C:\Users\B\Desktop\aass\scripts\scraper.js

REM Node.js 경로 (npm list node로 찾을 수 있음)
set NODE_PATH=C:\Users\B\Desktop\aass\node_modules\.bin\node.exe

REM 프로젝트 디렉토리
set PROJECT_DIR=C:\Users\B\Desktop\aass

REM 실행 시간 설정
echo 매일 몇 시에 실행하시겠습니까?
echo 예: 08:00, 12:00, 20:00
set /p RUN_TIME="시간 입력 (기본값: 09:00): "
if "!RUN_TIME!"=="" set RUN_TIME=09:00

REM 기존 작업 삭제
echo 기존 작업 확인 중...
schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if !errorlevel! equ 0 (
    echo 기존 작업을 삭제합니다...
    schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1
)

REM 새 작업 생성
echo 새 작업을 생성합니다...
schtasks /create /tn "%TASK_NAME%" /tr "cmd /c cd /d %PROJECT_DIR% && node %SCRIPT_PATH%" /sc daily /st %RUN_TIME% /ru SYSTEM /rl HIGHEST /f

if !errorlevel! equ 0 (
    echo.
    echo ====================================
    echo ✓ 성공적으로 등록되었습니다!
    echo ====================================
    echo.
    echo 작업 이름: %TASK_NAME%
    echo 실행 시간: 매일 %RUN_TIME%
    echo 스크립트: %SCRIPT_PATH%
    echo 로그 파일: %PROJECT_DIR%\scripts\scraper.log
    echo.
    echo 설정 확인:
    schtasks /query /tn "%TASK_NAME%" /v
    echo.
    echo 즉시 실행하려면:
    echo   schtasks /run /tn "%TASK_NAME%"
    echo.
    echo 작업 삭제하려면:
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo.
) else (
    echo.
    echo ✗ 작업 등록에 실패했습니다.
    echo 관리자 권한으로 실행해주세요.
    echo.
)

pause
