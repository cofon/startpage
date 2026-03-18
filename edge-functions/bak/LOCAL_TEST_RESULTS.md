# 本地测试结果与解决方案

## 📊 测试结果汇总

### ✅ 测试通过
- **hello.js (生产环境)**: EdgeOne 部署后正常工作
  - URL: `https://startpage-rjh1mdmj.edgeone.cool/api/hello?target=https://www.baidu.com`
  - 返回：`You sent the target URL: https://www.baidu.com`

### ⚠️ 存在问题

#### 问题 1: hello.js 本地测试转圈
**现象**：
- 访问 `http://localhost:8088/api/hello?target=https://www.baidu.com` 一直转圈
- 访问 `http://localhost:8088/api/hello?target=abc` 正常返回

**原因分析**：
1. **百度反爬机制** - 本地开发环境的 fetch 请求可能被识别为脚本行为
2. **超时设置** - 可能没有设置合适的超时时间
3. **User-Agent 问题** - 默认 User-Agent 可能暴露了爬虫身份

**解决方案**：
```javascript
// 在 hello.js 中添加 User-Agent 和超时设置
const response = await fetch(target, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  signal: AbortSignal.timeout(10000)
});
```

---

#### 问题 2: get-metadata.js SSL 错误 ❌
**错误信息**：
```
输入：https://localhost:8088/api/get-metadata?url=https://www.baidu.com
此站点的连接不安全
ERR_SSL_PROTOCOL_ERROR
```

**根本原因**：
- `edgeone pages dev` 启动的是 **HTTP 服务**（非 HTTPS）
- 使用了错误的协议：`https://localhost:8088` ❌
- 正确的协议：`http://localhost:8088` ✅

**解决方案**：
使用 HTTP 协议访问本地服务：
```bash
# ❌ 错误
https://localhost:8088/api/get-metadata?url=https://www.baidu.com

# ✅ 正确
http://localhost:8088/api/get-metadata?url=https://www.baidu.com
```

---

## 🔧 修复措施

### 已完成的修复

#### 1. 增强边缘函数日志
在 `api/get-metadata.js` 中添加了详细的 console.log：
```javascript
console.log('[EdgeFunction] 请求 URL:', context.request.url);
console.log('[EdgeFunction] 目标 URL:', targetUrl);
console.log('[EdgeFunction] 元数据获取成功');
```

#### 2. 创建 .edgeoneignore
排除不必要的文件，避免打包错误：
```
node_modules/
server.js
local-metadata-service.js
test-*.js
*.md
```

#### 3. 精简 package.json
只保留必需的生产依赖：
```json
{
  "dependencies": {
    "cheerio": "^1.0.0"
  }
}
```

---

## 📋 正确的测试流程

### 方式一：使用 edgeone pages dev

```bash
# 1. 启动开发服务（端口 8088，HTTP 协议）
edgeone pages dev -t <YOUR_API_TOKEN>

# 2. 在浏览器中访问（注意是 HTTP）
http://localhost:8088/api/get-metadata?url=https://www.baidu.com

# 3. 或使用 curl 测试
curl "http://localhost:8088/api/get-metadata?url=https://www.baidu.com"
```

**预期结果**：
- ✅ 返回 JSON 数据
- ✅ 包含 title、description、iconUrl
- ✅ 状态码 200

---

### 方式二：使用独立的本地服务

```bash
# 1. 启动独立服务（端口 3000）
npm run serve:local

# 2. 访问 API
http://localhost:3000/api/get-metadata?url=https://www.baidu.com
```

**区别**：
- `edgeone pages dev`: 模拟真实边缘函数环境（端口 8088）
- `serve:local`: 独立的 Express 服务器（端口 3000）

---

## 🐛 已知问题

### 1. 百度等网站本地访问转圈
**原因**：反爬机制拦截了本地开发环境的请求

**临时方案**：
- 使用其他网站测试（如 wikipedia.org）
- 在生产环境（EdgeOne）测试

**长期方案**：
- 实现 User-Agent 轮换
- 添加请求头模拟真实浏览器
- 使用代理或边缘函数（推荐）

---

### 2. Hello.js 缺少超时处理
当前代码可能没有设置超时，导致请求挂起。

**建议修复**：
```javascript
export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('target');
  
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000); // 10 秒超时
    
    const response = await fetch(target, {
      signal: controller.signal,
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });
    
    return new Response(`You sent the target URL: ${target}`);
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
```

---

## 📊 端口对照表

| 服务 | 端口 | 协议 | 用途 |
|------|------|------|------|
| edgeone pages dev | 8088 | HTTP | 模拟边缘函数运行时 |
| serve:local | 3000 | HTTP | 独立本地开发服务器 |
| Vite dev server | 5173 | HTTP | 前端开发服务器 |

---

## ✅ 验证清单

### 本地测试
- [ ] 使用 `http://` 协议（不是 `https://`）
- [ ] 访问正确的端口（8088 或 3000）
- [ ] 测试简单网站（避免百度等反爬严格的网站）
- [ ] 查看终端输出的日志

### 生产环境测试
- [ ] 访问 EdgeOne 部署的域名
- [ ] 测试多个网站（包括百度）
- [ ] 检查返回的 JSON 格式
- [ ] 验证图标数据

---

## 🎯 下一步行动

### 立即执行
```bash
# 1. 清理并重启
cd edge-functions
rm -rf node_modules
npm install

# 2. 启动开发服务
edgeone pages dev -t <YOUR_API_TOKEN>

# 3. 测试（使用 HTTP）
curl "http://localhost:8088/api/get-metadata?url=https://www.wikipedia.org"
```

### 如果仍然失败
1. **检查终端日志** - 查看详细错误信息
2. **测试简单网站** - 避免百度、谷歌等反爬网站
3. **查看 .temp 文件** - 记录具体的错误信息

---

## 📝 相关文档

- [打包错误修复](./FIX_BUNDLE_ERRORS.md)
- [545 错误排查](./FIX_545_ERROR.md)
- [401 错误修复](./FIX_401_ERROR.md)
- [AbortSignal 修复](./FIX_ABORTSIGNAL_TIMEOUT.md)
- [测试指南](./TEST_GUIDE.md)

---

**更新时间**: 2026-03-17  
**关键提示**: 本地测试使用 **HTTP**，不是 HTTPS！
