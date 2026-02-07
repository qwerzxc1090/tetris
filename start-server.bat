@echo off
cd /d "%~dp0"
echo Serving from: %CD%
echo.
echo Starting server at http://localhost:5500
echo Press Ctrl+C to stop.
echo.

python -m http.server 5500 --bind 0.0.0.0 2>nul
if %errorlevel% neq 0 (
  echo Python not found. Trying Node.js...
  npx --yes serve -l 5500 .
)
if %errorlevel% neq 0 (
  echo Install Python or Node.js, or run start-server.ps1 in PowerShell.
  pause
)
