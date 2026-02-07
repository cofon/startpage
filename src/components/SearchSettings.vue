<script setup>
import { ref, computed } from 'vue'
import { useSettingStore } from '../stores/setting'

const settingStore = useSettingStore()

// 编辑模式
const editingEngineId = ref(null)

// 编辑的搜索引擎数据
const editingEngine = ref({
  id: '',
  name: '',
  template: '',
  icon: '',
  iconColor: '#6b7280'
})

// 是否在编辑模式
const isEditing = computed(() => !!editingEngineId.value)

// 开始编辑搜索引擎
function startEdit(engine) {
  editingEngineId.value = engine.id
  editingEngine.value = {
    id: engine.id,
    name: engine.name,
    template: engine.template,
    icon: engine.icon,
    iconColor: engine.iconColor || '#6b7280'
  }
}

// 开始添加搜索引擎
function startAddEngine() {
  editingEngineId.value = null
  editingEngine.value = {
    id: '',
    name: '',
    template: '',
    icon: '',
    iconColor: '#6b7280'
  }
}

// 保存搜索引擎
async function saveEngine() {
  try {
    // 验证必填字段
    if (!editingEngine.value.name || !editingEngine.value.template) {
      alert('请填写完整的搜索引擎信息')
      return
    }

    // 验证模板是否包含 {query} 占位符
    if (!editingEngine.value.template.includes('{query}')) {
      alert('搜索模板必须包含 {query} 占位符')
      return
    }

    if (isEditing.value) {
      // 更新现有搜索引擎
      await settingStore.updateSearchEngine(editingEngine.value)
      alert('搜索引擎更新成功！')
    } else {
      // 添加新搜索引擎
      await settingStore.addSearchEngine(editingEngine.value)
      alert('搜索引擎添加成功！')
    }

    // 重置表单
    startAddEngine()
  } catch (error) {
    console.error('保存搜索引擎失败:', error)
    alert('保存搜索引擎失败，请查看控制台获取详细信息')
  }
}

// 删除搜索引擎
async function deleteEngine(engineId) {
  const engine = settingStore.searchEngines.find(e => e.id === engineId)
  if (confirm(`确定要删除 "${engine?.name}" 搜索引擎吗？`)) {
    try {
      await settingStore.deleteSearchEngine(engineId)
      alert('搜索引擎删除成功！')

      // 如果删除的是当前编辑的搜索引擎，重置表单
      if (editingEngineId.value === engineId) {
        startAddEngine()
      }
    } catch (error) {
      console.error('删除搜索引擎失败:', error)
      alert('删除搜索引擎失败，请查看控制台获取详细信息')
    }
  }
}

// 取消编辑
function cancelEdit() {
  startAddEngine()
}

// 拖拽排序相关
const draggingIndex = ref(-1)

function handleDragStart(index) {
  draggingIndex.value = index
}

function handleDragOver(index) {
  if (draggingIndex.value === -1 || draggingIndex.value === index) return

  const engines = [...settingStore.searchEngines]
  const draggedEngine = engines[draggingIndex.value]
  engines.splice(draggingIndex.value, 1)
  engines.splice(index, 0, draggedEngine)

  // 更新搜索引擎列表
  settingStore.searchEngines.splice(0, settingStore.searchEngines.length, ...engines)
  draggingIndex.value = index
}

async function handleDropOnList(event) {
  event.preventDefault()

  if (draggingIndex.value === -1) {
    return
  }

  // 保存新的排序
  const engines = settingStore.searchEngines.map((engine, i) => ({
    ...engine,
    order: i + 1,
    updatedAt: new Date().toISOString()
  }))

  // 更新数据库中的顺序
  try {
    for (const engine of engines) {
      await settingStore.updateSearchEngine(engine)
    }
  } catch (error) {
    console.error('保存搜索引擎排序失败:', error)
    alert('保存排序失败，请查看控制台获取详细信息')
  }

  draggingIndex.value = -1
}

function handleDragEnd() {
  draggingIndex.value = -1
}
</script>

<template>
  <div class="search-settings">
    <!-- 搜索引擎列表 -->
    <div 
      class="engine-list"
      @dragover.prevent
      @drop="handleDropOnList"
    >
      <div
        v-for="(engine, index) in settingStore.searchEngines"
        :key="engine.id"
        class="engine-item"
        :class="{ editing: editingEngineId === engine.id, dragging: draggingIndex === index }"
        draggable="true"
        @dragstart="handleDragStart(index)"
        @dragover.prevent="handleDragOver(index)"
        @dragend="handleDragEnd"
      >
        <div class="engine-info">
          <div class="drag-handle">⋮⋮</div>
          <div class="engine-icon" :style="{ color: engine.iconColor }">
            <div v-if="engine.icon && engine.icon.startsWith('<svg')" v-html="engine.icon" class="icon-image"></div>
            <img v-else-if="engine.icon" :src="engine.icon" :alt="engine.name" class="icon-image">
            <span v-else class="icon-placeholder">{{ engine.name[0] }}</span>
          </div>
          <div class="engine-details">
            <div class="engine-name">{{ engine.name }}</div>
            <div class="engine-template">{{ engine.template }}</div>
          </div>
        </div>
        <div class="engine-actions">
          <button
            class="action-button edit-button"
            @click="startEdit(engine)"
            title="编辑"
          >
            ✎
          </button>
          <button
            v-if="engine.id !== 'local'"
            class="action-button delete-button"
            @click="deleteEngine(engine.id)"
            title="删除"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索引擎编辑表单 -->
    <div class="engine-editor">
      <h3>{{ isEditing ? '编辑搜索引擎' : '添加搜索引擎' }}</h3>

      <div class="form-group">
        <label for="engine-icon">图标</label>
        <div class="icon-input-group">
          <input
            id="engine-icon"
            v-model="editingEngine.icon"
            type="text"
            class="form-input"
            placeholder="图标URL"
          >
          <div class="icon-preview" :style="{ color: editingEngine.iconColor }">
            <div v-if="editingEngine.icon && editingEngine.icon.startsWith('<svg')" v-html="editingEngine.icon" class="icon-image"></div>
            <img v-else-if="editingEngine.icon" :src="editingEngine.icon" :alt="editingEngine.name || '预览'" class="icon-image">
            <span v-else class="icon-placeholder">{{ editingEngine.name[0] || '?' }}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="engine-icon-color-text">图标颜色</label>
        <div class="color-input-group">
          <input
            id="engine-icon-color"
            v-model="editingEngine.iconColor"
            type="color"
            class="color-picker"
          >
          <input
            id="engine-icon-color-text"
            v-model="editingEngine.iconColor"
            type="text"
            class="color-text"
            placeholder="#6b7280"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="engine-name">名称</label>
        <input
          id="engine-name"
          v-model="editingEngine.name"
          type="text"
          class="form-input"
          placeholder="搜索引擎名称"
        >
      </div>

      <div class="form-group">
        <label for="engine-template">搜索模板</label>
        <input
          id="engine-template"
          v-model="editingEngine.template"
          type="text"
          class="form-input"
          placeholder="搜索URL（使用 {query} 作为查询参数）"
        >
        <div class="form-hint">例如：https://www.baidu.com/s?wd={query}</div>
      </div>

      <div class="form-actions">
        <button class="button button-secondary" @click="cancelEdit">
          取消
        </button>
        <button class="button button-primary" @click="saveEngine">
          {{ isEditing ? '保存修改' : '添加搜索引擎' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-settings {
  padding: 20px;
}

.engine-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.engine-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  background-color: var(--color-bg-card);
  transition: all 0.3s ease;
  cursor: move;
}

.engine-item:hover {
  border-color: var(--color-border-base);
}

.engine-item.editing {
  border-color: var(--color-primary);
  background-color: var(--color-bg-hover);
}

.engine-item.dragging {
  opacity: 0.5;
  transform: scale(1.02);
}

.engine-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  color: var(--color-text-disabled);
  font-size: 16px;
  cursor: grab;
  flex-shrink: 0;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.engine-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: var(--color-bg-page);
  flex-shrink: 0;
}

.icon-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.icon-placeholder {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text-secondary);
}

.engine-details {
  flex: 1;
  min-width: 0;
}

.engine-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-main);
  margin-bottom: 4px;
}

.engine-template {
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.engine-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background-color: var(--color-bg-page);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-main);
}

.edit-button:hover {
  color: var(--color-primary);
}

.delete-button:hover {
  color: #ef4444;
}

.engine-editor {
  background-color: var(--color-bg-card);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--shadow-light);
}

.engine-editor h3 {
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

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-disabled);
}

.icon-input-group {
  display: flex;
  gap: 12px;
}

.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: var(--color-bg-page);
  flex-shrink: 0;
}

.color-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.color-picker {
  width: 48px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  cursor: pointer;
  background-color: var(--color-bg-page);
  flex-shrink: 0;
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
}

.button-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}

.button-secondary:hover {
  background-color: var(--color-bg-hover);
}
</style>
