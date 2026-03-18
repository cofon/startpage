# URL 参数编码问题解决方案

## 🎯 问题根源

根据 EdgeOne 智能客服说明：
> **参数编码**：在浏览器或前端调用时，如果参数是 URL，请务必编码

### 问题现象
```
❌ 未编码的 URL
http://localhost:8088/api/hello?target=https://www.baidu.com
结果：一直转圈

✅ 已编码的 URL
http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com
预期：立即返回
```

---

## 🔧 解决方案

### 方案一：手动编码（浏览器测试）

在浏览器地址栏输入时，对 URL 参数进行编码：

| 原始字符 | 编码后 |
|---------|--------|
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `=` | `%3D` |
| `&` | `%26` |

**示例：**
```
原始：https://www.baidu.com
编码：https%3A%2F%2Fwww.baidu.com

完整 URL:
http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com
```

---

### 方案二：使用 JavaScript 自动生成

```javascript
// 在前端代码中
const targetUrl = 'https://www.baidu.com';
const encodedUrl = encodeURIComponent(targetUrl);

// 正确的访问方式
fetch(`/api/hello?target=${encodedUrl}`)
  .then(res => res.text())
  .then(console.log);
```

---

### 方案三：后端自动解码（已实现）

优化后的 `hello.js` 会自动检测并解码编码的参数：

```javascript
let targetUrl = searchParams.get('target');

// 如果参数看起来是编码的，尝试解码
if (targetUrl && targetUrl.includes('%')) {
  try {
    targetUrl = decodeURIComponent(targetUrl);
  } catch (e) {
    console.warn('解码失败，使用原始值');
  }
}
```

---

## 📋 测试步骤

### 步骤 1：重启开发服务
```bash
# 停止当前的 edgeone pages dev
# Ctrl + C

# 重新启动
edgeone pages dev -t <YOUR_API_TOKEN>
```

### 步骤 2：测试编码的 URL

**方法 A：使用 curl（推荐）**
```bash
curl "http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com"
```

**方法 B：浏览器访问**
```
http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com
```

**方法 C：使用 JavaScript**
```javascript
// 在浏览器控制台执行
fetch('http://localhost:8088/api/hello?target=' + encodeURIComponent('https://www.baidu.com'))
  .then(res => res.text())
  .then(console.log);
```

### 步骤 3：验证结果

**预期输出：**
```
You sent the target URL: https://www.baidu.com
```

---

## 🎯 为什么生产环境不需要编码也能工作？

### 可能的原因

1. **CDN 优化**
   - EdgeOne CDN 可能对 URL 进行了自动处理
   - 边缘节点更智能的 URL 解析

2. **浏览器行为差异**
   - 直接访问 HTTPS 网站时，浏览器可能自动编码
   - 本地 HTTP 环境触发不同的安全策略

3. **EdgeOne Pages 配置**
   - 生产环境可能有不同的 URL 处理规则

---

## ⚠️ 最佳实践

### 前端调用规范

```javascript
// ✅ 正确：始终编码 URL 参数
const apiUrl = `/api/get-metadata?url=${encodeURIComponent(websiteUrl)}`;
fetch(apiUrl);

// ❌ 错误：直接拼接 URL
const apiUrl = `/api/get-metadata?url=${websiteUrl}`;
fetch(apiUrl); // 可能导致问题
```

### 后端处理规范

```javascript
// ✅ 推荐：自动处理编码和解码
export default function onRequest(context) {
  let targetUrl = context.request.url.searchParams.get('target');
  
  // 尝试解码（如果是编码的）
  if (targetUrl?.includes('%')) {
    try {
      targetUrl = decodeURIComponent(targetUrl);
    } catch {}
  }
  
  return new Response(`URL: ${targetUrl}`);
}
```

---

## 📊 对照表

| 场景 | URL 格式 | 结果 | 建议 |
|------|---------|------|------|
| 本地开发 | 未编码 | ❌ 转圈 | 必须编码 |
| 本地开发 | 已编码 | ✅ 正常 | 推荐 |
| 生产环境 | 未编码 | ✅ 正常 | 可用但不推荐 |
| 生产环境 | 已编码 | ✅ 正常 | 推荐 |

---

## 🔗 相关资源

- [encodeURIComponent() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- [decodeURIComponent() - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent)
- [EdgeOne Pages API 文档](https://docs.edgeone.tencent.com/)

---

**更新时间**: 2026-03-17  
**关键发现**: URL 参数必须编码！
