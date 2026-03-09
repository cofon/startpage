# Website Fetcher 日志使用说明

## 📝 日志文件格式

日志文件采用**制表符分隔（TSV）**格式，便于使用 `sed`、`awk`、`cut` 等工具处理。

### 日志文件名
```
website_fetcher_YYYYMMDD_HHMMSS.log
```
例如：`website_fetcher_20260309_210345.log`

### 日志格式
```
时间戳\t级别\t消息内容
```

示例：
```
2026-03-09 21:03:45	INFO	PROGRAM_START	Website Fetcher Started
2026-03-09 21:03:45	INFO	TIMESTAMP	2026-03-09T21:03:45.123456
2026-03-09 21:03:45	INFO	INPUT_FILE	../src/data/startpage-backup-2026-02-05.json
2026-03-09 21:03:45	INFO	OUTPUT_FILE	websites-updated.json
```

## 🔍 常用 awk/sed 命令示例

### 1. 查看程序执行统计

```bash
# 查看处理的网站总数
awk -F'\t' '/TOTAL_WEBSITES/ {print $3}' website_fetcher_*.log

# 查看成功更新的网站数量
awk -F'\t' '/UPDATED_COUNT/ {print $3}' website_fetcher_*.log

# 查看各字段填充统计
awk -F'\t' '/MISSING_FIELDS_STATISTICS/ {print "Title缺失:"$3", Description缺失:"$5", Icon缺失:"$7}' website_fetcher_*.log
```

### 2. 查看成功/失败的 URL

```bash
# 查看所有成功的 URL
awk -F'\t' '/FETCH_SUCCESS/ {print $3}' website_fetcher_*.log

# 查看所有失败的 URL
awk -F'\t' '/FETCH_FAILED/ {print $4}' website_fetcher_*.log

# 统计失败次数
awk -F'\t' '/FETCH_FAILED/ {count++} END {print "失败总数:", count}' website_fetcher_*.log
```

### 3. 查看错误信息

```bash
# 查看所有错误
awk -F'\t' '$2=="ERROR" {print $0}' website_fetcher_*.log

# 查看特定类型的错误（如连接错误）
awk -F'\t' '/ConnectionError/ {print $0}' website_fetcher_*.log

# 统计各类错误数量
awk -F'\t' '$2=="ERROR" {errors[$3]++} END {for (e in errors) print e": "errors[e]}' website_fetcher_*.log
```

### 4. 查看程序运行状态

```bash
# 查看程序开始和结束时间
awk -F'\t' '/PROGRAM_START|PROGRAM_END/ {print $1, $3}' website_fetcher_*.log

# 查看配置信息
awk -F'\t' '/CONFIGURATION_START/,/CONFIGURATION_END/' website_fetcher_*.log

# 查看完整的执行流程
awk -F'\t' '{print $1, $2, $3}' website_fetcher_*.log | head -50
```

### 5. 使用 sed 提取特定信息

```bash
# 提取所有成功的 URL（使用 sed）
sed -n 's/.*FETCH_SUCCESS\t\([^\t]*\)\t.*/\1/p' website_fetcher_*.log

# 提取所有警告信息
sed -n 's/.*WARNING\t\(.*\)/\1/p' website_fetcher_*.log

# 删除 INFO 级别日志，只看 WARNING 和 ERROR
sed '/\tINFO\t/d' website_fetcher_*.log
```

### 6. 组合命令示例

```bash
# 统计成功率
total=$(awk -F'\t' '/BATCH_FETCH_END/ {sum+=$4} END {print sum}' website_fetcher_*.log)
success=$(awk -F'\t' '/BATCH_FETCH_END/ {sum+=$6} END {print sum}' website_fetcher_*.log)
echo "总共：$total, 成功：$success, 成功率：$(echo "scale=2; $success*100/$total" | bc)%"

# 查看每个网站的标题获取情况
awk -F'\t' '/FETCH_SUCCESS/ {print $3 "\t" $4}' website_fetcher_*.log | sort | uniq -c

# 生成简要报告
echo "=== 执行报告 ===" && \
awk -F'\t' '/PROGRAM_START/ {start=$1} /PROGRAM_END/ {end=$1} END {print "开始：" start; print "结束：" end}' website_fetcher_*.log && \
awk -F'\t' '/TOTAL_WEBSITES/ {print "总网站数：" $3}' website_fetcher_*.log && \
awk -F'\t' '/UPDATED_COUNT/ {print "更新数量：" $3}' website_fetcher_*.log && \
awk -F'\t' '/FETCH_FAILED/ {count++} END {print "失败数量：" (count?count:0)}' website_fetcher_*.log
```

## 📊 日志类型说明

### 程序生命周期
- `PROGRAM_START` - 程序开始运行
- `PROGRAM_END` - 程序执行完成
- `TIMESTAMP` - 时间戳

### 配置信息
- `CONFIGURATION_START/END` - 配置信息块开始/结束
- `INPUT_FILE` - 输入文件路径
- `OUTPUT_FILE` - 输出文件路径
- `MAX_WORKERS` - 并发线程数
- `TIMEOUT` - 请求超时时间

### 数据加载
- `LOAD_FILE_START` - 开始加载文件
- `LOAD_FILE_SUCCESS` - 文件加载成功
- `LOAD_FILE_ERROR` - 文件加载失败
- `WEBSITES_COUNT` - 网站数量

### 数据处理
- `UPDATE_START` - 开始更新数据
- `UPDATE_COMPLETE` - 更新完成
- `MISSING_FIELDS_STATISTICS` - 缺失字段统计
- `URLS_TO_FETCH` - 需要获取的 URL 列表
- `UPDATED_COUNT` - 更新的网站数量

### 网络请求
- `BATCH_FETCH_START` - 批量获取开始
- `BATCH_FETCH_END` - 批量获取结束
- `FETCH_SUCCESS` - 单个网站获取成功
- `FETCH_FAILED` - 单个网站获取失败
- `FETCH_ERROR` - 获取过程中的错误

### 文件保存
- `SAVE_FILE_START` - 开始保存文件
- `SAVE_FILE_SUCCESS` - 文件保存成功
- `SAVE_FILE_ERROR` - 文件保存失败

### 错误和警告
- `PARAM_ERROR` - 参数错误
- `UNKNOWN_PARAM` - 未知参数
- `WARNING` - 一般警告
- `ERROR` - 错误

## 💡 实用技巧

### 在 Windows 上使用 PowerShell 查看日志

```powershell
# 查看日志文件内容
Get-Content website_fetcher_*.log

# 筛选 ERROR 级别的日志
Select-String -Pattern "\tERROR\t" website_fetcher_*.log

# 统计成功和失败数量
$log = Get-Content website_fetcher_*.log
$success = ($log | Select-String "FETCH_SUCCESS").Count
$failed = ($log | Select-String "FETCH_FAILED").Count
Write-Host "成功：$success, 失败：$failed"
```

### 在 Debian/Linux 上使用 grep/awk

```bash
# 实时查看日志（类似 tail -f）
tail -f website_fetcher_*.log

# 彩色高亮显示错误
grep --color=always "ERROR\|FAILED" website_fetcher_*.log

# 导出失败的 URL 到文件
awk -F'\t' '/FETCH_FAILED/ {print $4}' website_fetcher_*.log > failed_urls.txt
```

## 🎯 快速诊断

```bash
# 一键诊断脚本
#!/bin/bash
LOG_FILE=$(ls -t website_fetcher_*.log | head -1)

if [ -z "$LOG_FILE" ]; then
    echo "未找到日志文件"
    exit 1
fi

echo "=== 最新日志：$LOG_FILE ==="
echo ""
echo "执行时间："
awk -F'\t' '/PROGRAM_START|PROGRAM_END/ {print $1, $3}' "$LOG_FILE"
echo ""
echo "配置信息："
awk -F'\t' '/INPUT_FILE|OUTPUT_FILE|MAX_WORKERS|TIMEOUT/ {print $3, $4}' "$LOG_FILE"
echo ""
echo "处理统计："
awk -F'\t' '/TOTAL_WEBSITES|UPDATED_COUNT/ {print $3, $4}' "$LOG_FILE"
echo ""
echo "失败统计："
awk -F'\t' '/FETCH_FAILED/ {count++} END {print "失败数量:", (count?count:0)}' "$LOG_FILE"
echo ""
echo "错误列表："
awk -F'\t' '$2=="ERROR" {print $3, $4}' "$LOG_FILE"
```

## ⚠️ 注意事项

1. **日志文件大小**：大量网站处理时日志可能很大，建议定期清理
2. **时间同步**：跨平台使用时注意系统时间一致性
3. **编码问题**：日志文件使用 UTF-8 编码，确保终端支持
4. **特殊字符**：URL 中包含的特殊字符已在日志中正确转义
