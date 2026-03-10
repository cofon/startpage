<script setup>
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import { useWebsiteStore } from './stores/website'
import { useSettingStore } from './stores/setting'
import { useSearchStore } from './stores/search'
import { useNotificationStore } from './stores/notification'
import db from './utils/indexedDB'
import { defaultWebsites } from './data/defaultWebsites'
import { normalizeWebsiteForDB } from './utils/websiteNormalizer'
import {
  handleWebsiteDeleted,
  handleWebsiteRestored,
  handleWebsiteMarkToggled,
} from './utils/displayModeManager'
import SearchModule from './components/SearchModule.vue'
import DisplayModule from './components/DisplayModule.vue'
import WebsiteDialog from './components/WebsiteDialog.vue'
import NotificationContainer from './components/NotificationContainer.vue'

// 初始化 stores
const websiteStore = useWebsiteStore()
const settingStore = useSettingStore()
const searchStore = useSearchStore()
const notificationStore = useNotificationStore()

// 网站对话框
const showWebsiteDialog = ref(false)
const editingWebsite = ref(null)

// DOM 引用
const appRef = ref(null)

// 响应式数据：容器宽度和每行 item 数量
const containerWidth = ref(800) // 默认值（max-width）
const itemsPerRow = ref(7) // 默认值

// 更新容器宽度和每行 item 数量
function updateLayoutMetrics() {
  if (appRef.value) {
    const width = appRef.value.offsetWidth
    containerWidth.value = width

    // 计算每行能容纳的 item 数量
    // 每个 item 最小宽度 100px + gap 10px = 110px
    const itemMinWidth = 100 + 10 // minmax(100px, 1fr) + gap
    itemsPerRow.value = Math.floor(width / itemMinWidth)
  }
}

// 监听窗口大小变化
let resizeObserver = null
onMounted(() => {
  // 初始计算
  updateLayoutMetrics()

  // 使用 ResizeObserver 监听容器大小变化
  if (appRef.value) {
    resizeObserver = new ResizeObserver(updateLayoutMetrics)
    resizeObserver.observe(appRef.value)
  }

  // 备用方案：监听窗口 resize 事件
  window.addEventListener('resize', updateLayoutMetrics)
})

onBeforeUnmount(() => {
  if (resizeObserver && appRef.value) {
    resizeObserver.unobserve(appRef.value)
  }
  window.removeEventListener('resize', updateLayoutMetrics)
})

// 计算顶部空白高度（动态调整）
const topPadding = computed(() => {
  // 基础顶部空白（非 marked 模式使用）
  const basePadding = 24

  // 只在显示 marked list 时根据行数动态调整
  if (searchStore.displayMode === 'marked') {
    const markedCount = searchStore.results?.length || 0

    // 根据实际每行 item 数量计算行数
    if (markedCount > 0 && itemsPerRow.value > 0) {
      const rows = Math.ceil(markedCount / itemsPerRow.value) + 1

      // 行数越多，顶部空白越小，每增加一行减少 50px
      // 1 行：300px, 2 行：250px, 3 行：200px, 4 行：150px...
      const paddingReduction = (rows - 1) * 60

      // 最小值为 150px（避免空白太小）
      return Math.max(24, 300 - paddingReduction)
    }

    // marked list 为空时，使用基础空白
    return 300
  }

  // 其他模式（搜索、普通列表等）统一使用固定值 20px
  return basePadding
})

// 文字选择相关状态
let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }
let hadSelectionOnMouseDown = false

// 检测是否在选择文字
function checkTextSelection(event) {
  const timeDiff = Date.now() - mouseDownTime
  const distanceDiff = Math.sqrt(
    Math.pow(event.clientX - mouseDownPosition.x, 2) +
      Math.pow(event.clientY - mouseDownPosition.y, 2),
  )
  return !hadSelectionOnMouseDown && (distanceDiff > 5 || timeDiff > 200)
}

// 记录鼠标按下事件
// function handleMouseDown(event) {
//   mouseDownTime = Date.now()
//   mouseDownPosition = { x: event.clientX, y: event.clientY }
//   const selection = window.getSelection()
//   hadSelectionOnMouseDown = selection.toString().trim().length > 0
// }

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
    // WebsiteDialog 已经调用了 updateWebsite，这里只需要更新数据库和刷新显示
    const websiteToUpdate = normalizeWebsiteForDB(websiteData)
    await db.updateWebsite(websiteToUpdate)

    // 如果当前显示模式是搜索，重新执行搜索
    if (searchStore.displayMode === 'search') {
      if (searchStore.query && searchStore.query.trim()) {
        searchStore.results = websiteStore.searchWebsites(searchStore.query)
      } else {
        searchStore.results = []
      }
    } else if (searchStore.displayMode === 'marked') {
      // 如果当前显示模式是已标记，刷新已标记列表
      searchStore.results = websiteStore.markedWebsites
    }
  } else {
    // WebsiteDialog 已经调用了 addWebsite，这里只需要更新数据库
    const newWebsite = websiteStore.websites[websiteStore.websites.length - 1]
    const websiteToAdd = normalizeWebsiteForDB(newWebsite)
    await db.addWebsite(websiteToAdd)
  }
}

// 删除网站（软删除）
async function deleteWebsite(website) {
  await websiteStore.deleteWebsite(website.id)
  const websiteToUpdate = normalizeWebsiteForDB({
    ...website,
    isActive: false,
    updatedAt: new Date(),
  })
  await db.updateWebsite(websiteToUpdate)
  handleWebsiteDeleted(searchStore, websiteStore, website.id)
  notificationStore.success(`已删除网站：${website.name}`)
}

// 恢复网站（将 isActive 设置为 true）
async function restoreWebsite(website) {
  websiteStore.updateWebsite(website.id, { isActive: true })
  const websiteToUpdate = normalizeWebsiteForDB({
    ...website,
    isActive: true,
    updatedAt: new Date(),
  })
  await db.updateWebsite(websiteToUpdate)
  handleWebsiteRestored(searchStore, websiteStore, website.id)
  notificationStore.success(`已恢复网站：${website.name}`)
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
    const maxOrder = Math.max(0, ...websiteStore.markedWebsites.map((w) => w.markOrder))
    const newOrder = maxOrder + 1
    await websiteStore.markWebsite(website.id, newOrder)
    newIsMarked = true
    newMarkOrder = newOrder
  }

  const websiteToUpdate = normalizeWebsiteForDB({
    ...website,
    isMarked: newIsMarked,
    markOrder: newMarkOrder,
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
  <div
    id="app"
    ref="appRef"
    :class="settingStore.selectedThemeId + '-theme'"
    :style="{ paddingTop: topPadding + 'px' }"
  >
    <!-- 通知容器 -->
    <NotificationContainer />

    <!-- 搜索模块 -->
    <SearchModule />

    <!-- 显示模块 -->
    <DisplayModule
      @website-click="handleWebsiteClick"
      @toggle-mark="toggleWebsiteMark"
      @edit="openEditWebsite"
      @delete="deleteWebsite"
      @restore="restoreWebsite"
      @add-website="openAddWebsite"
    />

    <!-- 网站管理对话框 -->
    <WebsiteDialog v-model="showWebsiteDialog" :website="editingWebsite" @save="saveWebsite" />
  </div>
</template>

<style scoped>
#app {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 20px;
  box-sizing: border-box; /* 确保 padding 包含在宽度内 */
  overflow-x: hidden; /* 防止水平溢出 */
  transition: padding-top 0.3s ease; /* 平滑过渡 */
}

/* 主题样式 */
.light-theme,
.dark-theme,
.auto-theme,
[class$='-theme'] {
  background: var(--color-bg-page);
  color: var(--color-text-main);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
