# 知乎网站调试信息说明

## 📋 已添加的调试功能

### **调试代码位置**
在 [`website_fetcher.py`](file://d:\vue\startpage\tools\website_fetcher.py#L677-L684) 的 `fetch_website_data()` 方法中（第 677-684 行）

### **输出的调试信息**

对于每个知乎网站，会输出以下调试日志：

| 日志类型 | 说明 | 示例 |
|---------|------|------|
| `DEBUG_ZHIHU_URL` | 完整的 URL | `https://www.zhihu.com/question/...` |
| `DEBUG_ZHIHU_STATUS` | HTTP 状态码 | `403` (Forbidden) |
| `DEBUG_ZHIHU_HEADERS` | 响应头字典 | `{'server': 'BLB/25.11.0.2', ...}` |
| `DEBUG_ZHIHU_HTML_LENGTH` | HTML 内容长度 | `694` 字节 |
| `DEBUG_ZHIHU_HTML_PREVIEW` | HTML 前 2000 字符 | `<!DOCTYPE html><html>...` |

---

## 🔍 查看调试信息

### **Windows PowerShell**

```powershell
# 查看所有知乎调试信息
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU"

# 只看状态码
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU_STATUS"

# 查看响应头
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU_HEADERS"

# 查看原始 HTML
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU_HTML_PREVIEW"
```

### **Linux / WSL (使用 awk)**

```bash
# 查看所有调试信息
awk -F': ' '/DEBUG_ZHIHU/ {print $2}' website_fetcher_*.log

# 查看状态码
awk -F'\t' '/DEBUG_ZHIHU_STATUS/ {print $3}' website_fetcher_*.log
```

---

## 📊 实际输出示例

### **403 Forbidden 情况**
```
2026-03-09 23:20:18INFO  DEBUG_ZHIHU_URL: https://www.zhihu.com/question/62251457/answer/3082755339?utm_id=0
2026-03-09 23:20:18INFO  DEBUG_ZHIHU_STATUS: 403
2026-03-09 23:20:18INFO  DEBUG_ZHIHU_HEADERS: {'server': 'BLB/25.11.0.2', 'content-type': 'text/html', ...}
2026-03-09 23:20:18INFO  DEBUG_ZHIHU_HTML_LENGTH: 694
2026-03-09 23:20:18INFO  DEBUG_ZHIHU_HTML_PREVIEW: <!DOCTYPE html><html lang="en"><head><meta id="zh-zse-ck" charset="UTF-8" content="MCsQx0IPKjIVmQM7pEf15M5HNDMOodCFw7E0NGp6mOw0AXUwel1a6hLPEVMhFc8/qh9xCf8Jllf7OJWeoraMCQJvD9rQf1TCrnkPpXOp1A0+of8mOuLs2EaBzecAWfNMls4279QJqX7VPGlv5790bhLupR9EKidnliZ/HgywC9o="></head><body>...</body></html>
```

**分析：**
- ✅ 状态码 403 → 被反爬虫机制拦截
- ✅ 响应头显示服务器是 `BLB/25.11.0.2`（知乎的反爬系统）
- ✅ HTML 内容很短（694 字节），包含反爬验证脚本 `zse-ck.js`
- ✅ 页面包含加密参数 `zh-zse-ck`，用于浏览器指纹识别

---

## 💡 调试信息用途

### **1. 诊断 403 错误原因**
通过查看 `DEBUG_ZHIHU_STATUS` 和 `DEBUG_ZHIHU_HEADERS`，可以判断：
- 是否被反爬虫系统识别
- 是否需要登录才能访问
- 是否有其他限制（如 IP 封禁、频率限制等）

### **2. 分析反爬机制**
通过 `DEBUG_ZHIHU_HTML_PREVIEW` 可以看到：
- 是否返回了验证码页面
- 是否要求登录
- 是否有 JavaScript 验证脚本

### **3. 验证请求头效果**
如果修改了 User-Agent 或其他请求头，可以通过调试信息验证是否有效。

---

## ⚠️ 注意事项

### **1. 日志文件大小**
- 每个知乎网站约增加 2-5KB 日志
- `DEBUG_ZHIHU_HTML_PREVIEW` 包含 2000 字符的原始 HTML
- 大量知乎网站可能导致日志文件迅速增大

### **2. 隐私保护**
响应头中可能包含敏感信息：
- Cookie（如 `_xsrf=kGzcYQXGZ5Q4tuVIn6tIcwHM2sRcInCZ`）
- 服务器内部标识符

**不要将完整日志上传到公开平台！**

### **3. 临时使用**
这些调试信息仅用于开发和排查问题：
- ✅ 调试完成后可以注释掉相关代码
- ✅ 或者通过条件编译只在需要时启用

---

## 🧪 测试方法

### **小规模测试**
```bash
cd d:\vue\startpage\tools
python main.py --input test_data.json --output test_output.json
```

### **查看结果**
```powershell
# 查看是否输出了调试信息
Get-Content website_fetcher_*.log | Select-String "DEBUG_ZHIHU"

# 统计成功/失败数量
Get-Content website_fetcher_*.log | Select-String "DEBUG_ZHIHU_STATUS" | ForEach-Object { ($_ -split ': ')[1] } | Group-Object
```

---

## 📝 代码实现细节

### **调试代码位置**
```python
# website_fetcher.py 第 677-684 行
# 调试信息：如果是知乎网站，输出详细数据（在检查状态码之前）
domain = self.extract_domain(normalized_url)
if 'zhihu.com' in domain:
 self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
 self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
 self.logger.info('DEBUG_ZHIHU_HEADERS: %s', dict(response.headers))
 self.logger.info('DEBUG_ZHIHU_HTML_LENGTH: %d', len(response.text))
 self.logger.info('DEBUG_ZHIHU_HTML_PREVIEW: %s', response.text[:2000])
```

### **关键设计决策**
1. **放在 `raise_for_status()` 之前** → 即使 403 错误也会输出
2. **使用 `%s` 格式化** → 避免 f-string 在某些情况下的编码问题
3. **限制 HTML 长度** → 防止日志文件过大（只输出前 2000 字符）
4. **使用制表符分隔** → 便于后续用 awk/grep 处理

---

## 🎯 下一步建议

### **如果需要更详细的调试**
可以添加：
- 请求头信息（User-Agent、Cookie 等）
- 完整的 HTML 内容（保存到单独文件）
- 网络连接时间统计
- DNS 解析时间

### **如果要绕过反爬**
可以考虑：
- 使用真实的 Cookie
- 添加随机延迟
- 使用代理 IP
- 使用无头浏览器（Selenium/Puppeteer）

---

## ✅ 总结

现在您已经有了完整的知乎网站调试工具：
- ✅ 可以看到 HTTP 状态码
- ✅ 可以查看响应头信息
- ✅ 可以查看原始 HTML 内容
- ✅ 即使 403 错误也能获取数据

这些信息足以帮助您诊断为什么知乎网站无法访问，以及可能的解决方案！🔍
