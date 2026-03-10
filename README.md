# Startpage - 个人起始页

一个轻量级、可自定义的浏览器起始页 Web 应用，用于替代浏览器默认收藏夹，提供便捷的网址收藏、展示和检索功能。

## 使用方式
- 构建后的文件位于 `dist/index.html`
- 直接在浏览器中打开使用
- 部署到静态服务器（Nginx、Apache 等）
- 发布到 GitHub Pages、Vercel、Netlify 等平台

## ✨ 特性

- 🎯 **快速搜索**：支持本地搜索和网络搜索，可自定义搜索引擎
- 📌 **网站标记**：标记常用网站，快速访问
- 🏷️ **标签管理**：通过标签分类管理网站
- 🎨 **主题切换**：支持浅色、深色和跟随系统主题
- 💾 **数据持久化**：使用 IndexedDB 本地存储数据，隐私安全
- 📤 **数据备份**：支持数据导入/导出 JSON 格式
- 📱 **响应式设计**：适配不同屏幕尺寸
- 🔔 **通知系统**：实时反馈操作结果
- 🖼️ **智能图标**：自动获取网站 favicon，支持多级降级策略
- ⌨️ **命令模式**：通过 `--keyword` 命令访问高级功能

## 🚀 快速开始

### 开发环境

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

### 构建生产版本

```bash
npm run build
```

### 代码质量

```bash
# 代码检查和修复
npm run lint

# 代码格式化
npm run format
```

## 📁 项目结构

```
startpage/
├── src/                      # 源代码目录
│   ├── components/           # Vue 组件
│   │   ├── AddWebsitePanel.vue       # 添加网站面板
│   │   ├── CommandSettings.vue       # 命令设置面板 (主题/搜索/添加/导入导出/布局)
│   │   ├── DisplayModule.vue         # 显示模块容器
│   │   ├── HelpPanel.vue             # 帮助面板
│   │   ├── MarkedWebsiteList.vue     # 已标记网站列表 (仅网格模式)
│   │   ├── NotificationContainer.vue # 通知容器
│   │   ├── SearchEngineSelector.vue  # 搜索引擎选择器
│   │   ├── SearchModule.vue          # 搜索模块 (输入框 + 标签列表)
│   │   ├── SearchResultsList.vue     # 搜索结果列表 (仅列表模式)
│   │   ├── SearchSettings.vue        # 搜索设置面板
│   │   ├── ThemeSettings.vue         # 主题设置面板
│   │   ├── WebsiteActions.vue        # 网站操作按钮 (标记/编辑/删除/恢复)
│   │   ├── WebsiteDialog.vue         # 网站编辑对话框
│   │   └── WebsiteIcon.vue           # 网站图标组件
│   ├── data/                 # 静态数据
│   │   ├── defaultSearchEngines.js   # 默认搜索引擎配置
│   │   ├── defaultThemes.js          # 默认主题配置
│   │   └── defaultWebsites.js        # 默认网站数据
│   ├── router/               # 路由配置
│   │   └── index.js          # Vue Router 配置
│   ├── stores/               # Pinia 状态管理
│   │   ├── dragDrop.js       # 拖拽排序状态
│   │   ├── notification.js   # 通知状态管理
│   │   ├── search.js         # 搜索状态管理
│   │   ├── setting.js        # 全局设置管理
│   │   └── website.js        # 网站数据管理
│   ├── utils/                # 工具函数
│   │   ├── displayModeManager.js     # 显示模式管理器
│   │   ├── dragDropManager.js        # 拖拽排序管理器
│   │   ├── iconManager.js            # 图标管理工具
│   │   ├── indexedDB.js              # IndexedDB 数据库操作
│   │   ├── searchParser.js           # 搜索参数解析工具
│   │   ├── websiteImportUtils.js     # 网站导入工具
│   │   ├── websiteNormalizer.js      # 网站数据标准化工具
│   │   └── websiteUtils.js           # 网站工具函数
│   ├── App.vue             # 主应用根组件
│   └── main.js             # 应用入口文件
├── tools/                    # Python 工具脚本
│   ├── main.py               # 网站数据获取主脚本
│   └── website_fetcher.py    # 网站信息抓取工具
├── docs/                     # 文档目录
├── dist/                     # 生产构建输出目录
├── index.html                # HTML 模板文件
├── package.json              # 项目配置文件
├── vite.config.js            # Vite 构建配置
└── eslint.config.js          # ESLint 配置
```

## 🎯 核心功能详解

### 1. 搜索模块

#### 搜索引擎类型
- **本地搜索**：搜索 IndexedDB 中的网站数据，输入即触发搜索
- **网络搜索**：百度、必应、Yandex 等外部搜索引擎，按 Enter 执行搜索

#### 搜索行为
- **本地搜索模式**：
  - 输入框为空：显示已标记网站列表
  - 输入关键词：立即执行本地搜索，显示搜索结果
  - 输入 `--` 开头：进入命令模式，显示对应功能面板
  - 输入框获得焦点且内容为空：显示标签列表
- **网络搜索模式**：
  - 始终显示已标记网站列表
  - 按 Enter 键执行网络搜索（跳转外部搜索引擎）
  - 切换搜索引擎时清空输入框

#### 高级搜索命令（仅本地搜索）

**基础命令**（以 `--` 开头）：
- `--theme`：打开主题设置面板
- `--search`：打开搜索引擎设置面板
- `--add`：打开添加网站面板
- `--import`：打开导入数据面板
- `--export`：打开导出数据面板
- `--layout`：打开布局切换面板
- `--help`：显示帮助信息

**网站过滤命令**：
- `--all`：显示所有网站（包括已删除和隐藏的）
- `--active`：显示所有活跃网站
- `--active false`：显示非活跃网站（已删除）
- `--inactive`：同 `--active false`
- `--marked`：显示已标记的网站
- `--marked false`：显示未标记的网站
- `--unmarked`：同 `--marked false`
- `--hidden`：显示隐藏的网站
- `--visible`：显示可见的网站

**标签过滤命令**：
- `--tag <标签名>`：显示包含指定标签的网站
  - 示例：`--tag 技术`

**排序命令**：
- `--visit`：按访问次数排序显示
- `--recent`：按最近访问时间排序显示

**组合命令**（支持多个命令组合使用）：
- `--marked --tag 工作`：显示已标记且包含"工作"标签的网站
- `--active baidu --visit`：显示活跃的且包含"baidu"的网站，按访问次数排序
- `--inactive --tag 工作 --recent`：显示已删除且标签为工作的网站，按最近访问时间排序

**普通搜索**：
- 直接输入关键词即可搜索网站名称、URL、描述或标签
- 支持多个关键词（空格分隔，AND 关系）
- 示例：`谷歌 百度` 搜索同时包含"谷歌"和"百度"的网站

### 2. 显示模块

显示模块根据 `displayMode` 状态决定显示内容：

#### 显示模式类型
- **`marked`**：已标记网站列表
- **`search`**：搜索结果列表
- **`settings`**：命令设置面板
- **`help`**：帮助面板
- **`empty`**：空状态
- **`history`**：历史记录（预留）
- **`favorites`**：收藏夹（预留）

#### 已标记网站列表 (`displayMode = 'marked'`)
- **显示条件**：
  - 本地搜索模式且输入框为空
  - 网络搜索模式
- **显示方式**：**仅支持网格模式**（grid），不支持切换
- **布局特征**：
  - 每个网站显示：图标 + 名称
  - 鼠标悬浮时显示操作按钮（标记/编辑/删除）
  - 支持右键复制链接（浏览器默认菜单）
- **功能**：
  - 点击访问网站
  - 支持拖拽排序
  - 操作按钮需要鼠标悬浮才显示

#### 搜索结果列表 (`displayMode = 'search'`)
- **显示条件**：本地搜索模式且输入框不为空（且非命令模式）
- **显示方式**：**仅支持列表模式**（list），不支持切换
- **布局特征**：
  - 每行显示一个网站，包括：
    - 网站图标
    - 网站描述（截断显示）
    - 网站 URL（截断显示）
    - 标签列表（如果有）
    - 操作按钮（始终显示，无需悬浮）
- **功能**：
  - 点击访问网站
  - 操作按钮：标记/编辑/删除/恢复
  - 不支持拖拽排序

#### 命令设置面板 (`displayMode = 'settings'`)
- **触发方式**：在本地搜索模式输入 `--` 开头的命令
- **显示内容**：根据具体命令显示不同子面板
  - `--theme` → 主题设置
  - `--search` → 搜索设置
  - `--add` → 添加网站
  - `--import` → 导入数据
  - `--export` → 导出数据
  - `--layout` → 布局切换

#### 帮助面板 (`displayMode = 'help'`)
- **触发方式**：输入 `--help` 命令
- **显示内容**：所有可用命令的详细说明和示例

### 3. 命令模式详解

#### 命令模式的本质
**项目已删除传统的设置按钮和设置面板**，所有设置功能通过命令模式访问：
- 用户不再看到"设置"图标或按钮
- 所有配置功能通过输入 `--` 开头的命令触发
- 这是一种键盘优先的交互设计，提升效率

#### 命令模式状态管理
```javascript
// search store 中的状态
commandMode: ref(null) // 'theme' | 'search' | 'add' | 'import' | 'export' | 'layout' | 'help' | null
displayMode: ref('marked') // 控制显示模块显示什么
```

#### 命令处理流程
1. 用户在输入框输入 `--`
2. `searchStore.handleCommand()` 被调用
3. 解析命令并设置 `commandMode`
4. 设置 `displayMode = 'settings'`
5. `CommandSettings` 组件渲染对应面板

#### 退出命令模式
- 点击面板右上角关闭按钮
- 清空输入框（会重置 `commandMode` 和 `displayMode`）
- 切换搜索引擎

### 4. 设置功能（命令模式访问）

#### 主题设置 (`--theme`)
- 浅色模式
- 深色模式
- 跟随系统（auto）
- 自定义主题（支持添加/编辑/删除）

#### 搜索引擎设置 (`--search`)
- 查看当前搜索引擎列表
- 添加自定义搜索引擎
- 编辑/删除搜索引擎
- 设置默认搜索引擎

#### 添加网站 (`--add`)
- 打开添加网站对话框
- 填写网站信息（URL、名称、描述、标签等）
- 自动获取网站图标

#### 数据管理
- **导入数据** (`--import`)：从 JSON 文件导入网站和设置
- **导出数据** (`--export`)：导出所有数据为 JSON 备份文件
  - 文件名格式：`startpage-backup-YYYYMMDD-HHMMSS.json`

#### 布局切换 (`--layout`) (已废弃)
- **注意**：此布局仅控制搜索结果的显示方式
- 网格布局（Grid）
- 列表布局（List）
- **重要**：已标记网站列表始终使用网格模式，不受此设置影响

### 5. 通知系统

- 操作成功/失败实时反馈
- 自动消失的通知条
- 友好的错误提示
- 支持 success 和 error 两种类型

## 💾 数据存储

### IndexedDB 数据库结构

数据库名称：`StartPageDB` (版本 5)

#### websites 表
存储网站信息：

```javascript
{
  id: number,              // 自增 ID (主键)
  name: string,            // 网站名称
  title: string,           // 网站标题（新增）
  url: string,             // 网站链接
  description: string,     // 网站描述
  iconData: string,        // 从网络获取的 icon 的 base64(PNG/ICO/JPG等)
  iconGenerateData: string, // 本地生成的 SVG 图标
  tags: Array,             // 标签数组 [tag1, tag2, ...]
  isMarked: boolean,       // 是否为已标记网站
  markOrder: number,       // marked 网站排序 (仅当 isMarked 为 true 时有效)
  visitCount: number,      // 访问次数统计
  lastVisited: Date,       // 最近访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  isActive: boolean,       // 是否激活状态 (正常搜索不显示非激活的网站)
  isHidden: boolean        // 是否隐藏状态 (正常搜索不显示隐藏的网站)
}
```

**索引**：
- `isMarked`：快速查询已标记网站
- `markOrder`：按顺序获取已标记网站
- `tags`：查询指定标签的网站（多值索引）
- `isActive`：查询活跃状态
- `isHidden`：查询隐藏状态
- `url`：按 URL 查询

已删除字段：
- `iconUrl`: string,         // 原始 URL (版本 7 已删除)
- `icon`: string,            // 图标 URL(版本 7 已删除)
- `iconCanFetch`: boolean,   // 是否可以从网络获取 icon(版本 7 已删除)
- `iconFetchAttempts`: number, // 尝试从网络获取的次数 (版本 7 已删除)
- `iconLastFetchTime`: Date, // 最后一次尝试从网络获取的时间戳 (版本 7 已删除)

#### settings 表
存储应用设置：

```javascript
{
  id: string,                    // 固定为 'settings'
  selectedThemeId: string,       // 当前主题 ('light' | 'dark' | 'auto' | 'custom')
  selectedSearchEngineId: string,// 当前搜索引擎
  lastBackupTime: Date           // 最后备份时间
  // 注意：searchResultLayout 字段已被注释，不再使用
}
```

#### themes 表
存储主题配置：

```javascript
{
  id: string,
  name: string,
  colors: {
    primary: string,             // 主色调
    primaryHover: string,        // 主色调悬停
    primaryActive: string,       // 主色调激活
    textMain: string,            // 主要文本
    textSecondary: string,       // 次要文本
    textDisabled: string,        // 禁用文本
    textOnPrimary: string,       // 主色调上的文字
    bgPage: string,              // 页面背景
    bgCard: string,              // 卡片背景
    bgHover: string,             // 悬停背景
    bgActive: string,            // 激活背景
    borderBase: string,          // 基础边框
    borderFocus: string,         // 聚焦边框
    shadowLight: string,         // 浅阴影
    shadowMedium: string,        // 中等阴影
    shadowDark: string           // 深阴影
  },
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：`name`

#### searchEngines 表
存储搜索引擎配置：

```javascript
{
  id: string,          // 搜索引擎 ID (如 'baidu', 'bing', 'local')
  name: string,        // 名称
  icon: string,        // 图标 (内联 SVG 字符串)
  iconColor: string,   // 图标颜色
  template: string,    // URL 模板 (如 'https://www.baidu.com/s?wd={query}')
  order: number,       // 排序
  createdAt: Date,
  updatedAt: Date
}
```

**索引**：`name`, `order`

## 🔧 技术栈

### 前端框架
- **Vue 3.5.27**：使用 Composition API 和 `<script setup>` 语法
- **Pinia 3.0.4**：状态管理
- **Vue Router 5.0.1**：路由管理（Hash 模式）

### 构建工具
- **Vite 7.3.1**：快速开发和构建
- **vite-plugin-singlefile**：打包为单文件 HTML
- **@vitejs/plugin-vue**：Vue 支持

### 代码质量
- **ESLint**：代码检查
- **Prettier**：代码格式化
- **oxlint**：高性能 Linter

### 数据存储
- **IndexedDB**：浏览器内置数据库（数据库名：StartPageDB）

## 🌐 部署方案

### 本地使用
构建后直接双击打开 `dist/index.html`（因使用相对路径和 IndexedDB，需要 HTTP(S) 环境）

### 静态服务器
```bash
npm run build
# 将 dist 目录部署到 Nginx/Apache 等
```

### GitHub Pages
1. 构建项目：`npm run build`
2. 推送 `dist` 目录到 GitHub 仓库
3. 在仓库设置启用 GitHub Pages

### Vercel / Netlify
连接 GitHub 仓库，自动构建和部署

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 遵循 ESLint 和 Prettier 规则
- 使用 camelCase 命名变量
- 组件使用 PascalCase 命名
- 保持代码整洁和可读性

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。

## 🔄 更新日志

### v2.0.0 (当前版本)
- **架构重构**：
  - 删除传统设置面板 UI，改用命令模式访问所有设置功能
  - 显示模式简化：已标记列表仅支持网格模式，搜索结果仅支持列表模式
  - 移除布局切换按钮，布局设置移至 `--layout` 命令
- **功能优化**：
  - 命令模式增强，支持更多快捷命令
  - 搜索命令解析器改进
  - 图标获取逻辑优化
  - 通知系统完善
  - 数据库结构优化，移除冗余字段，新增 title 字段
- **性能提升**：
  - 组件拆分更细粒度
  - 状态管理优化
  - 减少不必要的 DOM 操作

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

---

**注意**：因使用 IndexedDB，数据仅保存在当前浏览器中，跨设备不同步。请定期使用 `--export` 命令导出数据备份。


## 未完成工作
{
  "websites": [
    {
      "url": "https://www.baidu.com",
      "name": "百度",
      "title": "百度一下，你就知道",
      "description": "百度是一个中国最大的中文搜索引擎，也是全球最大的中文信息源。"
      "iconData": "data:image网站图标的base64编码的图片数据..."
      其他字段
    },
    {
      "url": "https://www.google.com",
      "name": "谷歌",
      "title": "Google",
      "description": "谷歌是一个全球最大的搜索引擎，提供搜索、翻译、图片、视频、新闻、地图、翻译等功能。"
      "iconData": "data:image网站图标的base64编码的图片数据..."
      其他字段
    }
  ],
  "settings": "{},
  "themes": [],
  "searchEngines": []
}
