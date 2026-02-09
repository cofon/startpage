<script setup>
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from '../stores/website'

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

// 表单数据
const form = ref({
  name: '',
  url: '',
  description: '',
  iconUrl: '',
  tags: [],
  isMarked: false,
  isActive: true,
  isHidden: false,
  // 图标相关字段
  iconData: null,
  iconGenerateData: null,
  iconCanFetch: true,
  iconFetchAttempts: 0,
  iconLastFetchTime: null,
  iconError: null
})

// 标签输入
const tagInput = ref('')

// 使用 store 中的所有标签
const allTags = computed(() => websiteStore.allTags)

// 判断标签是否已添加
function isTagAdded(tag) {
  return form.value.tags.includes(tag)
}

// 切换标签（添加或删除）
function toggleTag(tag) {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  } else {
    form.value.tags.push(tag)
  }
}

// 对话框标题
const dialogTitle = computed(() => {
  return props.website ? '编辑网站' : '添加网站'
})

// 打开对话框时初始化表单
function openDialog() {
  if (props.website) {
    form.value = {
      name: props.website.name,
      url: props.website.url,
      description: props.website.description || '',
      iconUrl: props.website.iconUrl || '',
      tags: props.website.tags ? [...props.website.tags] : [],
      isMarked: props.website.isMarked || false,
      isActive: props.website.isActive !== undefined ? props.website.isActive : true,
      isHidden: props.website.isHidden || false,
      // 保留现有的图标相关字段
      iconData: props.website.iconData || null,
      iconGenerateData: props.website.iconGenerateData || null,
      iconCanFetch: props.website.iconCanFetch !== undefined ? props.website.iconCanFetch : true,
      iconFetchAttempts: props.website.iconFetchAttempts || 0,
      iconLastFetchTime: props.website.iconLastFetchTime || null,
      iconError: props.website.iconError || null
    }
  } else {
    // 新建网站时初始化所有字段
    form.value = {
      name: '',
      url: '',
      description: '',
      iconUrl: '',
      tags: [],
      isMarked: false,
      isActive: true,
      isHidden: false,
      iconData: null,
      iconGenerateData: null,
      iconCanFetch: true,
      iconFetchAttempts: 0,
      iconLastFetchTime: null,
      iconError: null
    }
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

// 删除标签
function removeTag(tag) {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

// 处理标签输入回车
function handleTagInputKeydown(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  }
}

// 保存网站
function saveWebsite() {
  if (!form.value.name || !form.value.url) {
    alert('请填写网站名称和URL')
    return
  }

  // 处理标签输入：使用英文逗号、英文分号或空格分隔
  if (tagInput.value.trim()) {
    const newTags = tagInput.value
      .split(/[,;\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag && !form.value.tags.includes(tag))

    form.value.tags.push(...newTags)
  }

  // 如果URL没有协议，添加 https://
  let url = form.value.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // 如果没有提供图标URL，使用默认图标URL
  const iconUrl = form.value.iconUrl || url

  const websiteData = {
    ...form.value,
    url,
    iconUrl,
    // 确保包含所有图标相关字段
    iconData: form.value.iconData,
    iconGenerateData: form.value.iconGenerateData,
    iconCanFetch: form.value.iconCanFetch,
    iconFetchAttempts: form.value.iconFetchAttempts,
    iconLastFetchTime: form.value.iconLastFetchTime,
    iconError: form.value.iconError
  }

  emit('save', websiteData)
  closeDialog()
}

// 关闭对话框
function closeDialog() {
  emit('update:modelValue', false)
  // 移除焦点，避免焦点回到编辑按钮上
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

// 监听对话框打开
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    openDialog()
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
  } else {
    // 移除键盘事件监听
    document.removeEventListener('keydown', handleKeydown)
  }
})

// 处理键盘事件
function handleKeydown(event) {
  if (event.key === 'Escape') {
    closeDialog()
  }
}
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
          <label for="website-name">网站名称 *</label>
          <input
            id="website-name"
            v-model="form.name"
            type="text"
            placeholder="例如：GitHub"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="website-url">网站URL *</label>
          <input
            id="website-url"
            v-model="form.url"
            type="text"
            placeholder="例如：github.com"
            class="form-input"
          >
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
          <label for="website-icon">图标URL</label>
          <input
            id="website-icon"
            v-model="form.iconUrl"
            type="text"
            placeholder="图标URL（可选）"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label for="tag-input">标签</label>
          <div class="tags-input-container">
            <input
              v-model="tagInput"
              type="text"
              id="tag-input"
              name="tags"
              class="form-input"
              placeholder="输入标签，用逗号、分号或空格分隔"
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
          <div class="form-hint">点击保存按钮时添加标签，使用英文逗号、英文分号或空格分隔多个标签</div>
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
  background-color: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: #f5f5f5;
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
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.tags-input-container {
  /* 标签输入容器 */
  width: 100%;
  box-sizing: border-box;
}

.tags-dropdown {
  background-color: white;
  border: 1px solid #ddd;
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
  color: #333;
  background-color: #f0f0f0;
  font-size: 13px;
  white-space: nowrap;
}

.tag-item:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}

.tag-item.tag-added {
  background-color: #409eff;
  color: white;
}

.form-hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
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
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
  margin-right: 6px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
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
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.button-secondary:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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