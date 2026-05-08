@echo off
title [7] Mobile App (Expo Web)

echo ================================================================
echo   [7] Mobile app via Expo Web
echo   Browser shows the React Native app as a web page (no Expo Go).
echo
echo   NOTE:
echo     - Some screens that depend on native modules (KakaoMap,
echo       expo-location, expo-notifications) may render blank or
echo       throw warnings. That is expected for the web target.
echo     - Safe screens to demo: Login, Onboarding, Consent, Home,
echo       Schedule, ChildProfile, Billing, NotificationSettings.
echo     - First launch may take 30~90 seconds to bundle.
echo ================================================================
echo.

set "MOBILE_DIR=%~dp0..\mobile"

if not exist "%MOBILE_DIR%\node_modules" (
    echo [WARN] mobile\node_modules not found. Running npm install...
    cd /d "%MOBILE_DIR%" && npm install
)

REM Start Expo Web in a new cmd window (port 8081 by default)
start "Mobile (Expo Web)" cmd /k "cd /d %MOBILE_DIR% && npx expo start --web"

REM Open the dev URL after a short wait so the bundler has time to start
start "" /b cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:8081"

echo [DONE] Expo Web window opened in a new cmd.
echo Browser will auto-open http://localhost:8081 in ~12 seconds.
echo.
echo If the browser shows "site can't be reached" the bundler is
echo still building. Wait ~30 more seconds and refresh.
echo.
pause
exit /b 0
