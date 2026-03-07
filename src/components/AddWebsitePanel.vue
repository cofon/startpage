<script setup>
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from '../stores/website'
import { useNotificationStore } from '../stores/notification'
import {
  isValidUrl,
  extractSiteNameFromUrl,
  generateDefaultIcon,
  fetchWebsiteInfo,
  fetchWebsiteIcon
} from '../utils/websiteUtils'

const emit = defineEmits(['close'])

const websiteStore = useWebsiteStore()
const notificationStore = useNotificationStore()

// 表单数据
const formData = ref({
  name: '',
  url: '',
  description: '',
  tags: '',
  isMarked: false,
  isActive: true,
  isHidden: false,
  iconData: '',
  networkIconData: ''
})

// URL验证状态
const urlValidation = ref({
  isValid: false,
  message: ''
})

// 加载状态
const isLoading = ref(false)

// 获取所有标签
const allTags = computed(() => {
  const tags = new Set()
  websiteStore.websites.forEach(website => {
    if (website.tags && Array.isArray(website.tags)) {
      website.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

// 获取当前输入的标签列表
const currentTags = computed(() => {
  return formData.value.tags
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
})

// 检查标签是否已添加
function isTagAdded(tag) {
  return currentTags.value.includes(tag)
}

// 添加或移除标签
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

  formData.value.tags = tags.join(', ')
}

// 监听URL变化，自动填充网站名称和图标
watch(() => formData.value.url, async (newUrl) => {
  if (!newUrl) {
    urlValidation.value = {
      isValid: false,
      message: ''
    }
    formData.value.iconData = ''
    formData.value.networkIconData = ''
    return
  }

  // 验证URL
  if (isValidUrl(newUrl)) {
    urlValidation.value = {
      isValid: true,
      message: ''
    }

    // 立即生成图标（基于URL）
    const siteName = extractSiteNameFromUrl(newUrl)
    const iconSvg = generateDefaultIcon(siteName)
    formData.value.iconData = iconSvg

    // 如果名称为空，使用提取的网站名
    if (!formData.value.name) {
      formData.value.name = siteName
    }

    // 获取网站信息和图标
    isLoading.value = true
    try {
      // 获取网站信息（标题和描述）
      const { title, description } = await fetchWebsiteInfo(newUrl)

      // 使用获取到的标题更新名称
      if (title) {
        formData.value.name = title
        // 重新生成图标（基于真实的网站标题）
        formData.value.iconData = generateDefaultIcon(title)
      }

      // 使用获取到的描述（如果有）
      if (description) {
        formData.value.description = description
      }

      // 获取网站图标
      const networkIcon = await fetchWebsiteIcon(newUrl)
      if (networkIcon) {
        formData.value.networkIconData = networkIcon
      }
    } catch (error) {
      console.error('获取网站信息失败:', error)
    } finally {
      isLoading.value = false
    }
  } else {
    urlValidation.value = {
      isValid: false,
      message: '请输入有效的URL（如：https://www.example.com）'
    }
    formData.value.iconData = ''
    formData.value.networkIconData = ''
  }
})

// 提交表单
async function handleSubmit() {
  try {
    // 验证必填字段
    if (!formData.value.name || !formData.value.url) {
      notificationStore.warning('请填写网站名称和链接')
      return
    }

    // 验证URL格式
    if (!isValidUrl(formData.value.url)) {
      notificationStore.warning('请输入有效的URL')
      return
    }

    // 处理标签
    const tags = formData.value.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t)

    // 添加网站
    await websiteStore.addWebsite({
      name: formData.value.name,
      url: formData.value.url,
      description: formData.value.description,
      tags: tags,
      isMarked: formData.value.isMarked,
      markOrder: 0,
      visitCount: 0,
      isActive: formData.value.isActive,
      isHidden: formData.value.isHidden,
      iconData: formData.value.iconData,
      iconGenerateData: {
        type: 'default',
        siteName: formData.value.name
      }
    })

    // 等待一小段时间，确保数据库保存完成
    await new Promise(resolve => setTimeout(resolve, 100))

    notificationStore.success('网站添加成功！')
    emit('close')
  } catch (error) {
    console.error('添加网站失败:', error)
    notificationStore.error('添加网站失败，请查看控制台获取详细信息')
  }
}

// 取消
function handleCancel() {
  emit('close')
}
</script>

<template>
  <div class="add-website-panel">

    <div class="form-group">
      <label for="website-url">网站链接 <span class="required">*</span></label>
      <input
        id="website-url"
        v-model="formData.url"
        type="url"
        class="form-input"
        :class="{ 'error': !urlValidation.isValid && formData.url }"
        placeholder="https://example.com"
        maxlength="500"
      >
      <div v-if="!urlValidation.isValid && formData.url" class="error-message">
        {{ urlValidation.message }}
      </div>
    </div>

    <div class="form-group">
      <label for="website-name">网站名称 <span class="required">*</span></label>
      <input
        id="website-name"
        v-model="formData.name"
        type="text"
        class="form-input"
        placeholder="输入网站名称"
        maxlength="100"
      >
    </div>

    <!-- 图标预览 -->
    <div class="icon-preview">
      <label>网站图标预览</label>
      <div class="icon-display-container">
        <div class="icon-display">
          <div class="icon-label">自动生成</div>
          <div class="icon-image">
            <div v-if="formData.iconData" v-html="formData.iconData"></div>
            <div v-else class="icon-placeholder">
              <span class="placeholder-text">?</span>
            </div>
          </div>
        </div>
        <div class="icon-display">
          <div class="icon-label">网络获取</div>
          <div class="icon-image">
            <img 
              v-if="formData.networkIconData" 
              :src="formData.networkIconData" 
              alt="网站图标"
            >
            <div v-else class="icon-placeholder">
              <span class="placeholder-text">?</span>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="loading-indicator">
          <div class="spinner"></div>
          <span>正在获取网站信息...</span>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="website-description">网站描述</label>
      <textarea
        id="website-description"
        v-model="formData.description"
        class="form-textarea"
        placeholder="输入网站描述（可选）"
        rows="3"
        maxlength="500"
      ></textarea>
    </div>

    <div class="form-group">
      <div class="form-group-title">网站设置</div>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" id="is-marked" name="isMarked" v-model="formData.isMarked">
          <span>标记</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="is-active" name="isActive" v-model="formData.isActive">
          <span>启用</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="is-hidden" name="isHidden" v-model="formData.isHidden">
          <span>隐藏</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label for="website-tags">标签</label>
      <div class="tags-input-container">
        <input
          id="website-tags"
          v-model="formData.tags"
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

    <div class="form-actions">
      <button class="button button-secondary" @click="handleCancel">
        取消
      </button>
      <button class="button button-primary" @click="handleSubmit">
        添加网站
      </button>
    </div>
  </div>
</template>

<style scoped>
.add-website-panel {
  padding: 20px;
}

.add-website-panel h3 {
  margin: 0 0 24px 0;
  color: var(--color-text-main);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  transition: border-color 0.3s ease;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

/* 图标预览 */
.icon-preview {
  margin-bottom: 20px;
}

.icon-preview label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: var(--color-text-main);
}

.icon-display-container {
  display: flex;
  gap: 16px;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
  background-color: var(--color-bg-hover);
  border-radius: 12px;
  position: relative;
}

.icon-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.icon-image {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--color-bg-page);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-image svg {
  width: 100%;
  height: 100%;
}

.icon-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-hover);
  border: 2px dashed var(--color-border-base);
  border-radius: 12px;
}

.placeholder-text {
  font-size: 32px;
  font-weight: bold;
  color: var(--color-text-secondary);
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 标签输入容器 */
/* .tags-input-container {} */

.tags-dropdown {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.tag-item {
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-main);
  background-color: var(--color-bg-active);
  font-size: 13px;
  white-space: nowrap;
}

.tag-item:hover {
  background-color: var(--color-bg-hover);
  transform: translateY(-1px);
}

.tag-item.tag-added {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.tag-item.tag-added:hover {
  background-color: var(--color-primary-hover);
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-text-main);
  font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
  margin-right: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.button-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
}

.button-secondary:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-focus);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.button-secondary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
