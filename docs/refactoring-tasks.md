# 重构任务执行计划表

## 第一阶段：创建工具函数

### 任务 1.1：创建 websiteNormalizer.js
- [x] 创建文件 `src/utils/websiteNormalizer.js`
- [x] 实现 `createWebsiteObject` 函数
- [x] 实现 `normalizeWebsiteForDB` 函数
- [x] 实现 `normalizeWebsitesForDB` 函数

### 任务 1.2：创建 displayModeManager.js
- [x] 创建文件 `src/utils/displayModeManager.js`
- [x] 实现 `updateDisplayResults` 函数
- [x] 实现 `refreshCurrentDisplay` 函数

### 任务 1.3：创建 dragDropManager.js
- [x] 创建文件 `src/utils/dragDropManager.js`
- [x] 实现 `initDragDrop` 函数
- [x] 实现 `handleDragStart` 函数
- [x] 实现 `handleDragEnd` 函数
- [x] 实现 `handleDrop` 函数

## 第二阶段：拆分组件

### 任务 2.1：创建 WebsiteActions.vue
- [x] 创建文件 `src/components/WebsiteActions.vue`
- [x] 实现组件模板
- [x] 实现组件逻辑
- [x] 实现组件样式

### 任务 2.2：创建 MarkedWebsiteList.vue
- [x] 创建文件 `src/components/MarkedWebsiteList.vue`
- [x] 实现组件模板
- [x] 实现组件逻辑
- [x] 实现组件样式

### 任务 2.3：创建 SearchResultsList.vue
- [x] 创建文件 `src/components/SearchResultsList.vue`
- [x] 实现组件模板
- [x] 实现组件逻辑
- [x] 实现组件样式

### 任务 2.4：创建 SearchModule.vue
- [x] 创建文件 `src/components/SearchModule.vue`
- [x] 实现组件模板
- [x] 实现组件逻辑
- [x] 实现组件样式

### 任务 2.5：创建 DisplayModule.vue
- [x] 创建文件 `src/components/DisplayModule.vue`
- [x] 实现组件模板
- [x] 实现组件逻辑
- [x] 实现组件样式

## 第三阶段：优化 Stores

### 任务 3.1：创建 dragDrop.js store
- [x] 创建文件 `src/stores/dragDrop.js`
- [x] 实现拖拽状态管理
- [x] 实现拖拽排序逻辑

### 任务 3.2：优化 website.js
- [x] 使用 websiteNormalizer 工具
- [x] 移除重复的网站对象创建逻辑
- [x] 简化状态管理

### 任务 3.3：优化 search.js
- [x] 使用 displayModeManager 工具
- [x] 分离搜索逻辑和显示逻辑
- [x] 简化命令处理

## 第四阶段：重构 App.vue

### 任务 4.1：使用新组件替换旧代码
- [x] 使用 SearchModule 组件
- [x] 使用 DisplayModule 组件
- [x] 使用 WebsiteActions 组件

### 任务 4.2：移除重复逻辑
- [x] 移除网站对象创建重复代码
- [x] 移除显示模式切换重复代码
- [x] 移除 UI 更新重复代码

### 任务 4.3：简化 App.vue
- [x] 简化模板
- [x] 简化脚本
- [x] 测试功能完整性

## 第五阶段：清理和优化

### 任务 5.1：删除不再使用的代码
- [x] 清理 App.vue 中的旧代码
- [x] 清理组件中的旧代码
- [x] 清理 stores 中的旧代码

### 任务 5.2：优化样式
- [x] 提取公共样式
- [x] 优化组件样式
- [x] 优化全局样式

### 任务 5.3：更新文档
- [x] 更新重构计划文档
- [x] 更新任务执行状态
- [x] 编写重构总结文档
