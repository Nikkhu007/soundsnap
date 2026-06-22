@echo off
title SoundSnap Launcher
color 0A

echo.
echo  Starting SoundSnap...
echo.

:: Kill anything already on ports 5000 and 5173
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 "') do taskkill /PID %%a /F >nul 2>&1

:: Start backend in its own window
start "SoundSnap Backend" cmd /k "cd /d D:\code\soundsnap\server && node index.js"

:: Give backend 2 seconds to connect to MongoDB
timeout /t 2 /nobreak >nul

:: Start frontend in its own window
start "SoundSnap Frontend" cmd /k "cd /d D:\code\soundsnap\client && npm run dev"

:: Give Vite 3 seconds to spin up
timeout /t 3 /nobreak >nul

:: Open the app in the default browser
start "" "http://localhost:5173"

echo  Backend  running on http://localhost:5000
echo  Frontend running on http://localhost:5173
echo.
echo  Both windows opened. Close them to stop the servers.
echo.
pause
