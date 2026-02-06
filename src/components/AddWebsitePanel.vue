<script setup>
import { ref, computed } from 'vue'
import { useWebsiteStore } from '../stores/website'

const emit = defineEmits(['close'])

const websiteStore = useWebsiteStore()

// 表单数据
const formData = ref({
  name: '',
  url: '',
  description: '',
  tags: ''
})

// 标签输入框是否聚焦
const tagsInputFocused = ref(false)

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

// 添加标签
function addTag(tag) {
  const currentTags = formData.value.tags
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  if (!currentTags.includes(tag)) {
    formData.value.tags = [...currentTags, tag].join(', ')
  }
}

// 提交表单
async function handleSubmit() {
  try {
    // 验证必填字段
    if (!formData.value.name || !formData.value.url) {
      alert('请填写网站名称和链接')
      return
    }

    // 验证URL格式
    try {
      new URL(formData.value.url)
    } catch {
      alert('请输入有效的URL')
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
      isMarked: false,
      markOrder: 0,
      visitCount: 0,
      isActive: true,
      isHidden: false
    })

    alert('网站添加成功！')
    emit('close')
  } catch (error) {
    console.error('添加网站失败:', error)
    alert('添加网站失败，请查看控制台获取详细信息')
  }
}

// 重置表单
function resetForm() {
  formData.value = {
    name: '',
    url: '',
    description: '',
    tags: ''
  }
}
</script>

<template>
  <div class="add-website-panel">
    <h3>添加网站</h3>

    <div class="form-group">
      <label>网站名称 <span class="required">*</span></label>
      <input
        v-model="formData.name"
        type="text"
        class="form-input"
        placeholder="输入网站名称"
        maxlength="100"
      >
    </div>

    <div class="form-group">
      <label>网站链接 <span class="required">*</span></label>
      <input
        v-model="formData.url"
        type="url"
        class="form-input"
        placeholder="https://example.com"
        maxlength="500"
      >
    </div>

    <div class="form-group">
      <label>网站描述</label>
      <textarea
        v-model="formData.description"
        class="form-textarea"
        placeholder="输入网站描述（可选）"
        rows="3"
        maxlength="500"
      ></textarea>
    </div>

    <div class="form-group">
      <label>标签</label>
      <div class="tags-input-container">
        <input
          v-model="formData.tags"
          type="text"
          class="form-input"
          placeholder="输入标签，用逗号分隔"
          @focus="tagsInputFocused = true"
          @blur="tagsInputFocused = false"
        >
        <div v-if="tagsInputFocused && allTags.length > 0" class="tags-dropdown">
          <div
            v-for="tag in allTags"
            :key="tag"
            class="tag-item"
            @click="addTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
      <div class="form-hint">点击标签可快速添加</div>
    </div>

    <div class="form-actions">
      <button class="button button-secondary" @click="resetForm">
        重置
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

.tags-input-container {
  position: relative;
}

.tags-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: var(--shadow-medium);
  z-index: 10;
}

.tag-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--color-text-main);
}

.tag-item:hover {
  background-color: var(--color-bg-hover);
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.button-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}

.button-secondary:hover {
  background-color: var(--color-bg-hover);
}
</style>
