@echo off
echo ============================================
echo   BlockLib - Starting Local Demo Environment
echo ============================================

echo [1/3] Starting Hardhat Local Blockchain...
start "BlockLib - Blockchain (8545)" cmd /k "cd /d %~dp0 && npm run node:blockchain"

echo Waiting 5 seconds for Hardhat node to initialize...
timeout /t 5 /nobreak >nul

echo [2/3] Resetting demo DB, deploying Library.sol, and starting API...
start "BlockLib - API (4000)" cmd /k "cd /d %~dp0 && npm run demo:reset && npm run dev:api"

echo [3/3] Starting React Frontend...
start "BlockLib - Web (5173)" cmd /k "cd /d %~dp0 && npm run dev:web"

echo.
echo All 3 terminals launched!
echo Open http://localhost:5173 once the API and Web servers finish starting.
pause
