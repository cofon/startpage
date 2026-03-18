# EdgeOne Pages Dev 卡死问题完整排查指南

## 🚨 问题现象

```bash
# 测试 hello.js（即使是最简单的版本）
curl "http://localhost:8088/api/hello?target=https%3A%2F%2Fwww.baidu.com"
# 结果：不返回任何内容，一直卡住 ❌
```

---

## 🔍 已完成的修复

### ✅ 1. 创建 edgeone-pages.json
明确指定函数入口：
```json
{
  "version": 1,
  "functions": {
    "/api/hello": {
      "entry": "api/hello.js"
    },
    "/api/get-metadata": {
      "entry": "api/get-metadata.js"
    }
  }
}
```

### ✅ 2. 简化 hello.js
使用最简版本测试基础功能：
```javascript
export default function onRequest(context) {
  return new Response("Hello from API!", { 
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

---

## 🛠️ 排查步骤

### 步骤 1: 完全重启 edgeone pages dev

```bash
# 1. 停止当前服务 (Ctrl + C)

# 2. 清理缓存
cd edge-functions
rm -rf .edgeone/
rm -rf node_modules/.cache/

# 3. 重新安装依赖
npm install

# 4. 重新启动（查看详细日志）
edgeone pages dev -t <YOUR_API_TOKEN> --verbose
```

### 步骤 2: 检查启动日志

**正常启动应该看到：**
```
✓ Functions bundled successfully
✓ Development server started on http://localhost:8088
✓ Function registered: /api/hello
✓ Function registered: /api/get-metadata
```

**如果看到错误：**
- 检查 `.edgeoneignore` 是否正确
- 确认 `package.json` 中的依赖已安装
- 查看是否有 TypeScript 或 ESLint 错误

### 步骤 3: 测试最简单的端点

```bash
# 测试不带参数的 hello
curl -v http://localhost:8088/api/hello

# 预期输出：
# < HTTP/1.1 200 OK
# < Content-Type: text/plain
# Hello from API!
```

**如果仍然卡住：**
- 查看 edgeone pages dev 的终端输出
- 检查是否有 `[hello.js]` 相关的日志
- 如果没有日志，说明请求根本没到达函数

---

## 🎯 可能的根本原因

### 原因 1: edgeone pages dev 的 Bug
EdgeOne Pages 的开发服务器可能存在：
- 热重载失败
- 函数注册错误
- 端口占用但未报错

**解决方案：**
```bash
# 完全退出并清理
taskkill /F /IM node.exe  # Windows
# 或
killall node              # Mac/Linux

# 删除所有缓存
rm -rf .vite/
rm -rf node_modules/.cache/
rm -rf .edgeone/

# 重启
edgeone pages dev -t <YOUR_API_TOKEN>
```

### 原因 2: 函数未正确注册
`edgeone pages dev` 可能没有加载 `hello.js`

**验证方法：**
```bash
# 查看启动日志中是否显示：
✓ Function registered: /api/hello
```

如果没有，检查：
1. `edgeone-pages.json` 的路径是否正确
2. `api/hello.js` 文件是否存在
3. 导出是否正确（必须是 `export default function onRequest`）

### 原因 3: CORS 预检请求卡住
浏览器可能先发送 OPTIONS 请求

**测试方法：**
```bash
# 显式发送 OPTIONS 请求
curl -X OPTIONS -v http://localhost:8088/api/hello

# 如果没有响应，需要在 hello.js 中添加 CORS 处理
```

**添加 CORS 支持：**
```javascript
export default function onRequest(context) {
  // 处理 OPTIONS 预检请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  return new Response("Hello from API!");
}
```

---

## 📋 完整的测试流程

### 阶段 1: 基础测试
```bash
# 1. 测试健康检查（如果有的话）
curl http://localhost:8088/health

# 2. 测试简单端点
curl -v http://localhost:8088/api/hello

# 3. 查看终端日志
# 应该看到函数的 console.log 输出
```

### 阶段 2: 带参数测试
```bash
# 1. 测试简单参数
curl "http://localhost:8088/api/hello?target=test"

# 2. 测试编码的 URL
curl "http://localhost:8088/api/hello?target=https%3A%2F%2Fexample.com"

# 3. 对比生产环境
curl "https://startpage-rjh1mdmj.edgeone.cool/api/hello?target=test"
```

### 阶段 3: 调试模式
```bash
# 1. 启动时开启详细日志
edgeone pages dev -t <TOKEN> --verbose

# 2. 在另一个终端监控日志
# (如果有日志文件的话)

# 3. 使用 Postman 或 Insomnia 测试
# 这些工具可以看到更详细的请求/响应信息
```

---

## ⚡ 快速解决方案（推荐）

### 方案 A: 使用独立的本地服务器
如果 `edgeone pages dev` 持续有问题，可以使用 Express 服务器：

```bash
# 启动独立服务
npm run serve:local

# 测试
curl "http://localhost:3000/api/get-metadata?url=https://www.wikipedia.org"
```

**优点：**
- 更稳定
- 日志更清晰
- 易于调试

**缺点：**
- 与真实边缘函数环境有差异

### 方案 B: 直接部署测试
既然生产环境工作正常，可以直接部署后测试：

```bash
# 部署到 EdgeOne
edgeone pages deploy

# 测试生产环境
curl "https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.wikipedia.org"
```

### 方案 C: 降级 edgeone CLI
```bash
# 卸载当前版本
npm uninstall -g edgeone

# 安装特定版本（如果知道哪个版本稳定）
npm install -g edgeone@1.2.30
```

---

## 📊 诊断清单

- [ ] `edgeone-pages.json` 存在且配置正确
- [ ] `api/hello.js` 文件存在
- [ ] 函数导出正确（`export default function onRequest`）
- [ ] 启动日志显示函数已注册
- [ ] 终端没有报错
- [ ] 端口 8088 未被其他程序占用
- [ ] 防火墙允许 localhost:8088
- [ ] 已尝试清理所有缓存
- [ ] 已尝试重启服务
- [ ] 生产环境工作正常

---

## 🎯 下一步行动

### 立即执行
```bash
# 1. 停止当前服务
# Ctrl + C

# 2. 清理
cd edge-functions
rm -rf .edgeone/ node_modules/.cache/

# 3. 重启（带详细日志）
edgeone pages dev -t <YOUR_API_TOKEN> --verbose

# 4. 新开终端测试
curl -v http://localhost:8088/api/hello
```

### 如果还是不行
1. **查看 edgeone pages dev 的终端输出** - 有任何错误或警告吗？
2. **测试生产环境** - 确认代码本身没问题
3. **使用独立服务器** - `npm run serve:local`
4. **报告给 EdgeOne** - 可能是 CLI 工具的 bug

---

## 🔗 相关资源

- [EdgeOne Pages 文档](https://docs.edgeone.tencent.com/)
- [GitHub Issues](https://github.com/tencentyun/edgeone-pages-cli/issues)
- [本地测试结果](./LOCAL_TEST_RESULTS.md)
- [URL 编码规范](./URL_ENCODING_FIX.md)

---

**更新时间**: 2026-03-17  
**状态**: 等待进一步诊断
