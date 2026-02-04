<script setup>
import { ref, computed, watch } from 'vue'

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

// 由于websiteStore目前未被使用，暂时注释掉相关代码
// const websiteStore = useWebsiteStore()

// 表单数据
const form = ref({
  name: '',
  url: '',
  description: '',
  iconUrl: '',
  tags: [],
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
}

// 监听对话框打开
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    openDialog()
  }
})
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
          <label>标签</label>
          <div class="tags-input-container">
            <div class="tags-list">
              <span
                v-for="tag in form.tags"
                :key="tag"
                class="tag-item"
              >
                {{ tag }}
                <button class="tag-remove" @click="removeTag(tag)">×</button>
              </span>
            </div>
            <input
              v-model="tagInput"
              type="text"
              placeholder="输入标签后按回车添加"
              class="tag-input"
              @keydown="handleTagInputKeydown"
            >
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
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
}

.form-group {
  margin-bottom: 20px;
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
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.tags-input-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px;
  min-height: 40px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-remove {
  margin-left: 6px;
  cursor: pointer;
  background: none;
  border: none;
  font-size: 16px;
  line-height: 1;
  color: #1890ff;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-secondary {
  background-color: #f0f0f0;
  color: #333;
}

.button-secondary:hover {
  background-color: #e0e0e0;
}

.button-primary {
  background-color: #409eff;
  color: white;
}

.button-primary:hover {
  background-color: #66b1ff;
}
</style>