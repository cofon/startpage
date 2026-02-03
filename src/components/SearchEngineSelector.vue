<script setup>
import { ref, computed } from 'vue'
import { useSettingStore } from '../stores/setting'
import { useSearchStore } from '../stores/search'

const settingStore = useSettingStore()
const searchStore = useSearchStore()

const isOpen = ref(false)

// 获取搜索引擎列表
const searchEngines = computed(() => {
  return Object.entries(settingStore.searchEngineList).map(([id, engine]) => ({
    id,
    ...engine
  }))
})

// 切换搜索引擎
function selectEngine(engineId) {
  settingStore.setSelectedSearchEngine(engineId)
  isOpen.value = false
}

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 点击外部关闭菜单
function handleClickOutside(event) {
  if (!event.target.closest('.engine-selector')) {
    isOpen.value = false
  }
}

// 挂载时添加点击外部监听
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="engine-selector">
    <div class="engine-current" @click="toggleDropdown">
      <div class="engine-icon" v-html="searchStore.currentEngineIcon"></div>
      <span class="engine-name">{{ searchStore.currentEngine?.name }}</span>
      <span class="dropdown-arrow" :class="{ open: isOpen }">▼</span>
    </div>

    <div v-if="isOpen" class="engine-dropdown">
      <div
        v-for="engine in searchEngines"
        :key="engine.id"
        class="engine-option"
        :class="{ active: engine.id === settingStore.selectedSearchEngine }"
        @click="selectEngine(engine.id)"
      >
        <div class="engine-icon" v-html="searchStore.engineIcons[engine.id]"></div>
        <span class="engine-name">{{ engine.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.engine-selector {
  position: relative;
  display: inline-block;
}

.engine-current {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.engine-current:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.engine-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.engine-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.engine-name {
  font-size: 14px;
  color: #333;
}

.dropdown-arrow {
  font-size: 10px;
  color: #666;
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.engine-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.engine-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.engine-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.engine-option.active {
  background-color: rgba(0, 0, 0, 0.08);
}

.engine-option .engine-name {
  flex: 1;
}
</style>
