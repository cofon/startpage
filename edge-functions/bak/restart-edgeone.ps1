# EdgeOne Pages Dev 清理与重启脚本 - 简化版

Write-Host "=== EdgeOne 开发服务 - 清理与重启 ===" -ForegroundColor Cyan

# 步骤 1: 终止所有 Node.js 进程
Write-Host "[1/4] 终止所有 Node.js 进程..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 步骤 2: 检查端口
Write-Host "[2/4] 检查端口..." -ForegroundColor Yellow
netstat -ano | findstr ":8088"
netstat -ano | findstr ":8511"

# 步骤 3: 清理缓存
Write-Host "[3/4] 清理缓存..." -ForegroundColor Yellow
Set-Location "D:\vue\startpage\edge-functions"
if (Test-Path ".edgeone") { Remove-Item -Recurse -Force ".edgeone" }
if (Test-Path ".vite") { Remove-Item -Recurse -Force ".vite" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
Write-Host "  清理完成" -ForegroundColor Green

# 步骤 4: 启动服务
Write-Host ""
Write-Host "[4/4] 启动 EdgeOne 开发服务..." -ForegroundColor Green
Write-Host "提示：按 Ctrl+C 停止服务" -ForegroundColor Cyan
edgeone pages dev -t vwNrNw3qm6K7n703X3YJNRIZSGGvVXGkSrXjdaksjI4=
