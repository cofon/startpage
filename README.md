# Startpage - 个人起始页

一个轻量级、可自定义的浏览器起始页 Web 应用，用于替代浏览器默认收藏夹，提供便捷的网址收藏、展示和检索功能。


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

输出到 `dist`

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
- `--all` - 显示所有活跃且非隐藏的网站
- `--active` - 显示活跃网站
- `--marked` - 显示已标记网站
- `--hidden` - 显示隐藏网站
- `--tag <标签名>` - 按标签过滤

#### 字段搜索命令
- `--title <关键词>` - 只搜索网站标题
- `--desc <关键词>` - 只搜索网站描述
- `--name <关键词>` - 只搜索网站名称
- `--url <关键词>` - 只搜索网站 URL

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

### 浏览器扩展

#### 安装扩展
1. 打开 Chrome 浏览器
2. 进入 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extension` 目录

#### 使用扩展
1. 访问任意网站
2. 点击浏览器工具栏中的扩展图标
3. 在弹出的面板中点击"添加到起始页"
4. 扩展会自动获取网站元数据并添加到起始页

#### 扩展功能
- 自动获取当前页面的标题、描述和图标
- 支持离线添加（当起始页未打开时，数据会保存在扩展存储中）
- 当起始页打开时，会自动同步扩展中保存的网站数据
- 支持从扩展面板直接添加网站到起始页

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.27 | Composition API + `<script setup>` |
| Pinia | 3.0.4 | 状态管理 |
| Vue Router | 5.0.1 | Hash 模式路由 |
| Vite | 7.3.1 | 构建工具 |
| IndexedDB | - | 本地数据存储 |
| Cheerio | 1.2.0 | HTML 解析（用于元数据获取） |

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
│   │   ├── WebsiteDialog.vue         # 网站管理对话框
│   │   └── ...
│   ├── stores/               # Pinia 状态管理
│   │   ├── website.js        # 网站数据
│   │   ├── search.js         # 搜索状态
│   │   ├── setting.js        # 全局设置
│   │   └── notification.js   # 通知状态
│   ├── utils/                # 工具函数
│   │   ├── database/         # 数据库操作
│   │   ├── search/           # 搜索相关
│   │   ├── ui/               # UI 相关
│   │   ├── website/          # 网站相关
│   │   └── ...
│   ├── services/             # 业务服务
│   │   ├── importService.js          # 导入服务
│   │   └── websiteMetadataService.js # 网站元数据服务
│   ├── data/                 # 静态数据
│   ├── router/               # 路由配置
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── extension/                # 浏览器扩展
│   ├── background.js         # 扩展后台脚本
│   ├── content.js            # 扩展内容脚本
│   ├── manifest.json         # 扩展配置
│   ├── popup.html            # 扩展弹出面板
│   └── popup.js              # 扩展弹出面板脚本

├── public/                   # 静态资源
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
  url: string,             // 网站链接
  name: string,            // 网站名称
  title: string,           // 网站标题
  description: string,     // 网站描述
  iconData: string,        // 图标 base64
  iconGenerateData: string,// SVG 图标
  tags: Array,             // 标签数组
  isMarked: boolean,       // 已标记
  isActive: boolean,       // 激活状态
  isHidden: boolean        // 隐藏状态
  markOrder: number,       // 标记排序
  visitCount: number,      // 访问次数
  lastVisited: Date,       // 最后访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date          // 更新时间
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

### 扩展存储结构

扩展使用 `chrome.storage.local` 存储以下数据：

```javascript
{
  "metas": [ // 未同步的网站元数据
    {
      "url": "https://www.example.com",
      "title": "示例网站",
      "description": "这是一个示例网站",
      "iconData": "data:image/png;base64,..."
    }
  ]
}
```

## 🌐 部署方案

### 本地使用

```bash
# 这个版本的vite配置无法index.html直接打开，需要使用http服务器
# 可以修改配置后再编译
npm run build
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



### Vercel / Netlify

连接 GitHub 仓库，自动构建和部署

## 🔧 元数据获取

### 扩展获取（推荐）

使用浏览器扩展获取网站元数据，支持：
- 自动获取当前页面的标题、描述和图标
- 支持多种编码格式（UTF-8、GB2312 等）
- 支持多种图标格式（ICO、PNG、SVG 等）
- 离线存储功能









## 📊 性能优化

- ✅ Vite 快速构建和热更新
- ✅ 组件按需加载
- ✅ IndexedDB 本地存储，读写高效
- ✅ 图标懒加载和缓存
- ✅ 批量数据处理优化

- ✅ 扩展本地处理，提高响应速度

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

### v2.1.0 (当前版本)

**新功能**：
- ✅ 浏览器扩展集成，支持从任意标签页快速添加网站
- ✅ 扩展离线存储功能，当起始页未打开时保存数据
- ✅ 扩展与起始页自动同步机制
- ✅ 多编码支持，解决中文网站乱码问题
- ✅ 多级图标获取策略，提高图标获取成功率

**功能优化**：
- ✅ 元数据获取逻辑改进，支持多种编码格式
- ✅ 消息传递机制重构，统一管理所有消息
- ✅ 错误处理增强，提供更友好的错误提示
- ✅ 扩展存储管理优化，自动清理已同步数据

**性能提升**：
- ✅ 扩展本地处理元数据，减少网络请求
- ✅ 批量数据处理优化
- ✅ 图标缓存机制改进

### v2.0.0

**架构重构**：
- ✅ 删除传统设置面板 UI，改用命令模式
- ✅ 显示模式简化：已标记列表仅网格模式，搜索结果仅列表模式
- ✅ 移除布局切换按钮


**功能优化**：
- ✅ 命令模式增强，支持更多快捷命令
- ✅ 搜索命令解析器改进

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


### 扩展集成
通过浏览器扩展，提供更便捷的网站添加方式，实现无缝体验。

---

**注意**：因使用 IndexedDB，数据仅保存在当前浏览器中，跨设备不同步。请定期使用 `--export` 命令导出数据备份。

## 🔗 相关链接


- [Vue 3 文档](https://vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [Chrome 扩展开发文档](https://developer.chrome.com/docs/extensions/mv3/)
