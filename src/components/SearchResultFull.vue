<script setup>
/**
 * 完整模式布局组件
 * 显示所有信息，多行布局
 */
import { ref, onMounted, watch } from 'vue'
import WebsiteIcon from './WebsiteIcon.vue'
import WebsiteActions from './WebsiteActions.vue'
import { useWebsiteStore } from '../stores/website'

const websiteStore = useWebsiteStore()

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'toggle-mark', 'edit', 'delete', 'restore'])

// 图标数据
const iconData = ref(null)
const iconGenerateData = ref(null)

// 文字选择相关状态
let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }
let hadSelectionOnMouseDown = false

// 加载图标数据
async function loadIconData() {
  if (props.website.id) {
    try {
      const iconResult = await websiteStore.loadWebsiteIcon(props.website.id)
      if (iconResult) {
        iconData.value = iconResult.iconData
        iconGenerateData.value = iconResult.iconGenerateData
      }
    } catch (error) {
      console.error('SearchResultFull - 加载图标数据失败:', error)
    }
  }
}

// 监听 website 变化
watch(() => props.website, () => {
  loadIconData()
}, { immediate: true })

// 组件挂载时加载图标数据
onMounted(() => {
  loadIconData()
})

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
  console.log('[SearchResultFull] 处理网站点击:', website.name, website.id)

  if (checkTextSelection(event)) {
    console.log('[SearchResultFull] 检测到文字选择，取消点击')
    return
  }

  // 阻止a标签的默认行为
  event.preventDefault()
  event.stopPropagation()

  console.log('[SearchResultFull] 触发click事件到父组件')
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
    <!-- 主体内容：简单粗暴的字段列表 -->
    <div class="full-content">
        <div class="field-row">
          <span class="field-label">id:</span>
          <span class="field-value">{{ website.id }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">icon:</span>
          <div class="field-value icon-field">
            <WebsiteIcon :website="website" />
          </div>
        </div>
        
        <div class="field-row">
          <span class="field-label">svg:</span>
          <div class="field-value svg-field">
            <div v-if="iconGenerateData" class="svg-preview">
              <img :src="iconGenerateData" alt="SVG Preview" class="svg-image" />
            </div>
            <span v-else class="no-value">-</span>
          </div>
        </div>
        
        <div class="field-row">
          <span class="field-label">name:</span>
          <span class="field-value">{{ website.name }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">url:</span>
          <span class="field-value">
            <a
              :href="website.url"
              target="_blank"
              rel="noopener noreferrer"
              class="website-link"
              @mousedown="(event) => handleMouseDown(event)"
              @click="(event) => handleWebsiteClick(website, event)"
            >
              {{ website.url }}
            </a>
          </span>
        </div>
        
        <div class="field-row">
          <span class="field-label">title:</span>
          <span class="field-value">{{ website.title || '-' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">desc:</span>
          <span class="field-value">{{ website.description || '-' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">tags:</span>
          <div class="field-value tags-field">
            <span v-for="tag in website.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
            <span v-if="!website.tags || website.tags.length === 0" class="no-value">-</span>
          </div>
        </div>
        
        <div class="field-row">
          <span class="field-label">isMarked:</span>
          <span class="field-value">{{ website.isMarked ? 'true' : 'false' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">isActive:</span>
          <span class="field-value">{{ website.isActive ? 'true' : 'false' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">isHidden:</span>
          <span class="field-value">{{ website.isHidden ? 'true' : 'false' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">markOrder:</span>
          <span class="field-value">{{ website.markOrder || 0 }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">visitCount:</span>
          <span class="field-value">{{ website.visitCount || 0 }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">lastVisited:</span>
          <span class="field-value">{{ website.lastVisited ? formatDate(website.lastVisited) : '-' }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">createdAt:</span>
          <span class="field-value">{{ formatDate(website.createdAt) }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">updatedAt:</span>
          <span class="field-value">{{ formatDate(website.updatedAt) }}</span>
        </div>
        
        <div class="field-row">
          <span class="field-label">actions:</span>
          <div class="field-value actions-field">
            <WebsiteActions
              :website="website"
              @toggle-mark="handleToggleMark"
              @edit="handleEdit"
              @delete="handleDelete"
              @restore="handleRestore"
            />
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.website-item {
  padding: 12px;
  background-color: var(--color-bg-card);
  border-radius: 4px;
  cursor: default;
  user-select: none;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-border);
}

.website-item:hover {
  border-color: var(--color-primary);
}

/* 操作按钮字段 */
.actions-field {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* 主体内容 */
.full-content {
  width: 100%;
}

.website-link {
  text-decoration: none;
  color: var(--color-primary);
  cursor: pointer;
}

.website-link:hover {
  text-decoration: underline;
}

/* 字段行 */
.field-row {
  display: flex;
  margin-bottom: 6px;
  align-items: flex-start;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-label {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.field-value {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-main);
  word-break: break-word;
  font-family: monospace;
}

/* 图标字段 */
.icon-field {
  display: flex;
  align-items: center;
}

.icon-field :deep(.website-icon) {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

/* SVG字段 */
.svg-field {
  display: flex;
  align-items: center;
}

.svg-preview {
  margin-right: 8px;
}

.svg-image {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: white;
  padding: 2px;
}



/* 标签字段 */
.tags-field {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag {
  padding: 2px 8px;
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.no-value {
  color: var(--color-text-disabled);
}



/* 响应式设计 */
@media (max-width: 768px) {
  .website-item {
    padding: 12px;
  }
  
  .field-label {
    width: 100px;
    font-size: 13px;
  }
  
  .field-value {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .field-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .field-label {
    width: 100%;
  }
}
</style>