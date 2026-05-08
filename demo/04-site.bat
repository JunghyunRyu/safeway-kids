@echo off
title [4] Marketing Site (port 3000)

echo ================================================================
echo   [4] Marketing site
echo   Vite dev @ http://localhost:3000
echo   Key pages:
echo       /                Landing
echo       /cost-simulator  Cost simulator
echo       /location-terms  Location-data consent (lawyer focus)
echo       /privacy         Privacy policy
echo       /terms           Terms of service
echo ================================================================
echo.

set "SITE_DIR=%~dp0..\site"

if not exist "%SITE_DIR%\node_modules" (
    echo [WARN] site\node_modules not found. Running npm install...
    cd /d "%SITE_DIR%" && npm install
)

start "Site (port 3000)" cmd /k "cd /d %SITE_DIR% && npm run dev"

start "" /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000/location-terms"

echo.
echo [DONE] Site window opened.
echo Browser auto-navigates to /location-terms (location consent page).
echo Change the URL manually if the lawyer asks for another page.
echo.
pause
exit /b 0
