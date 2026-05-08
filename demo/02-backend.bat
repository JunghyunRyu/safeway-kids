@echo off
title [2] Backend API (port 8000)

echo ================================================================
echo   [2] Backend API server
echo   FastAPI uvicorn @ http://localhost:8000
echo   Swagger UI:        http://localhost:8000/docs
echo ================================================================
echo.

set "BACKEND_DIR=%~dp0..\backend"

if not exist "%BACKEND_DIR%\.venv\Scripts\activate.bat" (
    echo [ERROR] backend\.venv not found.
    echo         Run these first:
    echo           cd backend
    echo           python -m venv .venv
    echo           .venv\Scripts\activate
    echo           pip install -e .
    pause
    exit /b 1
)

start "Backend API (port 8000)" cmd /k "cd /d %BACKEND_DIR% && call .venv\Scripts\activate.bat && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [DONE] Backend window opened.
echo.
echo If you need seed data, open the Web dashboard ([3])
echo and use Platform Admin -^> sidebar Seed menu,
echo or run directly:
echo   cd backend
echo   .venv\Scripts\activate
echo   python -m app.seed
echo.
pause
exit /b 0
