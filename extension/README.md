# StartPage Edge 浏览器插件

这是一个 Edge 浏览器插件，用于快速添加网站到起始页，并支持数据的导入导出。

## 📦 功能特性

### 1. 快捷键添加网站
- **快捷键**: `Alt + Shift + D` (Windows) / `Alt+ Shift + D` (Mac)
- 自动填充当前网页的 title、URL、description、icon 等信息
- 可自定义网站名称（name）、标签等
- 支持标记为"常用网站"（显示在起始页 Grid 模式）

### 2. 数据导入
- 支持从现有起始页项目导入备份的 JSON 数据
- 批量导入所有网站数据
- 自动处理数据格式兼容性

### 3. 数据导出
- 导出所有网站数据到 JSON 文件
- 可用于数据备份或迁移到其他设备
- 文件名自动生成时间戳

## 🚀 安装方法

### 方法一：开发者模式安装（推荐）

1. **打开 Edge 扩展管理页面**
   - 地址栏输入：`edge://extensions/`
   - 或点击菜单 → 扩展 → 管理扩展

2. **启用开发者模式**
   - 打开左侧的"开发人员"开关

3. **加载扩展**
   - 点击"加载解压缩的扩展"
   - 选择 `d:\vue\startpage\extension` 文件夹
   - 确认加载成功

4. **验证安装**
   - 在扩展列表中看到 "StartPage - 快速添加网站"
   - 版本号为 `1.0.0`

### 方法二：打包安装

1. 在扩展管理页面点击"打包扩展"
2. 选择扩展目录：`d:\vue\startpage\extension`
3. 生成 `.crx` 和 `.zip` 文件
4. 双击 `.crx` 文件安装

## 📖 使用指南

### 添加单个网站

#### 场景 A：在当前浏览的网页添加（推荐）

1. **使用快捷键**
   - 在目标网页上按下 `Alt+Shift + D`
   - 弹出插件窗口

2. **自动填充信息**
   - ✅ **title**: 自动读取网页标题
   - ✅ **url**: 自动读取当前 URL
   - ✅ **description**: 自动读取 `<meta name="description">`
   - ✅ **iconData**: 自动获取网站 favicon 并转为 base64

3. **补充信息**
   - **name**: 用户自定义（可选，用于 Marked List Grid 模式显示）
   - **tags**: 输入标签，逗号分隔（可选）
   - **isMarked**: 手动勾选后才会显示在起始页（默认不勾选）

4. **保存**
   - 点击"保存"按钮
   - 数据保存到起始页 IndexedDB
   - 看到"✓ 添加成功"提示
   - **注意**: 添加的网站不会立即出现在起始页，需要手动搜索查看或在起始页刷新后查看

#### 场景 B：手动输入 URL 添加

1. **打开插件窗口**
   - 按 `Alt+ Shift+ D` 或在工具栏点击插件图标

2. **输入 URL**
   - 在 URL 字段输入目标网站地址
   - 例如：`https://www.google.com`

3. **获取元数据**
   - 点击"自动获取信息"按钮
   - 插件通过 fetch 获取：
     - title（网页标题）
     - description（网页描述）
     - iconData（网站图标 base64）

4. **补充信息**
   - **name**: 用户自定义（可选）
   - **tags**: 输入标签（可选）
   - **isMarked**: 是否标记（可选）

5. **保存**
   - 点击"保存"按钮
   - 数据保存到数据库

### 导入现有数据

1. **准备数据文件**
   - 从现有起始页项目导出数据
   - 获取 JSON 格式的备份文件（例如：`startpage-backup-2026-03-10.json`）

2. **打开导入面板**
   - 点击插件图标打开弹窗
   - 切换到"导入数据"标签页

3. **选择文件**
   - 点击"选择 JSON 文件"
   - 选择你的备份文件
   - 文件名会显示在下方

4. **开始导入**
   - 点击"开始导入"按钮
   - 等待进度条完成
   - 查看导入结果（成功导入 X 个网站）

5. **验证数据**
   - 切换到"添加网站"标签页
   - 或在起始页查看已导入的网站

### 导出数据

1. **打开导出面板**
   - 点击插件图标
   - 切换到"导出数据"标签页

2. **导出数据**
   - 点击"导出数据"按钮
   - 自动下载 JSON 文件
   - 文件名格式：`startpage-backup-YYYY-MM-DD-HH-mm-ss.json`

3. **保存备份**
   - 将导出的文件保存到安全位置
   - 可用于恢复或迁移到新设备

## 🗄️ 数据存储

### 数据库结构

- **存储位置**: 浏览器 IndexedDB 数据库（仅起始页持有）
- **数据库名称**: `StartPageDB`
- **表名**: `websites`
- **主键**: `id` (自动递增)

### 完整数据字段

根据主项目规范，websites 表包含以下字段：

```javascript
{
  id: number,              // 自增 ID (主键)
  name: string,            // 网站名称（用户自定义，用于 Marked List Grid 模式）
  title: string,           // 网站标题（网页原始标题，用于 Search Results List 模式）
  url: string,             // 网站链接（必填字段）
  description: string,     // 网站描述
  iconData: string,        // 网络获取的 icon base64（包含 data:image 前缀）
  iconGenerateData: string, // 本地生成的 SVG 图标 base64（包含 data:image 前缀）
  tags: Array,             // 标签数组 [tag1, tag2, ...]
  isMarked: boolean,       // 是否为已标记网站
  markOrder: number,       // marked 网站排序（仅当 isMarked 为 true 时有效）
  visitCount: number,      // 访问次数统计
  lastVisited: Date,       // 最近访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  isActive: boolean,       // 是否激活状态（正常搜索不显示非激活的网站）
  isHidden: boolean        // 是否隐藏状态（正常搜索不显示隐藏的网站）
}
```

### 字段详细说明

| 字段名 | 类型 | 必填 | 默认值 | 说明 | 使用场景 |
|-------|------|------|--------|------|---------|
| `id` | Number | 自动生成 | - | 唯一标识符（自增） | 内部使用 |
| `name` | String | 可选* | `''` | 网站名称（用户自定义） | **Marked List Grid 模式显示** |
| `title` | String | 可选* | `''` | 网站标题（网页原始标题） | **Search Results List 模式显示** |
| `url` | String | ✅ **必填** | - | 网站 URL | 链接跳转 |
| `description` | String | 可选* | `''` | 网站描述 | 辅助信息 |
| `iconData` | String | 可选 | `null` | 网络获取的图标 base64 | 网站图标显示 |
| `iconGenerateData` | String | 可选 | `null` | 本地生成的 SVG 图标 base64（由起始页生成） | 备用图标显示 |
| `tags` | Array<String> | 可选 | `[]` | 标签数组 | 搜索/分类 |
| `isMarked` | Boolean | 可选 | `false` | 是否标记为常用 | 过滤控制 |
| `markOrder` | Number | 可选 | `0` | 标记顺序（用于排序） | Marked List 排序 |
| `visitCount` | Number | 可选 | `0` | 访问计数 | 统计信息 |
| `lastVisited` | Date | 可选 | `null` | 最近访问时间 | 统计信息 |
| `createdAt` | Date | 可选 | `new Date()` | 创建时间 | 审计信息 |
| `updatedAt` | Date | 可选 | `new Date()` | 更新时间 | 审计信息 |
| `isActive` | Boolean | 可选 | `true` | 是否激活 | 过滤控制 |
| `isHidden` | Boolean | 可选 | `false` | 是否隐藏 | 过滤控制 |

**注意**: 
- `*` 表示 `name`、`title`、`description` 三个字段中**至少有一个不为空即可**
- `url` 是**唯一必填字段**

### 字段独立性原则

**重要**：`name` 和 `title` 是两个完全独立的字段：

1. ✅ **不会互相映射**：导入时保持原样，不自动转换
2. ✅ **不会互相覆盖**：各自独立存在，互不影响
3. ✅ **按需使用**：不同显示模式读取不同的字段
4. ✅ **可单独存在**：可以只有 name 或只有 title，或两者都有
5. ✅ **默认值规则**：
   - `isMarked`: **false**（不默认勾选，需要手动标记）
   - `isActive`: **true**（默认激活状态）
   - `isHidden`: **false**（默认不隐藏）

### 添加网站时的默认行为

当通过插件添加新网站时，系统会自动设置以下默认值：

``javascript
{
  isMarked: false,    // ❌ 不默认勾选（需要用户手动选择）
  isActive: true,     // ✅ 默认激活（正常搜索可见）
  isHidden: false,    // ✅ 默认不隐藏（正常搜索可见）
  visitCount: 0,
  markOrder: 0,
  iconData: null,         // 网络获取的图标（可能为空）
  iconGenerateData: null  // SVG 备用图标（由起始页生成）
}
```

**设计理念**：
- 新添加的网站需要用户**主动确认**是否标记为常用（isMarked）
- 所有网站默认都是激活状态（isActive），可在搜索中显示
- 除非用户明确设置，否则不会隐藏任何网站（isHidden）
- **图标处理**：
  - 插件负责获取网络图标（iconData）
  - 起始页负责生成 SVG 备用图标（iconGenerateData）
  - 两者的 base64 数据都包含完整的 data:image 前缀

### 显示模式与字段对应关系

#### **Marked List 模式（仅 Grid 布局）**
```
┌─────────────────────────────────────┐
│  Marked List - Grid Mode            │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 百度 │  │GitHub│  │ B 站 │      │
│  └──────┘  └──────┘  └──────┘      │
│    ↑          ↑          ↑          │
│  显示 name  显示 name  显示 name     │
│                                     │
│  ⚠️ 注意：只有 isMarked=true 的网站才会显示在此处 │
└─────────────────────────────────────┘
```

**特点**：
- 显示 `name` 字段（用户自定义的简短名称）
- Grid 网格布局，自动换行
- 每行数量根据容器宽度动态计算
- **仅显示 `isMarked=true` 且 `isActive=true` 的网站**
- 新添加的网站默认 `isMarked=false`，不会立即显示

#### **Search Results 模式（仅 List 布局）**
```
┌─────────────────────────────────────┐
│  Search Results - List Mode         │
├─────────────────────────────────────┤
│  🔍 百度一下，你就知道               │
│     https://www.baidu.com           │
│     全球最大的中文搜索引擎          │
│     ↑ 显示 title 字段                │
│                                     │
│  🔍 GitHub: Let's build from here   │
│     https://github.com              │
│     代码托管平台                    │
│     ↑ 显示 title 字段                │
└─────────────────────────────────────┘
```

**特点**：
- 显示 `title` 字段（网页原始完整标题）
- List 列表布局，垂直排列
- 显示完整标题、URL 和描述

### Icon 数据格式规范

#### **iconData（网络获取的图标）**
```javascript
// ✅ 正确格式（包含完整的 data:image 前缀）
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
"data:image/x-icon;base64,AAABAAEAAAAAAA..."
"data:image/svg+xml;base64,PHN2ZyB4bWxucz0..."

// ❌ 错误格式（缺少前缀）
"iVBORw0KGgoAAAANSUhEUgAA..."  // 无法直接使用
```

#### **iconGenerateData（本地生成的 SVG 图标）**
``javascript
// ✅ 正确格式（由起始页基于 name 首字母生成）
"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiMyMTk2RjMiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iNDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QjwvdGV4dD48L3N2Zz4="

// 解码后是一个蓝色圆形背景 + 白色字母"B"的 SVG
```

**生成规则**：
- ⚠️ **注意**：此字段由**起始页**在保存网站时自动生成，插件不需要处理
- 起始页从 `name` 字段提取首字母（不是从域名）
- 例如：`name: "百度"` → 首字母 "B"
- 例如：`name: "GitHub"` → 首字母 "G"
- 生成 SVG：圆形背景 + 白色大写字母
- 转为 base64 并添加 `data:image/svg+xml;base64,` 前缀

**插件职责**：
- ✅ 仅负责获取 `iconData`（网络图标）
- ❌ 不需要生成或处理 `iconGenerateData`（由起始页负责）

### 导入导出数据格式

**导入数据示例**：

``json
{
  "websites": [
    {
      "id": 1,
      "name": "百度",                    // 用户自定义名称（用于 Marked List）
      "title": "百度一下，你就知道",      // 网页原始标题（用于搜索结果）
      "url": "https://www.baidu.com/",
      "description": "全球最大的中文搜索引擎",
      "tags": ["搜索", "search"],
      "iconData": "data:image/png;base64,iVBORw0KG...",
      "iconGenerateData": "data:image/svg+xml;base64,PHN2Z...",
      "isMarked": true,
      "markOrder": 1,
      "isActive": true,
      "isHidden": false,
      "visitCount": 0
    },
    {
      "id": 2,
      "name": "GitHub",                  // 用户自定义名称
      "title": "GitHub: Let's build from here",  // 网页原始标题
      "url": "https://github.com",
      "description": "代码托管平台",
      "tags": ["开发", "代码"],
      "iconData": "data:image/png;base64,...",
      "iconGenerateData": "data:image/svg+xml;base64,...",
      "isMarked": true,
      "markOrder": 2,
      "isActive": true,
      "isHidden": false,
      "visitCount": 0
    }
  ]
}
```

**导出数据格式**：

导出的 JSON 文件会完整保留所有字段信息：

``json
{
  "websites": [
    {
      "id": 1,
      "name": "百度",
      "title": "百度一下，你就知道",
      "url": "https://www.baidu.com/",
      "description": "",
      "tags": ["搜索", "search"],
      "iconData": "data:image/png;base64,iVBORw0KG...",
      "iconGenerateData": "data:image/svg+xml;base64,PHN2Z...",
      "isMarked": true,
      "isActive": true,
      "isHidden": false,
      "visitCount": 0
    }
  ]
}
```

### 存储内容说明

- ✅ **包含**：
  - 网站名称（name）、标题（title）、URL、描述
  - 网络图标数据（iconData，包含完整 base64 前缀）
  - 标签、标记状态、访问统计等元数据
  
- ⚠️ **不包含**：
  - SVG 备用图标（iconGenerateData 由起始页在保存时生成）

## 🔄 与起始页集成

### 数据同步机制

插件和起始页共享同一个 IndexedDB 数据库：

1. **单一数据源原则**
   - 只有起始页持有 IndexedDB 数据库
   - 插件不独立存储核心数据
   - 避免数据同步复杂度

2. **通信机制**
   - 插件通过 Content Script + Message Passing 调用起始页 API
   - 数据流：`popup.js → background.js → content.js → window.StartPageAPI → indexedDB.js`

3. **实时性保证**
   - 插件添加的网站会立即出现在起始页
   - 起始页的操作也会反映到插件中
   - 无需手动刷新或同步

### 使用方法

- 将起始页设置为浏览器主页或新标签页
- 地址：`file:///d:/vue/startpage/dist/index.html`
- 或使用本地服务器：`http://localhost:5173`

## 🛠️ 开发调试

### 查看数据库

#### 方法 1：开发者工具快速查看（推荐）

1. 打开起始页
2. 按 `F12` 打开开发者工具
3. 切换到"Application"标签
4. 展开"IndexedDB" → "StartPageDB" → "websites"
5. 查看所有网站数据

#### 方法 2：控制台脚本查看

在起始页控制台执行：
```javascript
const request = indexedDB.open('StartPageDB', 7)
request.onsuccess = (e) => {
  const db = e.target.result
  const tx = db.transaction('websites', 'readonly')
  const store = tx.objectStore('websites')
  store.getAll().onsuccess = (e) => {
   console.table(e.target.result)
   console.log(`总计：${e.target.result.length} 个网站`)
  }
}
```

### 查看日志

1. 打开扩展管理页面：`edge://extensions/`
2. 找到 "StartPage" 扩展
3. 点击"查看视图：背景页"
4. 在控制台中查看后台日志

### 热重载

修改代码后：
1. 在扩展管理页面
2. 点击刷新图标 🔄
3. 重新打开插件窗口即可生效

## ⚠️ 注意事项

1. **数据备份**
   - 定期导出数据以防丢失
   - IndexedDB 数据存储在本地，清除浏览器数据会删除

2. **跨浏览器**
   - 不同浏览器的 IndexedDB 不互通
   - 可通过导入导出功能迁移数据

3. **隐私模式**
   - 隐私/无痕模式下 IndexedDB 会被清除
   - 不建议在隐私模式下使用

4. **数据量限制**
   - IndexedDB 通常有存储空间限制（因浏览器而异）
   - 建议保持合理数量的网站数据

5. **Icon 数据格式**
   - 确保 iconData 和 iconGenerateData 包含完整的 base64 前缀
   - 格式：`data:image/<type>;base64,<data>`
   - 否则无法直接在 `<img>` 标签中使用

## 🐛 故障排除

### 问题 1：快捷键不生效

**解决方案**：
- 检查是否有其他扩展占用了相同快捷键
- 在 `edge://extensions/shortcuts` 中重新设置

### 问题 2：导入失败

**可能原因**：
- JSON 文件格式不正确
- 数据缺少必需的字段

**解决方案**：
- 确保 JSON 文件包含 `websites` 数组
- 验证每个网站对象是否有 `url` 字段（必填）
- 确保 `name`、`title`、`description` 至少有一个不为空

### 问题 3：数据不显示

**解决方案**：
- 刷新起始页
- 清除浏览器缓存后重试
- 检查 IndexedDB 中是否有数据

### 问题 4：图标显示异常

**可能原因**：
- iconData 缺少 `data:image` 前缀
- base64 数据损坏

**解决方案**：
- 检查数据库中 iconData 字段格式是否正确
- 重新获取图标数据

## 📝 更新日志

### v1.0.0 (2026-03-10)
- ✨ 初始版本发布
- ➕ 添加网站功能（支持自动获取 title/description/icon）
- 📥 数据导入功能（支持完整字段映射）
- 📤 数据导出功能（包含 iconData）
- ⌨️ 快捷键支持 (Alt+Shift+D)
- 🎯 明确 name 和 title 字段独立性
- 🎨 支持 Marked List Grid 模式和 Search Results List 模式
- 🔧 SVG 图标由起始页负责生成，插件专注数据采集

## 📄 许可证

与主项目保持一致