# 边缘函数测试指南

## ✅ 修复完成

已成功修复 `AbortSignal.timeout is not a function` 错误，所有相关文件已更新。

### 修复的文件
1. ✅ `edge-functions/api/get-metadata.js` - EdgeOne 边缘函数主文件
2. ✅ `edge-functions/local-metadata-service.js` - 本地服务（2 处修复）
3. ✅ `edge-functions/test-api-quick.js` - 新增快速测试脚本
4. ✅ `edge-functions/package.json` - 新增测试命令

---

## 🚀 本地测试流程

### 方法一：快速测试（推荐）

```bash
# 1. 启动本地服务
cd edge-functions
npm install
npm run serve:local

# 2. 新开终端，运行快速测试
npm run test:quick https://www.baidu.com
```

**预期输出：**
```
🧪 开始测试边缘函数 API...

目标 URL: https://www.baidu.com
API 地址：http://localhost:3000/api/get-metadata?url=https%3A%2F%2Fwww.baidu.com

状态码：200

响应内容：
{
  "success": true,
  "data": {
    "title": "百度一下，你就知道",
    "description": "...",
    "iconUrl": "..."
  }
}

✅ 测试成功！
```

### 方法二：浏览器测试

```bash
# 1. 启动本地服务
npm run serve:local

# 2. 在浏览器中访问
http://localhost:3000/api/get-metadata?url=https://www.baidu.com
```

### 方法三：cURL 测试

```bash
# 启动服务后
curl "http://localhost:3000/api/get-metadata?url=https://www.baidu.com"
```

---

## 🌐 部署到 EdgeOne

### 前置准备

```bash
# 1. 安装 EdgeOne CLI（如未安装）
npm install -g edgeone

# 2. 登录 EdgeOne
edgeone login

# 3. 初始化项目（首次部署）
cd edge-functions
edgeone pages init
```

### 部署步骤

```bash
# 部署边缘函数
edgeone pages deploy
```

部署成功后会返回一个域名，例如：
```
https://startpage-rjh1mdmj.edgeone.cool
```

### 生产环境测试

```bash
# 访问部署后的 API
curl "https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.baidu.com"
```

或在浏览器中访问：
```
https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.baidu.com
```

---

## 📊 测试用例

### 测试网站列表

```bash
# 大型网站（测试超时处理）
npm run test:quick https://www.taobao.com

# 国际网站（测试网络延迟）
npm run test:quick https://www.google.com

# 小型网站（测试正常响应）
npm run test:quick https://zh.wikipedia.org

# 中文网站（测试编码处理）
npm run test:quick https://www.zhihu.com
```

### 错误场景测试

```bash
# 无效 URL
npm run test:quick "not-a-valid-url"
# 预期：返回 "URL 格式不正确"

# 缺少参数
curl http://localhost:3000/api/get-metadata
# 预期：返回 "缺少 url 参数"

# 无法访问的网站
npm run test:quick https://this-domain-does-not-exist.com
# 预期：返回超时或 DNS 错误
```

---

## 🔍 调试技巧

### 查看日志

本地服务会在终端输出详细日志：

```
[Metadata] 开始获取：https://www.baidu.com
[HTTP] ✅ 响应状态：200
[Decode] ✅ HTML 长度：12345 字符
[Title] ✅ 从<title>标签获取
[Desc] ✅ 从 meta description 获取
[Icon] ✅ 从 rel="icon"获取
[Result] ✅ 提取成功
```

### 超时测试

修改超时时间进行测试：

```javascript
// 在代码中临时修改超时时间
setTimeout(() => controller.abort(), 1000); // 1 秒超时
```

### 网络模拟

使用 Chrome DevTools 的 Network Throttling 模拟慢速网络。

---

## ⚠️ 常见问题

### Q1: 本地服务启动失败？
```bash
# 检查端口是否被占用
netstat -ano | findstr :3000

# 或者修改 server.js 中的端口号
```

### Q2: 返回 403 Forbidden？
- 网站可能反爬虫，检查 User-Agent 是否有效
- 尝试添加更多请求头
- 增加重试次数

### Q3: 返回空数据？
- 检查网站是否使用 JavaScript 渲染
- Cheerio 无法执行 JS，需要 Puppeteer
- 查看日志确认 HTML 解析是否成功

### Q4: 图标无法显示？
- 检查 iconUrl 是否为绝对路径
- 某些网站使用相对路径，需要转换
- 自动降级到 /favicon.ico

---

## 📈 性能优化建议

1. **缓存策略**：对同一域名的请求实施缓存
2. **并发控制**：批量请求时限制并发数（≤8）
3. **超时调整**：根据实际响应时间优化超时设置
4. **错误重试**：指数退避策略（1s, 2s, 4s）

---

## 📝 更新日志

### 2026-03-17
- ✅ 修复 `AbortSignal.timeout` 不兼容问题
- ✅ 使用 `AbortController + setTimeout` 实现超时
- ✅ 添加快速测试脚本
- ✅ 更新 package.json 添加测试命令
- ✅ 创建测试指南文档

---

## 🔗 相关文档

- [EdgeOne 边缘函数配置与元数据处理规范](./README.md)
- [修复总结](./FIX_ABORTSIGNAL_TIMEOUT.md)
- [本地服务代码](./local-metadata-service.js)
