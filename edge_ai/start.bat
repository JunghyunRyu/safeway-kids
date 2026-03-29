@echo off
chcp 65001 >nul 2>&1
title SafeWay Kids Edge AI PoC Demo

echo ============================================================
echo   SafeWay Kids Edge AI PoC Demo - 시작
echo ============================================================
echo.

:: 1. Python 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되어 있지 않습니다.
    echo Python 3.10 이상을 설치하세요: https://python.org
    pause
    exit /b 1
)

:: 2. 가상환경 생성 (없으면)
if not exist ".venv" (
    echo [1/4] 가상환경 생성 중...
    python -m venv .venv
    if errorlevel 1 (
        echo [오류] 가상환경 생성 실패
        pause
        exit /b 1
    )
    echo       가상환경 생성 완료
) else (
    echo [1/4] 가상환경 확인 완료
)

:: 3. 가상환경 활성화
call .venv\Scripts\activate.bat

:: 4. 의존성 설치
echo [2/4] 의존성 확인 중...
pip install -r requirements.txt --quiet 2>nul
if errorlevel 1 (
    echo [오류] 의존성 설치 실패. 네트워크를 확인하세요.
    pause
    exit /b 1
)
echo       의존성 설치 완료

:: 5. 모델 다운로드
echo [3/4] AI 모델 확인 중...
python setup_models.py
if errorlevel 1 (
    echo [오류] 모델 다운로드 실패. 네트워크를 확인하세요.
    pause
    exit /b 1
)

:: 6. 서버 시작
echo.
echo [4/4] 데모 서버 시작 중...
echo ============================================================
echo   브라우저에서 http://localhost:7860 을 여세요
echo   종료: Ctrl+C
echo ============================================================
echo.

:: 브라우저 자동 열기 (1초 대기 후)
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:7860"

:: Flask 서버 실행
python main.py

pause
