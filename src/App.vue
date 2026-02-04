<script setup>
import { onMounted, ref } from 'vue'
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

// 网站对话框
const showWebsiteDialog = ref(false)
const editingWebsite = ref(null)

// 设置面板
const showSettingsPanel = ref(false)

// 是否首次使用
const isFirstTime = ref(false)

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
      searchStore.results = websiteStore.searchWebsites(searchStore.query)
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
    // 重新计算搜索结果
    searchStore.results = websiteStore.searchWebsites(searchStore.query)
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

// 初始化应用
onMounted(async () => {
  try {
    // 初始化数据库
    await db.init()

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
            @focus="searchStore.setShowTagsList(true)"
            @blur="searchStore.setShowTagsList(false)"
            @keyup.enter="searchStore.executeSearch"
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
          v-for="website in searchStore.results"
          :key="website.id"
          class="website-item grid"
          @click="handleWebsiteClick(website)"
        >
          <WebsiteIcon 
            :website="website" 
 
          />
          <div class="website-info">
            <div class="website-name">{{ website.name }}</div>
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
            <div class="website-name">{{ website.name }}</div>
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
  margin-bottom: 40px;
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
}

.website-item.list {
  flex-direction: row;
  text-align: left;
}

.website-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 10px;
}

.website-item.list .website-icon {
  margin-bottom: 0;
  margin-right: 15px;
}

.website-info {
  flex: 1;
  overflow: hidden;
}

.website-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.website-description {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.website-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.website-item.list .website-actions {
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
