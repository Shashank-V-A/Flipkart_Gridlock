@echo off
echo Starting EventFlow AI Backend...
start "EventFlow Backend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo Starting EventFlow AI Frontend...
start "EventFlow Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
