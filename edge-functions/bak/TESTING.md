# 本地测试指南

## 📦 快速开始

### 1. 安装依赖

在 `edge-functions` 目录下执行：

```bash
cd edge-functions
npm install
```

这会安装：
- `cheerio`: HTML 解析库
- `node-fetch`: Node.js 环境的 fetch API

### 2. 测试单个网站

```bash
# 方式 1: 使用 npm script
npm run test:single https://www.baidu.com

# 方式 2: 直接运行
node local-metadata-service.js https://www.baidu.com
```

**示例输出：**
```
[Metadata] 开始获取：https://www.baidu.com
[HTTP] ✅ 响应状态：200
[Charset] 从响应头检测到：utf-8
[Decode] ✅ HTML 长度：356789 字符
[Title] ✅ 从<title>标签获取
[Desc] ✅ 从 meta description 获取
[Icon] ✅ 从 rel="icon"获取：https://www.baidu.com/favicon.ico
[Result] ✅ 提取成功

✅ 测试结果: {
  "url": "https://www.baidu.com",
  "title": "百度一下，你就知道",
  "description": "百度是全球最大的中文搜索引擎...",
  "iconUrl": "https://www.baidu.com/favicon.ico"
}
```

### 3. 批量测试

```bash
# 运行批量测试（20 个网站）
npm run test:batch
```

这会测试 20 个常见网站，并生成测试报告。

---

## 🔧 自定义测试

### 修改测试 URL 列表

编辑 `test-metadata.js` 文件，修改 `websites` 数组：

```javascript
const websites = [
  'https://www.example1.com',
  'https://www.example2.com',
  // ... 添加更多
];
```

### 调整批次大小

```javascript
// 默认每批 50 个（受 EdgeOne 64 次 fetch 限制）
const results = await batchGetMetadata(websites, 50);
```

---

## 📊 日志说明

### 日志级别

- `[Metadata]`: 主流程日志
- `[HTTP]`: HTTP 请求状态
- `[Charset]`: 编码检测结果
- `[Decode]`: HTML 解码信息
- `[Title]`: Title 提取来源
- `[Desc]`: Description 提取来源
- `[Icon]`: Icon 提取来源
- `[JSON-LD]`: JSON-LD 解析状态
- `[Batch]`: 批量处理进度
- `[Error]`: 错误信息

### 符号说明

- ✅: 成功
- ⚠️: 警告/降级处理
- ℹ️: 提示信息
- ❌: 失败

---

## ⚙️ 配置选项

### 超时设置

在 `local-metadata-service.js` 中修改：

```javascript
signal: AbortSignal.timeout(10000) // 改为 15 秒
```

### 请求头配置

可以添加更多请求头：

```javascript
headers: {
  'User-Agent': '...',
  'Accept': '...',
  // 添加其他请求头
}
```

---

## 🐛 常见问题

### 1. 编码问题导致乱码

**现象**: 获取的 title/description 是乱码

**原因**: 某些中文网站使用 GBK 编码

**解决**: 代码已自动检测编码，检查日志中的 `[Charset]` 输出

### 2. SSL 证书错误

**现象**: `certificate has expired`

**解决**: 
- 开发环境可临时禁用证书验证
- 或联系网站管理员更新证书

### 3. 请求超时

**现象**: `The operation was aborted due to timeout`

**解决**:
- 增加超时时间：`AbortSignal.timeout(30000)`
- 检查网络连接
- 网站可能无法访问

### 4. 403 Forbidden

**现象**: `HTTP 403: Forbidden`

**原因**: 网站反爬虫机制

**解决**:
- 添加更完整的请求头
- 使用真实 User-Agent
- 添加延迟避免频繁请求

---

## 📈 性能优化建议

### 1. 并发控制

虽然本地可以同时发起多个请求，但要注意：
- EdgeOne 边缘函数有 **8 并发** 限制
- 建议保持与生产环境一致的配置

### 2. 缓存策略

可以添加简单的内存缓存：

```javascript
const cache = new Map();

async function getWebsiteMetadata(url) {
  if (cache.has(url)) {
    console.log('[Cache] ✅ 命中缓存');
    return cache.get(url);
  }
  
  const metadata = await _fetchMetadata(url);
  cache.set(url, metadata);
  return metadata;
}
```

### 3. 批量处理

对于大量网站：
- 分批处理（每批≤50 个）
- 批次间添加延迟
- 使用 `Promise.allSettled` 处理部分失败

---

## 🔄 下一步

测试通过后，可以：

1. **集成到项目**: 修改 `src/services/websiteMetadataService.js` 调用本地服务
2. **迁移到边缘函数**: 将逻辑复制到 `edge-functions/api/metadata.js`
3. **部署测试**: 使用 `edgeone pages dev` 本地测试边缘函数
4. **生产部署**: 推送到 Git 自动部署

---

## 📞 调试技巧

### 查看详细日志

在关键位置添加 `console.log`:

```javascript
console.log('[Debug] 响应头:', Object.fromEntries(response.headers));
console.log('[Debug] HTML 前 500 字符:', html.substring(0, 500));
```

### 单独测试某个网站

```bash
node local-metadata-service.js https://problematic-site.com
```

### 保存测试结果

```bash
node test-metadata.js > test-results.txt
```
