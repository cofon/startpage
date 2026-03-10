# 查看插件数据的详细指南

## 🎯 方法 1：使用 Edge 开发者工具（推荐）

### 步骤 1：打开插件弹窗
1. 按下 `Alt + Shift + D` 打开插件窗口
2. 或在 Edge 工具栏点击插件图标

### 步骤 2：打开开发者工具
1. 在插件弹窗上**右键点击**
2. 选择"**检查**"（Inspect）
3. 会弹出开发者工具窗口

### 步骤 3：查看控制台
1. 切换到 "**Console**"（控制台）标签
2. 粘贴以下代码并按回车：

```javascript
// 打开数据库
const request = indexedDB.open('StartPageDB', 7)

request.onsuccess = (event) => {
  const db = event.target.result
  const transaction = db.transaction(['websites'], 'readonly')
  const store = transaction.objectStore('websites')
  
  // 获取所有网站数据
  const getAllRequest = store.getAll()
  
  getAllRequest.onsuccess = () => {
    const websites = getAllRequest.result
    console.log('=== 所有网站数据 ===')
    console.table(websites)
    console.log(`总计：${websites.length} 个网站`)
    
    // 导出为 JSON（可选）
    console.log('=== JSON 格式 ===')
    console.log(JSON.stringify(websites, null, 2))
  }
}
```

### 步骤 4：查看结果
- 在控制台中看到表格形式的数据
- 包含字段：name, url, description, tags, isMarked, markOrder 等
- 可以展开每个对象查看详情

---

## 🎯 方法 2：在主起始页查看

### 步骤 1：打开起始页
访问：`http://localhost:5173` 或你的部署地址

### 步骤 2：打开开发者工具
按 `F12` 或右键 → 检查

### 步骤 3：Application 面板
1. 切换到 "**Application**"（应用程序）标签
2. 左侧展开：**Storage** → **IndexedDB** → **StartPageDB**
3. 点击 "**websites**" 表

### 步骤 4：浏览数据
- 右侧显示所有网站记录
- 可以点击每条记录查看详细信息
- 支持搜索、过滤、删除等操作

![示意图]
```
左侧导航:
└─ IndexedDB
   └─ StartPageDB
      ├─ websites ← 点击这里
      └─ settings

右侧显示:
Key | id | name | url | description | tags | isMarked ...
```

---

## 🎯 方法 3：使用插件自身功能

### 导出数据查看

1. **打开插件弹窗**
2. **切换到"导出数据"标签页**
3. **点击"导出数据"按钮**
4. **下载 JSON 文件**（例如：`startpage-backup-2026-03-10.json`）
5. **用文本编辑器打开**该文件即可查看完整数据

**JSON 文件格式示例**：
```json
{
  "websites": [
    {
      "id": 1,
      "name": "Google",
      "url": "https://www.google.com",
      "description": "全球最大的搜索引擎",
      "tags": ["搜索", "工具"],
      "isMarked": true,
      "markOrder": 1,
      "isActive": true,
      "isHidden": false,
      "visitCount": 0
    },
    {
      "id": 2,
      "name": "GitHub",
      "url": "https://github.com",
      "description": "代码托管平台",
      "tags": ["开发", "代码"],
      "isMarked": true,
      "markOrder": 2,
      "isActive": true,
      "isHidden": false,
      "visitCount": 0
    }
  ]
}
```

---

## 🎯 方法 4：高级用户 - 直接访问数据库文件

⚠️ **不推荐普通用户使用此方法**

### 前提条件
- 关闭 Edge 浏览器
- 安装 LevelDB 查看工具

### 工具推荐
1. **LevelDB Viewer**（第三方工具）
2. **Python 脚本**（需要 leveldb 库）

### 风险警告
- 直接修改可能导致数据损坏
- 只能在浏览器关闭时访问
- 建议先备份整个目录

---

## 🛠️ 实用调试脚本

### 快速查看统计数据

在控制台执行：
```javascript
// 统计信息
const request = indexedDB.open('StartPageDB', 7)
request.onsuccess = (e) => {
  const db = e.target.result
  const tx = db.transaction('websites', 'readonly')
  const store = tx.objectStore('websites')
  
  store.getAll().onsuccess = (e) => {
    const data = e.target.result
    console.group('📊 数据统计')
    console.log('总网站数:', data.length)
    console.log('标记网站数:', data.filter(w => w.isMarked).length)
    console.log('活跃网站数:', data.filter(w => w.isActive).length)
    console.log('隐藏网站数:', data.filter(w => w.isHidden).length)
    console.groupEnd()
  }
}
```

### 搜索特定网站

```javascript
// 搜索包含关键词的网站
const keyword = '搜索' // 修改为你要搜索的词
const request = indexedDB.open('StartPageDB', 7)

request.onsuccess = (e) => {
  const db = e.target.result
  const tx = db.transaction('websites', 'readonly')
  const store = tx.objectStore('websites')
  
  store.getAll().onsuccess = (e) => {
    const all = e.target.result
    const filtered = all.filter(w => 
      w.name.includes(keyword) || 
      w.description?.includes(keyword) ||
      w.tags?.some(t => t.includes(keyword))
    )
    console.log(`找到 ${filtered.length} 个匹配的网站:`)
    console.table(filtered)
  }
}
```

### 清空所有数据（慎用！）

```javascript
// ⚠️ 警告：这将删除所有网站数据！
if (confirm('确定要清空所有网站数据吗？此操作不可恢复！')) {
  const request = indexedDB.open('StartPageDB', 7)
  request.onsuccess = (e) => {
    const db = e.target.result
    const tx = db.transaction('websites', 'readwrite')
    const store = tx.objectStore('websites')
    
    store.clear().onsuccess = () => {
      console.log('✓ 已清空所有数据')
    }
  }
}
```

---

## 📋 数据结构说明

### Website 对象字段

| 字段名 | 类型 | 说明 |
|-------|------|------|
| `id` | Number | 自动生成的唯一标识（自增） |
| `name` | String | 网站名称 |
| `url` | String | 网站 URL |
| `description` | String | 网站描述 |
| `tags` | Array | 标签数组 |
| `isMarked` | Boolean | 是否标记为常用 |
| `markOrder` | Number | 标记顺序（用于排序） |
| `isActive` | Boolean | 是否激活 |
| `isHidden` | Boolean | 是否隐藏 |
| `visitCount` | Number | 访问计数 |

---

## 💡 常见问题

### Q: 为什么看不到数据？
A: 
- 确保插件已正确安装
- 尝试添加一些网站后再查看
- 刷新页面或重启浏览器

### Q: 数据能同步到其他设备吗？
A: 
- IndexedDB 是本地存储，不会自动同步
- 可通过"导出数据"功能手动迁移

### Q: 如何备份数据？
A: 
- 使用插件的"导出数据"功能
- 定期保存 JSON 文件到云盘

### Q: 数据库被锁定了怎么办？
A: 
- 关闭所有 Edge 窗口
- 等待几秒后重试
- 或重启浏览器
