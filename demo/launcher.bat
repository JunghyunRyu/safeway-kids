@echo off
title SafeWay Kids - Demo Launcher (2026-05-07)
setlocal

:menu
cls
echo ================================================================
echo   SafeWay Kids - Demo Launcher (Lawyer Meeting 2026-05-07)
echo ================================================================
echo.
echo   [1] Edge AI screen recognition
echo       (face / abnormal behavior / leftover / blind spot)
echo       Browser: http://localhost:7860
echo.
echo   [2] Backend API server (port 8000)
echo       Swagger: http://localhost:8000/docs
echo.
echo   [3] Web dashboard (academy / platform admin / live map)
echo       Browser: http://localhost:5173
echo.
echo   [4] Marketing site (landing / cost / location-terms / privacy)
echo       Browser: http://localhost:3000
echo.
echo   [5] GPS replay simulator (fake vehicle GPS every 5s)
echo       Requires: [2] backend up + seed data loaded
echo.
echo   [6] Start ALL (backend + web + site + edge AI + mobile)
echo       Single key for the whole stack. Run 5-10 min before meeting.
echo.
echo   [7] Mobile app via Expo Web (port 8081)
echo       Browser-based RN preview (no Expo Go / QR needed)
echo.
echo   [8] Reset demo consent (parent 01033333333 by default)
echo       Run before meeting to show ConsentScreen empty again
echo.
echo   [9] Stop ALL demo processes
echo.
echo   [C] Open presenter-notes.md (notepad, presenter only)
echo   [D] Open cheatsheet.html (browser, show with lawyer)
echo   [Q] Quit launcher
echo.

set "choice="
set /p choice=Select number:

if /i "%choice%"=="1" call "%~dp001-edge-ai.bat" & goto menu
if /i "%choice%"=="2" call "%~dp002-backend.bat" & goto menu
if /i "%choice%"=="3" call "%~dp003-web.bat" & goto menu
if /i "%choice%"=="4" call "%~dp004-site.bat" & goto menu
if /i "%choice%"=="5" call "%~dp005-gps-sim.bat" & goto menu
if /i "%choice%"=="6" call "%~dp006-start-all.bat" & goto menu
if /i "%choice%"=="7" call "%~dp007-mobile-web.bat" & goto menu
if /i "%choice%"=="8" call "%~dp008-reset-consent.bat" & goto menu
if /i "%choice%"=="9" call "%~dp099-stop-all.bat" & goto menu
if /i "%choice%"=="C" start "" notepad "%~dp0presenter-notes.md" & goto menu
if /i "%choice%"=="D" start "" "%~dp0cheatsheet.html" & goto menu
if /i "%choice%"=="Q" goto end

echo.
echo Invalid input. Try again.
timeout /t 2 >nul
goto menu

:end
echo Launcher closed.
endlocal
exit /b 0
