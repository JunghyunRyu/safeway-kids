@echo off
title [9] Stop ALL Demo Processes

echo ================================================================
echo   [9] Stop all demo processes
echo ================================================================
echo.
echo The following will be cleaned up:
echo   - uvicorn (port 8000)
echo   - vite    (ports 5173, 3000)
echo   - Edge AI Flask/Gradio (port 7860)
echo   - Expo Web Metro       (port 8081)
echo   - GPS Replay python
echo.
echo Press any key to continue, or close this window to cancel.
pause >nul

echo.
echo [1/3] Killing processes by port...

for %%P in (8000 5173 3000 7860 8081) do (
    for /f "tokens=5" %%X in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
        echo   Port %%P used by PID %%X - killing
        taskkill /PID %%X /F >nul 2>&1
    )
)

echo [2/3] Killing leftover python.exe gps_replay processes...
wmic process where "name='python.exe' and CommandLine like '%%gps_replay%%'" call terminate >nul 2>&1

echo [3/3] Skipping generic node.exe kill (would impact other IDE windows).
echo       If a Vite cmd window is still alive, close it manually.

echo.
echo [DONE]
echo.
pause
exit /b 0
