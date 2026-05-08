@echo off
title [3] Web Dashboard (port 5173)

echo ================================================================
echo   [3] Web dashboard
echo   Vite dev @ http://localhost:5173
echo   Login: Academy admin or Platform admin (both supported)
echo   Key pages:
echo       /                  Dashboard
echo       /map               Live vehicle map (GPS) ^<-- ask the lawyer here!
echo       /boarding-status   Boarding status
echo       /students          Students search + parent mapping
echo       /compliance        Compliance / audit log
echo       /seed              Seed data (dev only)
echo ================================================================
echo.

set "WEB_DIR=%~dp0..\web"

if not exist "%WEB_DIR%\node_modules" (
    echo [WARN] web\node_modules not found. Running npm install...
    cd /d "%WEB_DIR%" && npm install
)

start "Web Dashboard (port 5173)" cmd /k "cd /d %WEB_DIR% && npm run dev"

start "" /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173"

echo.
echo [DONE] Web dashboard window opened.
echo.
echo Recommended demo flow:
echo   1) Platform admin login (phone 010-0000-0000 / code 000000)
echo   2) /seed - generate seed data once
echo   3) /map  - watch real-time vehicles
echo   4) Run [5] GPS simulator to see vehicles move
echo.
pause
exit /b 0
