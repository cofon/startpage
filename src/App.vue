<script setup>
import { onMounted, ref, computed } from 'vue'
import { useWebsiteStore } from './stores/website'
import { useSettingStore } from './stores/setting'
import { useSearchStore } from './stores/search'
import { useNotificationStore } from './stores/notification'
import db from './utils/database'
import { defaultWebsites } from './data/defaultWebsites'
import { normalizeWebsiteForDB } from './utils/website/websiteUtils'
import {
  handleWebsiteDeleted,
  handleWebsiteRestored,
  handleWebsiteMarkToggled,
} from './utils/ui/displayModeManager'
import { isExtensionInstalled, sendMessageToExtension } from './services/websiteMetadataService'
import { extractSiteNameFromUrl } from './utils/website/websiteUtils'
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

// 计算顶部空白高度
const topPadding = computed(() => {
  // 基础顶部空白
  const basePadding = 0

  // 只在显示 marked list 时根据行数动态调整
  if (searchStore.displayMode === 'marked') {
    const markedCount = searchStore.results?.length || 0

    // marked list 为空时，使用较大空白使搜索模块居中偏上
    if (markedCount === 0) {
      return 300
    }
    if (markedCount <= 7) {
      return 270
    }
    if (markedCount <= 14) {
      return 250
    }
    if (markedCount <= 21) {
      return 180
    }
    if (markedCount <= 28) {
      return 134
    }
    if (markedCount <= 35) {
      return 64
    }
  }

  // 其他模式（搜索、普通列表等）统一使用固定值 24px
  return basePadding
})

// 根据 displayMode 返回对应的页面类名
function getPageClass() {
  const mode = searchStore.displayMode

  if (mode === 'marked') return 'marked-mode'
  if (mode === 'search') return 'search-mode'
  if (mode === 'settings' || mode === 'help') return 'panel-mode'

  return ''
}

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

// 处理来自扩展的消息
function handleExtensionMessage(event) {
  const { type, payload, requestId } = event.detail;
  console.log('[App] 收到扩展消息:', type, payload);

  // 只处理来自扩展的消息，忽略来自起始页内部的消息
  if (type === 'EXTENSION_SUBMIT_WEBSITE_META') {
    // 处理扩展提交的网站元数据
    handleExtensionSubmitWebsiteMeta(payload, requestId);
  }
}

// 处理扩展提交网站元数据
async function handleExtensionSubmitWebsiteMeta(meta, requestId) {
  try {
    // 检查 URL 是否已存在
    const existingWebsite = websiteStore.websites.find(w => w.url === meta.url);
    if (!existingWebsite) {
      // 创建新网站，使用从扩展传递过来的字段
      const siteName = meta.name || extractSiteNameFromUrl(meta.url);
      const newWebsite = {
        name: siteName,
        title: meta.title || siteName,
        url: meta.url,
        description: meta.description || '',
        tags: meta.tags && Array.isArray(meta.tags) && meta.tags.length > 0 ? meta.tags : ['new'],
        isMarked: meta.isMarked || false,
        isActive: meta.isActive !== undefined ? meta.isActive : true,
        isHidden: meta.isHidden || false,
        iconData: meta.iconData || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        visitCount: 0,
        lastVisited: null
      };

      // 添加到 store（已包含数据库保存逻辑和 SVG 生成）
      await websiteStore.addWebsite(newWebsite);

      console.log('[App] 已添加从扩展提交的网站:', siteName);
      notificationStore.success(`已从扩展添加网站：${siteName}`);

      // 发送响应
      const responseEvent = new CustomEvent('StartPageAPI-Response', {
        detail: {
          success: true,
          message: '网站添加成功',
          requestId
        }
      });
      window.dispatchEvent(responseEvent);
    } else {
      console.log('[App] 网站已存在:', meta.url);

      // 发送响应
      const responseEvent = new CustomEvent('StartPageAPI-Response', {
        detail: {
          success: false,
          error: '网站已存在',
          requestId
        }
      });
      window.dispatchEvent(responseEvent);
    }
  } catch (error) {
    console.error('[App] 处理扩展提交网站元数据失败:', error);

    // 发送响应
    const responseEvent = new CustomEvent('StartPageAPI-Response', {
      detail: {
        success: false,
        error: error.message,
        requestId
      }
    });
    window.dispatchEvent(responseEvent);
  }
}

// 初始化应用
onMounted(async () => {
  try {
    // 注册扩展消息监听器
    window.addEventListener('StartPageAPI-Call', handleExtensionMessage);

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

    // ========== 4. 从扩展获取未同步的元数据 ==========
    try {
      console.log('[App] 尝试从扩展获取未同步的元数据');
      const response = await sendMessageToExtension('START_PAGE_REQUEST_UNSYNCED_METAS');
      if (response.success && response.data && response.data.length > 0) {
        console.log('[App] 从扩展获取到未同步的元数据:', response.data.length, '条');
        const syncedWebsiteIds = [];
        for (const meta of response.data) {
          // 检查 URL 是否已存在
          const existingWebsite = websiteStore.websites.find(w => w.url === meta.url);
          if (!existingWebsite) {
            // 创建新网站
            const siteName = extractSiteNameFromUrl(meta.url);
            const newWebsite = {
              name: siteName,
              title: meta.title || siteName,
              url: meta.url,
              description: meta.description || '',
              tags: ['new'],
              isMarked: false,
              isActive: true,
              isHidden: false,
              iconData: meta.iconData || '',
              iconGenerateData: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              visitCount: 0,
              lastVisited: null
            };

            // 添加到 store（已包含数据库保存逻辑）
            await websiteStore.addWebsite(newWebsite);

            console.log('[App] 已添加从扩展同步的网站:', siteName);
            notificationStore.success(`已从扩展同步网站：${siteName}`);
          } else {
            console.log('[App] 网站已存在，跳过添加:', meta.url);
          }
          
          // 无论网站是否已存在，都记录为已同步
          // 这样扩展会删除本地存储中的对应数据
          syncedWebsiteIds.push(meta.url);
        }

        // 通知扩展数据已同步
        if (syncedWebsiteIds.length > 0) {
          console.log('[App] 通知扩展数据已同步:', syncedWebsiteIds.length, '条');
          await sendMessageToExtension('START_PAGE_SYNC_COMPLETE', {
            syncedWebsiteIds: syncedWebsiteIds
          });
        }
      }
    } catch (error) {
      console.error('[App] 从扩展获取未同步元数据失败:', error);
    }

    // ========== 5. 加载搜索引擎图标 ==========
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
    :class="[settingStore.selectedThemeId + '-theme', getPageClass()]"
    :style="{ paddingTop: topPadding + 'px' }"
  >
    <!-- 通知容器 -->
    <NotificationContainer />

    <!-- 搜索模块粘性包装器 -->
    <div class="search-sticky-wrapper">
      <SearchModule />
    </div>

    <!-- 非 marked 模式下的占位空白 -->
    <div class="search-spacer"></div>

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
  min-height: calc(100vh - 40px); /* 确保内容少时也占满视口（减去上下 padding） */
}

/* 非 marked 模式：页面可滚动，搜索模块固定 */
#app:not(.marked-mode) {
  height: auto;
  overflow-y: visible; /* 允许页面级滚动 */
  padding-top: 0 !important; /* 移除非 marked 模式的顶部 padding，避免内容滚动到搜索模块上方 */
}

/* 搜索模块粘性布局 - 非 marked 模式时固定顶部 */
#app:not(.marked-mode) .search-sticky-wrapper {
  position: fixed; /* 使用 fixed 代替 sticky，确保始终固定在视口顶部 */
  top: 0px; /* 与 marked 模式的基础 padding 保持一致 */
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  background: var(--color-bg-page);
}

/* 非 marked 模式下的占位空白 - 填补固定搜索模块的高度和顶部空白 */
#app:not(.marked-mode) .search-spacer {
  height: calc(
    24px + 60px + 24px
  ); /* 顶部空白 24px + SearchModule 高度 60px + padding-bottom 24px */
  width: 100%;
  flex-shrink: 0;
}

/* marked list 模式：整体可滚动，搜索模块不固定 */
#app.marked-mode {
  overflow-y: auto; /* 容器自身可滚动 */
  max-height: calc(100vh - 40px);
}

#app.marked-mode .search-sticky-wrapper {
  position: static; /* 恢复普通流 */
  width: 100%; /* 确保占满父容器 */
  display: flex;
  justify-content: center; /* 居中对齐 */
}

#app.marked-mode .search-spacer {
  display: none; /* marked 模式下隐藏占位 */
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

<style>
/* 隐藏 EdgeOne 插入的元素 */
#immersive-translate-browser-popup,
#edgeone-watermark {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
}
</style>


