<#
  一键把项目从 SQLite 切换到 MySQL。
  用法：右键“使用 PowerShell 运行”，或在项目目录执行
        powershell -ExecutionPolicy Bypass -File scripts/switch-to-mysql.ps1
#>

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  把数据库从 SQLite 切换到 MySQL" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1) 输入连接信息
$user = Read-Host "MySQL 用户名（直接回车 = root）"
if ([string]::IsNullOrWhiteSpace($user)) { $user = "root" }

$secure = Read-Host "MySQL 密码（输入时不显示）" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

$dbName = Read-Host "数据库名（直接回车 = career_ai）"
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "career_ai" }

# 2) 找 mysql.exe
$mysql = $null
$svc = Get-CimInstance Win32_Service -Filter "Name='MySQL80'" -ErrorAction SilentlyContinue
if ($svc -and $svc.PathName -match '"?([^"]*mysqld\.exe)') {
  $mysql = Join-Path (Split-Path $matches[1]) "mysql.exe"
}
if (-not $mysql -or -not (Test-Path $mysql)) {
  $mysql = Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
}
if (-not $mysql) { throw "没找到 mysql.exe，请确认 MySQL 已安装" }
Write-Host "使用客户端：$mysql" -ForegroundColor DarkGray

# 3) 测试连接 + 建库
$env:MYSQL_PWD = $password
& $mysql -u $user -e "SELECT VERSION();" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "连接失败：用户名或密码不对" }

& $mysql -u $user -e "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if ($LASTEXITCODE -ne 0) { throw "建库失败" }
Write-Host "[1/6] 数据库 $dbName 就绪" -ForegroundColor Green

# 4) 备份并切换 schema
Copy-Item "prisma\schema.prisma" "prisma\schema.sqlite.bak" -Force
Copy-Item ".env" ".env.sqlite.bak" -Force
Copy-Item "prisma\schema.mysql.prisma" "prisma\schema.prisma" -Force
Write-Host "[2/6] schema 已切到 mysql（原文件备份为 schema.sqlite.bak）" -ForegroundColor Green

# 5) 写 .env
$encodedPwd = [uri]::EscapeDataString($password)
$envContent = @"
DATABASE_URL="mysql://$user:$encodedPwd@127.0.0.1:3306/$dbName"
"@
Set-Content ".env" $envContent -Encoding UTF8
Write-Host "[3/6] .env 已更新（原文件备份为 .env.sqlite.bak）" -ForegroundColor Green

# 6) 生成客户端 + 建表 + 迁移数据
Write-Host "[4/6] 生成 Prisma 客户端并建表..." -ForegroundColor Yellow
npx prisma generate | Out-Host
npx prisma db push --skip-generate | Out-Host

Write-Host "[5/6] 迁移现有数据..." -ForegroundColor Yellow
node scripts/migrate-sqlite-to-mysql.mjs | Out-Host

# 7) 重新构建前端
Write-Host "[6/6] 重新构建前端..." -ForegroundColor Yellow
npm run build | Out-Host

Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "全部完成！现在执行 npm start 启动服务器即可。" -ForegroundColor Green
Write-Host "如果之后想退回 SQLite：把 prisma\schema.sqlite.bak 覆盖回 schema.prisma、.env.sqlite.bak 覆盖回 .env，再 npx prisma generate。" -ForegroundColor DarkGray
Read-Host "按回车关闭"
