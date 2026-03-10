# 知乎网站调试信息说明

## 📋 修改内容

### **1. 移除 h1 降级方案** ❌

**修改前：**
```python
def fetch_title(self, soup):
    # 先查找 head 标签，然后在 head 中查找 title 标签
    head_tag = soup.find('head')
    if head_tag:
        title_tag = head_tag.find('title')
    else:
        # 如果没有找到 head 标签，则在整个文档中查找 title
        title_tag = soup.find('title')
    
    if title_tag:
        title = title_tag.text.strip()
        # ...过滤逻辑...
        return title
    
    # 降级方案：从 h1 获取
    if not title:
        h1 = soup.find('h1')
        if h1:
            title = h1.text.strip()
```

**修改后：**
```python
def fetch_title(self, soup):
    # 只从 head 标签中的 title 标签提取，不再使用 body 中的 h1 降级
    head_tag = soup.find('head')
    if head_tag:
        title_tag = head_tag.find('title')
        if title_tag:
            title = title_tag.text.strip()
            # ...过滤逻辑...
            if title and title not in ['Sina Visitor System', ...]:
                return title
    return ''
```

**影响：**
- ✅ 更严格遵循 HTML 规范（`<title>` 应在 `<head>` 中）
- ✅ 避免获取到 body 中错误的 title 标签
- ⚠️ 某些动态网站可能无法获取标题（但会有特殊网站硬编码兜底）

---

### **2. 添加知乎调试信息** 🔍

在 [`fetch_website_data()`](file://d:\vue\startpage\tools\website_fetcher.py#L689-L706) 方法中添加（第 689-706 行）：

```python
# 调试信息：如果是知乎网站，输出原始 HTML 数据和相关调试信息
domain = self.extract_domain(normalized_url)
if 'zhihu.com' in domain:
    self.logger.info(f'DEBUG_ZHIHU_RAW_HTML\t{normalized_url}')
    self.logger.info(f'DEBUG_ZHIHU_STATUS_CODE\t{response.status_code}')
    self.logger.info(f'DEBUG_ZHIHU_RESPONSE_HEADERS\t{dict(response.headers)}')
    
    # 输出 head 部分的原始 HTML（限制长度，避免日志过长）
    head_tag = soup.find('head')
    if head_tag:
        head_html = str(head_tag)[:2000]  # 限制长度
        self.logger.info(f'DEBUG_ZHIHU_HEAD_HTML\t{head_html}')
    else:
        self.logger.warning(f'DEBUG_ZHIHU_NO_HEAD\tNo <head> tag found')
    
    # 输出 title 标签内容
    title_tag = soup.find('title')
    if title_tag:
        self.logger.info(f'DEBUG_ZHIHU_TITLE_TAG\t{title_tag.text.strip()}')
    else:
        self.logger.warning(f'DEBUG_ZHIHU_NO_TITLE\tNo <title> tag found')
```

---

## 🎯 调试信息详解

### **输出的调试日志类型**

| 日志类型 | 说明 | 示例 |
|---------|------|------|
| `DEBUG_ZHIHU_RAW_HTML` | 知乎 URL 和状态码 | `https://www.zhihu.com/question/...` |
| `DEBUG_ZHIHU_STATUS_CODE` | HTTP 响应状态码 | `200` 或 `403` |
| `DEBUG_ZHIHU_RESPONSE_HEADERS` | 响应头信息 | `{'Content-Type': 'text/html', ...}` |
| `DEBUG_ZHIHU_HEAD_HTML` | `<head>` 标签的原始 HTML（前 2000 字符） | `<head><title>...</title>...</head>` |
| `DEBUG_ZHIHU_TITLE_TAG` | `<title>` 标签的文本内容 | `有问题，就会有答案 - 知乎` |
| `DEBUG_ZHIHU_NO_HEAD` | 未找到 `<head>` 标签（警告） | `No <head> tag found` |
| `DEBUG_ZHIHU_NO_TITLE` | 未找到 `<title>` 标签（警告） | `No <title> tag found` |

---

## 📊 查看调试信息

### **Windows PowerShell**

```powershell
# 查看所有知乎相关的调试日志
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU"

# 查看特定网站的调试信息
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU_HEAD_HTML"

# 查看状态码
Get-Content website_fetcher_*.log -Encoding UTF8 | Select-String "DEBUG_ZHIHU_STATUS_CODE"
```

### **Linux / WSL (awk)**

```bash
# 查看所有知乎调试信息
awk -F'\t' '/DEBUG_ZHIHU/ {print $2, $3}' website_fetcher_*.log

# 查看 head HTML 内容
awk -F'\t' '/DEBUG_ZHIHU_HEAD_HTML/ {print $3}' website_fetcher_*.log

# 查看 title 标签内容
awk -F'\t' '/DEBUG_ZHIHU_TITLE_TAG/ {print $3}' website_fetcher_*.log
```

---

## 🔍 分析 403 错误原因

### **可能的情况**

#### **1. 成功获取（状态码 200）**
```
DEBUG_ZHIHU_STATUS_CODE    200
DEBUG_ZHIHU_HEAD_HTML      <head><title>有问题，就会有答案 - 知乎</title>...</head>
DEBUG_ZHIHU_TITLE_TAG      有问题，就会有答案 - 知乎
```
**结论：** 请求成功，能正常获取 HTML

#### **2. 403 Forbidden（被反爬虫拦截）**
```
DEBUG_ZHIHU_STATUS_CODE    403
DEBUG_ZHIHU_RESPONSE_HEADERS    {'X-XSS-Protection': '1', 'Content-Security-Policy': ...}
```
**结论：** 被知乎反爬虫机制识别并拒绝

**常见原因：**
- User-Agent 不够真实
- 缺少必要的请求头（如 Cookie、Referer）
- 访问频率过高
- IP 被限制

#### **3. 有 HTML 但无 title**
```
DEBUG_ZHIHU_HEAD_HTML      <head><meta charset="utf-8">...</head>
DEBUG_ZHIHU_NO_TITLE       No <title> tag found
```
**结论：** 页面结构异常或动态加载

---

## 💡 使用建议

### **临时启用调试**

只在需要调试时开启，避免日志过大：

```python
# 在 fetch_website_data() 方法中
if 'zhihu.com' in domain:
    # 调试代码...
```

**调试完成后可以注释掉或删除。**

### **扩展到其他网站**

如果需要调试其他网站，可以复制逻辑：

```python
if 'zhihu.com' in domain:
    # 知乎调试代码...
elif 'stackoverflow.com' in domain:
    # StackOverflow 调试代码...
elif 'github.com' in domain:
    # GitHub 调试代码...
```

---

## 📝 修改的文件清单

### [website_fetcher.py](file://d:\vue\startpage\tools\website_fetcher.py)

1. **第 236-250 行**：[`fetch_title()`](file://d:\vue\startpage\tools\website_fetcher.py#L236-L250) 方法
   - 移除 h1 降级方案
   - 只从 `<head>` 中提取 title

2. **第 689-706 行**：[`fetch_website_data()`](file://d:\vue\startpage\tools\website_fetcher.py#L689-L706) 方法
   - 添加知乎调试信息输出
   - 包括状态码、响应头、head HTML、title 等

3. **第 634-658 行**：文档字符串更新
   - 移除 h1 相关的说明

---

## 🧪 测试方法

### **小规模测试**

```bash
cd d:\vue\startpage\tools
python main.py --input test_zhihu.json --output test_output.json
```

### **查看结果**

```powershell
# 查看是否输出了调试信息
Get-Content website_fetcher_*.log | Select-String "DEBUG_ZHIHU"

# 查看获取到的 title
Get-Content website_fetcher_*.log | Select-String "DEBUG_ZHIHU_TITLE_TAG"
```

---

## ⚠️ 注意事项

### **1. 日志文件大小**

调试信息会显著增加日志文件大小：
- 每个知乎网站约增加 2-5KB 日志
- 大量知乎网站可能导致日志文件过大

**建议：** 调试完成后删除或注释掉调试代码。

### **2. 隐私保护**

响应头中可能包含敏感信息：
- Server 信息
- Set-Cookie
- X-Frame-Options 等安全策略

**注意：** 不要将完整日志上传到公开平台。

### **3. 性能影响**

输出大量调试信息会略微降低处理速度：
- 字符串格式化开销
- 日志写入磁盘时间

**影响很小，但批量处理时需注意。**

---

## 🎯 预期效果

运行程序后，对于每个知乎网站，您应该能看到类似这样的日志：

```
2026-03-09 22:30:15  INFO  DEBUG_ZHIHU_RAW_HTML    https://www.zhihu.com/question/123456
2026-03-09 22:30:15  INFO  DEBUG_ZHIHU_STATUS_CODE    200
2026-03-09 22:30:15  INFO  DEBUG_ZHIHU_RESPONSE_HEADERS    {'Content-Type': 'text/html; charset=utf-8', 'Server': 'nginx', ...}
2026-03-09 22:30:15  INFO  DEBUG_ZHIHU_HEAD_HTML    <head><meta charset="utf-8"><title>有问题，就会有答案 - 知乎</title><meta name="description" content="知乎，中文互联网高质量的问答社区和创作者聚集的原创内容平台"...
2026-03-09 22:30:15  INFO  DEBUG_ZHIHU_TITLE_TAG    有问题，就会有答案 - 知乎
```

或者如果是 403 错误：

```
2026-03-09 22:30:16  INFO  DEBUG_ZHIHU_RAW_HTML    https://www.zhihu.com/question/789012
2026-03-09 22:30:16  INFO  DEBUG_ZHIHU_STATUS_CODE    403
2026-03-09 22:30:16  INFO  DEBUG_ZHIHU_RESPONSE_HEADERS    {'X-XSS-Protection': '1', 'Content-Security-Policy': "...", 'Server': 'ZHIHU'}
```

这样您就可以清楚地看到：
- ✅ HTTP 状态码（200 成功 or 403 被拦截）
- ✅ 响应头信息（判断是否被识别为爬虫）
- ✅ 原始 HTML 内容（确认是否返回了有效页面）
- ✅ Title 标签内容（验证是否能正确提取）

立即测试一下吧！🔍
