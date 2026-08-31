@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ===============================
echo   Envoi vers l application
echo ===============================
echo.
node scripts/garmin-sync.mjs --publish
echo.
echo Appuie sur une touche pour fermer.
pause >nul
