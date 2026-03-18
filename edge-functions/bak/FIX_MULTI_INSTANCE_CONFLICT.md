# EdgeOne Pages Dev 多实例冲突问题修复

## 🚨 问题现象

运行 `edgeone pages dev --verbose` 时：

```
● Running at: http://localhost:6704
● Running at: http://localhost:6705
● Running at: http://localhost:6706
...
● Running at: http://localhost:6709  ← 最终停在这个端口

proxy error ECONNREFUSED 127.0.0.1:8511
```

**症状：**
- 启动了多个开发服务器实例（6704-6709）
- 代理服务无法启动（端口 8511 连接失败）
- 边缘函数无法正常工作

---

## 🔍 根本原因

### 原因 1: 进程未完全终止
之前运行的 `edgeone pages dev` 实例没有完全退出，导致：
- 新实例检测到旧实例在运行
- 自动切换到下一个可用端口
- 多个实例相互干扰

### 原因 2: 代理服务异常
EdgeOne 内部使用代理服务转发请求：
- 默认监听端口 8511
- 如果代理启动失败，所有函数请求都会失败
- 表现为 `ECONNREFUSED` 错误

### 原因 3: Windows 编码问题
```
'edgeone' ڲⲿҲǿеĳ
```
实际信息：`edgeone 不是内部或外部命令`
- PowerShell 使用 UTF-16LE 编码
- edgeone CLI 输出可能是 UTF-8
- 导致中文字符显示为乱码

---

## 🛠️ 完整解决方案

### 步骤 1: 强制终止所有 Node.js 进程

**Windows PowerShell:**
```powershell
# 方法 1: 使用 taskkill
taskkill /F /IM node.exe

# 方法 2: 使用 Stop-Process
Get-Process node | Stop-Process -Force
```

**验证进程已终止:**
```powershell
Get-Process node
# 应该返回空结果
```

### 步骤 2: 清理所有缓存和临时文件

```powershell
cd D:\vue\startpage\edge-functions

# 删除 EdgeOne 缓存
rm -rf .edgeone/

# 删除 Vite 缓存
rm -rf .vite/

# 删除 node_modules 缓存
rm -rf node_modules/.cache/

# 删除 temp 文件
rm -rf temp/

# 清理系统临时文件（可选）
rm -rf $env:TEMP/edgeone-*
```

### 步骤 3: 检查端口占用

```powershell
# 检查 8088 端口是否被占用
netstat -ano | findstr :8088

# 检查 8511 端口是否被占用
netstat -ano | findstr :8511

# 如果有占用，记录 PID 并终止
taskkill /F /PID <PID>
```

### 步骤 4: 重新启动（单实例模式）

```powershell
# 确保在当前目录
cd D:\vue\startpage\edge-functions

# 启动开发服务（不要加 --verbose，避免过度日志）
edgeone pages dev -t vwNrNw3qm6K7n703X3YJNRIZSGGvVXGkSrXjdaksjI4=

# 等待看到正常启动信息：
# ✓ Functions bundled successfully
# ✓ Development server started on http://localhost:8088
# ✓ Function registered: /api/hello
# ✓ Function registered: /api/get-metadata
```

### 步骤 5: 验证服务正常

**新开一个 PowerShell 窗口:**
```powershell
# 测试最简单的端点
curl -UseBasicParsing http://localhost:8088/api/hello

# 预期输出：
# Hello from API!
```

---

## ⚡ 快速解决脚本

创建 `restart-edgeone.ps1`:

```powershell
Write-Host "=== 正在停止所有 Node.js 进程 ===" -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Write-Host "=== 清理缓存 ===" -ForegroundColor Yellow
Set-Location "D:\vue\startpage\edge-functions"
Remove-Item -Recurse -Force .edgeone\ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .vite\ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache\ -ErrorAction SilentlyContinue

Write-Host "=== 检查端口占用 ===" -ForegroundColor Yellow
$ports = @("8088", "8511")
foreach ($port in $ports) {
    $result = netstat -ano | Select-String ":$port"
    if ($result) {
        Write-Host "端口 $port 被占用:" -ForegroundColor Red
        Write-Host $result
    } else {
        Write-Host "端口 $port 空闲 ✓" -ForegroundColor Green
    }
}

Write-Host "=== 启动 EdgeOne 开发服务 ===" -ForegroundColor Green
Write-Host "提示：按 Ctrl+C 停止服务" -ForegroundColor Cyan
edgeone pages dev -t vwNrNw3qm6K7n703X3YJNRIZSGGvVXGkSrXjdaksjI4=
```

**使用方法:**
```powershell
.\restart-edgeone.ps1
```

---

## 🎯 预防措施

### 1. 始终正确停止服务
```bash
# ✅ 正确：使用 Ctrl+C
# 在终端按 Ctrl+C 停止服务

# ❌ 错误：直接关闭窗口
# 这会导致进程残留
```

### 2. 定期检查进程
```powershell
# 每天工作开始前检查
Get-Process node | Where-Object {$_.StartTime -lt (Get-Date).AddHours(-1)}
# 终止运行超过 1 小时的异常进程
```

### 3. 使用单一终端
- 只在一个 PowerShell 窗口运行 `edgeone pages dev`
- 避免同时打开多个开发服务

### 4. 监控端口
```powershell
# 创建 monitor-port.ps1
while ($true) {
    Clear-Host
    Write-Host "=== 端口监控 ($(Get-Date -Format 'HH:mm:ss')) ==="
    netstat -ano | Select-String ":8088|:8511"
    Start-Sleep -Seconds 5
}
```

---

## 📊 正常启动日志示例

```
[plugins]Loaded internal plugin

🚀 [Logger Plugin] Starting development server
📂 Working directory: D:\vue\startpage\edge-functions
🔧 Development environment: {}

✅ [Logger Plugin] Development server is running
⏱️  Server started at: 2026-03-17T14:30:00.000Z
● Running at: http://localhost:8088  ← 正确的端口

[cli]Dev server running in raw mode...

> Start validating the configuration file:
none error in configuration file
End validating!

✓ Functions bundled successfully
✓ Function registered: /api/hello
✓ Function registered: /api/get-metadata
```

---

## ⚠️ 常见错误对照

| 错误现象 | 原因 | 解决方案 |
|---------|------|---------|
| 端口 6704-6709 | 多实例冲突 | 终止所有 node 进程 |
| ECONNREFUSED:8511 | 代理未启动 | 清理缓存后重启 |
| 中文乱码 | 编码不匹配 | 忽略，不影响功能 |
| 函数未注册 | 配置未加载 | 检查 edgeone-pages.json |

---

## 🔗 相关资源

- [故障排查指南](./TROUBLESHOOTING_DEV_SERVER.md)
- [路由重写修复](./FIX_ROUTE_REWRITE.md)
- [URL 编码规范](./URL_ENCODING_FIX.md)

---

**更新时间**: 2026-03-17  
**关键**: 彻底清理 + 单实例启动
