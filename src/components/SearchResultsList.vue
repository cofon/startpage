<script setup>
/**
 * 搜索结果列表组件
 * 用于显示搜索结果，包含网站信息和操作按钮
 */
import { ref, onMounted } from 'vue'
import WebsiteIcon from './WebsiteIcon.vue'
import WebsiteActions from './WebsiteActions.vue'

const props = defineProps({
  websites: {
    type: Array,
    required: true
  },
  layout: {
    type: String,
    default: 'list',
    validator: (value) => ['grid', 'list'].includes(value)
  }
})

// 添加调试信息
onMounted(() => {
  console.log('[SearchResultsList] Component mounted')
  console.log('[SearchResultsList] Websites count:', props.websites?.length)
  console.log('[SearchResultsList] Layout:', props.layout)
  console.log('[SearchResultsList] First website:', props.websites?.[0])
})

const emit = defineEmits(['click', 'toggle-mark', 'edit', 'delete', 'restore'])

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

  emit('click', website)
}

/**
 * 处理标记切换
 */
function handleToggleMark(website) {
  emit('toggle-mark', website)
}

/**
 * 处理编辑
 */
function handleEdit(website) {
  emit('edit', website)
}

/**
 * 处理删除
 */
function handleDelete(website) {
  emit('delete', website)
}

/**
 * 处理恢复
 */
function handleRestore(website) {
  emit('restore', website)
}
</script>

<template>
  <div class="search-results-list" :class="layout">
    <div
      v-for="website in websites"
      :key="website.id"
      class="website-item"
      :class="layout"
    >
      <a
        :href="website.url"
        target="_blank"
        rel="noopener noreferrer"
        class="website-link-wrapper"
        @mousedown="(event) => handleMouseDown(event)"
        @click="(event) => handleWebsiteClick(website, event)"
      >
        <WebsiteIcon :website="website" />
        <div class="website-info">
          <div class="website-description" :title="website.name">
            {{ website.description }}
          </div>
          <span
            class="website-url"
            :title="website.url"
          >
            {{ website.url }}
          </span>
          <div v-if="website.tags && website.tags.length > 0" class="website-tags">
            <span v-for="tag in website.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
      </a>
      <WebsiteActions
        :website="website"
        @toggle-mark="handleToggleMark"
        @edit="handleEdit"
        @delete="handleDelete"
        @restore="handleRestore"
      />
      <!-- 调试信息 -->
      <div style="display: none;">
        Actions rendered for: {{ website.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-results-list {
  display: grid;
  gap: 20px;
  width: 100%;
  max-width: 100%;
}

/* 列表模式 */
.search-results-list.list {
  grid-template-columns: 1fr;
}

/* 网格模式 */
.search-results-list.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.website-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: var(--color-bg-card);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  overflow: visible;
  width: auto;
  max-width: 100%;
  box-sizing: border-box;
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.website-item.grid {
  flex-direction: column;
  text-align: center;
}

.website-item.grid .website-link-wrapper {
  flex-direction: column;
}

.website-item.grid .website-actions {
  margin-top: 8px;
}

.website-link-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  text-decoration: none;
  color: inherit;
}

.website-info {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.website-item.grid .website-info {
  width: 100%;
}

/* WebsiteActions 的样式在其组件内部定义 */

.website-description {
  font-size: 16px;
  color: var(--color-text-main);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.website-url {
  display: inline-block;
  font-size: 14px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.website-link-wrapper:hover .website-description {
  color: var(--color-primary);
}

.website-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
  max-width: 100%;
}

.tag {
  padding: 4px 12px;
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border-radius: 12px;
  font-size: 12px;
  transition: all 0.2s ease;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag:hover {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}
</style>
