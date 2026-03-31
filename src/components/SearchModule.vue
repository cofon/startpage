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
  const result = settingStore.selectedSearchEngineId === 'local'
  console.log('SearchModule - isLocalSearchEngine:', result)
  return result
})

// 监听showCommandList变化
watch(() => searchStore.showCommandList, (newValue, oldValue) => {
  console.log('SearchModule - showCommandList watch START')
  console.log('SearchModule - showCommandList changed from:', oldValue, 'to:', newValue)
  console.log('SearchModule - currentCommands length:', searchStore.currentCommands.length)
  console.log('SearchModule - shouldShowCommandList:', searchStore.shouldShowCommandList)
  const queryValue = searchStore.query
  console.log('SearchModule - query:', queryValue)
  console.log('SearchModule - showCommandList watch END')
})

/**
 * 处理输入框获得焦点
 */
function handleInputFocus() {
  console.log('SearchModule - handleInputFocus')
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
  console.log('SearchModule - handleInputBlur START')
  console.log('SearchModule - handleInputBlur - showCommandList before:', searchStore.showCommandList)
  const queryValue = searchStore.query
  console.log('SearchModule - handleInputBlur - query:', queryValue)
  // 只关闭命令列表，不关闭 tags-list
  searchStore.setShowCommandList(false)
  console.log('SearchModule - handleInputBlur - showCommandList after:', searchStore.showCommandList)
  console.log('SearchModule - handleInputBlur END')
}

/**
 * 处理输入框内容变化
 */
function handleInput() {
  console.log('SearchModule - handleInput START')
  const queryValue = searchStore.query
  console.log('SearchModule - handleInput - query:', queryValue)
  console.log('SearchModule - handleInput - isLocalSearchEngine:', isLocalSearchEngine.value)
  console.log('SearchModule - handleInput - showCommandList before:', searchStore.showCommandList)
  console.log('SearchModule - handleInput - shouldShowCommandList:', searchStore.shouldShowCommandList)
  console.log('SearchModule - handleInput - currentCommands.length:', searchStore.currentCommands.length)
  
  if (isLocalSearchEngine.value) {
    console.log('SearchModule - handleInput - shouldShowTagsList:', searchStore.shouldShowTagsList)
    console.log('SearchModule - handleInput - showTagsList:', searchStore.showTagsList)
    console.log('SearchModule - handleInput - currentTags.length:', searchStore.currentTags.length)
    // 使用 nextTick 确保 shouldShowCommandList 和 shouldShowTagsList 的值已经更新
    nextTick(() => {
      console.log('SearchModule - handleInput - nextTick callback')
      console.log('SearchModule - handleInput - shouldShowCommandList in nextTick:', searchStore.shouldShowCommandList)
      console.log('SearchModule - handleInput - shouldShowTagsList in nextTick:', searchStore.shouldShowTagsList)
      console.log('SearchModule - handleInput - showTagsList before set:', searchStore.showTagsList)
      searchStore.setShowCommandList(searchStore.shouldShowCommandList)
      console.log('SearchModule - handleInput - showCommandList after nextTick:', searchStore.showCommandList)
      console.log('SearchModule - handleInput - showTagsList after set:', searchStore.showTagsList)
      console.log('SearchModule - handleInput - currentTags.length in nextTick:', searchStore.currentTags.length)
    })
  }
  
  console.log('SearchModule - handleInput END')
}

/**
 * 处理ESC按键，隐藏tags列表和命令列表
 */
function handleEscKey() {
  console.log('SearchModule - handleEscKey')
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
  console.log('SearchModule - handleCommandClick:', command)
  const query = searchStore.query.value.trim()
  const parts = query.split(/\s+/)
  
  // 替换最后一个部分为完整的命令
  parts[parts.length - 1] = `-${command}`
  
  searchStore.setQuery(parts.join(' '))
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
        @vue:mounted="console.log('[TagsList] Mounted - showTagsList:', searchStore.showTagsList, ', currentTags.length:', searchStore.currentTags.length)"
        @vue:before-mount="console.log('[TagsList] Before Mount - showTagsList:', searchStore.showTagsList, ', currentTags.length:', searchStore.currentTags.length)"
        @vue:before-unmount="console.log('[TagsList] Before Unmount')"
      >
        <div style="position: absolute; top: -30px; left: 0; background: #2196f3; color: white; padding: 5px; font-size: 12px;">
          [TagsList Visible] Tags: {{ searchStore.currentTags.length }}
        </div>
        <div
          v-for="tag in searchStore.currentTags"
          :key="tag"
          class="tag-item"
          @mousedown="searchStore.searchByTag(tag)"
          @vue:mounted="console.log('[TagItem] Mounted:', tag)"
        >
          {{ tag }}
        </div>
      </div>
      <!-- 标签列表调试信息 -->
      <div v-else class="tags-debug-info" style="position: absolute; top: 70px; left: 0; background: #e3f2fd; padding: 10px; border: 2px solid #2196f3; z-index: 10001;">
        <div style="font-weight: bold; color: #2196f3;">[TagsList NOT Visible]</div>
        <div>showTagsList: {{ searchStore.showTagsList }}</div>
        <div>currentTags.length: {{ searchStore.currentTags.length }}</div>
        <div>shouldShowTagsList: {{ searchStore.shouldShowTagsList }}</div>
      </div>
      
      <!-- 命令列表 -->
      <div
        v-if="searchStore.showCommandList && searchStore.currentCommands.length > 0"
        class="commands-list"
        @vue:mounted="console.log('[CommandList] Mounted - showCommandList:', searchStore.showCommandList, ', currentCommands.length:', searchStore.currentCommands.length)"
        @vue:before-mount="console.log('[CommandList] Before Mount - showCommandList:', searchStore.showCommandList, ', currentCommands.length:', searchStore.currentCommands.length)"
        @vue:before-unmount="console.log('[CommandList] Before Unmount')"
      >
        <div style="position: absolute; top: -30px; left: 0; background: #4caf50; color: white; padding: 5px; font-size: 12px;">
          [CommandList Visible] Commands: {{ searchStore.currentCommands.length }}
        </div>
        <div
          v-for="command in searchStore.currentCommands"
          :key="command"
          class="command-item"
          @vue:mounted="console.log('[CommandItem] Mounted:', command)"
        >
          -{{ command }}
        </div>
      </div>
      <!-- 命令列表调试信息 -->
      <div v-else class="command-debug-info" style="position: absolute; top: 70px; left: 0; background: #ffeb3b; padding: 10px; border: 2px solid #ff9800; z-index: 10001;">
        <div style="font-weight: bold; color: #f44336;">[CommandList NOT Visible]</div>
        <div>[CommandList Debug] showCommandList: {{ searchStore.showCommandList }}</div>
        <div>[CommandList Debug] currentCommands.length: {{ searchStore.currentCommands.length }}</div>
        <div>[CommandList Debug] shouldShowCommandList: {{ searchStore.shouldShowCommandList }}</div>
        <div>[CommandList Debug] query: {{ searchStore.query }}</div>
        <div>[CommandList Debug] Condition 1 (showCommandList): {{ searchStore.showCommandList }} (should be true)</div>
        <div>[CommandList Debug] Condition 2 (currentCommands.length > 0): {{ searchStore.currentCommands.length > 0 }} (should be true)</div>
        <div>[CommandList Debug] Final Condition (showCommandList && currentCommands.length > 0): {{ searchStore.showCommandList && searchStore.currentCommands.length > 0 }} (should be true)</div>
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
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  margin-top: 10px;
  min-height: 50px;
  border: 2px solid red;
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
