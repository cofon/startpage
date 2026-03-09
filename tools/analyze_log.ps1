# analyze_log.ps1 - Website Fetcher 日志分析脚本 (PowerShell 版本)
# 使用方法：.\analyze_log.ps1 [日志文件名]
# 如果不指定文件名，自动使用最新的日志文件

param(
    [string]$LogFile
)

# 如果没有指定日志文件，使用最新的
if (-not $LogFile) {
    $latestLog = Get-ChildItem "website_fetcher_*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $latestLog) {
        Write-Host "未找到日志文件" -ForegroundColor Red
        exit 1
    }
    $LogFile = $latestLog.Name
    Write-Host "使用最新日志文件：$LogFile" -ForegroundColor Cyan
}

if (-not (Test-Path $LogFile)) {
    Write-Host "日志文件不存在：$LogFile" -ForegroundColor Red
    exit 1
}

Write-Host "=== Website Fetcher 日志分析报告 ===" -ForegroundColor Green
Write-Host ""

# 读取日志内容
$logContent = Get-Content $LogFile

# 提取信息
$programStart = $logContent | Select-String "PROGRAM_START" | ForEach-Object { ($_ -split '\t')[0] }
$programEnd = $logContent | Select-String "PROGRAM_END" | ForEach-Object { ($_ -split '\t')[0] }

$inputFile = $logContent | Select-String "INPUT_FILE" | ForEach-Object { ($_ -split '\t')[2] }
$outputFile = $logContent | Select-String "OUTPUT_FILE" | ForEach-Object { ($_ -split '\t')[2] }
$maxWorkers = $logContent | Select-String "MAX_WORKERS" | ForEach-Object { ($_ -split '\t')[2] }
$timeout = $logContent | Select-String "TIMEOUT" | ForEach-Object { ($_ -split '\t')[2] }

$totalWebsites = $logContent | Select-String "TOTAL_WEBSITES" | Select-Object -Last 1 | ForEach-Object { ($_ -split '\t')[2] }
$missingStats = $logContent | Select-String "MISSING_FIELDS_STATISTICS" | ForEach-Object { $_ -split '\t' }
$urlsToFetch = $logContent | Select-String "URLS_TO_FETCH" | ForEach-Object { ($_ -split '\t')[2] }

$fetchStats = $logContent | Select-String "BATCH_FETCH_END" | ForEach-Object { $_ -split '\t' }
$fetchTotal = $fetchStats[4]
$fetchSuccess = $fetchStats[6]
$fetchFailed = $fetchStats[8]

$updatedCount = $logContent | Select-String "UPDATED_COUNT" | ForEach-Object { ($_ -split '\t')[2] }
$titleFilled = $logContent | Select-String "TITLE_FILLED" | ForEach-Object { ($_ -split '\t')[2] }
$descFilled = $logContent | Select-String "DESCRIPTION_FILLED" | ForEach-Object { ($_ -split '\t')[2] }
$iconFilled = $logContent | Select-String "ICONDATA_FILLED" | ForEach-Object { ($_ -split '\t')[2] }

$errors = $logContent | Select-String "\tERROR\t"
$warnings = $logContent | Select-String "\tWARNING\t"

# 输出报告
Write-Host "【执行时间】" -ForegroundColor Yellow
Write-Host "  开始：$programStart"
Write-Host "  结束：$programEnd"
Write-Host ""

Write-Host "【配置信息】" -ForegroundColor Yellow
Write-Host "  输入文件：$inputFile"
Write-Host "  输出文件：$outputFile"
Write-Host "  并发线程：$maxWorkers"
Write-Host "  超时时间：${timeout}秒"
Write-Host ""

Write-Host "【处理统计】" -ForegroundColor Yellow
Write-Host "  总网站数：$totalWebsites"
if ($missingStats) {
    Write-Host "  缺失统计：title=$($missingStats[3]), description=$($missingStats[5]), iconData=$($missingStats[7])"
}
Write-Host "  需要获取：$urlsToFetch"
Write-Host ""

Write-Host "【获取结果】" -ForegroundColor Yellow
Write-Host "  总共尝试：$fetchTotal"
Write-Host "  成功：$fetchSuccess"
Write-Host "  失败：$fetchFailed"
if ($fetchTotal -and [int]$fetchTotal -gt 0) {
    $successRate = ([int]$fetchSuccess / [int]$fetchTotal) * 100
    Write-Host ("  成功率：{0:N2}%" -f $successRate)
}
Write-Host ""

Write-Host "【更新结果】" -ForegroundColor Yellow
Write-Host "  更新数量：$updatedCount"
Write-Host "  Title 填充：$titleFilled"
Write-Host "  Description 填充：$descFilled"
Write-Host "  IconData 填充：$iconFilled"
Write-Host ""

Write-Host "【错误统计】" -ForegroundColor Yellow
Write-Host "  错误总数：$($errors.Count)"
Write-Host "  警告总数：$($warnings.Count)"

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  错误详情:" -ForegroundColor Red
    for ($i = 0; $i -lt $errors.Count; $i++) {
        $parts = $errors[$i] -split '\t'
        Write-Host ("    {0}. {1}`t{2}" -f ($i+1), $parts[3], $parts[4])
    }
}

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
