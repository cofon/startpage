<script setup>
/**
 * 已标记网站列表组件
 * 用于显示已标记的网站列表，支持拖拽排序
 */
import { ref } from 'vue'
import WebsiteIcon from './WebsiteIcon.vue'
import { initDragDrop } from '../utils/ui/dragDropManager'
import { useWebsiteStore } from '../stores/website'
import { useSearchStore } from '../stores/search'

const props = defineProps({
  websites: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['click'])

// 初始化 stores
const websiteStore = useWebsiteStore()
const searchStore = useSearchStore()

// 初始化拖拽
const { draggedIndex, handleDragStart, handleDragEnd, handleDrop } = initDragDrop()

// 文字选择相关状态
let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }
let hadSelectionOnMouseDown = false

/**
 * 检测是否在选择文字
 */
function checkTextSelection(event) {
  const timeDiff = Date.now() - mouseDownTime
  const distanceDiff = Math.sqrt(
    Math.pow(event.clientX - mouseDownPosition.x, 2) +
    Math.pow(event.clientY - mouseDownPosition.y, 2)
  )

  return !hadSelectionOnMouseDown && (distanceDiff > 5 || timeDiff > 200)
}

/**
 * 记录鼠标按下事件
 */
function handleMouseDown(event) {
  mouseDownTime = Date.now()
  mouseDownPosition = { x: event.clientX, y: event.clientY }

  const selection = window.getSelection()
  hadSelectionOnMouseDown = selection.toString().trim().length > 0
}

/**
 * 处理网站点击
 */
function handleWebsiteClick(website, event) {
  if (checkTextSelection(event)) {
    return
  }

  emit('click', website, event)
}
</script>

<template>
  <div class="marked-website-list">
    <div
      v-for="(website, index) in websites"
      :key="website.id"
      class="website-item"
      :class="{ 'dragging': draggedIndex === index }"
      draggable="true"
      @mousedown="(event) => handleMouseDown(event)"
      @click="(event) => handleWebsiteClick(website, event)"
      @dragstart="(event) => handleDragStart(website, index)"
      @dragend="(event) => handleDragEnd(event)"
      @dragover.prevent
      @drop="(event) => handleDrop(index, websiteStore, searchStore)"
    >
      <a
        :href="website.url"
        target="_blank"
        rel="noopener noreferrer"
        class="website-link-wrapper"
        @click.stop
      >
        <WebsiteIcon :website="website" />
        <div class="website-info">
          <span class="website-name" :title="website.name">
            {{ website.name }}
          </span>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.marked-website-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  width: 100%;
}

.website-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--color-bg-card);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.website-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.website-link-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.website-info {
  text-align: center;
  width: 100%;
}

.website-name {
  display: block;
  font-size: 14px;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.website-link-wrapper:hover .website-name {
  color: var(--color-primary);
}
</style>
