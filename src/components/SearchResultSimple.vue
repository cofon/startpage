<script setup>
/**
 * 极简模式布局组件
 * 一行显示：icon、title/desc/name、actions
 */
import WebsiteIcon from './WebsiteIcon.vue'
import WebsiteActions from './WebsiteActions.vue'

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
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
  console.log('[SearchResultSimple] 处理网站点击:', website.name, website.id)

  if (checkTextSelection(event)) {
    console.log('[SearchResultSimple] 检测到文字选择，取消点击')
    return
  }

  // 阻止a标签的默认行为
  event.preventDefault()
  event.stopPropagation()

  console.log('[SearchResultSimple] 触发click事件到父组件')
  emit('click', website, event)

  // 注意：不在这里打开链接，让父组件(App.vue)来处理
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

/**
 * 获取网站显示文本
 * 优先级：title > description > name
 */
function getWebsiteDisplayText(website) {
  if (website.title && website.title.trim() !== '') {
    return website.title
  }
  if (website.description && website.description.trim() !== '') {
    return website.description
  }
  return website.name || ''
}
</script>

<template>
  <div class="website-item simple-mode">
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
        <div class="website-description" :title="getWebsiteDisplayText(website)">
          {{ getWebsiteDisplayText(website) }}
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
  </div>
</template>

<style scoped>
.website-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: var(--color-bg-card);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.website-link-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

/* 调整 simple 模式下的图标大小 */
.website-link-wrapper :deep(.website-icon) {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.website-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.website-description {
  font-size: 14px;
  color: var(--color-text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  max-width: 100%;
}

.website-link-wrapper:hover .website-description {
  color: var(--color-primary);
}
</style>