# EdgeOne 边缘函数 - API 配置与切换指南

## 📋 概述

本项目支持两种元数据获取模式：
1. **本地开发模式**：运行在本地的 Node.js 服务器（模拟 EdgeOne 边缘函数）
2. **EdgeOne 生产模式**：部署到腾讯 EdgeOne 平台的真实边缘函数

通过简单配置，可以在两种模式之间无缝切换。

---

## 🔧 配置方式

### 方式一：手动指定模式

#### 1. 本地开发环境

创建 `.env` 文件：

```bash
VITE_API_MODE=local
VITE_LOCAL_API_URL=http://localhost:3000
VITE_EDGEONE_API_URL=
```

启动本地服务：
```bash
npm run serve:local
```

#### 2. EdgeOne 生产环境

创建 `.env.production` 文件：

```bash
VITE_API_MODE=edgeone
VITE_LOCAL_API_URL=http://localhost:3000
VITE_EDGEONE_API_URL=https://your-project.edgeone.app
```

然后构建并部署：
```bash
npm run build
edgeone pages deploy dist/
```

### 方式二：自动切换模式（推荐）

创建 `.env` 文件：

```bash
VITE_API_MODE=auto
VITE_LOCAL_API_URL=http://localhost:3000
VITE_EDGEONE_API_URL=https://your-project.edgeone.app
```

- 开发时（`npm run dev`）：自动使用本地 API
- 生产构建（`npm run build`）：自动使用 EdgeOne API

---

## 🚀 部署步骤

### 第一步：部署边缘函数

```bash
cd edge-functions
npm install
edgeone pages deploy
```

部署成功后，在 EdgeOne 控制台获取分配的域名，例如：
```
https://your-project.edgeone.app
```

### 第二步：配置前端环境变量

编辑 `.env.production`：

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://your-project.edgeone.app
```

### 第三步：构建并部署前端

```bash
npm run build
edgeone pages deploy dist/
```

---

## 📊 代码调用示例

### 单个网站元数据获取

```javascript
import { fetchMetadata } from '@/services/websiteMetadataService';

const metadata = await fetchMetadata('https://example.com', {
  source: 'auto' // 或 'local-api', 'plugin'
});

console.log(metadata);
// 输出：
// {
//   title: '示例网站',
//   description: '这是一个示例网站',
//   iconData: 'data:image/x-icon;base64,AAAB...'
// }
```

### 批量补全元数据

```javascript
import { batchEnrichMetadata } from '@/services/websiteMetadataService';

const websites = [
  { url: 'https://baidu.com', title: '', description: '', iconData: '' },
  { url: 'https://bilibili.com', title: '', description: '', iconData: '' }
];

await batchEnrichMetadata(websites, (processed, total) => {
  console.log(`进度：${processed}/${total}`);
}, { source: 'auto' });
```

---

## 🔍 调试技巧

### 查看当前使用的 API 模式

打开浏览器控制台，会看到详细的日志输出：

```
[fetchMetadataFromLocalApi] ========== 开始获取元数据 ==========
[fetchMetadataFromLocalApi] 📍 数据来源：EdgeOne 边缘函数（生产环境）
[fetchMetadataFromLocalApi] API 地址：https://your-project.edgeone.app
[fetchMetadataFromLocalApi] API 模式：edgeone
```

### 强制使用特定模式

在代码中临时指定：

```javascript
// 强制使用本地 API
const metadata = await fetchMetadata(url, { source: 'local-api' });

// 或者修改 .env 文件中的 VITE_API_MODE
```

---

## ⚠️ 注意事项

1. **EdgeOne 域名获取**
   - 必须先部署边缘函数才能获取到实际域名
   - 在 EdgeOne 控制台的「边缘函数」→「服务管理」中查看

2. **跨域问题**
   - 本地开发时使用 `http://localhost:3000`
   - EdgeOne 已配置 CORS 响应头，无需额外设置

3. **网络限制**
   - 本地环境可能无法访问某些国外网站（如 GitHub、Google）
   - EdgeOne 生产环境通常可以正常访问

4. **性能优化**
   - EdgeOne 边缘函数有 15 秒超时限制
   - 建议对常用域名实施缓存策略

---

## 📁 相关文件

- [`src/services/websiteMetadataService.js`](./src/services/websiteMetadataService.js) - 元数据服务
- [`edge-functions/api/get-metadata.js`](./edge-functions/api/get-metadata.js) - 边缘函数代码
- [`.env.example`](./.env.example) - 环境变量示例
- [`.env`](./.env) - 本地开发配置
- [`.env.production.example`](./.env.production.example) - 生产环境配置示例

---

## ❓ 常见问题

### Q: 如何知道当前使用的是本地 API 还是 EdgeOne？
A: 打开浏览器控制台，查看 `[getApiBaseUrl]` 开头的日志

### Q: 可以在运行时动态切换吗？
A: 不建议。环境变量在构建时就已确定，运行时切换需要重新构建

### Q: 如果 EdgeOne 服务不可用怎么办？
A: 使用 `auto` 模式会自动降级到本地 API（开发环境），或在代码中添加错误处理逻辑
