<script setup>
import { computed, ref } from 'vue'
import { useSearchStore } from '../stores/search'
import { useSettingStore } from '../stores/setting'
import { useNotificationStore } from '../stores/notification'
import db from '../utils/indexedDB'
import ThemeSettings from './ThemeSettings.vue'
import SearchSettings from './SearchSettings.vue'
import LayoutSwitch from './LayoutSwitch.vue'
import AddWebsitePanel from './AddWebsitePanel.vue'

const searchStore = useSearchStore()
const settingStore = useSettingStore()
const notificationStore = useNotificationStore()

// 当前显示的面板
const activePanel = computed(() => searchStore.commandMode)

// 关闭面板
function closePanel() {
  searchStore.clearCommandMode()
}

// 导入/导出
const importFile = ref(null)

// 导出数据
async function handleExport() {
  try {
    const data = await db.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 生成日期时间字符串，格式为：YYYYMMDDHHmmss
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}`
    a.download = `startpage-backup-${dateTimeStr}.json`

    a.click()
    URL.revokeObjectURL(url)
    settingStore.updateLastBackupTime()
    await settingStore.saveSettings()
    notificationStore.success('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    notificationStore.error('导出失败，请查看控制台获取详细信息')
  }
}

// 导入数据
async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        await db.importData(data)
        notificationStore.success('导入成功！页面即将刷新...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error('解析导入文件失败:', error)
        notificationStore.error('导入文件格式错误')
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('导入失败:', error)
    notificationStore.error('导入失败，请查看控制台获取详细信息')
  }

  // 清空文件输入
  event.target.value = ''
}

// 触发导入
function triggerImport() {
  importFile.value?.click()
}
</script>

<template>
  <div class="command-settings">
    <div class="panel-header">
      <div class="header-left">
        <button
          class="header-button"
          :class="{ active: activePanel === 'theme' }"
          @click="searchStore.handleCommand('--theme')"
          title="主题"
        >
          <span class="icon">🎨</span>
        </button>
        <button
          class="header-button"
          :class="{ active: activePanel === 'search' }"
          @click="searchStore.handleCommand('--search')"
          title="搜索"
        >
          <span class="icon">🔍</span>
        </button>
        <button
          class="header-button"
          :class="{ active: activePanel === 'add' }"
          @click="searchStore.handleCommand('--add')"
          title="添加网站"
        >
          <span class="icon">➕</span>
        </button>
        <button
          class="header-button"
          :class="{ active: activePanel === 'import' }"
          @click="searchStore.handleCommand('--import')"
          title="导入"
        >
          <span class="icon">📥</span>
        </button>
        <button
          class="header-button"
          :class="{ active: activePanel === 'export' }"
          @click="searchStore.handleCommand('--export')"
          title="导出"
        >
          <span class="icon">📤</span>
        </button>
        <button
          class="header-button"
          :class="{ active: activePanel === 'layout' }"
          @click="searchStore.handleCommand('--layout')"
          title="布局"
        >
          <span class="icon">📐</span>
        </button>
      </div>
      <button class="close-button" @click="closePanel" title="关闭">✕</button>
    </div>

    <div class="panel-content">
      <!-- 主题设置面板 -->
      <div v-if="activePanel === 'theme'" class="panel-section">
        <ThemeSettings />
      </div>

      <!-- 搜索设置面板 -->
      <div v-else-if="activePanel === 'search'" class="panel-section">
        <SearchSettings />
      </div>

      <!-- 添加网站面板 -->
      <div v-else-if="activePanel === 'add'" class="panel-section">
        <AddWebsitePanel />
      </div>

      <!-- 导入面板 -->
      <div v-else-if="activePanel === 'import'" class="panel-section">
        <div class="import-export-panel">
          <h3>导入数据</h3>
          <p class="description">从备份文件中导入网站和设置数据。</p>
          <button class="action-button" @click="triggerImport">
            <span class="icon">📥</span>
            选择文件导入
          </button>
          <input
            ref="importFile"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleImport"
          >
        </div>
      </div>

      <!-- 导出面板 -->
      <div v-else-if="activePanel === 'export'" class="panel-section">
        <div class="import-export-panel">
          <h3>导出数据</h3>
          <p class="description">导出所有网站和设置数据到备份文件。</p>
          <button class="action-button" @click="handleExport">
            <span class="icon">📤</span>
            导出数据
          </button>
          <p v-if="settingStore.lastBackupTime" class="last-backup">
            上次备份：{{ new Date(settingStore.lastBackupTime).toLocaleString() }}
          </p>
        </div>
      </div>

      <!-- 布局切换面板 -->
      <div v-else-if="activePanel === 'layout'" class="panel-section">
        <div class="layout-panel">
          <h3>搜索结果布局</h3>
          <div class="layout-options">
            <button
              class="layout-option"
              :class="{ active: settingStore.searchResultLayout === 'grid' }"
              @click="settingStore.searchResultLayout = 'grid'"
            >
              <span class="icon">⊞</span>
              <span class="label">网格布局</span>
            </button>
            <button
              class="layout-option"
              :class="{ active: settingStore.searchResultLayout === 'list' }"
              @click="settingStore.searchResultLayout = 'list'"
            >
              <span class="icon">☰</span>
              <span class="label">列表布局</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.command-settings {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--color-bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-medium);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-base);
}

.header-left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.header-button {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid transparent;
  background-color: var(--color-bg-hover);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.header-button:hover {
  background-color: var(--color-bg-active);
}

.header-button.active {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

.header-button .icon {
  font-size: 24px;
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background-color: var(--color-bg-hover);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.panel-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 导入导出面板样式 */
.import-export-panel {
  text-align: center;
  padding: 20px;
}

.import-export-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.import-export-panel .description {
  margin: 0 0 20px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: var(--color-primary-hover);
}

.action-button .icon {
  font-size: 18px;
}

.last-backup {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

/* 布局面板样式 */
.layout-panel {
  padding: 20px;
}

.layout-panel h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.layout-options {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.layout-option {
  flex: 1;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background-color: var(--color-bg-hover);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.layout-option:hover {
  background-color: var(--color-bg-active);
}

.layout-option.active {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

.layout-option .icon {
  font-size: 32px;
}

.layout-option .label {
  font-size: 14px;
  font-weight: 500;
}
</style>
