<script setup>
import { ref, computed, watch } from 'vue'
import { useSettingStore } from '../stores/setting'
import { useSearchStore } from '../stores/search'

const settingStore = useSettingStore()
const searchStore = useSearchStore()

const isOpen = ref(false)

// 获取搜索引擎列表
const searchEngines = computed(() => {
  return settingStore.searchEngines
})

// 监听搜索引擎列表变化
watch(() => searchEngines.value, (newVal) => {
  searchStore.loadEngineIcons()
}, { deep: true })

// 监听搜索引擎图标变化
watch(() => searchStore.engineIcons, (newVal) => {
  // 图标变化时自动更新，因为 currentEngineIcon 是 computed 属性
}, { deep: true })

// 切换搜索引擎
function selectEngine(engine) {
  settingStore.setSelectedSearchEngine(engine.id)
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
    <div class="engine-icon-container" @click="toggleDropdown">
      <div class="engine-icon" :style="{ color: settingStore.getCurrentSearchEngine()?.iconColor }">
        <div class="icon-svg" v-html="searchStore.currentEngineIcon"></div>
      </div>
      <transition-group name="slide" tag="div" class="engine-list-container">
        <div
          v-for="(engine, index) in isOpen ? searchEngines : []"
          :key="engine.id"
          class="engine-item"
          :class="{ 'selected': engine.id === settingStore.selectedSearchEngineId }"
          :style="{ transitionDelay: `${index * 0.05}s` }"
          @click.stop="selectEngine(engine)"
        >
          <div class="engine-icon" :style="{ color: engine.iconColor }">
            <template v-if="searchStore.engineIcons[engine.id]">
              <div class="icon-svg" v-html="searchStore.engineIcons[engine.id]"></div>
            </template>
            <template v-else>
              <img v-if="engine.icon" :src="engine.icon" :alt="engine.name">
              <span v-else class="icon-placeholder">{{ engine.name[0] }}</span>
            </template>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.engine-selector {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.engine-icon-container {
  display: flex;
  align-items: center;
  height: 100%;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.engine-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 100%;
  font-size: 24px;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.3s ease;
  padding-left: 8px;
}

.engine-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.engine-icon .icon-placeholder {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-text-secondary);
}

.engine-icon .icon-svg {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.engine-icon .icon-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.engine-icon:hover {
  opacity: 0.8;
}

.engine-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 100%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex-shrink: 0;
  color: var(--color-primary);
}

.engine-item:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-primary-hover);
}

.engine-item.selected {
  background-color: var(--color-bg-active);
  color: var(--color-primary-hover);
}

/* transition-group 动画效果 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-enter-from,
.slide-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(-10px);
}

.slide-enter-to,
.slide-leave-from {
  width: 50px;
  opacity: 1;
  transform: translateX(0);
}

/* 确保transition-group布局正常 */
.slide-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.engine-list-container {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
