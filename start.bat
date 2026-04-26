@echo off
title Football Tracker
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Football Tracker
echo  ==========================================
echo.

if not exist "node_modules" (
    echo  Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo  ERROR: npm install failed. Is Node.js installed?
        pause & exit /b 1
    )
    echo.
)

start /min cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:8888"

echo  Starting at http://localhost:8888
echo  Press Ctrl+C to stop.
echo.

call npx --yes netlify-cli dev
pause
