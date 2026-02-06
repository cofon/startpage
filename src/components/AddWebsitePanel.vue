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
  tags: '',
  isMarked: false,
  isActive: true,
  isHidden: false
})

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
      isMarked: formData.value.isMarked,
      markOrder: 0,
      visitCount: 0,
      isActive: formData.value.isActive,
      isHidden: formData.value.isHidden
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
    tags: '',
    isMarked: false,
    isActive: true,
    isHidden: false
  }
}
</script>

<template>
  <div class="add-website-panel">

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

    <div class="form-group">
      <label for="website-url">网站链接 <span class="required">*</span></label>
      <input
        id="website-url"
        v-model="formData.url"
        type="url"
        class="form-input"
        placeholder="https://example.com"
        maxlength="500"
      >
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
  /* 标签输入容器 */
}

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
