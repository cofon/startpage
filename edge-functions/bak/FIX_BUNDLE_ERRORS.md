# 边缘函数打包错误修复指南

## 问题描述
运行 `edgeone pages dev` 时出现大量错误：

```
✘ [ERROR] Could not resolve "node:fs"
✘ [ERROR] Could not resolve "node:path"
✘ [ERROR] Could not resolve "node:http2"
```

## 根本原因
EdgeOne Pages 的 bundler 在打包时尝试将 Node.js 内置模块（如 `fs`, `path`, `http2`）也打包进去，但这些是 Node.js 运行时内置的，不应该被打包。

这些错误通常由以下原因引起：
1. **开发依赖被误打包** - `@typescript-eslint/tsconfig-utils` 等工具库被包含进生产代码
2. **本地服务文件被打包** - `server.js`, `local-metadata-service.js` 等本地开发文件不应部署
3. **缺少忽略配置** - 没有 `.edgeoneignore` 文件排除不必要的文件

---

## ✅ 已修复内容

### 1. 创建 `.edgeoneignore` 文件
排除以下文件：
- `node_modules/` - 依赖目录（EdgeOne 会自动安装）
- `server.js` - 本地服务器
- `local-metadata-service.js` - 本地服务
- `test-*.js` - 测试脚本
- `*.md` - 文档
- `.env*` - 环境配置
- `.git/`, `.vscode/` - 版本控制和 IDE 配置

### 2. 精简 package.json
**修改前：**
```json
{
  "dependencies": {
    "cheerio": "^1.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
```

**修改后：**
```json
{
  "dependencies": {
    "cheerio": "^1.0.0"
  }
}
```

**说明：**
- `express` 和 `cors` 仅用于本地服务 `server.js`，边缘函数不需要
- EdgeOne 边缘函数使用原生 fetch API，不需要 express
- cheerio 是唯一的生产依赖（HTML 解析）

---

## 🚀 重新部署步骤

### 步骤 1: 清理 node_modules
```bash
cd edge-functions
rm -rf node_modules/
rm -rf package-lock.json
```

### 步骤 2: 重新安装依赖
```bash
npm install
```

### 步骤 3: 验证本地服务
```bash
# 启动本地服务（需要 express）
npm run serve:local

# 测试 API
curl "http://localhost:3000/api/get-metadata?url=https://www.baidu.com"
```

**注意：** 本地服务仍然可以正常工作，因为 express 在 `devDependencies` 中。

### 步骤 4: 部署到 EdgeOne
```bash
# 启动开发模式（不会报错了）
edgeone pages dev

# 或者直接部署
edgeone pages deploy
```

---

## 🔍 验证清单

### ✅ 打包过程
- [ ] 不再出现 `Could not resolve "node:fs"` 错误
- [ ] 不再出现 `Could not resolve "node:path"` 错误
- [ ] 不再出现 `Could not resolve "node:http2"` 错误

### ✅ 功能测试
- [ ] 边缘函数能正常响应
- [ ] 返回正确的 JSON 数据
- [ ] 日志输出正常

---

## 📊 架构说明

### 本地开发环境
```
┌─────────────────────┐
│   server.js         │ ← Express 服务器（本地开发）
│   - express         │
│   - cors            │
│   - local-metadata  │
└─────────────────────┘
         ↓
   http://localhost:3000
```

### EdgeOne 边缘函数
```
┌─────────────────────┐
│   api/get-metadata  │ ← 边缘函数（生产环境）
│   - cheerio         │
│   - fetch API       │
└─────────────────────┘
         ↓
   EdgeOne CDN
```

**关键区别：**
- 本地开发：使用 Express 模拟边缘函数行为
- 生产环境：使用 EdgeOne 原生的边缘函数运行时
- 共享代码：HTML 解析逻辑（cheerio）

---

## ⚠️ 常见问题

### Q1: 为什么本地服务还能工作？
`express` 和 `cors` 仍然在 `devDependencies` 中，本地开发时会安装。

### Q2: 如果我想添加其他依赖？
- **生产依赖**（边缘函数需要）：添加到 `dependencies`
- **开发依赖**（本地测试需要）：添加到 `devDependencies`

### Q3: .edgeoneignore 不生效？
确保文件名正确（不是 `.gitignore`），并且放在 `edge-functions/` 目录下。

### Q4: 仍然报错怎么办？
1. 删除 `node_modules/` 和 `package-lock.json`
2. 重新运行 `npm install`
3. 检查 `.edgeoneignore` 是否正确

---

## 📝 相关文件

### 新增文件
- ✅ `edge-functions/.edgeoneignore` - 打包忽略配置

### 修改文件
- ✅ `edge-functions/package.json` - 精简生产依赖

### 保持不变
- ✅ `edge-functions/server.js` - 本地服务（开发用）
- ✅ `edge-functions/local-metadata-service.js` - 本地逻辑（开发用）
- ✅ `edge-functions/api/get-metadata.js` - 边缘函数（生产用）

---

## 🎯 下一步

1. **清理并重新安装**
   ```bash
   cd edge-functions
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **重新启动开发服务**
   ```bash
   edgeone pages dev -t <YOUR_API_TOKEN>
   ```

3. **验证不再报错**
   查看终端输出，应该不再有 `node:fs` 等错误

4. **测试功能**
   ```bash
   curl "https://YOUR_DOMAIN.edgeone.cool/api/get-metadata?url=https://www.baidu.com"
   ```

---

## 🔗 相关文档

- [545 错误排查](./FIX_545_ERROR.md)
- [401 错误修复](./FIX_401_ERROR.md)
- [AbortSignal 修复](./FIX_ABORTSIGNAL_TIMEOUT.md)
- [测试指南](./TEST_GUIDE.md)

---

**更新时间**: 2026-03-17  
**状态**: ✅ 已修复，等待验证
