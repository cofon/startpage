<script setup>
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from '../stores/website'
import { useNotificationStore } from '../stores/notification'
import { generateSVG, encodeSVG } from '../utils/website/websiteUtils'
import { fetchMetadata } from '../services/websiteMetadataService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  website: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

// 使用 website store
const websiteStore = useWebsiteStore()
const notificationStore = useNotificationStore()

// 编码SVG为Base64
function encodeSvg(svg) {
  if (!svg) return ''
  // 如果已经是Base64格式，直接返回
  if (svg.startsWith('data:image/svg+xml;base64,') || svg.startsWith('data:image/svg+xml;utf8,')) {
    return svg
  }
  // 否则进行Base64编码
  // 使用encodeURIComponent处理Unicode字符
  const encodedSvg = encodeURIComponent(svg)
    .replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
        return String.fromCharCode('0x' + p1)
      })
  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`
}

// 获取URL的meta数据
async function fetchWebsiteMeta() {
  if (!form.value.url) {
    notificationStore.warning('请输入URL')
    return
  }
  
  try {
    notificationStore.info('正在获取网站信息...')
    
    // 使用 websiteMetadataService.fetchMetadata 获取网站元数据
    const metadata = await fetchMetadata(form.value.url)
    
    if (metadata) {
      if (metadata.title) form.value.title = metadata.title
      if (metadata.description) form.value.description = metadata.description
      if (metadata.iconData) form.value.iconData = metadata.iconData
      notificationStore.success('获取网站信息成功！')
    } else {
      notificationStore.error('获取网站信息失败')
    }
  } catch (error) {
    console.error('获取网站信息失败:', error)
    notificationStore.error('获取网站信息失败：' + (error.message || '未知错误'))
  }
}

// 表单数据
const form = ref({
  name: '',
  title: '',
  url: '',
  description: '',
  tags: [],
  isMarked: false,
  isActive: true,
  isHidden: false,
  // 图标相关字段
  iconData: '',
  iconGenerateData: ''
})

// 监视name输入框的变化，当第一个字符变了时重新生成SVG
let previousNameFirstChar = ''
watch(() => form.value.name, (newName) => {
  const newFirstChar = newName ? newName.charAt(0) : ''
  if (newFirstChar !== previousNameFirstChar) {
    // 生成新的SVG图标
    if (newName) {
      const svgIcon = generateSVG(newName)
      form.value.iconGenerateData = encodeSVG(svgIcon)
    }
    previousNameFirstChar = newFirstChar
  }
}, { immediate: true })

// 标签输入
const tagInput = ref('')

// 获取当前输入的标签列表
const currentTags = computed(() => {
  return tagInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
})

// 使用 store 中的所有标签
const allTags = computed(() => websiteStore.allTags)

// 判断标签是否已添加
function isTagAdded(tag) {
  return currentTags.value.includes(tag)
}

// 切换标签（添加或删除）
function toggleTag(tag) {
  const tags = [...currentTags.value]
  const index = tags.indexOf(tag)

  if (index > -1) {
    // 如果标签已存在，则移除
    tags.splice(index, 1)
  } else {
    // 如果标签不存在，则添加
    tags.push(tag)
  }

  tagInput.value = tags.join(', ')
}

// 对话框标题
const dialogTitle = computed(() => {
  return props.website ? '编辑网站' : '添加网站'
})

// 打开对话框时初始化表单
async function openDialog() {
  if (props.website) {
    // 从 store 获取完整的网站数据（包含图标）
    const websiteWithIcon = await websiteStore.getWebsiteWithIcon(props.website.id)
    const websiteData = websiteWithIcon || props.website
    
    form.value = {
      name: websiteData.name || '',
      title: websiteData.title || '',
      url: websiteData.url,
      description: websiteData.description || '',
      tags: websiteData.tags ? [...websiteData.tags] : [],
      isMarked: websiteData.isMarked || false,
      isActive: websiteData.isActive !== undefined ? websiteData.isActive : true,
      isHidden: websiteData.isHidden || false,
      // 保留现有的图标相关字段
      iconData: websiteData.iconData || '',
      iconGenerateData: websiteData.iconGenerateData || ''
    }
    // 将标签数组转换为逗号分隔的字符串
    tagInput.value = websiteData.tags ? websiteData.tags.join(', ') : ''
  } else {
    // 新建网站时初始化所有字段
    form.value = {
      name: '',
      title: '',
      url: '',
      description: '',
      tags: [],
      isMarked: false,
      isActive: true,
      isHidden: false,
      iconData: '',
      iconGenerateData: ''
    }
    tagInput.value = ''
  }
}

// 关闭对话框
function closeDialog() {
  emit('update:modelValue', false)
}

// 验证表单
function validateForm() {
  // 验证URL格式
  try {
    new URL(form.value.url)
  } catch {
    notificationStore.warning('请输入有效的URL')
    return false
  }

  // 验证name、title、description至少有一个不为空
  const hasName = form.value.name && form.value.name.trim() !== ''
  const hasTitle = form.value.title && form.value.title.trim() !== ''
  const hasDescription = form.value.description && form.value.description.trim() !== ''
  
  if (!hasName && !hasTitle && !hasDescription) {
    notificationStore.warning('请填写网站名称、标题或描述中的至少一项')
    return false
  }

  return true
}

// 保存网站
async function saveWebsite() {
  if (!validateForm()) {
    return
  }

  try {
    // 将逗号分隔的字符串转换为标签数组
    const tagsArray = tagInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t)

    const websiteData = {
      ...form.value,
      tags: tagsArray,
      // 确保布尔值正确
      isMarked: !!form.value.isMarked,
      isActive: !!form.value.isActive,
      isHidden: !!form.value.isHidden,
      // 处理iconGenerateData，检查是否为Base64格式
      iconGenerateData: (() => {
        if (!form.value.iconGenerateData) return form.value.iconGenerateData
        if (typeof form.value.iconGenerateData !== 'string') return form.value.iconGenerateData
        if (form.value.iconGenerateData.startsWith('data:image/svg+xml;base64,') || 
            form.value.iconGenerateData.startsWith('data:image/svg+xml;utf8,')) {
          return form.value.iconGenerateData
        }
        try {
          return JSON.parse(form.value.iconGenerateData)
        } catch (e) {
          return form.value.iconGenerateData
        }
      })()
    }

    if (props.website) {
      // 更新现有网站
      websiteData.id = props.website.id
      await websiteStore.updateWebsite(props.website.id, websiteData)
      notificationStore.success('网站更新成功！')
    } else {
      // 添加新网站
      await websiteStore.addWebsite(websiteData)
      notificationStore.success('网站添加成功！')
    }

    emit('save', websiteData)
    closeDialog()
  } catch (error) {
    console.error('保存网站失败:', error)
    notificationStore.error('保存网站失败，请查看控制台获取详细信息')
  }
}

// 添加标签
function addTag() {
  const tag = tagInput.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

// 移除标签
function removeTag(index) {
  form.value.tags.splice(index, 1)
}

// 监听对话框打开状态
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    openDialog()
  }
}, { immediate: true })
</script>

<template>
  <div v-if="modelValue" class="dialog-overlay" @click.self="closeDialog">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ dialogTitle }}</h2>
        <button class="close-button" @click="closeDialog">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label for="website-name">网站名称</label>
          <input
            id="website-name"
            v-model="form.name"
            type="text"
            placeholder="例如：GitHub"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="website-title">网站标题</label>
          <input
            id="website-title"
            v-model="form.title"
            type="text"
            placeholder="例如：GitHub - 全球最大的代码托管平台"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="website-url">网站URL *</label>
          <div style="display: flex; gap: 8px;">
            <input
              id="website-url"
              v-model="form.url"
              type="text"
              placeholder="例如：github.com"
              class="form-input"
              style="flex: 1;"
            >
            <button
              type="button"
              class="button button-secondary"
              style="flex-shrink: 0; white-space: nowrap;"
              @click="fetchWebsiteMeta"
            >
              获取信息
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="website-description">描述</label>
          <textarea
            id="website-description"
            v-model="form.description"
            placeholder="简短描述这个网站"
            class="form-input"
            rows="2"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="website-icon">图标Base64编码</label>
          <textarea
            id="website-icon"
            v-model="form.iconData"
            type="text"
            placeholder="输入图标的base64编码"
            class="form-input"
            rows="3"
          ></textarea>
          <div class="icon-preview-small">
            <img v-if="form.iconData" :src="form.iconData" alt="网站图标">
            <div v-else class="icon-placeholder-small">?</div>
          </div>
        </div>

        <div class="form-group">
          <label for="website-svg">SVG图标代码</label>
          <textarea
            id="website-svg"
            v-model="form.iconGenerateData"
            type="text"
            placeholder="输入SVG代码"
            class="form-input"
            rows="3"
          ></textarea>
          <div class="icon-preview-small">
            <img v-if="form.iconGenerateData" :src="encodeSvg(form.iconGenerateData)" alt="SVG图标">
            <div v-else class="icon-placeholder-small">?</div>
          </div>
        </div>

        <div class="form-group">
          <label for="tag-input">标签</label>
          <div class="tags-input-container">
            <input
              id="tag-input"
              v-model="tagInput"
              type="text"
              class="form-input"
              placeholder="输入标签，用逗号分隔"
            >
            <div v-if="allTags.length > 0" class="tags-dropdown">
              <div
                v-for="tag in allTags"
                :key="tag"
                class="tag-item"
                :class="{ 'tag-added': isTagAdded(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </div>
            </div>
          </div>
          <div class="form-hint">点击标签可添加或移除</div>
        </div>

        <div class="form-group">
          <div class="form-group-title">网站设置</div>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="is-marked" name="isMarked" v-model="form.isMarked">
              <span>标记</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="is-active" name="isActive" v-model="form.isActive">
              <span>启用</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="is-hidden" name="isHidden" v-model="form.isHidden">
              <span>隐藏</span>
            </label>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button class="button button-secondary" @click="closeDialog">取消</button>
        <button class="button button-primary" @click="saveWebsite">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.dialog {
  background-color: var(--color-bg-card);
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-dark);
  color: var(--color-text-main);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-base);
  flex-shrink: 0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-main);
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: var(--color-bg-hover);
}

.dialog-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  overflow-x: hidden;
}

.form-group {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--color-text-main);
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tags-input-container {
  /* 标签输入容器 */
  width: 100%;
  box-sizing: border-box;
}

.tags-dropdown {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  box-sizing: border-box;
}

.tag-item {
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-main);
  background-color: var(--color-bg-hover);
  font-size: 13px;
  white-space: nowrap;
}

.tag-item:hover {
  background-color: var(--color-bg-active);
  transform: translateY(-1px);
}

.tag-item.tag-added {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.form-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.added-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: 13px;
  white-space: nowrap;
}

.remove-tag {
  margin-left: 6px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.remove-tag:hover {
  opacity: 1;
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-main);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
  margin-right: 6px;
}

.icon-preview-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-top: 8px;
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-bg-page);
}

.icon-preview-small img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.icon-preview-small div {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-preview-small svg {
  width: 100%;
  height: 100%;
}

.icon-placeholder-small {
  font-size: 24px;
  color: var(--color-text-secondary);
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border-base);
  flex-shrink: 0;
}

.button {
  flex: 1;
  padding: 12px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-secondary {
  background-color: var(--color-bg-hover);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
}

.button-secondary:hover {
  background-color: var(--color-bg-active);
  border-color: var(--color-border-base);
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.button-secondary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-light);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: var(--shadow-medium);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-dark);
}

.button-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-medium);
}
</style>
