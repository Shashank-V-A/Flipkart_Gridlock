@echo off
title Namma Trust
echo Stopping any existing servers on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul
echo Starting Namma Trust Backend...
start "Namma Trust Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --port 8000"
timeout /t 2 /nobreak >nul
echo Starting Namma Trust Frontend...
start "Namma Trust Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Namma Trust is starting. Open http://localhost:5173
pause
