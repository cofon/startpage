<script setup>
import { computed } from 'vue'
import { useSearchStore } from '../stores/search'
import ThemeSettings from './ThemeSettings.vue'
import SearchSettings from './SearchSettings.vue'
import AddWebsitePanel from './AddWebsitePanel.vue'
import ImportDataPanel from './ImportDataPanel.vue'
import ExportDataPanel from './ExportDataPanel.vue'

const searchStore = useSearchStore()

// 当前显示的面板
const activePanel = computed(() => searchStore.commandMode)

// 关闭面板
function closePanel() {
  searchStore.clearCommandMode()
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
        <ImportDataPanel />
      </div>

      <!-- 导出面板 -->
      <div v-else-if="activePanel === 'export'" class="panel-section">
        <ExportDataPanel />
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
</style>
