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
    // ========== 1. 初始化 IndexedDB（基础依赖） ==========
  await db.init()
    
    // ========== 2. 初始化设置（包括主题和搜索引擎，需要从数据库读取） ==========
  await settingStore.init()
    
    // ========== 3. 加载网站数据 ==========
  const websites = await db.getAllWebsites()
    websiteStore.setWebsites(websites)

    // 如果没有数据，加载默认网站
  if (websites.length === 0) {
    const websitesWithIds = []
      for (const website of defaultWebsites) {
      const id = await db.addWebsite(website)
        websitesWithIds.push({ ...website, id })
      }
      websiteStore.setWebsites(websitesWithIds)
    }

    // ========== 4. 加载搜索引擎图标 ==========
  await searchStore.loadEngineIcons()
    searchStore.init()
    
    // ========== 暴露全局 API 给插件调用 ==========
    window.StartPageAPI = {
      /**
       * 添加单个网站
       * @param {Object} data - 网站数据对象
       * @returns {Promise<number>} - 返回新网站的 ID
       */
      addWebsite: async (data) => {
      console.log('[StartPageAPI] 添加网站:', data)
        
        // 规范化数据（处理默认值等）
      const normalizedData = normalizeWebsiteForDB(data)
        
        // 保存到数据库
      const id = await db.addWebsite(normalizedData)
        
        // 更新 store
      const newWebsite = { ...normalizedData, id }
        websiteStore.addWebsite(newWebsite)
        
      console.log('[StartPageAPI] 添加成功，ID:', id)
        return id
      },
      
      /**
       * 批量导入网站
       * @param {Array} websites - 网站数组
       * @returns {Promise<Object>} - 返回导入结果统计
       */
      importWebsites: async (websites) => {
      console.log('[StartPageAPI] 批量导入网站，数量:', websites.length)
        
        let successCount = 0
        let errorCount = 0
      const errors = []
        
        for (let i = 0; i < websites.length; i++) {
         try {
          const website = websites[i]
          const normalizedData = normalizeWebsiteForDB(website)
            
          const id= await db.addWebsite(normalizedData)
          const newWebsite = { ...normalizedData, id }
            websiteStore.addWebsite(newWebsite)
            
            successCount++
          } catch (error) {
         console.error(`[StartPageAPI] 导入第 ${i + 1} 个网站失败:`, error)
            errorCount++
            errors.push({
              index: i,
              url: websites[i]?.url || 'unknown',
              error: error.message
            })
          }
        }
        
      console.log(`[StartPageAPI] 导入完成：成功 ${successCount}, 失败 ${errorCount}`)
        
        return {
          total: websites.length,
          success: successCount,
          failed: errorCount,
          errors
        }
      },
      
      /**
       * 获取所有网站
       * @returns {Promise<Array>} - 返回网站数组
       */
      getWebsites: async () => {
        return await db.getAllWebsites()
      },
      
      /**
       * 更新网站
       * @param {number} id - 网站 ID
       * @param {Object} data - 更新的数据
       * @returns {Promise<void>}
       */
      updateWebsite: async (id, data) => {
      console.log('[StartPageAPI] 更新网站:', id, data)
        await db.updateWebsite(id, data)
        
        // 更新 store
        websiteStore.updateWebsite(id, data)
      }
    }
    
    // ========== 监听来自 Content Script 的 CustomEvent ==========
    document.addEventListener('StartPageAPI-Call', async (event) => {
    console.log('[App.vue] 收到 StartPageAPI-Call 事件:', event.detail)
      
    const { action, data, requestId } = event.detail
      
    try {
       let result
       
      if (action === 'addWebsite') {
         result = await window.StartPageAPI.addWebsite(data)
       } else if (action === 'importWebsites') {
         result = await window.StartPageAPI.importWebsites(data)
       } else if (action === 'getWebsites') {
         result = await window.StartPageAPI.getWebsites()
       } else if (action === 'updateWebsite') {
         result = await window.StartPageAPI.updateWebsite(data.id, data)
       } else {
         throw new Error('未知操作：' + action)
       }
       
       // 发送响应事件
     const responseEvent = new CustomEvent('StartPageAPI-Response', {
         detail: {
           requestId,
           success: true,
           result
         }
       })
       document.dispatchEvent(responseEvent)
     console.log('[App.vue] 已发送响应事件')
     } catch (error) {
     console.error('[App.vue] 处理请求失败:', error)
       
       // 发送错误响应
     const responseEvent = new CustomEvent('StartPageAPI-Response', {
         detail: {
           requestId,
           success: false,
           error: error.message || '操作失败'
         }
       })
       document.dispatchEvent(responseEvent)
     }
    })
    
  console.log('[StartPageAPI] 全局 API 已就绪，CustomEvent 监听器已添加')
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
