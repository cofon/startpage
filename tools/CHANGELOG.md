# 更新日志

## 2026-03-09 - SVG 图标自动生成与域名缓存功能

### ✨ 新增功能

#### 1. **SVG 图标自动生成**
- 为缺少 `iconGenerateData` 字段的网站自动生成 SVG 图标
- 即使网络请求失败，也会生成 SVG 作为降级方案
- 确保每个网站都有可用的图标数据

#### 2. **域名级 SVG 缓存机制**
- 提取 URL 的根域名（如 `www.baidu.com`）
- 同一域名的所有 URL 共享同一个 SVG 图标
- 避免为同站点的不同页面生成多个不同图标

**示例：**
```
https://www.baidu.com/a1/b1  → 生成 SVG (首字母 B)
https://www.baidu.com/a2/b2  → 复用 SVG
https://www.baidu.com/a3/b3  → 复用 SVG
```

#### 3. **结构化日志记录**
添加以下日志类型，便于使用 awk/sed 分析：
- `SVG_GENERATED` - 记录新生成的 SVG
- `SVG_REUSED` - 记录复用的 SVG
- `SVG_GENERATION_COMPLETE` - 统计生成和复用数量

### 🔧 代码变更

#### website_fetcher.py

1. **修改 `update_websites_from_export()` 方法**
   - 添加第三次遍历，专门为缺少 `iconGenerateData` 的网站生成 SVG
   - 实现域名缓存机制 (`domain_svg_cache`)
   - 记录详细的 SVG 处理日志

2. **新增 `load_startpage_export_full()` 方法**
   - 加载完整的起始页导出数据（包括 websites、settings、themes、searchEngines）
   - 保持输入输出格式一致

3. **修改 `save_full_data_to_json()` 方法**
   - 保存完整的 JSON 结构，而非仅 websites 数组
   - 输出的文件可直接导入起始页项目

4. **删除 `save_websites_to_json()` 方法**
   - 已被 `save_full_data_to_json()` 替代

### 📝 输出格式改进

**之前的输出：**
```json
[
  {"url": "https://example.com", "title": "..."}
]
```

**现在的输出：**
```json
{
  "websites": [
    {"url": "https://example.com", "title": "..."}
  ],
  "settings": {},
  "themes": [],
  "searchEngines": []
}
```

**优势：**
- ✅ 与起始页导出格式完全一致
- ✅ 可直接导入使用，无需手动编辑
- ✅ 保留所有原始数据结构

### 📊 日志示例

```
2026-03-09 21:33:12  INFO  SVG_GENERATED         www.baidu.com   https://www.baidu.com/a1/b1
2026-03-09 21:33:12  INFO  SVG_REUSED            www.baidu.com   https://www.baidu.com/a2/b2
2026-03-09 21:33:12  INFO  SVG_REUSED            www.baidu.com   https://www.baidu.com/a3/b3
2026-03-09 21:33:12  INFO  SVG_GENERATION_COMPLETE  GENERATED 3  REUSED 4
```

### 🛠️ 使用方法

#### 基本用法
```bash
python main.py --input input.json --output output.json
```

#### 查看 SVG 生成统计（Linux/Debian）
```bash
# 统计生成和复用数量
awk -F'\t' '/SVG_GENERATION_COMPLETE/ {print "生成:" $4, "复用:" $6}' website_fetcher_*.log

# 查看哪些域名生成了 SVG
awk -F'\t' '/SVG_GENERATED/ {print $3}' website_fetcher_*.log | sort | uniq -c
```

#### 查看 SVG 生成统计（Windows PowerShell）
```powershell
$log = Get-Content website_fetcher_*.log -Encoding UTF8
$log | Select-String "SVG_GENERATION_COMPLETE"
```

### 🎯 实际效果

**测试数据：**
```json
{
  "websites": [
    {"url": "https://www.baidu.com/a1/b1"},
    {"url": "https://www.baidu.com/a2/b2"},
    {"url": "https://www.baidu.com/a3/b3"},
    {"url": "https://www.google.com/search"},
    {"url": "https://www.google.com/maps"},
    {"url": "https://github.com/user1/repo1"},
    {"url": "https://github.com/user2/repo2"}
  ]
}
```

**执行结果：**
- ✅ 生成 3 个不同的 SVG（baidu.com、google.com、github.com）
- ✅ 复用 4 次 SVG 缓存
- ✅ 所有百度系 URL 使用相同的"B"图标
- ✅ 所有 Google 系 URL 使用相同的"G"图标
- ✅ 所有 GitHub 系 URL 使用相同的"G"图标

### 📚 相关文档

- [`SVG_GENERATION_README.md`](./SVG_GENERATION_README.md) - SVG 生成功能详细说明
- [`LOG_README.md`](./LOG_README.md) - 日志格式与分析工具说明

### ⚠️ 注意事项

1. **域名定义**：使用完整域名（包括 www），`baidu.com` 和 `www.baidu.com` 被视为不同域名
2. **输出格式**：现在输出的是完整的起始页 JSON 结构，而非仅 websites 数组
3. **向后兼容**：如果输入文件只包含 websites 数组，输出也会保持相同结构

### 🐛 Bug 修复

- 修复了输出格式不一致的问题
- 修复了同一域名不同 URL 生成不同 SVG 的问题
- 修复了部分网站无法访问时缺少图标的问题

---

## 之前的更新

### 2026-03-08 - 初始版本
- 从起始页导出文件加载数据
- 批量获取网站 title、description、iconData
- 支持多线程并发请求
- 结构化日志记录
