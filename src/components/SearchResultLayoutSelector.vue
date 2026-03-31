<script setup>
/**
 * 搜索结果布局选择页面
 * 显示所有可用的布局模式，允许用户选择
 */
import { ref } from 'vue'
import { useSearchStore } from '../stores/search'

const searchStore = useSearchStore()

// 布局模式列表
const layoutModes = [
  {
    id: 'simple',
    name: '极简模式',
    description: '一行显示 icon、标题/描述/名称、操作按钮',
    preview: '简单、紧凑的显示方式，节省空间'
  },
  {
    id: 'default',
    name: '默认模式',
    description: '左侧 icon，中间标题/描述/名称和 URL，右侧操作按钮',
    preview: '信息完整，布局清晰的显示方式'
  },
  {
    id: 'full',
    name: '完整模式',
    description: '显示所有信息，包括 ID、icon、名称、标题、描述、标签和元数据',
    preview: '信息全面，适合需要详细了解网站信息的场景'
  }
]

// 当前选中的布局模式
const selectedLayout = ref(searchStore.currentLayoutMode || 'default')

/**
 * 选择布局模式
 */
function selectLayout(layoutId) {
  selectedLayout.value = layoutId
}

/**
 * 应用布局模式
 */
function applyLayout() {
  searchStore.setLayoutMode(selectedLayout.value)
  // 清除命令模式，返回搜索结果
  searchStore.clearCommandMode()
}

/**
 * 取消选择
 */
function cancelSelection() {
  // 清除命令模式，返回搜索结果
  searchStore.clearCommandMode()
}
</script>

<template>
  <div class="layout-selector-container">
    <div class="layout-selector-header">
      <h2>选择搜索结果布局</h2>
      <p>选择一种布局模式来显示搜索结果</p>
    </div>
    
    <div class="layout-modes-grid">
      <div
        v-for="mode in layoutModes"
        :key="mode.id"
        class="layout-mode-card"
        :class="{ active: selectedLayout === mode.id }"
        @click="selectLayout(mode.id)"
      >
        <div class="layout-mode-header">
          <h3>{{ mode.name }}</h3>
          <div class="layout-mode-indicator" :class="mode.id"></div>
        </div>
        <p class="layout-mode-description">{{ mode.description }}</p>
        <p class="layout-mode-preview">{{ mode.preview }}</p>
      </div>
    </div>
    
    <div class="layout-selector-actions">
      <button class="btn btn-secondary" @click="cancelSelection">取消</button>
      <button class="btn btn-primary" @click="applyLayout">应用</button>
    </div>
  </div>
</template>

<style scoped>
.layout-selector-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.layout-selector-header {
  text-align: center;
  margin-bottom: 40px;
}

.layout-selector-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 12px;
}

.layout-selector-header p {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.layout-modes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.layout-mode-card {
  padding: 24px;
  background-color: var(--color-bg-card);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.layout-mode-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.layout-mode-card.active {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}

.layout-mode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.layout-mode-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-main);
}

.layout-mode-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.layout-mode-indicator.simple {
  background-color: var(--color-success);
}

.layout-mode-indicator.default {
  background-color: var(--color-primary);
}

.layout-mode-indicator.full {
  background-color: var(--color-warning);
}

.layout-mode-description {
  font-size: 14px;
  color: var(--color-text-main);
  margin-bottom: 12px;
  line-height: 1.4;
}

.layout-mode-preview {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.layout-selector-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: var(--color-bg-hover);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-bg-active);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .layout-modes-grid {
    grid-template-columns: 1fr;
  }
  
  .layout-selector-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
}
</style>