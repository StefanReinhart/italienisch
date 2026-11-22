@echo off
rem Doppelklick: veroeffentlicht die App (siehe veroeffentlichen.ps1)
where pwsh >nul 2>nul
if %errorlevel%==0 (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0veroeffentlichen.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0veroeffentlichen.ps1"
)
