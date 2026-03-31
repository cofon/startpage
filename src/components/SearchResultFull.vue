<script setup>
/**
 * 完整模式布局组件
 * 显示所有信息，多行布局
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
  if (checkTextSelection(event)) {
    return
  }

  emit('click', website, event)
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
 * 格式化日期
 */
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<template>
  <div class="website-item full-mode">
    <!-- 头部：icon、名称、操作 -->
    <div class="full-header">
      <a
        :href="website.url"
        target="_blank"
        rel="noopener noreferrer"
        class="website-link"
        @mousedown="(event) => handleMouseDown(event)"
        @click="(event) => handleWebsiteClick(website, event)"
      >
        <div class="website-icon-container">
          <WebsiteIcon :website="website" />
        </div>
        <div class="website-header-info">
          <h3 class="website-name" :title="website.name">{{ website.name }}</h3>
          <span class="website-url" :title="website.url">{{ website.url }}</span>
        </div>
      </a>
      <div class="actions-container">
        <WebsiteActions
          :website="website"
          @toggle-mark="handleToggleMark"
          @edit="handleEdit"
          @delete="handleDelete"
          @restore="handleRestore"
        />
      </div>
    </div>
    
    <!-- 主体内容 -->
    <div class="full-content">
      <!-- 标题 -->
      <div v-if="website.title" class="content-section">
        <h4 class="section-title">标题</h4>
        <p class="section-content" :title="website.title">{{ website.title }}</p>
      </div>
      
      <!-- 描述 -->
      <div v-if="website.description" class="content-section">
        <h4 class="section-title">描述</h4>
        <p class="section-content" :title="website.description">{{ website.description }}</p>
      </div>
      
      <!-- 标签 -->
      <div v-if="website.tags && website.tags.length > 0" class="content-section">
        <h4 class="section-title">标签</h4>
        <div class="tags-container">
          <span v-for="tag in website.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 元数据 -->
    <div class="full-metadata">
      <div class="metadata-item">
        <span class="metadata-label">创建时间</span>
        <span class="metadata-value">{{ formatDate(website.createdAt) }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">更新时间</span>
        <span class="metadata-value">{{ formatDate(website.updatedAt) }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">访问次数</span>
        <span class="metadata-value">{{ website.visitCount || 0 }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">ID</span>
        <span class="metadata-value">{{ website.id }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.website-item {
  padding: 24px;
  background-color: var(--color-bg-card);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--shadow-light);
}

.website-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* 头部 */
.full-header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
}

.website-link {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.website-link:hover {
  opacity: 0.9;
}

.website-icon-container {
  flex-shrink: 0;
}

.website-icon-container :deep(.website-icon) {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.website-header-info {
  flex: 1;
  min-width: 0;
}

.website-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-main);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.website-url {
  font-size: 14px;
  color: var(--color-text-secondary);
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-container {
  flex-shrink: 0;
}

/* 主体内容 */
.full-content {
  margin-bottom: 24px;
}

.content-section {
  margin-bottom: 20px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  font-size: 16px;
  color: var(--color-text-main);
  margin: 0;
  line-height: 1.6;
  word-break: break-word;
}

/* Tags 容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 14px;
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tag:hover {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  transform: translateY(-1px);
}

/* 元数据 */
.full-metadata {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-hover);
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metadata-value {
  font-size: 14px;
  color: var(--color-text-main);
  font-family: monospace;
}

/* 链接 hover 效果 */
.website-link:hover .website-name {
  color: var(--color-primary);
}

.website-link:hover .website-url {
  color: var(--color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .website-item {
    padding: 20px;
  }
  
  .full-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .website-link {
    width: 100%;
  }
  
  .full-metadata {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .full-metadata {
    grid-template-columns: 1fr;
  }
  
  .website-icon-container :deep(.website-icon) {
    width: 40px;
    height: 40px;
  }
  
  .website-name {
    font-size: 18px;
  }
}
</style>