<script setup>
import { computed } from 'vue'
import { useSettingStore } from '../stores/setting'

const settingStore = useSettingStore()

// 当前布局模式
const currentLayout = computed(() => settingStore.searchResultLayout)

// 切换布局
function toggleLayout() {
  const newLayout = currentLayout.value === 'grid' ? 'list' : 'grid'
  settingStore.setSearchResultLayout(newLayout)
}
</script>

<template>
  <div class="layout-switch" @click="toggleLayout">
    <div class="switch-container">
      <div class="switch-slider" :class="currentLayout">
        <span class="switch-text">{{ currentLayout === 'grid' ? 'G' : 'L' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-switch {
  cursor: pointer;
  user-select: none;
}

.switch-container {
  width: 100px;
  height: 32px;
  background-color: var(--color-border-base);
  border-radius: 16px;
  position: relative;
  transition: background-color 0.3s ease;
}

.switch-slider {
  width: 60px;
  height: 28px;
  background-color: var(--color-primary);
  border-radius: 14px;
  position: absolute;
  top: 2px;
  left: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s ease;
}

.switch-slider.grid {
  left: 2px;
}

.switch-slider.list {
  left: 38px;
}

.switch-text {
  color: var(--color-text-on-primary);
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
}

.layout-switch:hover .switch-container {
  background-color: var(--color-bg-hover);
}
</style>
