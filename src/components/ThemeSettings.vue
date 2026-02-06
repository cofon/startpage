<script setup>
import { ref, computed } from 'vue'
import { useSettingStore } from '../stores/setting'

const settingStore = useSettingStore()

// 当前选中的主题
const currentTheme = computed(() => settingStore.themes.find(t => t.id === settingStore.selectedThemeId))

// 编辑的主题数据
const editingTheme = ref({
  id: '',
  name: '',
  colors: {}
})

// 是否在编辑模式
const isEditing = computed(() => !!editingTheme.value.id)

// 颜色配置
const colorKeys = [
  // 基础颜色
  { key: 'primary', label: '主色调' },
  { key: 'primaryHover', label: '主色调悬停' },
  { key: 'primaryActive', label: '主色调激活' },
  // 文本颜色
  { key: 'textMain', label: '主要文本' },
  { key: 'textSecondary', label: '次要文本' },
  { key: 'textDisabled', label: '禁用文本' },
  { key: 'textOnPrimary', label: '主色调上的文本' },
  // 背景颜色
  { key: 'bgPage', label: '页面背景' },
  { key: 'bgCard', label: '卡片背景' },
  { key: 'bgHover', label: '悬停背景' },
  { key: 'bgActive', label: '激活背景' },
  // 边框和阴影
  { key: 'borderBase', label: '基础边框' },
  { key: 'borderFocus', label: '聚焦边框' },
  { key: 'shadowLight', label: '浅阴影' },
  { key: 'shadowMedium', label: '中等阴影' },
  { key: 'shadowDark', label: '深阴影' }
]

// 选择主题
function selectTheme(theme) {
  settingStore.setTheme(theme.id)
  loadThemeData(theme)
}

// 加载主题数据到编辑表单
function loadThemeData(theme) {
  editingTheme.value = {
    id: theme.id,
    name: theme.name,
    colors: { ...theme.colors }
  }
}

// 重置表单
function resetForm() {
  if (currentTheme.value) {
    loadThemeData(currentTheme.value)
  }
}

// 保存主题
async function saveTheme() {
  try {
    // 创建纯数据对象，确保可以被克隆
    const themeData = {
      id: editingTheme.value.id,
      name: editingTheme.value.name,
      colors: { ...editingTheme.value.colors }
    }

    if (isEditing.value) {
      // 更新现有主题
      await settingStore.updateTheme(themeData)
      alert('主题更新成功！')
    } else {
      // 添加新主题
      await settingStore.addTheme(themeData)
      alert('主题添加成功！')
      // 选择新添加的主题
      selectTheme(themeData)
    }
  } catch (error) {
    console.error('保存主题失败:', error)
    alert('保存主题失败，请查看控制台获取详细信息')
  }
}

// 开始添加新主题
function startAddTheme() {
  editingTheme.value = {
    id: '',
    name: '',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      textMain: '#1f2937',
      textSecondary: '#6b7280',
      textDisabled: '#9ca3af',
      textOnPrimary: '#ffffff',
      bgPage: '#f9fafb',
      bgCard: '#ffffff',
      bgHover: '#f3f4f6',
      bgActive: '#e5e7eb',
      borderBase: '#e5e7eb',
      borderFocus: '#3b82f6',
      shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
  }
}

// 初始化
if (currentTheme.value) {
  loadThemeData(currentTheme.value)
}
</script>

<template>
  <div class="theme-settings">
    <!-- 主题选择列表 -->
    <div class="theme-list">
      <div
        v-for="theme in settingStore.themes"
        :key="theme.id"
        class="theme-item"
        :class="{ active: theme.id === settingStore.selectedThemeId }"
        @click="selectTheme(theme)"
      >
        <div class="theme-color" :style="{ backgroundColor: theme.colors.primary }">
          <span v-if="theme.id === settingStore.selectedThemeId" class="check-icon">✓</span>
        </div>
        <span class="theme-name">{{ theme.name }}</span>
      </div>
    </div>

    <!-- 主题编辑表单 -->
    <div class="theme-editor">
      <h3>{{ isEditing ? '编辑主题' : '添加主题' }}</h3>

      <div class="form-group">
        <label>主题名称</label>
        <input v-model="editingTheme.name" type="text" class="form-input" placeholder="输入主题名称">
      </div>

      <div class="color-list">
        <div v-for="color in colorKeys" :key="color.key" class="color-item">
          <label>{{ color.label }}</label>
          <div class="color-input-group">
            <input
              v-if="!color.key.startsWith('shadow')"
              v-model="editingTheme.colors[color.key]"
              type="color"
              class="color-picker"
            >
            <input
              v-model="editingTheme.colors[color.key]"
              type="text"
              class="color-text"
              :placeholder="color.key.startsWith('shadow') ? '阴影值 (例如: 0 1px 2px 0 rgba(0, 0, 0, 0.05))' : '颜色值'"
            >
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button v-if="!isEditing" class="button button-secondary" @click="startAddTheme">
          重置
        </button>
        <button v-else class="button button-secondary" @click="resetForm">
          重置
        </button>
        <button class="button button-primary" @click="saveTheme">
          {{ isEditing ? '保存修改' : '添加主题' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-settings {
  padding: 20px;
}

.theme-list {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.theme-item:hover {
  background-color: var(--color-bg-hover);
}

.theme-item.active {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}

.theme-color {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.check-icon {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.theme-name {
  font-size: 14px;
  color: var(--color-text-main);
}

.theme-editor {
  background-color: var(--color-bg-card);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow-light);
}

.theme-editor h3 {
  margin: 0 0 20px 0;
  color: var(--color-text-main);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 14px;
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

.color-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-item label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.color-input-group {
  display: flex;
  gap: 8px;
}

.color-picker {
  width: 48px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--color-bg-page);
}

.color-text {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  font-family: monospace;
}

.color-text:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
