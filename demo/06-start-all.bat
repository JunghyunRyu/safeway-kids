@echo off
title [6] Start ALL Demos

echo ================================================================
echo   [6] Start ALL: backend + web dashboard + site + edge AI + mobile
echo   Recommended 5-10 minutes before the meeting.
echo ================================================================
echo.

echo [1/5] Starting backend...
call "%~dp002-backend.bat" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2/5] Starting web dashboard...
call "%~dp003-web.bat" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [3/5] Starting marketing site...
call "%~dp004-site.bat" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [4/5] Starting Edge AI...
call "%~dp001-edge-ai.bat" >nul 2>&1
timeout /t 3 /nobreak >nul

echo [5/5] Starting Mobile (Expo Web)...
echo       (first build can take 30~90 seconds; runs in background)
call "%~dp007-mobile-web.bat" >nul 2>&1

echo.
echo ================================================================
echo   All services starting in their own windows. Check these tabs:
echo     http://localhost:5173        (Web dashboard)
echo     http://localhost:3000        (Marketing site)
echo     http://localhost:7860        (Edge AI screen recognition)
echo     http://localhost:8081        (Mobile app, Expo Web)
echo     http://localhost:8000/docs   (Swagger API)
echo ================================================================
echo.
echo [TIP] If seed data is empty, log in as Platform admin
echo       and click "Seed Data" in the sidebar once.
echo [TIP] Mobile bundler may still be building when other tabs are
echo       already responsive. Refresh localhost:8081 after ~60s.
echo [TIP] Before showing the lawyer, run [8] to reset parent consent.
echo.
pause
exit /b 0
