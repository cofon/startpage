# 边缘函数修复总结

## 问题描述

部署到 EdgeOne 的边缘函数在调用时返回 500 错误：
```json
{"success":false,"error":"AbortSignal.timeout is not a function"}
```

**根本原因：**
- `AbortSignal.timeout()` 是较新的 Web API，需要 Node.js 17+ 才支持
- EdgeOne 边缘函数运行环境可能使用 Node.js 16.x，不支持该方法

## 修复内容

### 1. 修复文件：`edge-functions/api/get-metadata.js`

**修改前：**
```javascript
signal: AbortSignal.timeout(15000), // 增加到 15 秒超时
```

**修改后：**
```javascript
// 创建超时控制的 AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  console.log(`[Timeout] ⏰ 请求超时 (15 秒)，中止请求`);
  controller.abort();
}, 15000);

// ... fetch 请求中使用 controller.signal

// 清除超时定时器
clearTimeout(timeoutId);
```

### 2. 修复文件：`edge-functions/local-metadata-service.js`

**第一处（网站元数据获取）：**
```javascript
// 修改前
signal: AbortSignal.timeout(15000),

// 修改后
signal: (() => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 15000);
  return controller.signal;
})(),
```

**第二处（图标获取）：**
```javascript
// 修改前
signal: AbortSignal.timeout(5000),

// 修改后
signal: (() => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);
  return controller.signal;
})(),
```

## 技术说明

### 兼容性方案优势
1. **广泛兼容**：`AbortController` + `setTimeout` 组合在所有 Node.js 版本中都支持
2. **功能等价**：实现与 `AbortSignal.timeout()` 相同的超时中止功能
3. **日志增强**：添加了超时日志，便于调试和监控

### 超时设置
- **主请求**：15 秒超时（适用于网页抓取）
- **图标请求**：5 秒超时（图标文件较小，快速失败）

## 测试步骤

### 本地测试
```bash
cd edge-functions
npm install
npm run serve:local
```

访问：`http://localhost:3000/api/get-metadata?url=https://www.baidu.com`

### 部署到 EdgeOne
```bash
# 确保已登录 EdgeOne
edgeone login

# 部署边缘函数
edgeone pages deploy
```

### 验证测试
访问部署后的 URL：
```
https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.baidu.com
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "title": "百度一下，你就知道",
    "description": "...",
    "iconUrl": "..."
  }
}
```

## 相关文件

- ✅ `edge-functions/api/get-metadata.js` - 边缘函数入口（已修复）
- ✅ `edge-functions/local-metadata-service.js` - 本地服务（已修复）
- ⚠️ `edge-functions/server.js` - 需检查是否有同样问题

## 后续建议

1. **统一超时处理**：考虑创建工具函数封装超时逻辑
2. **错误监控**：在生产环境添加更详细的错误日志
3. **性能优化**：对于频繁访问的域名实施缓存策略

## 修改时间
2026-03-17
