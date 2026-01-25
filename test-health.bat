@echo off
cd /d "%~dp0"
call npm run test:run lib/analytics/healthScore.test.ts
pause
