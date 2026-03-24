添加网站入口

添加网站的入口（共 4 个）
1️⃣ 命令模式入口 (--add)
位置: CommandSettings.vue
触发方式: 用户输入 --add 命令
UI 组件: AddWebsitePanel.vue
代码路径:
CommandSettings.vue:81 → <AddWebsitePanel />
CommandSettings.vue:43 → searchStore.handleCommand('--add')
2️⃣ 浏览器扩展入口
位置: extension/background.js
触发方式: 通过扩展菜单或快捷键添加当前页面
功能: 获取当前标签页的元数据（title, description, icon）
代码路径: extension/background.js:54-91 → addWebsite() 函数
3️⃣ 导入数据入口 (--import)
位置: ImportDataPanel.vue + importService.js
触发方式: 用户输入 --import 或点击导入按钮
功能: 批量导入 JSON 格式的网站数据
代码路径:
ImportDataPanel.vue:22-24 → 调用 importService.importData()
importService.js:342 → db.addWebsite(website) 批量保存
4️⃣ 对话框入口 (通用编辑/添加)
位置: WebsiteDialog.vue
触发方式: App.vue:107 → openAddWebsite()
使用场景: 通用的添加/编辑网站对话框
代码路径: WebsiteDialog.vue:201 → websiteStore.addWebsite(websiteData)


===============================================================

流程 1: AddWebsitePanel 添加流程（最复杂）
用户输入 URL 
  ↓
实时验证 URL 格式 (isValidUrl)
  ↓
检查 URL 是否已存在 (checkUrlExists)
  ↓
自动填充 name (extractSiteNameFromUrl)
  ↓
自动生成 SVG 图标 (normalizeWebsiteData → generateDefaultIcon)
  ↓
可选：手动获取 Meta 数据 (fetchMetadata from extension)
  ↓
用户编辑表单
  ↓
提交验证 (handleSubmit)
  ↓
标准化数据 (normalizeWebsiteData)
  ↓
添加到 Store (websiteStore.addWebsite)
  ↓
保存到数据库 (db.addWebsite)
  ↓
通知用户成功

关键代码: AddWebsitePanel.vue:602

javascript
await websiteStore.addWebsite(normalizedData)


===============================================================


流程 2: WebsiteDialog 添加流程（简化版）
用户打开对话框
  ↓
填写表单（name, url, tags 等）
  ↓
验证表单 (validateForm)
  ↓
保存 (saveWebsite)
  ↓
添加到 Store (websiteStore.addWebsite)
  ↓
更新数据库 (db.addWebsite)
  ↓
通知用户成功

关键代码: WebsiteDialog.vue:201

javascript
await websiteStore.addWebsite(websiteData)


===============================================================


流程 3: ImportService 批量导入流程
用户上传 JSON 文件
  ↓
解析和验证数据 (validateImportData)
  ↓
判断导入类型 (websites / urls)
  ↓
检查数据库中已存在的 URL
  ↓
分类处理：
  - 已存在且完整 → 跳过
  - 已存在但不完整 → 需要更新
  - 新数据 → 需要导入
  ↓
补全不完整数据的 Meta (enrichWebsites via extension)
  ↓
标准化数据 (normalizeWebsites)
  ↓
批量导入数据库 (importWebsitesToDB)
  ↓
返回导入结果统计
关键代码: importService.js:342

javascript
await db.addWebsite(website)


===============================================================


流程 4: Extension 扩展添加流程
用户点击扩展图标/快捷键
  ↓
background.js 获取当前标签页信息
  ↓
执行 content script 提取 Meta 数据
  ↓
发送消息给起始页 (START_PAGE_REQUEST_WEBSITE_META)
  ↓
起始页接收数据并显示在 AddWebsitePanel
  ↓
用户确认后添加到数据库
关键代码: extension/background.js:54-91

javascript
async function addWebsite() {
  const metadata = await getMetadataFromCurrentTab()
  // 发送到起始页...
}

===============================================================