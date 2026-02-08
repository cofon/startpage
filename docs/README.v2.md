# Startpage - 浏览器起始页

一个现代化的浏览器起始页项目，用于替代浏览器默认的收藏夹，提供便捷的网址收藏、展示和检索功能。

## 描述

浏览器起始页项目，用来替代浏览器默认的收藏夹，用于网址收藏展示检索，替代浏览器起始页和收藏夹，管理常用网站和书签，快速检索常用网站，快速访问常用网站

## 📝 使用说明

不开启本地服务，不放在云服务器，npm run build生成静态也页面，在浏览器打开index.html运行项目或者放在github pages。

## 技术方案

基于Vue3开发，使用vue3组合式API，使用Pinia状态管理，使用IndexedDB进行数据持久化，使用Vite进行构建，使用Vite-plugin-singlefile进行打包，使用hash路由。

## 🛠️ 构建方案

安装插件 vite-plugin-singlefile，修改 vite.config.js，路由使用hash模式，svg图标直接内联到JavaScript代码中而不是通过fetch请求外部文件

## ✨ 特性

- 🎯 **快速搜索**：支持本地搜索和网络搜索，可自定义搜索引擎
- 📌 **网站标记**：标记常用网站，快速访问
- 🏷️ **标签管理**：通过标签分类管理网站
- 🎨 **主题切换**：支持浅色、深色和跟随系统主题
- 💾 **数据持久化**：使用 IndexedDB 本地存储数据
- 📤 **数据备份**：支持数据导入/导出，防止数据丢失
- 📱 **响应式设计**：适配不同屏幕尺寸

## 🚀 快速开始

### 环境要求

- Node.js ^20.19.0 || >=22.12.0
- npm 或 yarn 或 pnpm

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

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
startpage/
├── src/                    # 源代码目录
│   ├── components/         # Vue 组件
│   │   ├── AddWebsitePanel.vue       # (设置面板点击添加网站按钮)添加网站面板组件
│   │   ├── LayoutSwitch.vue          # (设置面板bar上的switch按钮)布局切换组件
│   │   ├── SearchEngineSelector.vue  # (搜索模块点击当前选择搜索引擎icon)搜索引擎选择器
│   │   ├── SearchSettings.vue        # (设置面板点击搜索按钮)搜索设置组件
│   │   ├── SettingsPanel.vue         # 主设置面板
│   │   ├── ThemeSettings.vue         # (设置面点击主题按钮)主题设置组件
│   │   ├── WebsiteDialog.vue         # (显示模块网站item的edit图标)网站编辑对话框
│   │   └── WebsiteIcon.vue           # 网站图标组件
│   ├── stores/             # Pinia 状态管理
│   │   ├── counter.js      # 计数器状态（示例）
│   │   ├── search.js       # 搜索状态管理
│   │   ├── setting.js      # 全局设置管理
│   │   └── website.js      # 网站数据管理
│   ├── utils/              # 工具函数
│   │   ├── iconManager.js  # 图标管理工具
│   │   ├── indexedDB.js    # IndexedDB 数据库操作
│   │   └── searchParser.js # 搜索参数解析工具
│   ├── data/               # 静态数据文件
│   │   ├── defaultSearchEngines.js   # 默认搜索引擎配置
│   │   ├── defaultThemes.js          # 默认主题配置
│   │   ├── defaultWebsites.js        # 默认网站数据
│   │   ├── defaultWebsites - 副本.js # 网站数据备份
│   │   └── startpage-backup-2026-02-05.json # 数据备份文件
│   ├── router/             # 路由配置
│   │   └── index.js        # Vue Router 配置
│   ├── config/             # 配置目录（空）
│   ├── App.vue             # 主应用根组件
│   └── main.js             # 应用入口文件
├── public/                 # 静态资源目录
│   ├── favicon.ico         # 网站图标
│   └── icons/              # 图标资源目录
├── docs/                   # 文档目录
│   ├── README.v1.md        # 版本1文档
│   ├── README.v2.md        # 版本2文档
│   ├── SEARCH_COMPONENT_GUIDE.md  # 搜索组件指南
│   ├── search.md           # 搜索功能文档
│   ├── settings.md         # 设置功能文档
│   ├── settings_v1.md      # 设置功能文档v1
│   ├── icon-api.md         # 图标API文档
│   ├── icon-solution.md    # 图标解决方案文档
│   ├── 各种配置文件和日志文件...
│   └── 示例代码文件...
├── dist/                   # 生产构建输出目录
├── dist-v1/                # 版本1构建输出目录
├── node_modules/           # npm 依赖包
├── .vscode/                # VS Code 配置
├── .git/                   # Git 版本控制目录
├── index.html              # HTML 模板文件
├── package.json            # 项目配置文件
├── package-lock.json       # npm 锁定文件
├── vite.config.js          # Vite 构建配置
├── eslint.config.js        # ESLint 配置
├── jsconfig.json           # JavaScript 配置
├── .editorconfig           # 编辑器配置
├── .gitignore              # Git 忽略配置
├── .oxlintrc.json          # Oxlint 配置
├── .prettierrc.json        # Prettier 配置
└── README.md               # 项目主文档
```

## 💾 数据存储

### IndexedDB 数据库

项目使用 IndexedDB 进行本地数据存储，包含四个表：

#### websites 表

存储网站信息，包含以下字段：

```javascript
{
  id: number,              // 自增ID (主键)
  name: string,            // 网站名称
  url: string,             // 网站链接
  description: string,     // 网站描述
  icon: string,            // 图标URL（不再使用，暂时保留）
  tags: Array,             // 标签数组 [tag1, tag2, ...]
  isMarked: boolean,       // 是否为已标记网站
  markOrder: number,       // marked网站排序（仅当isMarked为true时有效）
  visitCount: number,      // 访问次数统计
  lastVisited: Date,       // 最近访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  isActive: boolean,       // 是否激活状态（正常搜索不显示非激活的网站）
  isHidden: boolean        // 是否隐藏状态（正常搜索不显示隐藏的网站）
}
```

**索引**：

- `isMarked`: 用于快速查询已标记网站
- `markOrder`: 用于按顺序获取已标记网站
- `tags`: 用于快速查询指定标签的网站（tags数组中的所有tag都索引）
- `isActive`: 用于查询激活状态的网站
- `isHidden`: 用于查询隐藏状态的网站

#### settings 表

存储应用设置，包含以下字段：

```javascript
{
  id: string,                    // 主键，固定为 'settings'
  lastBackupTime: Date,          // 上次备份时间
  selectedThemeId: string,         // 当前主题 ('light' | 'dark' | 'auto'| 'custom')
  selectedSearchEngineId: string,  // 当前搜索引擎
  searchResultLayout: string,    // 搜索结果显示方式 ('grid' | 'list')
}
```

**索引**：

- 没有索引

#### searchEngines 表

存储搜索引擎信息，包含以下字段：

```javascript
{
  id: string,          // 搜索引擎ID (主键 baidu | bing | yandex | local)
  name: string,        // 搜索引擎名称 (百度 | 必应 | Yandex | 本地)
  icon: string,        // icon的string(以后要改)
  iconColor: string,   // icon颜色(#FFFFFF)
  template: string,         // 搜索引擎URL模板 (例如：https://www.baidu.com/s?wd={query})
  order: number,       // 搜索引擎排序序号
  createdAt: Date,     // 创建时间
  updatedAt: Date,       // 更新时间
}
```

**索引**：

- name 用于快速查询指定名称的搜索引擎
- order 用于按顺序获取搜索引擎列表

#### themes 表

存储主题信息，包含以下字段：

```javascript
{
    id: string,
    name: string,
    colors: {
        primary: string, // 主色调（按钮、链接等）
        primaryHover: string, // 主色调悬停态
        primaryActive: string, // 主色调激活态
        textMain: string, // 主要文本 （标题、正文）
        textSecondary: string, // 次要文本 （描述、辅助信息）
        textDisabled: string, // 禁用文本
        textOnPrimary: string, // 主色调上的文字 （如按钮文字）
        bgPage: string, // 页面背景
        bgCard: string, // 卡片背景
        bgHover: string, // 悬停背景
        bgActive: string,   // 激活背景
        borderBase: string, // 基础边框
        borderFocus: string, // 聚焦边框
        shadowLight: string,    // 浅阴影
        shadowMedium: string,   // 中等阴影
        shadowDark: string, // 深阴影
    },
    createdAt: Date,
    updatedAt: Date
}
```

**索引**：

- name 用于快速查询指定名称的主题

## 🎯 功能说明

### 搜索模块

- **搜索引擎切换**：点击搜索引擎图标可切换搜索引擎
- **本地搜索**：在本地搜索引擎模式下，输入关键词自动搜索本地网站
- **网络搜索**：在网络搜索引擎模式下，输入关键词后按 Enter 执行网络搜索
- **标签搜索**：点击标签可快速搜索包含该标签的网站
- **标签显示**：仅在本地搜索且输入框为空时显示标签列表

#### 详细描述：

- 布局参考: search模块示例代码.md
- 点击selected search engine icon 显示 search engine icon list，点击list item切换 selected search engine and selected search engine icon的图标
- 默认搜索引擎列表：baidu bing yandex local(local用于本地搜索)
- 搜索引擎分为两类：
  - local-search 此分类只有一个local本地搜索
  - net-search locale之外的所有其他搜索引擎都是网络搜索，包括百度 必应 yandex等，以后会添加更多搜索引擎
- 如果 selected-search-engine 是 net-search，输入框内输入内容后按下enter键执行网络搜索
- 如果 selected-search-engine 是 local-search，输入框输入内容，自动执行本地搜索，并在显示模块中显示搜索结果
- 如果 selected-search-engine 是 local-search，输入框内的内容为空时，显示模块显示marked网站列表
- 如果 selected-search-engine 是 local-search，切换为 net-search 时清空输入框内容
- 如果 selected-search-engine 是 net-search，切换为 local-search 时清空输入框内容
- 如果 selected-search-engine 是 net-search，切换为 net-search 时不清空输入框内容
- 如果 selected-search-engine 是 local-search，输入框获取到焦点时在搜索模块下方显示 tags list，失去焦点隐藏tags list
- 点击tags list item，输入框内容自动填充为该tag，自动执行本地搜索，并在显示模块中显示搜索结果
- 如果 selected-search-engine 是 local-search，还可以执行一些特殊搜索

#### 本地搜索详细搜索功能

- 普通搜索：直接输入关键词，搜索网站名称、URL、描述和标签
- 组合搜索：多个关键词以空格分割，例：baidu 工作 会搜索同时包含"baidu"和"工作"的网站
- **特殊搜索**：
  --all：显示所有网站（包括已删除和隐藏的）
  --active：显示所有活跃的网站
  --active false：显示所有非活跃的网站
  --inactive：显示所有非活跃的网站（同 --active false）
  --marked：显示所有已标记的网站
  --marked false：显示所有未标记的网站
  --unmarked：显示所有未标记的网站（同 --marked false）
  --hidden：显示所有隐藏的网站
  --visible：显示所有可见的网站
  --tag <tagname>：显示包含指定标签的网站
  --visit：按访问次数排序显示
  --recent：按最近访问时间排序显示
- **特殊搜索也可组合**：
  --marked --tag 工作：显示已标记且包含"工作"标签的网站
  --active baidu：显示活跃的且包含"baidu"的网站
  --marked --tag 工作 --visit：显示已标记且包含"工作"标签的网站，并按访问次数排序

**PS** 如果将来需要添加新的搜索命令，只需要在 searchParser.js 中添加相应的解析逻辑

### 显示模块

#### marked网站列表

- **显示方式**：始终使用网格模式
- **显示条件**：
  - 如果 selected-search-engine 是 local-search 且 输入框为空，显示所有已标记的网站
  - 如果 selected-search-engine 是 net-search，显示所有已标记的网站
- **排序**：根据 markOrder 字段排序
- **操作**：
  - 点击网站图标或名称访问网站
  - 鼠标悬浮显示 [mark edit delete] icon按钮
  - 拖拽排序
- **item布局**: 从上到下依次为：网站图标、网站名、actionson icon(鼠标悬浮时)

#### 搜索结果列表

- **显示方式**：支持网格模式和列表模式，可在设置中切换
  - 网格模式：同marked网站列表
  - 列表模式：每行显示一个网站，包括图标、名称、描述、actions(始终显示 不需要鼠标悬浮)
- **显示条件**：
  - 如果 selected-search-engine 是 local-search 且 输入框不为空，显示搜索结果
- **操作**：
  - 点击网站图标或名称访问网站
  - 点击actions icon，执行 [mark edit delete] 操作
  - 不可拖拽排序

### 设置模块

- **打开设置**：点击右上角settings图标
- **包含的功能**：主题 搜索引擎 添加网站 显示模式 数据管理
    - **主题切换**：浅色、深色、跟随系统
    - **搜索引擎管理**：添加、删除自定义搜索引擎
    - **添加网站**: 添加网站
    - **显示模式**：切换搜索结果的网格/列表显示方式
    - **更多设置**：
        - **导出数据** ：JSON 格式
        - **导入数据** ：JSON 格式
- **关闭设置**：点击 settings面板外，Esc键


## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 进行代码规范检查和格式化：

```bash
# 代码检查和自动修复
npm run lint

# 代码格式化
npm run format
```

### 添加新功能

1. 在 `src/stores/` 中添加或修改状态管理
2. 在 `src/components/` 中创建或修改组件
3. 在 `src/utils/` 中添加工具函数
4. 更新相关文档


## 📦 部署

### 静态服务器部署

```bash
npm run build
# 将 dist 目录部署到静态服务器
```

### GitHub Pages 部署

1. 构建项目：`npm run build`
2. 将 `dist` 目录推送到 GitHub 仓库
3. 在仓库设置中启用 GitHub Pages，选择 `dist` 目录作为发布源

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请提交 Issue。



## 未完成的功能

- 网站item没有复制URL功能，需要添加
- settings  icon 太丑，换 
- 设置面板 主题面板 主题列表UI太丑，需要修改
- 浮动通知条未实现
- 搜索引擎如果保存的icon不是SVG，会直接把网址显示出来
- 添加/编辑网站面板添加 iconData iconGenerateData输入框，有些网站获取icon失败可以手动添加

## 已完成功能

- 搜索引擎增删改查已测试，搜索引擎图标需要修改，需要一个完整的方案, 确实使用SVG OK
- icon问题，获取不到一直获取，这很傻，修改方案：一律使用本地或者数据库中的图标，如果数据库没有使用本地图标，从网络获取到的图标保存到数据库中，下次使用数据库中的图标 OK
- 点击添加/取消标记时控制台播错，编辑删除没有测试，已修复 OK
- 数据库 isHidden字段未使用，需要使用 isHidden字段已添加 OK
- dark主题文字显示不清，需要调整，修改主题代码时修复了 OK
- settings面板UI大修：上边是bar下边是display OK
- 现在添加/修改主题需要修改源代码，需要修改为配置文件，不使用配置文件，存数据库了 OK
- 特殊功能 --keywords 未实现 OK
- 添加网站/导入数据/导出数据 未测试 OK
- 标记网站列表 拖拽排序 未实现 OK
- setting面板 点击theme list item 切换theme后关闭设置面板 OK
- setting面板 点击模式切换后关闭设置面板 OK
- selected-search-engine 是 local-search 时，标记网站列表不受设置模板显示模式按钮控制，但是切换到net-search时，标记网站列表会受设置模板显示模式按钮控制，需要修改，任何时候 标记网站列表 都不应该受设置模板显示模式按钮控制 OK