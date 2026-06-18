@echo off
echo Stopping any existing servers on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting EventFlow AI Backend...
start "EventFlow Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --port 8000"
timeout /t 3 /nobreak >nul
echo Starting EventFlow AI Frontend...
start "EventFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
