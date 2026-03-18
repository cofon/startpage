# EdgeOne 边缘函数开发指南

## 📚 文档导航

本目录包含以下文档和代码：

### 📖 文档

1. **[README.md](./README.md)** - 项目总览和架构设计
   - 项目概述
   - 架构设计
   - API 接口说明
   - 部署流程

2. **[TESTING.md](./TESTING.md)** - 本地测试指南
   - 快速开始
   - 自定义测试
   - 日志说明
   - 常见问题

### 💻 代码

1. **[local-metadata-service.js](./local-metadata-service.js)** - 本地测试版服务
   - 核心功能实现
   - 支持单个/批量获取
   - 完整的日志输出
   - CLI 命令行调用

2. **[test-metadata.js](./test-metadata.js)** - 测试脚本
   - 单个网站测试
   - 批量网站测试
   - 测试报告生成

3. **[package.json](./package.json)** - 依赖配置
   - cheerio: HTML 解析
   - node-fetch: HTTP 请求

---

## 🚀 快速开始流程

### Step 1: 安装依赖

```bash
cd edge-functions
npm install
```

### Step 2: 运行测试

```bash
# 测试单个网站
npm run test:single https://www.baidu.com

# 批量测试（20 个网站）
npm run test:batch
```

### Step 3: 查看结果

测试通过后，会输出类似以下结果：

```json
{
  "url": "https://www.baidu.com",
  "title": "百度一下，你就知道",
  "description": "百度是全球最大的中文搜索引擎...",
  "iconUrl": "https://www.baidu.com/favicon.ico"
}
```

---

## 📋 开发路线图

### ✅ 阶段 1: 本地测试（当前）

- [x] 创建本地测试服务
- [x] 编写测试脚本
- [x] 验证元数据提取逻辑
- [ ] 集成到主项目

### ⏳ 阶段 2: 边缘函数迁移

- [ ] 创建 `edge-functions/api/metadata.js`
- [ ] 适配 EdgeOne 运行时环境
- [ ] 配置环境变量
- [ ] 本地测试边缘函数

### ⏳ 阶段 3: 生产部署

- [ ] 部署到 EdgeOne Pages
- [ ] 配置域名和 HTTPS
- [ ] 监控和日志
- [ ] 性能优化

---

## 🔧 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **运行时** | Node.js 18+ | 边缘函数运行环境 |
| **HTTP 请求** | fetch / node-fetch | 获取网页内容 |
| **HTML 解析** | cheerio | 解析 HTML 提取元数据 |
| **编码处理** | TextDecoder | 正确处理多编码网页 |
| **部署平台** | EdgeOne Pages | 静态托管 + 边缘函数 |

---

## 📊 关键限制

### EdgeOne 边缘函数限制

| 项目 | 限制 | 应对策略 |
|------|------|----------|
| **Fetch 次数** | 64 次/运行 | 分批处理（每批≤50） |
| **并发请求** | 8 个 | 使用 Promise.allSettled |
| **超时时间** | 15 秒（可配至 300 秒） | 设置 AbortSignal.timeout |
| **内存** | 标准限制 | 避免大型数据结构 |

### 免费额度

- **请求次数**: 300 万次/月
- **适用场景**: 个人起始页完全足够

---

## 🎯 核心功能

### 1. 智能编码检测

```
响应头 charset → <meta>标签 → UTF-8 fallback
```

支持编码：UTF-8, GBK, GB2312, Big5, Shift_JIS 等

### 2. 多层元数据提取

**Title 优先级:**
1. `<title>` 标签
2. `og:title`
3. `twitter:title`
4. JSON-LD
5. `<h1>` 标签
6. hostname (兜底)

**Description 优先级:**
1. `name="description"`
2. `og:description`
3. `twitter:description`
4. JSON-LD
5. 第一个 `<p>` 标签
6. `name="keywords"`

**Icon 优先级:**
1. `rel="icon"`
2. `rel="shortcut icon"`
3. `rel="apple-touch-icon"`
4. `/favicon.ico` (默认)

---

## 🐛 调试技巧

### 查看详细日志

```bash
# 运行测试并保存日志
node test-metadata.js > test-log.txt 2>&1
```

### 测试特定网站

```bash
node local-metadata-service.js https://problematic-site.com
```

### 检查编码问题

查看日志中的 `[Charset]` 输出：

```
[Charset] 从响应头检测到：utf-8
[Charset] 从<meta>标签检测到：gbk
[Charset] 使用默认：UTF-8
```

---

## 📞 下一步行动

### 立即执行

1. **运行测试**: `npm run test:batch`
2. **检查结果**: 确认成功率
3. **修复问题**: 针对失败的网站分析原因

### 短期计划

1. 修改主项目的元数据获取服务
2. 调用本地测试代码
3. 验证功能正常

### 长期计划

1. 迁移到 EdgeOne 边缘函数
2. 部署到生产环境
3. 监控和优化

---

## 📚 参考资料

- [EdgeOne 官方文档](https://cloud.tencent.com/product/edgeone)
- [Cheerio 文档](https://cheerio.js.org/)
- [Node.js Fetch API](https://nodejs.org/api/globals.html#fetch)
- [TextDecoder MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/TextDecoder)

---

## 👥 贡献指南

遇到问题或有改进建议？

1. 查看日志定位问题
2. 搜索相关文档
3. 运行测试复现问题
4. 提交 issue 或 PR

---

**最后更新**: 2026-03-16  
**版本**: v1.0.0
