<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingStore } from '../stores/setting'
import { useWebsiteStore } from '../stores/website'
import db from '../utils/indexedDB'
// import iconManager from '../utils/iconManager'
import ThemeSettings from './ThemeSettings.vue'
import SearchSettings from './SearchSettings.vue'
import AddWebsitePanel from './AddWebsitePanel.vue'
import LayoutSwitch from './LayoutSwitch.vue'

// 点击外部关闭指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'blur-settings-button'])

const settingStore = useSettingStore()
const websiteStore = useWebsiteStore()

// 当前显示的面板
const activePanel = ref('theme') // 'theme' | 'search' | 'add-website' | ''

// 导入/导出
const importFile = ref(null)

// 更多菜单
const showMoreMenu = ref(false)

// 关闭更多菜单
function closeMoreMenu() {
  showMoreMenu.value = false
}

// 延迟关闭更多菜单
function closeMoreMenuDelayed() {
  setTimeout(() => {
    showMoreMenu.value = false
  }, 100)
}

// 触发导入
function triggerImport() {
  importFile.value?.click()
  closeMoreMenuDelayed()
}

// 切换面板
function setActivePanel(panel) {
  activePanel.value = activePanel.value === panel ? '' : panel
}

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
    const month = String(now.getMonth() + 1).padStart(2, '0')  // 月份从0开始，需要加1
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    const dateTimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`
    a.download = `startpage-backup-${dateTimeStr}.json`

    a.click()
    URL.revokeObjectURL(url)
    settingStore.updateLastBackupTime()
    await saveSettings()
    alert('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请查看控制台获取详细信息')
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
        // 重新加载网站和设置
        const websites = await db.getAllWebsites()
        websiteStore.setWebsites(websites)
        settingStore.loadSettings()

        alert('导入成功！页面即将刷新...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error('解析导入文件失败:', error)
        alert('导入文件格式错误')
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败，请查看控制台获取详细信息')
  }

  // 清空文件输入
  event.target.value = ''
}

// 保存设置
async function saveSettings() {
  try {
    await settingStore.saveSettings()
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败')
  }
}

// 关闭面板
function closePanel() {
  emit('update:modelValue', false)
  emit('blur-settings-button')
}

// 键盘事件处理
function handleKeyDown(event) {
  if (event.key === 'Escape' && props.modelValue) {
    closePanel()
    event.preventDefault()
    event.stopPropagation()
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

</script>

<template>
  <div v-if="modelValue" class="settings-overlay" @click.self="closePanel">
    <div class="settings-panel">
      <div class="panel-header">
        <div class="header-left">
          <button
            class="header-button"
            :class="{ active: activePanel === 'theme' }"
            @click="setActivePanel('theme')"
            title="主题"
          >
            <span class="icon">🎨</span>
          </button>
          <button
            class="header-button"
            :class="{ active: activePanel === 'search' }"
            @click="setActivePanel('search')"
            title="搜索"
          >
            <span class="icon">🔍</span>
          </button>
          <button
            class="header-button"
            :class="{ active: activePanel === 'add-website' }"
            @click="setActivePanel('add-website')"
            title="添加网站"
          >
            <span class="icon">➕</span>
          </button>
        </div>
        <div class="header-right">
          <LayoutSwitch />
          <div class="more-menu-container" v-click-outside="closeMoreMenu">
            <button
              class="header-button more-button"
              :class="{ active: showMoreMenu }"
              @click="showMoreMenu = !showMoreMenu"
              title="更多"
            >
              <span class="icon">⋮</span>
            </button>
            <transition name="dropdown">
              <div v-if="showMoreMenu" class="more-menu">
                <button class="menu-item" @click="handleExport(); closeMoreMenu()">
                  <span class="menu-icon">⬇️</span>
                  <span>导出数据</span>
                </button>
                <button class="menu-item" @click="triggerImport">
                  <span class="menu-icon">⬆️</span>
                  <span>导入数据</span>
                  <input ref="importFile" type="file" accept=".json" @change="handleImport" style="display: none;">
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="panel-content">
        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'theme'" key="theme">
            <ThemeSettings />
          </div>
        </transition>
        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'search'" key="search">
            <SearchSettings />
          </div>
        </transition>
        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'add-website'" key="add-website">
            <AddWebsitePanel @close="closePanel" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-panel {
  background-color: var(--color-bg-card);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-dark);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  border-bottom: 1px solid var(--color-border-base);
  position: sticky;
  top: 0;
  background-color: var(--color-bg-card);
  z-index: 10;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-bg-page);
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 24px;
  flex-shrink: 0;
}

.header-button:hover {
  background-color: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

.header-button.active {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: var(--shadow-medium);
}

.header-button .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
}

.panel-content {
  padding: 32px;
  height: 70vh;
  overflow-y: auto;
}

/* 更多菜单 */
.more-menu-container {
  position: relative;
}

.more-button {
  font-size: 28px;
  line-height: 1;
}

.more-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 12px;
  box-shadow: var(--shadow-dark);
  padding: 8px 0;
  z-index: 100;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
}

.menu-item:hover {
  background-color: var(--color-bg-hover);
}

.menu-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 面板切换动画 */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}




</style>
