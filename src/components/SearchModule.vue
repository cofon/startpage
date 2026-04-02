<script setup>
/**
 * 搜索模块组件
 * 包含搜索框、搜索引擎选择器和标签列表
 */
import { computed, watch, nextTick } from 'vue'
import { useSearchStore } from '../stores/search'
import { useSettingStore } from '../stores/setting'
import SearchEngineSelector from './SearchEngineSelector.vue'

const searchStore = useSearchStore()
const settingStore = useSettingStore()

// 计算属性：判断当前搜索引擎是否为本地搜索
const isLocalSearchEngine = computed(() => {
  return settingStore.selectedSearchEngineId === 'local'
})

// 监听showCommandList变化
watch(() => searchStore.showCommandList, (newValue, oldValue) => {
  // 更新 showCommandList
  searchStore.setShowCommandList(newValue)
})

/**
 * 处理输入框获得焦点
 */
function handleInputFocus() {
  if (isLocalSearchEngine.value) {
    if (!searchStore.query.value) {
      // 输入框为空时，显示所有 tags
      searchStore.setShowTagsList(true)
    } else {
      searchStore.setShowTagsList(searchStore.shouldShowTagsList)
    }
  }
}

/**
 * 处理输入框失去焦点
 */
function handleInputBlur() {
  // 关闭命令列表和 tags-list
  searchStore.setShowCommandList(false)
  searchStore.setShowTagsList(false)
}

/**
 * 处理输入框内容变化
 */
function handleInput() {

  
  if (isLocalSearchEngine.value) {

    // 使用 nextTick 确保 shouldShowCommandList 和 shouldShowTagsList 的值已经更新
    nextTick(() => {
      searchStore.setShowCommandList(searchStore.shouldShowCommandList)
    })
  }
  
}

/**
 * 处理ESC按键，隐藏tags列表和命令列表
 */
function handleEscKey() {
  if (searchStore.showTagsList) {
    searchStore.setShowTagsList(false)
  }
  if (searchStore.showCommandList) {
    searchStore.setShowCommandList(false)
  }
}

/**
 * 处理命令点击
 */
function handleCommandClick(command) {

  const queryValue = searchStore.query || ''
  const query = queryValue.trim()
  const parts = query.split(/\s+/)

  
  // 替换最后一个部分为完整的命令
  parts[parts.length - 1] = `-${command}`
  const newQuery = parts.join(' ')

  
  searchStore.setQuery(newQuery)
  searchStore.setShowCommandList(false)

}
</script>

<template>
  <div class="search-module">
    <div class="search-container">
      <div class="search-box">
        <SearchEngineSelector />
        <input
          v-model="searchStore.query"
          type="text"
          id="search-input"
          name="search"
          class="search-input"
          placeholder="搜索..."
          autocomplete="off"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @keyup.enter="searchStore.executeSearch"
          @keyup.esc="handleEscKey"
          @input="handleInput"
        >
      </div>

      <!-- 标签列表 -->
      <div
        v-if="searchStore.showTagsList && searchStore.currentTags.length > 0"
        class="tags-list"
      >
        <div
          v-for="tag in searchStore.currentTags"
          :key="tag"
          class="tag-item"
          @mousedown="searchStore.searchByTag(tag)"
        >
          {{ tag }}
        </div>
      </div>
      
      <!-- 命令列表 -->
      <div
        v-if="searchStore.showCommandList && searchStore.currentCommands.length > 0"
        class="commands-list"
        @mousedown.stop.prevent
      >
        <div
          v-for="command in searchStore.currentCommands"
          :key="command"
          class="command-item"
          @click="handleCommandClick(command)"
        >
          -{{ command }}
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.search-module {
  width: 100%;
  max-width: 800px;
  /* margin-bottom: 30px; */
  /* padding-bottom: 24px, 0; */
  padding: 24px 0;
  background-color: white
}

.search-container {
  position: relative;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  background-color: var(--color-bg-card);
  border-radius: 30px;
  box-shadow: var(--shadow-medium);
  transition: box-shadow 0.3s ease;
  position: relative;
}

.search-box:hover {
  box-shadow: var(--shadow-dark);
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 24px;
  font-size: 18px;
  color: var(--color-text-main);
  background-color: transparent !important;
  transition: flex 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 30px 30px 0;
}

.search-input::placeholder {
  color: var(--color-text-disabled);
}

/* 确保search-input在任何状态下都保持透明和圆角 */
.search-input:focus,
.search-input:hover,
.search-input:active {
  background-color: transparent !important;
  border-radius: 0 30px 30px 0;
}

/* 覆盖Edge浏览器的自动填充样式 */
.search-input:-webkit-autofill,
.search-input:-webkit-autofill:hover,
.search-input:-webkit-autofill:focus,
.search-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px transparent inset !important;
  -webkit-text-fill-color: var(--color-text-main) !important;
  background-color: transparent !important;
  transition: background-color 5000s ease-in-out 0s;
  caret-color: var(--color-text-main);
}

.tags-list {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: transparent;
  border-radius: 0;
  box-shadow: none;
  z-index: 10002;
  margin-top: 10px;
}

.tag-item {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-item:hover {
  background-color: var(--color-primary-hover);
}

/* 命令列表样式 */
.commands-list {
  position: absolute;
  top: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: var(--color-bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-medium);
  z-index: 10000;
  margin-top: 10px;
  min-height: 50px;
}

.command-item {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.command-item:hover {
  background-color: var(--color-primary-hover);
}
</style>
