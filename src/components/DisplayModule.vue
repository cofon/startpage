<script setup>
/**
 * 显示模块组件
 * 包含已标记网站列表、搜索结果、命令面板等
 */
import { useSearchStore } from '../stores/search'
// import { useSettingStore } from '../stores/setting'
import MarkedWebsiteList from './MarkedWebsiteList.vue'
import SearchResultsList from './SearchResultsList.vue'
import CommandSettings from './CommandSettings.vue'
import HelpPanel from './HelpPanel.vue'

const searchStore = useSearchStore()
// const settingStore = useSettingStore()

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
    <CommandSettings v-if="searchStore.displayMode === 'settings'" />

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
</style>
