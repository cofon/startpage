# Startpage - 个人起始页

一个轻量级、可自定义的浏览器起始页 Web 应用，用于替代浏览器默认收藏夹，提供便捷的网址收藏、展示和检索功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.5.27-green.svg)
![Vite](https://img.shields.io/badge/vite-7.3.1-purple.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen.svg)

## ✨ 特性

- 🎯 **快速搜索** - 支持本地搜索和网络搜索，可自定义搜索引擎
- 📌 **网站标记** - 标记常用网站，快速访问
- 🏷️ **标签管理** - 通过标签分类管理网站
- 🎨 **主题切换** - 支持浅色、深色和跟随系统主题
- 💾 **数据持久化** - 使用 IndexedDB 本地存储，隐私安全
- 📤 **导入导出** - 支持 JSON 格式数据备份
- 📱 **响应式设计** - 适配不同屏幕尺寸
- 🔔 **通知系统** - 实时反馈操作结果
- 🖼️ **智能图标** - 自动获取网站 favicon，支持多级降级
- ⌨️ **命令模式** - 通过 `--keyword` 命令访问高级功能
- 🚀 **EdgeOne 部署** - 支持自动构建和边缘函数

## 🚀 快速开始

### 环境要求

- Node.js ^20.19.0 || >=22.12.0
- npm / yarn / pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

输出到 `dist/index.html`

### 代码质量

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 📖 使用指南

### 搜索功能

#### 本地搜索（默认）
- **输入即搜索**：输入关键词立即搜索本地数据库
- **空输入框**：显示已标记网站列表
- **按 Enter**：无操作（仅网络搜索模式有效）

#### 网络搜索
- 切换搜索引擎后进入网络搜索模式
- **按 Enter**：跳转到外部搜索引擎执行搜索
- **始终显示**：已标记网站列表

### 命令模式

所有高级功能通过输入 `--` 开头的命令访问：

#### 基础命令
- `--theme` - 主题设置
- `--search` - 搜索引擎设置
- `--add` - 添加网站
- `--import` - 导入数据
- `--export` - 导出数据
- `--help` - 帮助信息

#### 过滤命令
- `--all` - 显示所有网站
- `--active` - 显示活跃网站
- `--marked` - 显示已标记网站
- `--hidden` - 显示隐藏网站
- `--tag <标签名>` - 按标签过滤

#### 排序命令
- `--visit` - 按访问次数排序
- `--recent` - 按最近访问时间排序

#### 组合使用示例
```
--marked --tag 工作     # 显示已标记且包含"工作"标签的网站
--active baidu --visit  # 显示活跃的含"baidu"的网站，按访问次数排序
```

### 网站管理

#### 添加网站
1. 输入 `--add` 打开添加面板
2. 填写网站 URL（自动填充名称和生成 SVG 图标）
3. 点击"🌐 获取信息"获取网站标题、描述和图标
4. 提交保存

#### 编辑/删除网站
- 鼠标悬浮在网站上显示操作按钮
- 支持编辑、删除、恢复（软删除）

#### 导入导出
- **导出**：`--export` 下载 JSON 备份文件
- **导入**：`--import` 上传 JSON 文件恢复数据

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.27 | Composition API + `<script setup>` |
| Pinia | 3.0.4 | 状态管理 |
| Vue Router | 5.0.1 | Hash 模式路由 |
| Vite | 7.3.1 | 构建工具 |
| IndexedDB | - | 本地数据存储 |

### 项目结构

```
startpage/
├── src/                      # 源代码
│   ├── components/           # Vue 组件
│   │   ├── SearchModule.vue          # 搜索模块
│   │   ├── DisplayModule.vue         # 显示容器
│   │   ├── MarkedWebsiteList.vue     # 已标记网站列表
│   │   ├── SearchResultsList.vue     # 搜索结果列表
│   │   ├── CommandSettings.vue       # 命令设置面板
│   │   ├── AddWebsitePanel.vue       # 添加网站面板
│   │   └── ...
│   ├── stores/               # Pinia 状态管理
│   │   ├── website.js        # 网站数据
│   │   ├── search.js         # 搜索状态
│   │   ├── setting.js        # 全局设置
│   │   └── notification.js   # 通知状态
│   ├── utils/                # 工具函数
│   │   ├── indexedDB.js      # IndexedDB 操作
│   │   ├── searchParser.js   # 命令解析
│   │   ├── websiteUtils.js   # 网站工具
│   │   └── ...
│   ├── services/             # 业务服务
│   │   ├── websiteService.js         # 网站服务
│   │   └── importService.js          # 导入服务
│   ├── data/                 # 静态数据
│   ├── router/               # 路由配置
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── edge-functions/           # EdgeOne 边缘函数
│   ├── api/
│   │   ├── get-metadata.js   # 元数据获取函数
│   │   └── hello.js          # Hello World 示例
│   ├── .env                  # 环境变量配置
│   └── edgeone-pages.json    # EdgeOne 配置
├── docs/                     # 文档目录
├── dist/                     # 构建输出
├── index.html                # HTML 模板
├── package.json              # 项目配置
└── vite.config.js            # Vite 配置
```

### 数据存储结构

数据库名：`StartPageDB` (版本 5)

#### websites 表
```javascript
{
  id: number,              // 自增 ID（主键）
  name: string,            // 网站名称
  title: string,           // 网站标题
  url: string,             // 网站链接
  description: string,     // 网站描述
  iconData: string,        // 图标 base64
  iconGenerateData: string,// SVG 图标
  tags: Array,             // 标签数组
  isMarked: boolean,       // 已标记
  markOrder: number,       // 标记排序
  visitCount: number,      // 访问次数
  lastVisited: Date,       // 最后访问时间
  isActive: boolean,       // 激活状态
  isHidden: boolean        // 隐藏状态
}
```

#### settings 表
```javascript
{
  id: string,                    // 'settings'
  selectedThemeId: string,       // 当前主题
  selectedSearchEngineId: string,// 当前搜索引擎
  lastBackupTime: Date           // 最后备份时间
}
```

## 🌐 部署方案

### 本地使用

```bash
npm run build
# 双击打开 dist/index.html（需要 HTTP 环境）
```

### 静态服务器

```bash
npm run build
# 将 dist 目录部署到 Nginx/Apache
```

### GitHub Pages

1. 构建：`npm run build`
2. 推送 `dist` 到 GitHub
3. 启用 GitHub Pages

### EdgeOne Pages（推荐）

1. 推送代码到 GitHub
2. EdgeOne 自动检测并构建
3. 配置环境变量（EdgeOne 控制台）
4. 自动部署到边缘节点

**环境变量配置**：
```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://your-domain.edgeone.cool
```

### Vercel / Netlify

连接 GitHub 仓库，自动构建和部署

## 🔧 EdgeOne 边缘函数

### 功能说明

边缘函数用于获取网站元数据（标题、描述、图标），解决跨域问题。

### API 端点

```
GET /api/get-metadata?url=<website_url>
```

### 示例

```bash
# 请求
curl "https://your-domain.edgeone.cool/api/get-metadata?url=https://www.baidu.com"

# 响应
{
  "success": true,
  "data": {
    "url": "https://www.baidu.com",
    "title": "百度一下，你就知道",
    "description": "全球领先的中文搜索引擎...",
    "iconUrl": "https://www.baidu.com/favicon.ico",
    "iconData": "data:image/x-icon;base64,xxx..."
  }
}
```

### 本地测试

```bash
cd edge-functions
npm install
npm run serve:local
# 访问 http://localhost:3000/api/get-metadata?url=https://www.baidu.com
```

### 部署

边缘函数随前端代码一起自动部署到 EdgeOne，无需手动操作。

## 📊 性能优化

- ✅ Vite 快速构建和热更新
- ✅ 组件按需加载
- ✅ IndexedDB 本地存储，读写高效
- ✅ 图标懒加载和缓存
- ✅ 批量数据处理优化
- ✅ 边缘函数减少网络延迟

## 🤝 贡献指南

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 遵循 ESLint 和 Prettier 规则
- 变量使用 camelCase 命名
- 组件使用 PascalCase 命名
- 保持代码整洁和可读性

### 提交信息规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式化
refactor: 重构代码
test: 测试相关
chore: 构建/工具链相关
```

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。

## 🔄 更新日志

### v2.0.0 (当前版本)

**架构重构**：
- ✅ 删除传统设置面板 UI，改用命令模式
- ✅ 显示模式简化：已标记列表仅网格模式，搜索结果仅列表模式
- ✅ 移除布局切换按钮
- ✅ EdgeOne 边缘函数集成

**功能优化**：
- ✅ 命令模式增强，支持更多快捷命令
- ✅ 搜索命令解析器改进
- ✅ 图标获取逻辑优化（EdgeOne API）
- ✅ 通知系统完善
- ✅ 数据库结构优化

**性能提升**：
- ✅ 组件细粒度拆分
- ✅ 状态管理优化
- ✅ 减少不必要的 DOM 操作

### v1.0.0 (早期版本)

- 初始版本，基础功能实现

---

## 💡 设计理念

### 键盘优先
通过命令模式，用户可以快速访问各种功能，无需在复杂的 UI 中寻找按钮。

### 简洁界面
删除冗余的 UI 元素，保持界面清爽，专注于核心功能：搜索和网站管理。

### 渐进增强
- 基础功能：简单的搜索和网站管理
- 高级功能：命令模式、标签过滤、排序等
- 用户可以根据需求逐步发现和使用高级功能

### 数据自主
所有数据存储在本地 IndexedDB，支持导出备份，用户完全掌控自己的数据。

### 边缘计算
利用 EdgeOne 边缘函数处理跨域请求，提升性能和可靠性。

---

**注意**：因使用 IndexedDB，数据仅保存在当前浏览器中，跨设备不同步。请定期使用 `--export` 命令导出数据备份。

## 🔗 相关链接

- [EdgeOne 文档](https://edgeone.ai/docs)
- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)



## 未完成工作

#### 插件
- 插件的功能
    - 定义一个快捷键打开插件面板
    - 插件面板有添加网站表单
    - 自动获取当前打开的页面的网站数据 title desc iconData
    - 提交表单添加到数据库
- 插件和起始页的消息传递
    - 插件没有自己数据库
    - 插件获取到数据后，发送给起始页，起始页保存到数据库
    - 插件需要数据时可以发消息给起始页，起始页返回数据
    - 