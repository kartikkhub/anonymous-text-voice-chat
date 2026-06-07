@echo off
title Anonymous Text & Voice Chat Server
echo ==========================================================
echo   Starting Anonymous Text & Voice Chat Lobbies
echo ==========================================================
echo.

:: Check for node_modules directory
if not exist node_modules (
    echo [INFO] node_modules folder not found. Installing dependencies...
    call npm.cmd install
) else (
    echo [INFO] Dependencies are already installed.
)

echo.
echo [INFO] Starting development server...
echo [INFO] Open http://localhost:3000 in your browser to chat.
echo [INFO] Press Ctrl+C in this terminal window to stop the server.
echo.

call npm.cmd run dev
pause
