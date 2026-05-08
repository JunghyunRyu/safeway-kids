@echo off
title [1] Edge AI Screen Recognition

echo ================================================================
echo   [1] Edge AI screen recognition demo
echo   (face / abnormal behavior / leftover / blind spot)
echo ================================================================
echo.
echo Starting Edge AI server in a new window.
echo Browser auto-opens http://localhost:7860 after 5-10 seconds.
echo.

start "Edge AI Server (port 7860)" cmd /k "cd /d %~dp0..\edge_ai && start.bat"

echo.
echo [DONE] Edge AI window opened.
echo Demo order: face register -^> boarding ID -^> abnormal -^> leftover -^> blind spot
echo.
pause
exit /b 0
