# Startpage 项目概览

## 📋 项目信息

**项目名称**: Startpage - 个人起始页  
**版本**: v2.0.0  
**许可证**: MIT  
**创建时间**: 2024  
**最后更新**: 2026-03-18  

## 🎯 核心价值

一个轻量级、可自定义的浏览器起始页 Web 应用，帮助你：
- ✅ 高效管理常用网站
- ✅ 快速搜索目标内容
- ✅ 完全掌控本地数据
- ✅ 打造个性化起始页

## 🚀 核心技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.5.27 |
| 状态管理 | Pinia | 3.0.4 |
| 路由 | Vue Router | 5.0.1 |
| 构建工具 | Vite | 7.3.1 |
| 数据存储 | IndexedDB | - |
| 边缘函数 | EdgeOne Pages | - |

## 📦 主要功能模块

### 1. 搜索模块
- 本地搜索（IndexedDB）
- 网络搜索（百度/必应等）
- 命令模式（`--keyword`）
- 智能标签过滤

### 2. 网站管理
- 添加/编辑/删除网站
- 标记常用网站
- 标签分类管理
- 导入/导出数据

### 3. 显示系统
- 已标记网站列表（网格模式）
- 搜索结果列表（列表模式）
- 命令设置面板
- 帮助面板

### 4. 主题系统
- 浅色主题
- 深色主题
- 跟随系统
- 自定义主题

### 5. EdgeOne 集成
- 边缘函数获取元数据
- 自动构建部署
- 全球加速访问

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         View Layer (Vue)            │
│  - SearchModule.vue                 │
│  - DisplayModule.vue                │
│  - CommandSettings.vue              │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      State Layer (Pinia)            │
│  - websiteStore                     │
│  - searchStore                      │
│  - settingStore                     │
│  - notificationStore                │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│     Service Layer (Business)        │
│  - websiteService                   │
│  - importService                    │
│  - websiteMetadataService           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Utility Layer (Core)           │
│  - websiteUtils.js                  │
│  - indexedDB.js                     │
│  - searchParser.js                  │
└─────────────────────────────────────┘
```

### 关键设计模式

- **命令模式**: `--keyword` 触发功能
- **状态模式**: `displayMode` 控制显示
- **观察者模式**: Vue 响应式系统
- **单例模式**: Pinia Store
- **工厂模式**: 图标生成

## 📁 目录结构

```
startpage/
├── src/                          # 前端源代码
│   ├── components/               # Vue 组件（14 个文件）
│   ├── stores/                   # Pinia 状态（4 个文件）
│   ├── services/                 # 业务服务（2 个文件）
│   ├── utils/                    # 工具函数（6 个文件）
│   ├── data/                     # 静态数据（3 个文件）
│   ├── router/                   # 路由配置
│   ├── App.vue                   # 根组件
│   └── main.js                   # 入口文件
├── edge-functions/               # EdgeOne 边缘函数
│   ├── api/                      # API 端点
│   │   ├── get-metadata.js       # 元数据获取
│   │   └── hello.js              # Hello World
│   ├── .env                      # 环境变量
│   └── edgeone-pages.json        # EdgeOne 配置
├── docs/                         # 文档目录
├── dist/                         # 构建输出
├── index.html                    # HTML 模板
├── package.json                  # 项目配置
└── vite.config.js                # Vite 配置
```

## 🔧 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 生产构建
npm run preview          # 预览构建结果

# 代码质量
npm run lint             # 检查并修复
npm run lint:eslint      # ESLint 检查
npm run lint:oxlint      # oxlint 检查
npm run format           # Prettier 格式化
```

## 🌐 部署方式

### 1. 本地使用
```bash
npm run build
# 打开 dist/index.html（需要 HTTP 环境）
```

### 2. 静态服务器
```bash
npm run build
# 部署 dist 到 Nginx/Apache
```

### 3. GitHub Pages
```bash
npm run build
git push
# 启用 GitHub Pages
```

### 4. EdgeOne（推荐）
```bash
git push
# EdgeOne 自动构建和部署
# 配置环境变量
```

### 5. Vercel / Netlify
连接 GitHub 仓库自动部署

## 💾 数据存储

### IndexedDB 结构

**数据库**: StartPageDB (版本 5)

**表结构**:
- `websites` - 网站数据
- `settings` - 应用设置
- `themes` - 主题配置
- `searchEngines` - 搜索引擎

详见 [README.md](./README.md#数据存储结构)

## 🔌 EdgeOne 边缘函数

### API 端点

```
GET /api/get-metadata?url=<website_url>
```

### 功能
- 获取网站标题
- 获取网站描述
- 获取网站图标（base64）
- 解决跨域问题
- 自动重试机制
- 超时保护

### 测试
```bash
cd edge-functions
npm run serve:local
curl "http://localhost:3000/api/get-metadata?url=https://www.baidu.com"
```

## 📊 性能指标

- ⚡ **启动速度**: <1s (Vite HMR)
- 📦 **构建大小**: ~500KB (gzip)
- 🚀 **首屏加载**: <2s
- 💾 **本地存储**: IndexedDB (无限制)
- 🌍 **CDN**: EdgeOne 全球加速

## 🛠️ 开发工具

### 必需
- Node.js >=20.19.0
- npm/yarn/pnpm

### 推荐
- VS Code
- ESLint 插件
- Prettier 插件
- Vue DevTools

### 可选
- Python (工具脚本)
- Git (版本控制)

## 📝 快速参考

### 常用命令
```
--theme      主题设置
--search     搜索引擎设置
--add        添加网站
--import     导入数据
--export     导出数据
--help       帮助信息
--marked     显示已标记网站
--tag <名称>  按标签过滤
--visit      按访问次数排序
```

### 快捷键
- `Ctrl/Cmd + K`: 聚焦搜索框（待实现）
- `Escape`: 关闭面板/清空输入框
- `Enter`: 执行搜索（网络搜索模式）

### 数据备份
```
--export → 下载 JSON 备份
--import → 上传 JSON 恢复
```

## 🎨 自定义扩展

### 添加主题
1. `--theme` 打开主题面板
2. 点击"添加自定义主题"
3. 配置颜色值
4. 保存使用

### 添加搜索引擎
1. `--search` 打开搜索设置
2. 点击"添加搜索引擎"
3. 填写名称、图标、URL 模板
4. 保存使用

### 批量导入网站
准备 JSON 文件：
```json
{
  "websites": [
    {
      "url": "https://example.com",
      "name": "示例网站",
      "tags": ["示例", "测试"]
    }
  ]
}
```
然后 `--import` 上传

## 🔒 隐私安全

- ✅ 所有数据本地存储（IndexedDB）
- ✅ 不上传任何用户数据到服务器
- ✅ 支持离线使用
- ✅ 开源代码可审计
- ✅ 定期导出备份

## 📈 未来规划

### 短期（v2.1.0）
- [ ] 网站统计数据面板 (`--stats`)
- [ ] 批量管理功能
- [ ] 命令提示优化
- [ ] 点击次数统计

### 中期（v2.2.0）
- [ ] 主题系统重构
- [ ] 图片背景支持
- [ ] 工具面板 (`--tools`)
- [ ] 真正删除功能

### 长期（v3.0.0）
- [ ] 云同步选项
- [ ] 多设备同步
- [ ] 插件系统
- [ ] PWA 支持

## 🤝 贡献指南

欢迎参与项目开发！

### 如何贡献
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

### 需要帮助
- 提交 Issue 报告 bug
- 提交 Feature Request
- 改进文档
- 分享项目

## 📚 相关资源

- [主 README](./README.md) - 详细使用说明
- [EdgeOne 文档](https://edgeone.ai/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

---

**最后更新**: 2026-03-18  
**维护者**: Startpage Team  
**许可证**: MIT
