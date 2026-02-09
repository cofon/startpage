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
  { key: 'primary', label: '主色调', desc: '按钮、链接等' },
  { key: 'primaryHover', label: '主色调悬停态', desc: '按钮、链接等悬停时' },
  { key: 'primaryActive', label: '主色调激活态', desc: '按钮、链接等激活时' },
  // 文本颜色
  { key: 'textMain', label: '主要文本', desc: '标题、正文' },
  { key: 'textSecondary', label: '次要文本', desc: '描述、辅助信息' },
  { key: 'textDisabled', label: '禁用文本', desc: '禁用状态的文本' },
  { key: 'textOnPrimary', label: '主色调上的文字', desc: '如按钮文字' },
  // 背景颜色
  { key: 'bgPage', label: '页面背景', desc: '整个页面的背景色' },
  { key: 'bgCard', label: '卡片背景', desc: '卡片、面板等背景色' },
  { key: 'bgHover', label: '悬停背景', desc: '元素悬停时的背景色' },
  { key: 'bgActive', label: '激活背景', desc: '元素激活时的背景色' },
  // 边框和阴影
  { key: 'borderBase', label: '基础边框', desc: '默认边框颜色' },
  { key: 'borderFocus', label: '聚焦边框', desc: '元素聚焦时的边框颜色' },
  { key: 'shadowLight', label: '浅阴影', desc: '轻微的阴影效果' },
  { key: 'shadowMedium', label: '中等阴影', desc: '中等强度的阴影效果' },
  { key: 'shadowDark', label: '深阴影', desc: '较深的阴影效果' }
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
      const newTheme = await settingStore.addTheme(themeData)
      alert('主题添加成功！')
      // 选择新添加的主题
      selectTheme(newTheme)
      // 加载新主题的数据到编辑表单
      loadThemeData(newTheme)
    }
  } catch (error) {
    console.error('保存主题失败:', error)
    alert('保存主题失败，请查看控制台获取详细信息')
  }
}

// 删除主题
async function deleteTheme(themeId) {
  try {
    if (confirm('确定要删除这个主题吗？')) {
      await settingStore.deleteTheme(themeId)
      alert('主题删除成功！')
      // 如果删除的是当前编辑的主题，重置表单
      if (editingTheme.value.id === themeId) {
        resetForm()
      }
    }
  } catch (error) {
    console.error('删除主题失败:', error)
    alert(error.message || '删除主题失败，请查看控制台获取详细信息')
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

// 检查是否可以删除主题
function canDeleteTheme(themeId) {
  return !['light', 'dark', 'auto'].includes(themeId)
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
        <div class="theme-color">
          <svg viewBox="0 0 48 48" class="theme-circle">
            <circle cx="24" cy="24" r="24" :fill="theme.colors.primary" />
            <g v-if="theme.id === settingStore.selectedThemeId" class="check-icon">
              <path d="M14 24 L20 30 L34 16" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
            </g>
          </svg>
        </div>
        <span class="theme-name">{{ theme.name }}</span>
        <button
          v-if="canDeleteTheme(theme.id)"
          class="delete-button"
          @click.stop="deleteTheme(theme.id)"
          title="删除主题"
        >
          <svg viewBox="0 0 24 24" class="delete-icon">
            <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <!-- 添加新主题按钮 -->
      <div class="theme-item add-theme-item" @click="startAddTheme" title="添加新主题">
        <div class="theme-color">
          <div class="add-theme-circle">
            <div class="add-icon-plus">
              <span class="plus-horizontal"></span>
              <span class="plus-vertical"></span>
            </div>
          </div>
        </div>
        <span class="theme-name">添加主题</span>
      </div>
    </div>

    <!-- 主题编辑表单 -->
    <div class="theme-editor">
      <h3>{{ isEditing ? '编辑主题' : '添加主题' }}</h3>

      <div class="form-group">
        <label for="theme-name">主题名称</label>
        <input id="theme-name" v-model="editingTheme.name" type="text" class="form-input form-input-name" placeholder="输入主题名称">
      </div>

      <div class="color-list">
        <div v-for="color in colorKeys" :key="color.key" class="color-item">
          <label :for="color.key.startsWith('shadow') ? ('text-' + color.key) : ('color-' + color.key)">
            {{ color.label }}
            <span class="color-desc">{{ color.desc }}</span>
          </label>
          <div class="color-input-group">
            <input
              v-if="!color.key.startsWith('shadow')"
              :id="'color-' + color.key"
              v-model="editingTheme.colors[color.key]"
              type="color"
              class="color-picker"
            >
            <input
              :id="'text-' + color.key"
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
  max-width: 100%;
  overflow-x: visible;
}

.theme-list {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding: 4px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  padding-top: 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  min-width: 80px;
  overflow: visible;
}

.theme-item:hover .theme-circle {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1)) brightness(1.1);
}

.theme-item:hover .theme-circle circle {
  opacity: 0.9;
}

.theme-item.active {
}

.theme-color {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.theme-circle {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.check-icon {
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.theme-name {
  font-size: 14px;
  color: var(--color-text-main);
}

.delete-button {
  position: absolute;
  /* 将删除按钮的中心点放在大圆右上45度的边线上 */
  /* top: calc(18% - 7.03px);
  right: calc(25% - 7.03px); */
  top: calc(8%);
  right: calc(15%);
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.theme-item:hover .delete-button {
  opacity: 1;
}

.delete-button:hover {
  background-color: rgba(255, 0, 0, 0.9);
  transform: scale(1.1);
}

.delete-icon {
  width: 14px;
  height: 14px;
}

.add-theme-item {
  cursor: pointer;
  border: none;
  background-color: transparent;
}

.add-theme-item:hover {
  /* theme-item本身不显示背景色 */
}

.add-theme-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-border-base);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
}

.add-theme-circle:hover {
  border-color: transparent;
  background-color: var(--color-primary-hover);
}

.add-icon-plus {
  position: relative;
  width: 16px;
  height: 16px;
}

.add-icon-plus .plus-horizontal,
.add-icon-plus .plus-vertical {
  position: absolute;
  background-color: var(--color-text-secondary);
  transition: background-color 0.3s ease;
}

.add-icon-plus .plus-horizontal {
  width: 16px;
  height: 2px;
  top: 7px;
  left: 0;
}

.add-icon-plus .plus-vertical {
  width: 2px;
  height: 16px;
  top: 0;
  left: 7px;
}

.add-theme-circle:hover .add-icon-plus .plus-horizontal,
.add-theme-circle:hover .add-icon-plus .plus-vertical {
  background-color: var(--color-text-on-primary);
}

.theme-editor {
  background-color: var(--color-bg-card);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-light);
  border: 1px solid var(--color-border-base);
}

.theme-editor h3 {
  margin: 0 0 24px 0;
  color: var(--color-text-main);
  font-size: 18px;
  font-weight: 600;
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
  padding: 10px 14px;
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  transition: all 0.3s ease;
}

.form-input-name {
  width: 100%;
  max-width: calc(100% - 29px); /* 减去颜色选择器的宽度(48px) + gap(8px) */
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: var(--color-text-disabled);
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
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.color-desc {
  font-size: 12px;
  color: var(--color-text-disabled);
  font-weight: normal;
}

.color-input-group {
  display: flex;
  gap: 8px;
}

.color-picker {
  width: 48px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  cursor: pointer;
  background-color: var(--color-bg-page);
  transition: all 0.2s ease;
}

.color-picker:hover {
  border-color: var(--color-border-focus);
}

.color-text {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  font-family: monospace;
  transition: all 0.2s ease;
}

.color-text:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border-base);
}

.button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.button-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.button-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
}

.button-secondary:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-focus);
}
</style>
