# 项目重构计划

## 一、代码结构分析

### 1.1 当前问题

#### App.vue (1172行) - 过于庞大
- 包含了太多职责：搜索、显示、拖拽、对话框管理、初始化等
- 大量重复代码：网站对象创建逻辑重复多次
- 混合了业务逻辑和UI逻辑
- 高度计算逻辑复杂且耦合度高

#### 组件结构问题
- WebsiteDialog.vue (515行) - 包含太多表单逻辑
- CommandSettings.vue - 命令面板管理
- HelpPanel.vue - 帮助面板
- 多个设置组件（ThemeSettings、SearchSettings等）分散管理

#### Stores 问题
- website.js - 包含太多业务逻辑
- search.js - 搜索逻辑和显示模式混合
- 缺少专门的拖拽管理 store

#### Utils 问题
- websiteUtils.js - 工具函数较完整
- iconManager.js - 图标管理独立性好
- indexedDB.js - 数据库操作独立性好
- 缺少网站对象转换工具

### 1.2 重复代码问题

1. **网站对象创建逻辑重复**（出现多次）：
   - handleWebsiteClick 中
   - handleDrop 中
   - saveWebsite 中
   - deleteWebsite 中
   - restoreWebsite 中
   - toggleWebsiteMark 中

2. **显示模式切换逻辑重复**：
   - deleteWebsite 中
   - restoreWebsite 中
   - toggleWebsiteMark 中

3. **UI 更新逻辑重复**：
   - 多处直接操作 searchStore.results

## 二、重构方案

### 2.1 第一阶段：提取工具函数

#### 2.1.1 创建 websiteNormalizer.js
**位置**: `src/utils/websiteNormalizer.js`

**职责**:
- 统一网站对象的创建和转换
- 处理响应式对象到普通对象的转换
- 确保所有字段都有默认值

**导出函数**:
```javascript
// 创建标准网站对象
export function createWebsiteObject(data)

// 从响应式对象创建普通对象
export function normalizeWebsiteForDB(website)

// 批量标准化网站对象
export function normalizeWebsitesForDB(websites)
```

#### 2.1.2 创建 displayModeManager.js
**位置**: `src/utils/displayModeManager.js`

**职责**:
- 统一管理显示模式切换
- 处理不同模式下的结果更新

**导出函数**:
```javascript
// 更新显示结果
export function updateDisplayResults(searchStore, websiteStore, mode)

// 刷新当前显示
export function refreshCurrentDisplay(searchStore, websiteStore)
```

#### 2.1.3 创建 dragDropManager.js
**位置**: `src/utils/dragDropManager.js`

**职责**:
- 统一拖拽逻辑
- 处理拖拽排序
- 更新数据库和store

**导出函数**:
```javascript
// 初始化拖拽
export function initDragDrop(config)

// 处理拖拽开始
export function handleDragStart(website, index)

// 处理拖拽结束
export function handleDragEnd()

// 处理拖拽放置
export async function handleDrop(targetIndex)
```

### 2.2 第二阶段：拆分组件

#### 2.2.1 创建 SearchModule.vue
**位置**: `src/components/SearchModule.vue`

**职责**:
- 搜索框
- 搜索引擎选择器
- 标签列表
- 搜索相关事件处理

**包含**:
- SearchEngineSelector
- TagsList (新建)

#### 2.2.2 创建 DisplayModule.vue
**位置**: `src/components/DisplayModule.vue`

**职责**:
- 显示模块容器
- 高度计算
- 滚动管理

**包含**:
- MarkedWebsiteList (新建)
- SearchResultsList (新建)
- CommandSettings
- HelpPanel

#### 2.2.3 创建 MarkedWebsiteList.vue
**位置**: `src/components/MarkedWebsiteList.vue`

**职责**:
- 显示已标记网站列表
- 拖拽排序
- 网站点击

#### 2.2.4 创建 SearchResultsList.vue
**位置**: `src/components/SearchResultsList.vue`

**职责**:
- 显示搜索结果
- 网站操作（标记、编辑、删除）

#### 2.2.5 创建 WebsiteActions.vue
**位置**: `src/components/WebsiteActions.vue`

**职责**:
- 网站操作按钮组
- 标记、编辑、删除、恢复

### 2.3 第三阶段：优化 Stores

#### 2.3.1 创建 dragDrop.js store
**位置**: `src/stores/dragDrop.js`

**职责**:
- 管理拖拽状态
- 拖拽排序逻辑

#### 2.3.2 优化 website.js
- 移除重复的网站对象创建逻辑
- 使用 websiteNormalizer 工具
- 简化状态管理

#### 2.3.3 优化 search.js
- 分离搜索逻辑和显示逻辑
- 使用 displayModeManager 工具
- 简化命令处理

### 2.4 第四阶段：优化 App.vue

#### 2.4.1 简化 App.vue
- 移除重复代码
- 使用新的组件和工具
- 只保留应用级别的逻辑

#### 2.4.2 重构后的 App.vue 结构
```vue
<script setup>
// 只保留：
// 1. 应用初始化
// 2. 全局事件监听
// 3. 组件组合
</script>

<template>
  <div id="app">
    <NotificationContainer />
    <SearchModule />
    <DisplayModule />
    <WebsiteDialog />
  </div>
</template>
```

## 三、执行步骤

### 步骤 1：创建工具函数
1. 创建 websiteNormalizer.js
2. 创建 displayModeManager.js
3. 创建 dragDropManager.js

### 步骤 2：拆分组件
1. 创建 WebsiteActions.vue
2. 创建 MarkedWebsiteList.vue
3. 创建 SearchResultsList.vue
4. 创建 SearchModule.vue
5. 创建 DisplayModule.vue

### 步骤 3：优化 Stores
1. 创建 dragDrop.js store
2. 优化 website.js
3. 优化 search.js

### 步骤 4：重构 App.vue
1. 使用新组件替换旧代码
2. 移除重复逻辑
3. 测试功能完整性

### 步骤 5：清理和优化
1. 删除不再使用的代码
2. 优化样式
3. 更新文档

## 四、预期效果

### 4.1 代码质量提升
- App.vue 从 1172 行减少到约 200 行
- 消除所有重复代码
- 职责清晰分离

### 4.2 可维护性提升
- 组件职责单一
- 工具函数可复用
- 代码结构清晰

### 4.3 可扩展性提升
- 易于添加新功能
- 易于修改现有功能
- 易于测试

## 五、注意事项

1. **保持向后兼容**：重构过程中确保功能不受影响
2. **逐步重构**：按照步骤逐步进行，每步都要测试
3. **保留备份**：重要文件重构前先备份
4. **文档更新**：重构完成后更新相关文档
5. **代码审查**：每步完成后进行代码审查

## 六、时间估算

- 第一阶段：2-3小时
- 第二阶段：3-4小时
- 第三阶段：2-3小时
- 第四阶段：2-3小时
- 第五阶段：1-2小时

**总计**：约 10-15 小时
