@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ===============================
echo   Recuperation des donnees
echo ===============================
echo.
node scripts/garmin-sync.mjs
echo.
echo Appuie sur une touche pour fermer.
pause >nul
