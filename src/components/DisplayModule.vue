<script setup>
/**
 * 显示模块组件
 * 包含已标记网站列表、搜索结果、命令面板等
 */
import { useSearchStore } from '../stores/search'
// import { useSettingStore } from '../stores/setting'
import MarkedWebsiteList from './MarkedWebsiteList.vue'
import SearchResultsList from './SearchResultsList.vue'
import ThemeSettings from './ThemeSettings.vue'
import SearchSettings from './SearchSettings.vue'
import AddWebsitePanel from './AddWebsitePanel.vue'
import ImportDataPanel from './ImportDataPanel.vue'
import ExportDataPanel from './ExportDataPanel.vue'
import BatchEditPanel from './BatchEditPanel.vue'
import HelpPanel from './HelpPanel.vue'
import SearchResultLayoutSelector from './SearchResultLayoutSelector.vue'

const searchStore = useSearchStore()
// const settingStore = useSettingStore()

// 关闭面板
function closePanel() {
  searchStore.clearCommandMode()
}

// 暴露计算属性给父组件使用
defineExpose({
  searchModuleMarginTop: '40px'
})
</script>

<template>
  <div class="display-module">
    <!-- 已标记网站列表 -->
    <MarkedWebsiteList
      v-if="searchStore.displayMode === 'marked'"
      :websites="searchStore.results"
      @click="(website, event) => $emit('website-click', website, event)"
    />

    <!-- 搜索结果 -->
    <SearchResultsList
      v-else-if="searchStore.displayMode === 'search'"
      :websites="searchStore.results"
      @click="(website, event) => $emit('website-click', website, event)"
      @toggle-mark="$emit('toggle-mark', $event)"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @restore="$emit('restore', $event)"
    />

    <!-- 空状态 -->
    <div v-else-if="searchStore.displayMode === 'empty'" class="empty-state">
      <p>暂无内容</p>
      <button class="button-primary" @click="$emit('add-website')">
        添加第一个网站
      </button>
    </div>

    <!-- 历史记录 (预留) -->
    <div v-else-if="searchStore.displayMode === 'history'" class="empty-state">
      <p>历史记录功能开发中...</p>
    </div>

    <!-- 收藏夹 (预留) -->
    <div v-else-if="searchStore.displayMode === 'favorites'" class="empty-state">
      <p>收藏夹功能开发中...</p>
    </div>

    <!-- 命令模式：设置面板 -->
    <div v-if="searchStore.displayMode === 'settings' || searchStore.displayMode === 'layout'" class="settings-content">
      <!-- 主题设置面板 -->
      <div v-if="searchStore.commandMode === 'theme'" class="settings-panel-content">
        <ThemeSettings />
      </div>

      <!-- 搜索设置面板 -->
      <div v-else-if="searchStore.commandMode === 'search'" class="settings-panel-content">
        <SearchSettings />
      </div>

      <!-- 添加网站面板 -->
      <div v-else-if="searchStore.commandMode === 'add'" class="settings-panel-content">
        <AddWebsitePanel />
      </div>

      <!-- 导入面板 -->
      <div v-else-if="searchStore.commandMode === 'import'" class="settings-panel-content">
        <ImportDataPanel />
      </div>

      <!-- 导出面板 -->
      <div v-else-if="searchStore.commandMode === 'export'" class="settings-panel-content">
        <ExportDataPanel />
      </div>

      <!-- 批量编辑面板 -->
      <div v-else-if="searchStore.commandMode === 'batch'" class="settings-panel-content">
        <BatchEditPanel />
      </div>

      <!-- 布局选择面板 -->
      <div v-else-if="searchStore.commandMode === 'layout'" class="settings-panel-content">
        <SearchResultLayoutSelector />
      </div>
    </div>

    <!-- 命令模式：帮助面板 -->
    <HelpPanel v-if="searchStore.displayMode === 'help'" />
  </div>
</template>

<style scoped>
.display-module {
  width: 100%;
  max-width: 800px;
  /* 移除 overflow-y: auto，让内容自然撑开高度 */
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 20px;
}

.button-primary {
  padding: 12px 32px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* 设置内容样式 */
.settings-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.settings-panel-content {
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
