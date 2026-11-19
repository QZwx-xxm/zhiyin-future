@echo off
chcp 65001 >nul
title 职航AI 本地服务器
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  if exist "D:\Node.js\nodejs\node.exe" (
    set "PATH=D:\Node.js\nodejs;%PATH%"
  ) else (
    echo 没有找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
  )
)

set "MYSQLD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"
set "MYSQL_DATA=C:\Users\kxyjn\Desktop\jianliyouhua\mysql-data"

echo ================================================
echo   职航AI 启动中……
echo   数据库：MySQL 8.0（端口 3307）
echo   网站：  http://localhost:8080
echo   别人访问：http://本机IP:8080
echo ================================================
echo.

rem 1) 先确认 MySQL（3307）在不在，不在就拉起来
netstat -ano | findstr ":3307" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo [1/2] 启动 MySQL ...
  if not exist "%MYSQLD%" (
    echo 找不到 mysqld.exe，请确认 MySQL 装在默认路径
    pause
    exit /b 1
  )
  start "MySQL-3307" /min "%MYSQLD%" --no-defaults --datadir="%MYSQL_DATA%" --port=3307 --bind-address=127.0.0.1
  timeout /t 8 /nobreak >nul
) else (
  echo [1/2] MySQL 已在运行
)

echo [2/2] 构建并启动网站 ...
call npm run serve
pause
