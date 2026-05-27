@echo off
cd /d "%~dp0.."
node scripts/full-backfill.js --auto
pause
