@echo off
chcp 65001 >nul
cd /d "%~dp0admin"

echo [1/2] Freeing port 4711 (killing stale server if any)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4711 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo [2/2] Starting server...
start "" http://localhost:4711
npx nodemon server.js
