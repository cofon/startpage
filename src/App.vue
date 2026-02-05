<script setup>
import { onMounted, ref, computed } from 'vue'
import { useWebsiteStore } from './stores/website'
import { useSettingStore } from './stores/setting'
import { useSearchStore } from './stores/search'
import db from './utils/indexedDB'
import SearchEngineSelector from './components/SearchEngineSelector.vue'
import WebsiteDialog from './components/WebsiteDialog.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import WebsiteIcon from './components/WebsiteIcon.vue'
import { defaultWebsites } from './data/defaultWebsites'

// 初始化 stores
const websiteStore = useWebsiteStore()
const settingStore = useSettingStore()
const searchStore = useSearchStore()

// 计算属性：判断当前搜索引擎是否为本地搜索
const isLocalSearchEngine = computed(() => {
  return settingStore.selectedSearchEngine === 'local';
});

// 网站对话框
const showWebsiteDialog = ref(false)
const editingWebsite = ref(null)

// 设置面板
const showSettingsPanel = ref(false)

// 是否首次使用
const isFirstTime = ref(false)

// 拖拽排序相关状态
const draggedItem = ref(null)
const draggedIndex = ref(-1)

// 拖拽开始
function handleDragStart(website, index) {
  draggedItem.value = website
  draggedIndex.value = index
}

// 拖拽结束
function handleDragEnd() {
  draggedItem.value = null
  draggedIndex.value = -1
}

// 拖拽放置
async function handleDrop(targetIndex) {
  if (draggedIndex.value === -1 || draggedIndex.value === targetIndex) {
    return
  }

  // 获取当前标记网站列表
  const markedWebsites = [...websiteStore.markedWebsites]

  // 检查markedWebsites是否存在且为数组
  if (!markedWebsites || !Array.isArray(markedWebsites)) {
    console.error('markedWebsites is not an array', markedWebsites)
    return
  }

  // 获取当前标记网站的ID列表
  const currentOrder = markedWebsites.map(w => w.id)

  // 创建新的顺序
  const newOrder = [...currentOrder]
  const [movedItem] = newOrder.splice(draggedIndex.value, 1)
  newOrder.splice(targetIndex, 0, movedItem)

  // 更新store中的顺序
  websiteStore.reorderMarkedWebsites(newOrder)

  // 更新searchStore.results
  // 直接替换整个ref对象，确保UI立即更新
  searchStore.results = websiteStore.markedWebsites

  // 更新数据库中的顺序
  for (let i = 0; i < newOrder.length; i++) {
    const website = websiteStore.websites.find(w => w.id === newOrder[i])
    if (website) {
      await db.updateWebsite({
        id: website.id,
        name: website.name,
        url: website.url,
        description: website.description || '',
        tags: Array.isArray(website.tags) ? [...website.tags] : [],
        visitCount: website.visitCount || 0,
        isMarked: website.isMarked,
        markOrder: i + 1,
        isActive: website.isActive !== undefined ? website.isActive : true,
        isHidden: website.isHidden !== undefined ? website.isHidden : false,
        iconData: website.iconData,
        iconGenerateData: website.iconGenerateData,
        iconCanFetch: website.iconCanFetch,
        iconFetchAttempts: website.iconFetchAttempts,
        iconUrl: website.iconUrl
      })
    }
  }
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
    // 创建一个普通对象副本传递给数据库
    const websiteToUpdate = {
      id: editingWebsite.value.id,
      name: websiteData.name,
      url: websiteData.url,
      description: websiteData.description || '',
      tags: Array.isArray(websiteData.tags) ? [...websiteData.tags] : [], // 确保tags是普通数组
      visitCount: websiteData.visitCount || 0,
      isMarked: websiteData.isMarked,
      markOrder: websiteData.markOrder || 0,
      isActive: websiteData.isActive !== undefined ? websiteData.isActive : true,
      isHidden: websiteData.isHidden !== undefined ? websiteData.isHidden : false,
      iconData: websiteData.iconData,
      iconGenerateData: websiteData.iconGenerateData,
      iconCanFetch: websiteData.iconCanFetch,
      iconFetchAttempts: websiteData.iconFetchAttempts,
      iconUrl: websiteData.iconUrl
    };
    await db.updateWebsite(websiteToUpdate)
  } else {
    // 添加新网站
    await websiteStore.addWebsite(websiteData)
    const newWebsite = websiteStore.websites[websiteStore.websites.length - 1]
    // 创建一个普通对象副本传递给数据库
    const websiteToAdd = {
      id: newWebsite.id,
      name: newWebsite.name,
      url: newWebsite.url,
      description: newWebsite.description || '',
      tags: Array.isArray(newWebsite.tags) ? [...newWebsite.tags] : [], // 确保tags是普通数组
      visitCount: newWebsite.visitCount || 0,
      isMarked: newWebsite.isMarked,
      markOrder: newWebsite.markOrder || 0,
      isActive: newWebsite.isActive !== undefined ? newWebsite.isActive : true,
      isHidden: newWebsite.isHidden !== undefined ? newWebsite.isHidden : false,
      iconData: newWebsite.iconData,
      iconGenerateData: newWebsite.iconGenerateData,
      iconCanFetch: newWebsite.iconCanFetch,
      iconFetchAttempts: newWebsite.iconFetchAttempts,
      iconUrl: newWebsite.iconUrl
    };
    await db.addWebsite(websiteToAdd)
  }
}

// 删除网站（软删除）
async function deleteWebsite(website) {
  if (confirm(`确定要删除 "${website.name}" 吗？`)) {
    // 更新store中的状态
    await websiteStore.deleteWebsite(website.id)

    // 创建一个普通对象副本传递给数据库，避免传递响应式对象
    const websiteToUpdate = {
      id: website.id,
      name: website.name,
      url: website.url,
      description: website.description || '',
      tags: Array.isArray(website.tags) ? [...website.tags] : [], // 确保tags是普通数组
      visitCount: website.visitCount || 0,
      isMarked: website.isMarked,
      markOrder: website.markOrder,
      isActive: false, // 设置为false，表示已删除
      isHidden: website.isHidden !== undefined ? website.isHidden : false,
      iconData: website.iconData,
      iconGenerateData: website.iconGenerateData,
      iconCanFetch: website.iconCanFetch,
      iconFetchAttempts: website.iconFetchAttempts,
      iconUrl: website.iconUrl,
      updatedAt: new Date()
    };
    await db.updateWebsite(websiteToUpdate)

    // 根据当前显示模式刷新UI
    if (searchStore.displayMode === 'marked') {
      // 如果当前显示的是标记网站列表，更新为标记网站列表
      searchStore.results = websiteStore.markedWebsites
    } else if (searchStore.displayMode === 'search') {
      // 如果当前显示的是搜索结果，更新为搜索结果
      searchStore.results = websiteStore.searchWebsites(searchStore.query.value)
    }
  }
}

// 切换网站标记状态
async function toggleWebsiteMark(website) {
  let newIsMarked;
  let newMarkOrder;

  if (website.isMarked) {
    // 取消标记
    await websiteStore.unmarkWebsite(website.id)
    newIsMarked = false;
    newMarkOrder = 0; // 取消标记后，markOrder设为0
  } else {
    // 计算新的标记顺序
    const maxOrder = Math.max(0, ...websiteStore.markedWebsites.map(w => w.markOrder))
    const newOrder = maxOrder + 1;
    // 标记网站并设置新顺序
    await websiteStore.markWebsite(website.id, newOrder)
    newIsMarked = true;
    newMarkOrder = newOrder;
  }

  // 创建一个普通对象副本传递给数据库，避免传递响应式对象
  const websiteToUpdate = {
    id: website.id,
    name: website.name,
    url: website.url,
    description: website.description || '',
    tags: Array.isArray(website.tags) ? [...website.tags] : [], // 确保tags是普通数组
    visitCount: website.visitCount || 0,
    isMarked: newIsMarked, // 新的标记状态
    markOrder: newMarkOrder, // 新的标记顺序
    isActive: website.isActive !== undefined ? website.isActive : true,
    isHidden: website.isHidden !== undefined ? website.isHidden : false,
    iconData: website.iconData,
    iconGenerateData: website.iconGenerateData,
    iconCanFetch: website.iconCanFetch,
    iconFetchAttempts: website.iconFetchAttempts,
    iconUrl: website.iconUrl
  };
  await db.updateWebsite(websiteToUpdate)


  // 如果当前显示的是标记网站列表或搜索结果，需要更新列表显示
  if (searchStore.displayMode === 'marked') {
    // 重新计算标记网站列表
    searchStore.results = websiteStore.markedWebsites
  } else if (searchStore.displayMode === 'search') {
    // 重新计算搜索结果，只有在有搜索关键词时才更新
    if (searchStore.query.value && searchStore.query.value.trim()) {
      searchStore.results = websiteStore.searchWebsites(searchStore.query.value)
    }
  }
}

// 点击网站
function handleWebsiteClick(website) {
  websiteStore.incrementVisitCount(website.id)
  // 创建一个普通对象副本传递给数据库，避免传递响应式对象
  const websiteToUpdate = {
    id: website.id,
    name: website.name,
    url: website.url,
    description: website.description || '',
    tags: Array.isArray(website.tags) ? [...website.tags] : [], // 确保tags是普通数组
    visitCount: website.visitCount || 0,
    isMarked: website.isMarked,
    markOrder: website.markOrder,
    isActive: website.isActive !== undefined ? website.isActive : true,
    isHidden: website.isHidden !== undefined ? website.isHidden : false,
    iconData: website.iconData,
    iconGenerateData: website.iconGenerateData,
    iconCanFetch: website.iconCanFetch,
    iconFetchAttempts: website.iconFetchAttempts,
    iconUrl: website.iconUrl
  };
  db.updateWebsite(websiteToUpdate)
  window.open(website.url, '_blank')
}

// 处理输入框获得焦点
function handleInputFocus() {
  // 如果当前搜索引擎是本地搜索且输入框为空，则显示标签列表
  if (isLocalSearchEngine.value && !searchStore.query.value) {
    searchStore.setShowTagsList(true);
  }
}

// 处理输入框失去焦点
function handleInputBlur() {
  // 失去焦点时总是隐藏标签列表
  searchStore.setShowTagsList(false);
}

// 处理输入框内容变化
function handleInput() {
  // 如果当前搜索引擎是本地搜索
  if (isLocalSearchEngine.value) {
    // 如果输入框为空，则显示标签列表
    if (!searchStore.query.value) {
      searchStore.setShowTagsList(true);
    } else {
      // 如果输入框不为空，则隐藏标签列表
      searchStore.setShowTagsList(false);
    }
  }
}

// 处理ESC按键，隐藏tags列表
function handleEscKey() {
  if (searchStore.showTagsList) {
    searchStore.setShowTagsList(false);
  }
}

// 初始化应用
onMounted(async () => {
  try {
    // 初始化数据库
    await db.init()

    // 监听键盘ESC按键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handleEscKey();
      }
    });

    // 加载设置
    const settings = await db.getSettings()
    if (settings) {
      settingStore.selectedTheme = settings.selectedTheme || 'light'
      settingStore.selectedSearchEngine = settings.selectedSearchEngine || 'baidu'
      settingStore.searchResultLayout = settings.searchResultLayout || 'grid'
      // 合并搜索引擎列表，确保包含默认搜索引擎
      if (settings.searchEngineList) {
        const defaultEngines = {
          baidu: {
            name: '百度',
            url: 'https://www.baidu.com/s?wd={query}',
            icon: '/icons/search-engines/baidu.svg'
          },
          bing: {
            name: '必应',
            url: 'https://www.bing.com/search?q={query}',
            icon: '/icons/search-engines/bing.svg'
          },
          yandex: {
            name: 'Yandex',
            url: 'https://yandex.com/search/?text={query}',
            icon: '/icons/search-engines/yandex.svg'
          },
          local: {
            name: '本地',
            url: '',
            icon: '/icons/search-engines/local.svg'
          }
        }
        settingStore.searchEngineList = { ...defaultEngines, ...settings.searchEngineList }
      }
      if (settings.lastBackupTime) {
        settingStore.lastBackupTime = settings.lastBackupTime
      }
    }

    // 应用主题
    settingStore.init()

    // 加载网站数据
    const websites = await db.getAllWebsites()
    if (websites.length > 0) {
      // 迁移网站数据，添加缺失的字段
      const migratedCount = await db.migrateWebsites()
      if (migratedCount > 0) {
        console.log(`已迁移 ${migratedCount} 个网站数据`)
        // 重新加载网站数据
        const updatedWebsites = await db.getAllWebsites()
        websiteStore.setWebsites(updatedWebsites)
      } else {
        websiteStore.setWebsites(websites)
      }
    } else {
      // 首次使用，加载默认网站
      isFirstTime.value = true
      websiteStore.setWebsites(defaultWebsites)
      // 保存默认网站到数据库
      for (const website of defaultWebsites) {
        await db.addWebsite(website)
      }
    }

    // 加载所有搜索引擎图标
    await searchStore.loadEngineIcons()

    // 初始化搜索结果
    searchStore.init()

  } catch (error) {
    console.error('初始化应用失败:', error)
  }
})
</script>

<template>
  <div id="app" :class="settingStore.selectedTheme + '-theme'">
    <!-- 搜索模块 -->
    <div class="search-module">
      <div class="search-container">
        <!-- 搜索框组件将在这里实现 -->
        <div class="search-box">
          <SearchEngineSelector />
          <input
            v-model="searchStore.query"
            type="text"
            class="search-input"
            placeholder="搜索..."
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            @keyup.enter="searchStore.executeSearch"
            @keyup.esc="handleEscKey"
            @input="handleInput"
          >
        </div>

        <!-- 标签列表 -->
        <div v-if="searchStore.showTagsList && searchStore.currentTags.length > 0" class="tags-list">
          <div
            v-for="tag in searchStore.currentTags"
            :key="tag"
            class="tag-item"
            @mousedown="searchStore.searchByTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </div>

    <!-- 显示模块 -->
    <div class="display-module">
      <!-- 已标记网站列表 -->
      <div v-if="searchStore.displayMode === 'marked'" class="website-list grid">
        <div
          v-for="(website, index) in searchStore.results"
          :key="website.id"
          class="website-item grid"
          :class="{ 'dragging': draggedIndex === index }"
          draggable="true"
          @click="handleWebsiteClick(website)"
          @dragstart="handleDragStart(website, index)"
          @dragend="handleDragEnd"
          @dragover.prevent
          @drop="handleDrop(index)"
        >
          <WebsiteIcon
            :website="website"

          />
          <div class="website-info">
            <div class="website-name" :title="website.name">{{ website.name }}</div>
          </div>
          <div class="website-actions">
            <button class="action-icon-button" @click.stop="toggleWebsiteMark(website)">
              {{ website.isMarked ? '★' : '☆' }}
            </button>
            <button class="action-icon-button" @click.stop="openEditWebsite(website)">
              ✎
            </button>
            <button class="action-icon-button delete" @click.stop="deleteWebsite(website)">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-else-if="searchStore.displayMode === 'search'" class="website-list" :class="settingStore.searchResultLayout">
        <div
          v-for="website in searchStore.results"
          :key="website.id"
          class="website-item"
          :class="settingStore.searchResultLayout"
          @click="handleWebsiteClick(website)"
        >
          <WebsiteIcon
            :website="website"

          />
          <div class="website-info">
            <div class="website-name" :title="website.name">{{ website.name }}</div>
            <div class="website-description">{{ website.description }}</div>
            <div v-if="website.tags && website.tags.length > 0" class="website-tags">
              <span v-for="tag in website.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
          <div class="website-actions">
            <button class="action-icon-button" @click.stop="toggleWebsiteMark(website)">
              {{ website.isMarked ? '★' : '☆' }}
            </button>
            <button class="action-icon-button" @click.stop="openEditWebsite(website)">
              ✎
            </button>
            <button class="action-icon-button delete" @click.stop="deleteWebsite(website)">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="searchStore.displayMode === 'empty'" class="empty-state">
        <p>暂无内容</p>
        <button class="button-primary" @click="openAddWebsite">添加第一个网站</button>
      </div>

      <!-- 历史记录 (预留) -->
      <div v-else-if="searchStore.displayMode === 'history'" class="website-list grid">
        <div class="empty-state">
          <p>历史记录功能开发中...</p>
        </div>
      </div>

      <!-- 收藏夹 (预留) -->
      <div v-else-if="searchStore.displayMode === 'favorites'" class="website-list grid">
        <div class="empty-state">
          <p>收藏夹功能开发中...</p>
        </div>
      </div>
    </div>

    <!-- 网站管理对话框 -->
    <WebsiteDialog
      v-model="showWebsiteDialog"
      :website="editingWebsite"
      @save="saveWebsite"
    />

    <!-- 设置模块 -->
    <div class="settings-module">
      <button class="settings-button" @click="showSettingsPanel = true">⚙️</button>
    </div>

    <!-- 设置面板 -->
    <SettingsPanel
      v-model="showSettingsPanel"
      @open-add-website="openAddWebsite"
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
.light-theme {
  background: #f5f5f5;
  color: #333;
}

.dark-theme {
  background: #1a1a1a;
  color: #eee;
}

.auto-theme {
  background: var(--system-bg, #f5f5f5);
  color: var(--system-text, #333);
}

/* 搜索模块 */
.search-module {
  width: 100%;
  max-width: 800px;
  margin-bottom: 60px; /* 增加下方间距 */
  margin-top: 40px; /* 添加上方间距 */
}

.search-container {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: white;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  position: relative;
}

.search-box:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
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
  color: #333;
  background-color: transparent;
  transition: flex 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-input::placeholder {
  color: #aaa;
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
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.tag-item {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-item:hover {
  background-color: #e0e0e0;
}

/* 显示模块 */
.display-module {
  width: 100%;
  max-width: 1200px;
  flex: 1;
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

/* 列表模式 */
.website-list.list {
  grid-template-columns: 1fr;
}

.website-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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

.website-name {
  font-size: 14px; /* 稍微减小字体 */
  font-weight: 500;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: clip;
  white-space: nowrap; /* 确保不换行 */
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  pointer-events: none; /* 阻止显示title提示 */
  cursor: default; /* 设置默认光标 */
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
  pointer-events: none; /* 阻止显示title提示 */
  cursor: default; /* 设置默认光标 */
}

.website-description {
  font-size: 14px;
  color: #666;
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
  background-color: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
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
  background-color: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.2s ease;
}

.action-icon-button:hover {
  background-color: #e8e8e8;
  color: #333;
}

.action-icon-button.delete:hover {
  background-color: #fff1f0;
  color: #ff4d4f;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.button-primary {
  margin-top: 20px;
  padding: 10px 24px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-primary:hover {
  background-color: #40a9ff;
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
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.settings-button:hover {
  transform: rotate(90deg);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

</style>
