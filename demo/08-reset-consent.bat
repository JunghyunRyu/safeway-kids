@echo off
title [8] Reset Consent (parent demo)

echo ================================================================
echo   [8] Reset demo consent rows
echo   Removes consent records for parent user 01033333333 (default)
echo   so that ConsentScreen is shown again on next app launch.
echo
echo   Tables affected:
echo     - guardian_consents  (guardian_id)
echo     - child_consents     (parent_id)
echo     - location_consents  (user_id)
echo
echo   Production guard: aborts unless environment=development.
echo ================================================================
echo.

set "BACKEND_DIR=%~dp0..\backend"

if not exist "%BACKEND_DIR%\.venv\Scripts\activate.bat" (
    echo [ERROR] backend\.venv not found. Run [2] first.
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"
call .venv\Scripts\activate.bat
python scripts\reset_demo_consent.py %1

echo.
echo Tip: pass a phone as argument to reset another parent.
echo   Example: 08-reset-consent.bat 01044444444
echo.
pause
exit /b 0
