@echo off
chcp 65001 >nul
title 启动 职引未来 服务
cd /d "%~dp0"

echo 正在启动 MySQL（3307）...
schtasks /run /tn "ZhiyinMySQL" >nul 2>nul
timeout /t 7 /nobreak >nul

echo 正在启动网站（8080）...
schtasks /run /tn "ZhiyinWeb" >nul 2>nul
timeout /t 5 /nobreak >nul

echo.
echo ================================================
echo   已启动
echo   本机访问：   http://localhost:8080
echo   同网段访问： http://本机IP:8080
echo   （查看本机 IP：在命令行输入 ipconfig）
echo   停止服务：双击「停止服务器.bat」
echo ================================================
echo.
timeout /t 8 /nobreak >nul
