# SVG 图标生成功能说明

## 📝 功能概述

程序现在会自动为缺少 `iconGenerateData` 字段的网站生成 SVG 图标，并且**同一域名的所有 URL 使用相同的 SVG 图标**。

## 🎯 主要特性

### 1. **自动生成 SVG**
- 当网站的 `iconGenerateData` 字段为空或不存在时，自动为其生成 SVG 图标
- 即使网络请求失败（如 404、超时等），仍会生成 SVG 图标作为降级方案

### 2. **域名缓存机制**
- 提取网站的根域名（如 `www.baidu.com`）
- 为每个域名生成一次 SVG，并缓存在内存中
- 同一域名的其他 URL 直接复用已生成的 SVG
- **示例：**
  - `https://www.baidu.com/a1/b1` → 生成 SVG（首字母 B）
  - `https://www.baidu.com/a2/b2` → 复用上面的 SVG
  - `https://www.baidu.com/a3/b3` → 复用上面的 SVG

### 3. **SVG 图标规则**
- **背景色**：蓝色 (#4a90e2)
- **文字**：白色，显示域名的首字母（大写）
- **尺寸**：64x64 viewBox
- **字体**：Arial, sans-serif, bold

## 📊 日志格式

日志中会记录每个网站的 SVG 处理情况：

```
SVG_GENERATED    <domain>    <url>     # 为该域名新生成 SVG
SVG_REUSED       <domain>    <url>     # 复用该域名的 SVG 缓存
SVG_GENERATION_COMPLETE  GENERATED <n>  REUSED <m>  # 统计信息
```

### 日志示例

```
2026-03-09 21:33:12  INFO  SVG_GENERATED         www.baidu.com   https://www.baidu.com/a1/b1
2026-03-09 21:33:12  INFO  SVG_REUSED            www.baidu.com   https://www.baidu.com/a2/b2
2026-03-09 21:33:12  INFO  SVG_REUSED            www.baidu.com   https://www.baidu.com/a3/b3
2026-03-09 21:33:12  INFO  SVG_GENERATED         www.google.com  https://www.google.com/search
2026-03-09 21:33:12  INFO  SVG_REUSED            www.google.com  https://www.google.com/maps
2026-03-09 21:33:12  INFO  SVG_GENERATION_COMPLETE  GENERATED 3  REUSED 4
```

**解读：**
- 为 3 个不同域名生成了 SVG（baidu.com、google.com、github.com）
- 复用了 4 次 SVG 缓存（同域名的其他 URL）

## 🔍 使用 awk/sed 分析 SVG 日志

### 在 Linux/Debian 上查看统计

```bash
# 统计生成和复用的 SVG 数量
awk -F'\t' '/SVG_GENERATION_COMPLETE/ {print "生成:" $4, "复用:" $6}' website_fetcher_*.log

# 查看所有新生成的 SVG（按域名分组）
awk -F'\t' '/SVG_GENERATED/ {print $3}' website_fetcher_*.log | sort | uniq -c

# 查看所有复用 SVG 的记录
awk -F'\t' '/SVG_REUSED/ {print $3 "\t" $4}' website_fetcher_*.log

# 统计每个域名的 SVG 复用次数
awk -F'\t' '/SVG_REUSED/ {count[$3]++} END {for (d in count) print d ": " count[d] "次"}' website_fetcher_*.log
```

### 使用 PowerShell 在 Windows 上查看

```powershell
# 查看 SVG 生成统计
$log = Get-Content website_fetcher_*.log -Encoding UTF8
$generated = $log | Select-String "SVG_GENERATED"
$reused = $log | Select-String "SVG_REUSED"
Write-Host "生成：$($generated.Count), 复用：$($reused.Count)"

# 查看哪些域名生成了 SVG
$generated | ForEach-Object { ($_ -split '\t')[3] } | Sort-Object -Unique

# 查看复用情况
$reused | ForEach-Object { 
    $parts = $_ -split '\t'
    Write-Host "$($parts[3]) -> $($parts[4])"
}
```

## 💡 示例场景

### 场景 1：批量导入书签

假设您有一批百度系的网址：
```json
{
  "websites": [
    {"url": "https://tieba.baidu.com"},
    {"url": "https://zhidao.baidu.com"},
    {"url": "https://image.baidu.com"},
    {"url": "https://www.google.com"},
    {"url": "https://maps.google.com"}
  ]
}
```

**执行结果：**
- `tieba.baidu.com` → 生成 SVG（首字母 T）
- `zhidao.baidu.com` → 复用 baidu.com 的 SVG
- `image.baidu.com` → 复用 baidu.com 的 SVG
- `www.google.com` → 生成 SVG（首字母 G）
- `maps.google.com` → 复用 google.com 的 SVG

**最终输出：**
- 只生成了 2 个不同的 SVG
- 复用了 3 次 SVG 缓存
- 所有百度系网站使用相同的蓝色"T"图标
- 所有 Google 系网站使用相同的蓝色"G"图标

### 场景 2：部分网站无法访问

```json
{
  "websites": [
    {"url": "https://www.baidu.com"},           // ✓ 可访问
    {"url": "https://www.google.com"},          // ✗ 超时
    {"url": "https://www.example-not-exist.com"} // ✗ 404
  ]
}
```

**执行结果：**
- 即使网站无法访问，仍会为它们生成 SVG 图标
- 保证每个网站都有 `iconGenerateData` 字段
- 可作为网络图标的降级方案

## 🎨 SVG 图标示例

### 百度域名 (www.baidu.com)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#4a90e2"/>
  <text x="32" y="40" font-size="32" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-weight="bold">B</text>
</svg>
```

### GitHub 域名 (github.com)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#4a90e2"/>
  <text x="32" y="40" font-size="32" text-anchor="middle" 
        fill="white" font-family="Arial, sans-serif" font-weight="bold">G</text>
</svg>
```

## ✅ 优势

1. **节省资源**：同一域名只生成一次 SVG，减少重复计算
2. **保持一致性**：同站点的不同页面使用相同图标
3. **提高成功率**：即使网络请求失败也有图标可用
4. **便于识别**：通过首字母快速识别网站
5. **日志清晰**：方便追踪和分析 SVG 生成情况

## ⚙️ 技术实现

### 域名提取逻辑
使用 `extract_domain()` 方法从 URL 中提取根域名：
- `https://www.baidu.com/a1/b1` → `www.baidu.com`
- `https://github.com/user/repo` → `github.com`

### 缓存机制
```python
domain_svg_cache = {}  # 域名 -> SVG Data URI

for website in websites:
    domain = extract_domain(url)
    if domain in domain_svg_cache:
        # 复用缓存
        website['iconGenerateData'] = domain_svg_cache[domain]
    else:
        # 生成新的 SVG 并缓存
        svg_icon = generate_svg_icon(url)
        website['iconGenerateData'] = svg_icon
        domain_svg_cache[domain] = svg_icon
```

## 📌 注意事项

1. **域名定义**：使用完整的域名（包括 www），所以 `baidu.com` 和 `www.baidu.com` 会被视为不同域名
2. **大小写**：域名首字母会转换为大写显示在 SVG 中
3. **特殊字符**：如果域名以数字开头，SVG 中会显示该数字
4. **空域名**：如果无法提取域名，会显示 "?" 作为占位符

## 🔄 与其他功能的配合

- **与网络图标获取配合**：
  - 优先使用网络获取的 `iconData`
  - `iconGenerateData` 作为备选或补充
  
- **与日志系统配合**：
  - 每条 SVG 生成/复用记录都会写入日志
  - 便于后续审计和问题排查

- **与输出格式配合**：
  - 输出的 JSON 保持与起始页项目完全兼容
  - 可直接导入使用，无需手动修改
