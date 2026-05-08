@echo off
title [5] GPS Replay Simulator

echo ================================================================
echo   [5] GPS replay simulator
echo   Sends fake vehicle GPS to backend every 5 seconds
echo   Web dashboard /map shows the markers moving in real time
echo ================================================================
echo.

set "BACKEND_DIR=%~dp0..\backend"

if not exist "%BACKEND_DIR%\.venv\Scripts\activate.bat" (
    echo [ERROR] backend\.venv not found. Run [2] first.
    pause
    exit /b 1
)

"%BACKEND_DIR%\.venv\Scripts\python.exe" -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health', timeout=3).status==200 else 1)" 2>nul
if errorlevel 1 (
    echo [ERROR] Backend not responding on :8000. Run [2] first.
    pause
    exit /b 1
)

echo [OK] Backend /health responded.
echo.
echo Starting GPS replay in a new window.
echo - Vehicles: 3
echo - Interval: 5 seconds
echo.

start "GPS Replay" cmd /k "cd /d %BACKEND_DIR% && call .venv\Scripts\activate.bat && python scripts\gps_replay.py --vehicles 3 --interval 5"

start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173/map"

echo [DONE] GPS replay started; /map opened in browser.
echo.
pause
exit /b 0
