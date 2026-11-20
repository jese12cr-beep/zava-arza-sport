@echo off
title ARZA SPORT Studio 3D (Grupo Zava) - Modo Local Opcional
cd /d "%~dp0"

echo ============================================================
echo    ARZA SPORT BY ZAVA - VISTA PREVIA LOCAL (OPCIONAL)
echo    Produccion en la nube: https://jese12cr-beep.github.io/zava-arza-sport/
echo ============================================================
echo.
if not exist node_modules (
  echo Instalando dependencias necesarias...
  call npm install
)

echo Compilando y abriendo vista previa temporal en http://localhost:4173 ...
call npm run build
start "" "http://localhost:4173"
call npm run preview -- --port 4173 --host

pause
