<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useWebsiteStore } from './stores/website'
import { useSettingStore } from './stores/setting'
import { useSearchStore } from './stores/search'
import { useNotificationStore } from './stores/notification'
import db from './utils/indexedDB'
import iconManager from './utils/iconManager'
import SearchEngineSelector from './components/SearchEngineSelector.vue'
import WebsiteDialog from './components/WebsiteDialog.vue'
import WebsiteIcon from './components/WebsiteIcon.vue'
import { defaultWebsites } from './data/defaultWebsites'
import NotificationContainer from './components/NotificationContainer.vue'
import CommandSettings from './components/CommandSettings.vue'
import HelpPanel from './components/HelpPanel.vue'

// 初始化 stores
const websiteStore = useWebsiteStore()
const settingStore = useSettingStore()
const searchStore = useSearchStore()
const notificationStore = useNotificationStore()

// 引用显示模块
const displayModuleRef = ref(null)

// 网站对话框
const showWebsiteDialog = ref(false)
const editingWebsite = ref(null)

// 是否首次使用
const isFirstTime = ref(false)

// 文字选择相关状态
let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }
let hadSelectionOnMouseDown = false

// 检测是否在选择文字
function checkTextSelection(event) {
  const timeDiff = Date.now() - mouseDownTime
  const distanceDiff = Math.sqrt(
    Math.pow(event.clientX - mouseDownPosition.x, 2) +
    Math.pow(event.clientY - mouseDownPosition.y, 2)
  )
  return !hadSelectionOnMouseDown && (distanceDiff > 5 || timeDiff > 200)
}

// 记录鼠标按下事件
function handleMouseDown(event) {
  mouseDownTime = Date.now()
  mouseDownPosition = { x: event.clientX, y: event.clientY }
  const selection = window.getSelection()
  hadSelectionOnMouseDown = selection.toString().trim().length > 0
}

// 处理网站点击
function handleWebsiteClick(website, event) {
  if (checkTextSelection(event)) {
    return
  }

  websiteStore.incrementVisitCount(website.id)
  const websiteToUpdate = normalizeWebsiteForDB(website)
  db.updateWebsite(websiteToUpdate)
  window.open(website.url, '_blank')
}

// 打开添加网站对话框
function openAddWebsite() {
  editingWebsite.value = null
  showWebsiteDialog.value = true
}

// 打开编辑网站对话框
function openEditWebsite(website) {
  editingWebsite.value = website
  showWebsiteDialog.value = true
}

// 保存网站
async function saveWebsite(websiteData) {
  if (editingWebsite.value) {
    // 更新现有网站
    await websiteStore.updateWebsite(editingWebsite.value.id, websiteData)
    const websiteToUpdate = normalizeWebsiteForDB(websiteData)
    await db.updateWebsite(websiteToUpdate)
  } else {
    // 添加新网站
    await websiteStore.addWebsite(websiteData)
    const newWebsite = websiteStore.websites[websiteStore.websites.length - 1]
    const websiteToAdd = normalizeWebsiteForDB(newWebsite)
    await db.addWebsite(websiteToAdd)
  }
}

// 删除网站（软删除）
async function deleteWebsite(website) {
  if (confirm(`确定要删除 "${website.name}" 吗？`)) {
    await websiteStore.deleteWebsite(website.id)
    const websiteToUpdate = normalizeWebsiteForDB({ ...website, isActive: false, updatedAt: new Date() })
    await db.updateWebsite(websiteToUpdate)
    handleWebsiteDeleted(searchStore, websiteStore, website.id)
    notificationStore.success(`已删除网站：${website.name}`)
  }
}

// 恢复网站（将 isActive 设置为 true）
async function restoreWebsite(website) {
  if (confirm(`确定要恢复 "${website.name}" 吗？`)) {
    websiteStore.updateWebsite(website.id, { isActive: true })
    const websiteToUpdate = normalizeWebsiteForDB({ ...website, isActive: true, updatedAt: new Date() })
    await db.updateWebsite(websiteToUpdate)
    handleWebsiteRestored(searchStore, websiteStore, website.id)
    notificationStore.success(`已恢复网站：${website.name}`)
  }
}

// 切换网站标记状态
async function toggleWebsiteMark(website) {
  let newIsMarked
  let newMarkOrder

  if (website.isMarked) {
    await websiteStore.unmarkWebsite(website.id)
    newIsMarked = false
    newMarkOrder = 0
  } else {
    const maxOrder = Math.max(0, ...websiteStore.markedWebsites.map(w => w.markOrder))
    const newOrder = maxOrder + 1
    await websiteStore.markWebsite(website.id, newOrder)
    newIsMarked = true
    newMarkOrder = newOrder
  }

  const websiteToUpdate = normalizeWebsiteForDB({
    ...website,
    isMarked: newIsMarked,
    markOrder: newMarkOrder
  })
  await db.updateWebsite(websiteToUpdate)

  if (newIsMarked) {
    notificationStore.success(`已标记网站：${website.name}`)
  } else {
    notificationStore.success(`已取消标记网站：${website.name}`)
  }

  handleWebsiteMarkToggled(searchStore, websiteStore, newIsMarked)
}

// 初始化应用
onMounted(async () => {
  try {
    await db.init()
    await settingStore.init()

    const websites = await db.getAllWebsites()
    if (websites.length > 0) {
      const migratedCount = await db.migrateWebsites()
      if (migratedCount > 0) {
        const updatedWebsites = await db.getAllWebsites()
        websiteStore.setWebsites(updatedWebsites)
      } else {
        websiteStore.setWebsites(websites)
      }
    } else {
      isFirstTime.value = true
      const websitesWithIds = []
      for (const website of defaultWebsites) {
        const id = await db.addWebsite(website)
        websitesWithIds.push({ ...website, id })
      }
      websiteStore.setWebsites(websitesWithIds)
    }

    await searchStore.loadEngineIcons()
    searchStore.init()
  } catch (error) {
    console.error('初始化应用失败:', error)
  }
})
</script>

<template>
  <div id="app" :class="settingStore.selectedThemeId + '-theme'">
    <!-- 通知容器 -->
    <NotificationContainer />

    <!-- 搜索模块 -->
    <SearchModule />

    <!-- 显示模块 -->
    <DisplayModule
      ref="displayModuleRef"
      @website-click="handleWebsiteClick"
      @toggle-mark="toggleWebsiteMark"
      @edit="openEditWebsite"
      @delete="deleteWebsite"
      @restore="restoreWebsite"
      @add-website="openAddWebsite"
    />

    <!-- 网站管理对话框 -->
    <WebsiteDialog
      v-model="showWebsiteDialog"
      :website="editingWebsite"
      @save="saveWebsite"
    />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* 主题样式 */
.light-theme,
.dark-theme,
.auto-theme,
[class$="-theme"] {
  background: var(--color-bg-page);
  color: var(--color-text-main);
}
</style>

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: var(--color-bg-card);
  border-radius: 30px;
  box-shadow: var(--shadow-medium);
  transition: box-shadow 0.3s ease;
  position: relative;
}

.search-box:hover {
  box-shadow: var(--shadow-dark);
}

.engine-icon-container {
  display: flex;
  align-items: center;
  height: 100%;
}

.engine-icon {
  width: 50px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.engine-icon img {
  width: 24px;
  height: 24px;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 24px;
  font-size: 18px;
  color: var(--color-text-main);
  background-color: transparent !important; /* 强制背景透明 */
  transition: flex 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 30px 30px 0; /* 添加圆角 */
}

.search-input::placeholder {
  color: var(--color-text-disabled);
}

/* 确保search-input在任何状态下都保持透明和圆角 */
.search-input:focus,
.search-input:hover,
.search-input:active {
  background-color: transparent !important;
  border-radius: 0 30px 30px 0;
}

/* 覆盖Edge浏览器的自动填充样式 */
.search-input:-webkit-autofill,
.search-input:-webkit-autofill:hover,
.search-input:-webkit-autofill:focus,
.search-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px transparent inset !important;
  -webkit-text-fill-color: var(--color-text-main) !important;
  background-color: transparent !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: var(--color-text-main);
}

/* 标签列表 */
.tags-list {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: var(--color-bg-card);
  border-radius: 15px;
  box-shadow: var(--shadow-medium);
  z-index: 100;
  margin-top: 10px; /* 添加上边距，与搜索框分开 */
}

.tag-item {
  padding: 8px 16px;
  background-color: var(--color-bg-hover);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-item:hover {
  background-color: var(--color-bg-active);
}

/* 显示模块 */
.display-module {
  width: 100%;
  max-width: 800px;
  overflow-y: auto;
}

.website-list {
  display: grid;
  gap: 20px;
  width: 100%;
}

/* 网格模式 */
.website-list.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* 已标记网站列表 - 更紧凑的布局 */
.website-list.grid.marked-list {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

/* 列表模式 */
.website-list.list {
  grid-template-columns: 1fr;
}

.website-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: var(--color-bg-card);
  border-radius: 15px;
  box-shadow: var(--shadow-light);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.website-item:hover .website-actions {
  opacity: 1;
}

.website-item.grid {
  flex-direction: column;
  text-align: center;
  min-height: 120px;
  height: 140px;
  justify-content: flex-start; /* 改为从顶部开始排列，为内容留出向下移动的空间 */
  padding: 15px 10px; /* 调整内边距，增加顶部空间 */
}

/* 已标记网站列表的 item 样式 - 更紧凑 */
.website-list.grid.marked-list .website-item {
  min-height: 90px;
  height: 100px;
  padding: 8px 6px;
}

.website-item.list {
  flex-direction: row;
  text-align: left;
  align-items: center;
}

.website-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 8px; /* 调整图标下方间距 */
  margin-top: 10px; /* 添加上边距，使图标稍微向下移动 */
}

/* 已标记网站列表的图标样式 - 更小 */
.website-list.grid.marked-list .website-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 6px;
  margin-top: 18px;
}

.website-item.list .website-icon {
  margin-bottom: 0;
  margin-right: 15px;
  margin-top: 0; /* list模式下不需要上边距 */
}

.website-info {
  flex: 1;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 8px; /* 调整内边距 */
  flex-grow: 1; /* 让website-info占据可用空间 */
}

.website-item.grid .website-info {
  padding: 0 8px;
  align-items: center;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  flex-grow: 1;
  margin-top: 5px; /* 添加上边距使整个信息块稍微向下移动 */
}

/* 已标记网站列表的信息样式 - 更紧凑 */
.website-list.grid.marked-list .website-info {
  padding: 0 4px;
  margin-top: auto;
  margin-bottom: 8px;
}

.website-name {
  font-size: 14px; /* 稍微减小字体 */
  font-weight: 500;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap; /* 确保不换行 */
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  color: inherit; /* 继承父元素的颜色 */
  text-decoration: none; /* 移除下划线 */
  display: block; /* 确保是块级元素 */
}

.website-item.grid .website-name {
  text-align: center;
  max-width: 100%;
  display: block;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap; /* 确保不换行 */
  width: 100%;
  min-width: 0;
  padding: 0 5px;
  flex-shrink: 1;
}

/* 已标记网站列表的网站名称样式 - 更小的字体 */
.website-list.grid.marked-list .website-name {
  font-size: 12px;
  padding: 0 2px;
}

.website-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  overflow-wrap: break-word;
  width: 100%;
}

.website-item.grid .website-description {
  display: none; /* 在grid模式下隐藏描述 */
}

.website-url {
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  text-decoration: none; /* 移除下划线 */
  display: block;
}

.website-item.grid .website-url {
  display: none; /* 在grid模式下隐藏URL */
}

.website-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.website-item.grid .website-tags {
  display: none; /* 在grid模式下隐藏标签 */
}

.website-tags .tag {
  display: inline-block;
  padding: 2px 8px;
  background-color: var(--color-bg-hover);
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.website-actions {
  display: flex;
  gap: 6px; /* 调整按钮间距 */
  opacity: 0;
  transition: opacity 0.2s ease;
  position: absolute;
  top: 8px; /* 调整位置 */
  right: 8px; /* 调整位置 */
  z-index: 1; /* 确保操作按钮在最上层 */
}

.website-item.grid .website-actions {
  position: static; /* 在grid模式下使用正常文档流 */
  opacity: 0; /* 默认隐藏，悬停时显示 */
  margin-top: 10px; /* 添加上方间距 */
  align-self: center; /* 垂直居中对齐 */
}

.website-item.list .website-actions {
  opacity: 1; /* 在list模式下始终显示 */
  position: static; /* 在list模式下使用正常定位 */
  margin-left: auto; /* 将动作按钮推到右侧 */
  align-self: center; /* 垂直居中对齐 */
}

.website-item:hover .website-actions {
  opacity: 1;
}

.action-icon-button {
  width: 32px;
  height: 32px;
  border: none;
  background-color: var(--color-bg-hover);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.action-icon-button:hover {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}

.action-icon-button.delete:hover {
  background-color: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-disabled);
}

.button-primary {
  margin-top: 20px;
  padding: 10px 24px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

/* 设置模块 */
.settings-module {
  position: fixed;
  top: 20px;
  right: 20px;
}

.settings-button {
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background-color: var(--color-bg-card);
  box-shadow: var(--shadow-light);
  cursor: pointer;
  font-size: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.settings-button:hover {
  transform: rotate(90deg);
  box-shadow: var(--shadow-medium);
}

</style>
