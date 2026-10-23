@echo off
echo ===================================================
echo  Q-SHIELD  --  Enterprise Quantum Security Platform
echo  Starting Full-Stack Dev Environment
echo ===================================================
echo.

REM -- Start FastAPI backend on port 8000 --
echo [1/2] Starting FastAPI backend on http://localhost:8000 ...
start "Q-Shield Backend" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

REM -- Wait a moment for backend to initialise --
timeout /t 3 /nobreak > nul

REM -- Start Next.js frontend on port 3000 --
echo [2/2] Starting Next.js frontend on http://localhost:3000 ...
start "Q-Shield Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ===================================================
echo  Both servers are starting in separate windows:
echo    Frontend :  http://localhost:3000
echo    Backend  :  http://localhost:8000
echo    API Docs :  http://localhost:8000/docs
echo ===================================================
echo.
pause
