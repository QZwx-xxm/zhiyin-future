@echo off
chcp 65001 >nul
title 停止 职航AI 服务器
cd /d "%~dp0"

echo 正在停止网站（8080）...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
  taskkill /f /pid %%p >nul 2>nul
)

echo 正在停止 MySQL（3307）...
set "MYSQLADMIN=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe"
if exist "%MYSQLADMIN%" (
  "%MYSQLADMIN%" -h 127.0.0.1 -P 3307 -u root --skip-password shutdown >nul 2>nul
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3307" ^| findstr "LISTENING"') do (
  taskkill /f /pid %%p >nul 2>nul
)

echo 已停止。
timeout /t 3 /nobreak >nul
