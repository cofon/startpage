# Startpage - 浏览器起始页

一个现代化的浏览器起始页项目，用于替代浏览器默认的收藏夹，提供便捷的网址收藏、展示和检索功能。

## 📝 使用说明
不开启本地服务，不放在云服务器，在浏览器打开index.html运行项目

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
├── src/
│   ├── components/      # Vue 组件
│   │   ├── SearchEngineSelector.vue  # 搜索引擎选择器
│   │   ├── SettingsPanel.vue         # 设置面板
│   │   ├── WebsiteDialog.vue         # 网站编辑对话框
│   │   └── WebsiteIcon.vue           # 网站图标组件
│   ├── stores/          # Pinia 状态管理
│   │   ├── website.js   # 网站数据管理
│   │   ├── setting.js   # 设置管理
│   │   └── search.js    # 搜索状态管理
│   ├── utils/           # 工具函数
│   │   └── indexedDB.js # IndexedDB 操作
│   ├── data/            # 静态数据
│   │   └── defaultWebsites.js  # 默认网站数据
│   ├── App.vue          # 主应用组件
│   └── main.js          # 应用入口
├── public/              # 静态资源
│   └── icons/           # 图标资源
├── index.html           # HTML 模板
├── package.json         # 项目配置
└── vite.config.js      # Vite 配置
```

## 💾 数据存储

### IndexedDB 数据库

项目使用 IndexedDB 进行本地数据存储，包含两个表：

#### websites 表

存储网站信息，包含以下字段：

```javascript
{
  id: number,              // 自增ID (主键)
  name: string,            // 网站名称
  url: string,             // 网站链接
  description: string,     // 网站描述
  icon: string,            // 图标URL（自动获取，失败则使用程序生成）
  tags: Array,             // 标签数组 [tag1, tag2, ...]
  isMarked: boolean,       // 是否为已标记网站
  markOrder: number,       // 常用网站排序（仅当isMarked为true时有效）
  visitCount: number,      // 访问次数统计
  lastVisited: Date,       // 最近访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  isActive: boolean,       // 是否激活状态（用于软删除）
  isHidden: boolean        // 是否隐藏状态（用于软删除）
}
```

**索引**：

- `isMarked`: 用于快速查询已标记网站
- `markOrder`: 用于按顺序获取已标记网站
- `tags`: 用于快速查询指定标签的网站（tags数组中的所有tag都索引）
- `isActive`: 用于查询激活状态的网站

#### settings 表

存储应用设置，包含以下字段：

```javascript
{
  id: string,                    // 主键，固定为 'global'
  selectedTheme: string,         // 当前主题 ('light' | 'dark' | 'auto')
  selectedSearchEngine: string,  // 当前搜索引擎
  searchEngineList: Object,      // 搜索引擎列表
  searchResultLayout: string,    // 搜索结果显示方式 ('grid' | 'list')
  lastBackupTime: Date,          // 上次备份时间
}
```

## 🎯 功能说明

### 搜索模块

- **搜索引擎切换**：点击搜索引擎图标可切换搜索引擎
- **本地搜索**：在本地搜索引擎模式下，输入关键词自动搜索本地网站
- **网络搜索**：在网络搜索引擎模式下，输入关键词后按 Enter 执行网络搜索
- **标签搜索**：点击标签可快速搜索包含该标签的网站
- **标签显示**：仅在本地搜索且输入框为空时显示标签列表

### 显示模块

#### 已标记网站列表

- **显示方式**：始终使用网格模式
- **排序**：根据 markOrder 字段排序
- **操作**：
  - 点击网站图标或名称访问网站
  - 右键菜单：编辑、删除、取消标记、复制URL
  - 拖拽排序（待实现）

#### 搜索结果列表

- **显示方式**：支持网格模式和列表模式，可在设置中切换
  - 网格模式：上方图标下方网站名
  - 列表模式：每行显示一个网站，包括图标、名称、描述、URL
- **操作**：
  - 点击网站图标或名称访问网站
  - 右键菜单：编辑、删除、添加/取消标记、复制URL

### 设置模块

- **主题切换**：浅色、深色、跟随系统
- **显示模式**：切换搜索结果的网格/列表显示方式
- **搜索引擎管理**：添加、删除自定义搜索引擎
- **数据管理**：
  - 添加网站
  - 导出数据（JSON 格式）
  - 导入数据（JSON 格式）

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

### 添加新搜索引擎

在设置面板中点击"添加搜索引擎"，填写以下信息：

- **ID**：唯一标识符（如：google）
- **名称**：搜索引擎名称（如：Google）
- **URL**：搜索URL（如：`https://www.google.com/search?q={query}`）
- **图标**：图标URL（可选，默认使用 `/icons/search-engines/default.svg`）

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

数据存储描述：
两个表：website存储网站，setting保存一些设置项

website
{
id: number, // 自增ID (主键)
name: string, // 网站名称
url: string, // 网站链接
description: string, // 网站描述
icon: string, // 图标URL（自动获取，失败则使用程序生成）
tags: Array, // 标签数组 [tag1, tag2, ...]
isMarked: boolean, // 是否为已标记网站
markOrder: number, // 常用网站排序（仅当isMarked为true时有效）
visitCount: number, // 访问次数统计
lastVisited: Date, // 最近访问时间
createdAt: Date, // 创建时间
updatedAt: Date, // 更新时间
isActive: boolean // 是否激活状态（用于软删除）
isHidden: boolean // 是否隐藏状态（用于）
}
主键：id (自增)
索引：
isMarked: 用于快速查询已标记网站
markOrder: 用于按顺序获取已标记网站
tags: 用于快速查询指定标签的网站(tags数组中的所有tag都索引)

setting
{
selected-theme: string,
themes: Array,
selected-search-engine: string,
search-engine-list: Object{
name: 搜索引擎名称,
url: 搜索引擎URL(例如百度: https://www.baidu.com/s?wd={query}),
icon: 本地图标路径},
search-result-layout: string,
lastBackupTime: Date,
}

数据库操作：

网页描述：
网页分为3个模块：搜索模块, 显示模块, 设置模块

1. 搜索模块描述：
   - 布局：参考SEARCH_COMPONENT_GUIDE.md
   - 点击selected search engine icon 显示 search engine icon list，点击list item切换 selected search engine and selected search engine icon的图标
   - 默认搜索引擎列表：baidu bing yandex local(local用于本地搜索)
   - 搜索引擎分为两类：
     - local-search 此分类只有一个local本地搜索
     - net-search locale之外的所有其他搜索引擎都是网络搜索，包括百度 必应 yandex等，以后会添加更多搜索引擎
   - 如果 selected-search-engine 是 net-search，输入框内输入内容后按下enter键执行网络搜索
   - 如果 selected-search-engine 是 local-search，输入框输入内容，自动执行本地搜索，并在显示模块中显示搜索结果
   - 如果 selected-search-engine 是 local-search，输入框内的内容为空时，显示模块显示常用网站列表
   - 如果 selected-search-engine 是 local-search，切换为 net-search 时清空输入框内容
   - 如果 selected-search-engine 是 net-search，切换为 local-search 时清空输入框内容
   - 如果 selected-search-engine 是 net-search，切换为 net-search 时不清空输入框内容
   - 如果 selected-search-engine 是 local-search，输入框获取到焦点时在搜索模块下方显示 tags list，失去焦点隐藏tags list
   - 点击tags list item，输入框内容自动填充为该tag，自动执行本地搜索，并在显示模块中显示搜索结果
   - 如果 selected-search-engine 是 local-search，输入框内容以 -- 开头时，执行一些特殊功能，后续慢慢添加，预留
2. 显示模块描述(可显示内容有三：已标记网站列表、本地搜索结果、--开头的关键字的搜索结果)
   - 显示模块在搜索模块下方
   - 默认显示 已标记网站列表
   - 如果 selected-search-engine 是 local-search，输入框输入内容，显示模块显示搜索结果
   - 如果 selected-search-engine 是 local-search，输入框内容以 -- 开头时，显示模块显示--开头的关键字的搜索结果(预留)
   - 如果 selected-search-engine 是 local-search，输入框内容为空时，显示模块显示 已标记网站列表
   - 如果 selected-search-engine 是 local-search，切换为 net-search 时会清空输入框，显示模块显示 已标记网站列表
   - 如果 selected-search-engine 是 net-search，显示模块显示 已标记网站列表
   - 已标记网站列表的显示方式和操作
     - 网格模式，上方图标下方网站名，已标记网站列表只有这一种显示方式
     - 鼠标拖拽改变网站排序
     - 鼠标右键显示菜单，菜单包括：编辑、删除、取消标记、复制url等(废弃)
   - 本地搜索结果列表的显示方式和操作
     - 网格模式，上方图标下方网站名
     - 列表模式， 每行显示一个网站，包括网站图标、网站名、网站描述、网站url，如果某个字段文字太多做截断处理
     - 搜索结果的右键菜单：编辑、删除、添加标记(如未标记)、取消标记(如已标记)、复制url等(废弃)
   - 右键菜单实现太过麻烦，使用鼠标悬浮显示图标的方法替代，列表模式直接显示在右侧
3. 设置模块描述:
   - 右上角显示一个 settings图标
   - 点击图标显示 settings面板
   - 点击settings面板之外的地方隐藏
   - settings面板集中所有的设置/控制选项
     - 主题切换
     - 搜索结果显示方式切换(网格模式、列表模式)
     - 数据导入/导出
     - 网站增删改查(暂时先不写具体代码，因为在显示模块有入口，后续有需要再添加)
     - 搜索引擎增删改查
     - 后续添加

状态管理：使用pinia

- 待修改：
    - 网站item没有复制URL功能，需要添加
    - settings  icon 太丑，换 
    - 设置面板 主题面板 主题列表UI太丑，需要修改
    - 浮动通知条未实现
    - 搜索引擎增删改查未测试，搜索引擎图标需要修改，需要一个完整的方案
    - icon问题，获取不到一直获取，这很傻，修改方案：一律使用本地或者数据库中的图标，如果数据库没有使用本地图标，从网络获取到的图标保存到数据库中，下次使用数据库中的图标 ERROR

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

