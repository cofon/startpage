# API 路由重写问题修复

## 🚨 问题现象

### 测试结果（temp 文件）
```bash
# 测试 hello.js
curl http://localhost:8088/api/hello?target=https://www.baidu.com
# 返回：Vue 前端页面 HTML (689 bytes) ❌

# 测试 get-metadata.js  
curl http://localhost:8088/api/get-metadata?url=https://www.baidu.com
# 返回：Vue 前端页面 HTML (689 bytes) ❌
```

**预期结果**：应该返回 API 数据，而不是 HTML 页面

---

## 🔍 根本原因

### edgeone-pages.json 配置问题

**错误配置：**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**问题：**
- 这个正则 `/(.*)` 匹配**所有路径**
- 包括 `/api/hello` 和 `/api/get-metadata`
- 导致 API 请求被重定向到前端页面

---

## ✅ 解决方案

### 修改后的配置

**正确配置：**
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**解释：**
- `/((?!api/).*)` 是负向前瞻正则
- 匹配**不以 `/api/` 开头**的所有路径
- `/api/*` 路径会被边缘函数处理，不会被重定向

---

## 📊 路由对照表

| 路径 | 旧行为 | 新行为 |
|------|--------|--------|
| `/` | → index.html ✅ | → index.html ✅ |
| `/about` | → index.html ✅ | → index.html ✅ |
| `/test/123` | → index.html ✅ | → index.html ✅ |
| `/api/hello` | → index.html ❌ | → api/hello.js ✅ |
| `/api/get-metadata` | → index.html ❌ | → api/get-metadata.js ✅ |

---

## 🚀 重新测试步骤

### 步骤 1: 重启服务
```bash
# 停止当前服务 (Ctrl + C)
cd edge-functions

# 重新启动
edgeone pages dev -t <YOUR_API_TOKEN>
```

### 步骤 2: 测试 hello.js
```powershell
# 测试简单参数
curl -UseBasicParsing "http://localhost:8088/api/hello?target=test"

# 测试编码的 URL
curl -UseBasicParsing "http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com"
```

**预期输出：**
```
You sent the target URL: https://www.baidu.com
```

### 步骤 3: 测试 get-metadata.js
```powershell
# 测试 Wikipedia（推荐）
curl -UseBasicParsing "http://localhost:8088/api/get-metadata?url=https%3A%2F%2Fwww.wikipedia.org"
```

**预期输出：**
```json
{
  "success": true,
  "data": {
    "title": "...",
    "description": "...",
    "iconUrl": "..."
  }
}
```

---

## ⚠️ 注意事项

### 1. 正则表达式语法
```javascript
// ❌ 错误：匹配所有路径
"/(.*)"

// ✅ 正确：排除 api 路径
"/((?!api/).*)"

// ✅ 备选：显式指定静态资源
"/(assets/.*)"
```

### 2. History 模式支持
如果前端使用 Vue Router 的 History 模式：
- 需要重写规则支持 SPA 路由
- 但必须排除 API 路径
- 当前配置已正确处理

### 3. 生产环境同步
确保生产环境使用相同的配置：
```bash
# 部署时检查配置
edgeone pages deploy

# 验证生产环境
curl "https://YOUR_DOMAIN.edgeone.cool/api/hello?target=test"
```

---

## 📋 相关文件

### 修改的文件
- ✅ [`edge-functions/edgeone-pages.json`](./edgeone-pages.json) - 修复重写规则

### 保持不变
- ✅ `edge-functions/api/hello.js` - 边缘函数逻辑
- ✅ `edge-functions/api/get-metadata.js` - 元数据获取函数
- ✅ `public/_headers` - 响应头配置
- ✅ `public/_redirects` - 重定向规则

---

## 🔗 相关文档

- [URL 编码规范](./URL_ENCODING_FIX.md)
- [本地故障排查](./TROUBLESHOOTING_DEV_SERVER.md)
- [401 错误修复](./FIX_401_ERROR.md)
- [EdgeOne Pages 路由配置](https://docs.edgeone.tencent.com/)

---

**更新时间**: 2026-03-17  
**状态**: ✅ 已修复，等待重新测试
