<script setup>
import { ref, computed } from 'vue'
import { useSettingStore } from '../stores/setting'
import { useNotificationStore } from '../stores/notification'
import { useWebsiteStore } from '../stores/website'

const settingStore = useSettingStore()
const notificationStore = useNotificationStore()
const websiteStore = useWebsiteStore()

// 导出模式：basic（全部导出）、default（默认条件导出）、custom（自定义条件导出）
const exportMode = ref('basic')

// 导出配置
const exportConfig = ref({
  // 基础设置
  format: 'json', // json、csv
  includeOtherTables: true, // 是否包含其他表（settings、themes、searchEngines）  
  // 默认条件导出的条件组
  defaultConditionGroups: [
    {
      id: 'group1',
      conditions: [
        {
          id: 'cond1',
          field: 'url',
          operator: 'notEmpty',
          value: ''
        }
      ]
    },
    {
      id: 'group2',
      conditions: [
        {
          id: 'cond2',
          field: 'name',
          operator: 'notEmpty',
          value: ''
        }
      ]
    },
    {
      id: 'group3',
      conditions: [
        {
          id: 'cond3-1',
          field: 'title',
          operator: 'notEmpty',
          value: ''
        },
        {
          id: 'cond3-2',
          field: 'description',
          operator: 'notEmpty',
          value: ''
        }
      ]
    },
    {
      id: 'group4',
      conditions: [
        {
          id: 'cond4',
          field: 'iconGenerateData',
          operator: 'notEmpty',
          value: ''
        }
      ]
    }
  ],
  
  // 自定义条件导出的条件组
  customConditionGroups: [
    {
      id: 'group1',
      conditions: [
        {
          id: 'cond1',
          field: 'url',
          operator: 'notEmpty',
          value: ''
        }
      ]
    }
  ],
  
  // 当前使用的条件组
  conditionGroups: [],
  
  fields: ['name', 'url', 'title', 'description', 'iconData', 'iconGenerateData', 'tags', 'isMarked', 'isActive', 'isHidden'],
  sortBy: 'createdAt',
  sortOrder: 'desc'
})



// 字段选项
const fieldOptions = [
  { value: 'name', label: '网站名称' },
  { value: 'title', label: '网站标题' },
  { value: 'url', label: '网站 URL' },
  { value: 'description', label: '网站描述' },
  { value: 'iconData', label: '图标数据' },
  { value: 'iconGenerateData', label: '生成图标' },
  { value: 'tags', label: '标签' },
  { value: 'isMarked', label: '已标记' },
  { value: 'isActive', label: '已激活' },
  { value: 'isHidden', label: '已隐藏' },
  { value: 'visitCount', label: '访问次数' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'updatedAt', label: '更新时间' }
]

// 操作符选项
const operatorOptions = [
  { value: 'equals', label: '等于' },
  { value: 'notEquals', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'notContains', label: '不包含' },
  { value: 'isEmpty', label: '为空' },
  { value: 'notEmpty', label: '不为空' },
  { value: 'valid', label: '有效' },
  { value: 'invalid', label: '无效' },
  { value: 'greaterThan', label: '大于' },
  { value: 'lessThan', label: '小于' }
]

// 逻辑关系选项
const logicOptions = [
  { value: 'AND', label: '并且' },
  { value: 'OR', label: '或者' }
]

// 导出格式选项
const formatOptions = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' }
]

// 排序字段选项
const sortFieldOptions = [
  { value: 'name', label: '网站名称' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'visitCount', label: '访问次数' },
  { value: 'markOrder', label: '标记顺序' }
]

// 排序顺序选项
const sortOrderOptions = [
  { value: 'asc', label: '升序' },
  { value: 'desc', label: '降序' }
]

// 存储数据加载状态
const isLoadingWebsites = ref(false)
// 存储符合条件的网站数量
const filteredWebsitesCount = ref(0)

// 从数据库获取网站数据并应用筛选
async function getFilteredWebsites() {
  isLoadingWebsites.value = true
  try {
    const db = await import('../utils/database')
    const allWebsites = await db.default.getAllWebsites()
    
    if (exportMode.value === 'basic') {
      return allWebsites
    }
    
    // 应用筛选条件
    return allWebsites.filter(website => {
      if (exportConfig.value.conditionGroups.length === 0) {
        return true
      }
      
      // 所有组都必须满足（组间是 AND 关系）
      return exportConfig.value.conditionGroups.every(group => {
        if (group.conditions.length === 0) {
          return true
        }
        
        // 组内至少有一个条件满足（组内是 OR 关系）
        return group.conditions.some(condition => {
          return evaluateCondition(website, condition)
        })
      })
    })
  } catch (error) {
    console.error('获取网站数据失败:', error)
    return []
  } finally {
    isLoadingWebsites.value = false
  }
}

// 更新符合条件的网站数量
async function updateFilteredCount() {
  const filteredWebsites = await getFilteredWebsites()
  filteredWebsitesCount.value = filteredWebsites.length
}

// 组件挂载时更新计数
import { onMounted } from 'vue'
onMounted(() => {
  updateFilteredCount()
})

// 监听条件变化时更新计数
import { watch } from 'vue'
watch(() => exportConfig.value.conditionGroups, () => {
  updateFilteredCount()
}, { deep: true })

// 监听导出模式变化
watch(() => exportMode.value, (newMode) => {
  if (newMode === 'basic') {
    // 全部导出：默认包含其他表
    exportConfig.value.includeOtherTables = true
  } else if (newMode === 'default') {
    // 默认条件导出：使用默认条件组，不包含其他表
    exportConfig.value.conditionGroups = JSON.parse(JSON.stringify(exportConfig.value.defaultConditionGroups))
    exportConfig.value.includeOtherTables = false
  } else if (newMode === 'custom') {
    // 自定义条件导出：使用自定义条件组，不包含其他表
    exportConfig.value.conditionGroups = JSON.parse(JSON.stringify(exportConfig.value.customConditionGroups))
    exportConfig.value.includeOtherTables = false
  }
  updateFilteredCount()
})

// 判断图标数据是否有效
function isValidIconData(iconData) {
  if (!iconData || typeof iconData !== 'string') {
    return false
  }
  // 检查是否是有效Base64编码的图片数据
  return iconData.startsWith('data:image/') && iconData.includes('base64,')
}

// 评估单个条件
function evaluateCondition(website, condition) {
  const { field, operator, value } = condition
  const fieldValue = website[field]
  
  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'notEquals':
      return fieldValue !== value
    case 'contains':
      return fieldValue && fieldValue.toString().includes(value)
    case 'notContains':
      return !fieldValue || !fieldValue.toString().includes(value)
    case 'isEmpty':
      return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)
    case 'notEmpty':
      return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)
    case 'valid':
      // 对于图标数据，判断是否是有效Base64编码
      if (field === 'iconData' || field === 'iconGenerateData') {
        return isValidIconData(fieldValue)
      }
      // 对于其他字段，非空即为有效
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
    case 'invalid':
      // 对于图标数据，判断是否是无效Base64编码
      if (field === 'iconData' || field === 'iconGenerateData') {
        return !isValidIconData(fieldValue)
      }
      // 对于其他字段，空值即为无效
      return fieldValue === undefined || fieldValue === null || fieldValue === ''
    case 'greaterThan':
      return parseFloat(fieldValue) > parseFloat(value)
    case 'lessThan':
      return parseFloat(fieldValue) < parseFloat(value)
    default:
      return false
  }
}

// 添加条件组
function addGroup() {
  const newGroupId = `group${exportConfig.value.conditionGroups.length + 1}`
  exportConfig.value.conditionGroups.push({
    id: newGroupId,
    conditions: [
      {
        id: `cond${newGroupId}-1`,
        field: 'name',
        operator: 'notEmpty',
        value: ''
      }
    ]
  })
}

// 在指定组中添加条件
function addCondition(groupId) {
  const group = exportConfig.value.conditionGroups.find(g => g.id === groupId)
  if (group) {
    const newId = `cond${groupId}-${group.conditions.length + 1}`
    group.conditions.push({
      id: newId,
      field: 'name',
      operator: 'notEmpty',
      value: ''
    })
  }
}

// 删除条件
function removeCondition(groupId, conditionId) {
  const group = exportConfig.value.conditionGroups.find(g => g.id === groupId)
  if (group) {
    group.conditions = group.conditions.filter(cond => cond.id !== conditionId)
    // 如果组内没有条件，删除该组
    if (group.conditions.length === 0) {
      removeGroup(groupId)
    }
  }
}

// 删除条件组
function removeGroup(groupId) {
  exportConfig.value.conditionGroups = exportConfig.value.conditionGroups.filter(g => g.id !== groupId)
}

// 重置条件
function resetConditions() {
  if (exportMode.value === 'default') {
    exportConfig.value.conditionGroups = JSON.parse(JSON.stringify(exportConfig.value.defaultConditionGroups))
  } else if (exportMode.value === 'custom') {
    exportConfig.value.conditionGroups = JSON.parse(JSON.stringify(exportConfig.value.customConditionGroups))
  }
  loadAllWebsites()
}



// 导出数据
async function handleExport() {
  try {
    const db = await import('../utils/database')
    
    // 准备导出数据
    let exportData = {
      version: 1,
      exportDate: new Date().toISOString()
    }
    
    // 获取符合条件的网站数据
    const websites = await getFilteredWebsites()
    
    // 排序
    if (exportConfig.value.sortBy) {
      websites.sort((a, b) => {
        const aValue = a[exportConfig.value.sortBy]
        const bValue = b[exportConfig.value.sortBy]
        
        if (aValue < bValue) {
          return exportConfig.value.sortOrder === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return exportConfig.value.sortOrder === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    
    // 过滤网站字段
    const exportWebsites = websites.map((site) => {
      const filteredSite = {}
      exportConfig.value.fields.forEach(field => {
        filteredSite[field] = site[field]
      })
      return filteredSite
    })
    
    exportData.websites = exportWebsites
    
    // 导出其他表数据
    if (exportConfig.value.includeOtherTables) {
      exportData.settings = await db.default.getSettings() || {}
      exportData.themes = await db.default.getAllThemes() || []
      exportData.searchEngines = await db.default.getAllSearchEngines() || []
    }
    
    // 生成导出文件
    let blob, fileName
    if (exportConfig.value.format === 'json') {
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      fileName = `startpage-export-${getDateTimeString()}.json`
    } else {
      // 生成 CSV
      const csvContent = generateCSV(exportWebsites)
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      fileName = `startpage-export-${getDateTimeString()}.csv`
    }
    
    // 下载文件
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    
    // 更新备份时间
    settingStore.updateLastBackupTime()
    await settingStore.saveSettings()
    notificationStore.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    notificationStore.error('导出失败，请查看控制台获取详细信息')
  }
}

// 生成日期时间字符串
function getDateTimeString() {
  const now = new Date()
  const year = now.getFullYear().toString()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}-${hours}${minutes}${seconds}`
}

// 生成 CSV 内容
function generateCSV(websites) {
  if (websites.length === 0) return ''
  
  const headers = exportConfig.value.fields
  const rows = websites.map(site => {
    return headers.map(field => {
      const value = site[field]
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') {
        // 处理包含逗号、引号或换行符的字符串
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return '"' + value.replace(/"/g, '""') + '"'
        }
        return value
      }
      if (Array.isArray(value)) {
        return '"' + value.join(', ').replace(/"/g, '""') + '"'
      }
      return value.toString()
    })
  })
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}
</script>

<template>
  <div class="import-export-panel">
    <h3>导出数据</h3>
    
    <!-- 导出模式选择 -->
    <div class="export-mode-selector">
      <label>
        <input type="radio" v-model="exportMode" value="basic" />
        全部导出
      </label>
      <label>
        <input type="radio" v-model="exportMode" value="default" />
        默认条件导出
      </label>
      <label>
        <input type="radio" v-model="exportMode" value="custom" />
        自定义条件导出
      </label>
    </div>
    
    <!-- 基础导出选项 -->
    <div v-if="exportMode === 'basic'" class="export-options">
      <p class="description">导出所有网站和设置数据到备份文件</p>
      
      <!-- 其他表导出选项 -->
      <div class="export-option">
        <label>
          <input type="checkbox" v-model="exportConfig.includeOtherTables" />
          包含设置、主题和搜索引擎数据
        </label>
      </div>
      
      <!-- 导出格式选择 -->
      <div class="export-option">
        <label>导出格式：</label>
        <select v-model="exportConfig.format">
          <option v-for="option in formatOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- 条件导出选项 -->
    <div v-else-if="exportMode === 'default' || exportMode === 'custom'" class="export-options advanced-export">

      
      <!-- 条件编辑 -->
      <div class="conditions-editor">
        <h4>筛选条件</h4>
        <div 
          v-for="(group, groupIndex) in exportConfig.conditionGroups" 
          :key="group.id"
          class="condition-group"
        >
          <div class="group-header">
            <span class="group-label">条件组{{ groupIndex + 1 }}</span>
            <button 
              class="remove-group-button"
              @click="removeGroup(group.id)"
              v-if="exportConfig.conditionGroups.length > 1"
            >
              ×
            </button>
          </div>
          <div class="group-conditions">
            <div 
              v-for="(condition, condIndex) in group.conditions" 
              :key="condition.id"
              class="condition-item"
            >
              <div class="condition-fields">
                <select v-model="condition.field" class="field-selector">
                  <option v-for="option in fieldOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <select v-model="condition.operator" class="operator-selector">
                  <option v-for="option in operatorOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <input 
                  v-model="condition.value" 
                  type="text" 
                  class="value-input"
                  placeholder="输入值"
                />
                <button 
                  class="remove-condition-button"
                  @click="removeCondition(group.id, condition.id)"
                >
                  ×
                </button>
              </div>
            </div>
            <button 
              class="add-condition-button"
              @click="addCondition(group.id)"
            >
              + 添加条件（OR）
            </button>
          </div>
        </div>
        <div class="condition-actions">
          <button class="add-group-button" @click="addGroup">
            + 添加条件组（AND）
          </button>
          <button 
            class="reset-conditions-button"
            @click="resetConditions"
          >
            重置条件
          </button>
        </div>
      </div>
      
      <!-- 导出配置 -->
      <div class="export-config">
        <!-- 字段选择 -->
        <div class="config-section">
          <h4>导出字段</h4>
          <div class="field-checkboxes">
            <label v-for="field in fieldOptions" :key="field.value" class="field-checkbox">
              <input 
                type="checkbox" 
                :checked="exportConfig.fields.includes(field.value)"
                @change="(e) => {
                  if (e.target.checked) {
                    exportConfig.fields.push(field.value)
                  } else {
                    exportConfig.fields = exportConfig.fields.filter(f => f !== field.value)
                  }
                }"
              />
              {{ field.label }}
            </label>
          </div>
        </div>
        
        <!-- 排序选项 -->
        <div class="config-section">
          <h4>排序选项</h4>
          <div class="sort-options">
            <div class="sort-option">
              <label>排序字段：</label>
              <select v-model="exportConfig.sortBy">
                <option v-for="option in sortFieldOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="sort-option">
              <label>排序顺序：</label>
              <select v-model="exportConfig.sortOrder">
                <option v-for="option in sortOrderOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- 其他选项 -->
        <div class="config-section">
          <h4>其他选项</h4>
          <div class="export-option">
            <label>
              <input type="checkbox" v-model="exportConfig.includeOtherTables" />
              包含设置、主题和搜索引擎数据
            </label>
          </div>
          <div class="export-option">
            <label>导出格式：</label>
            <select v-model="exportConfig.format">
              <option v-for="option in formatOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 预览信息 -->
      <div class="preview-info">
        <p v-if="isLoadingWebsites">加载数据中...</p>
        <p v-else>符合条件的网站数量：{{ filteredWebsitesCount }}</p>
      </div>
    </div>
    
    <!-- 导出按钮 -->
    <button class="action-button" @click="handleExport">
      <span class="icon">📤</span>
      导出数据
    </button>
    
    <!-- 上次备份时间 -->
    <p v-if="settingStore.lastBackupTime" class="last-backup">
      上次备份：{{ new Date(settingStore.lastBackupTime).toLocaleString() }}
    </p>
  </div>
</template>

<style scoped>
.import-export-panel {
  text-align: center;
  padding: 20px;
}

.import-export-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.import-export-panel h4 {
  margin: 16px 0 8px 0;
  font-size: 16px;
  color: var(--color-text-main);
  text-align: left;
}

.import-export-panel .description {
  margin: 0 0 20px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* 导出模式选择 */
.export-mode-selector {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.export-mode-selector label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  white-space: nowrap;
}

/* 导出选项 */
.export-options {
  margin-bottom: 20px;
  text-align: left;
}

.export-option {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.export-option label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.export-option select {
  padding: 6px 10px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
}

/* 高级导出 */
.advanced-export {
  background-color: var(--color-bg-card);
  padding: 16px;
  border-radius: 8px;
}



/* 条件编辑器 */
.conditions-editor {
  margin-bottom: 16px;
}

/* 条件组 */
.condition-group {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.group-label {
  font-weight: 500;
  color: var(--color-text-main);
}

.remove-group-button {
  padding: 4px 8px;
  background-color: var(--color-danger, #ef4444);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.group-conditions {
  margin-top: 10px;
}

/* 条件项 */
.condition-item {
  margin-bottom: 10px;
}

.condition-fields {
  display: flex;
  gap: 10px;
  flex: 1;
}

.field-selector,
.operator-selector {
  padding: 6px 10px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  flex: 1;
}

.value-input {
  padding: 6px 10px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  flex: 2;
}

.remove-condition-button {
  padding: 6px 10px;
  background-color: var(--color-danger, #ef4444);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.add-condition-button {
  padding: 6px 12px;
  background-color: var(--color-bg-hover);
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.add-condition-button:hover {
  background-color: var(--color-bg-active);
}

.add-group-button {
  padding: 8px 16px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-top: 10px;
}

.add-group-button:hover {
  background-color: var(--color-primary-hover);
}

/* 条件操作按钮容器 */
.condition-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 重置条件按钮 */
.reset-conditions-button {
  padding: 8px 16px;
  background-color: var(--color-bg-hover);
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.reset-conditions-button:hover {
  background-color: var(--color-bg-active);
}

/* 导出配置 */
.export-config {
  margin-bottom: 16px;
}

.config-section {
  margin-bottom: 16px;
}

.field-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
}

.sort-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-option select {
  padding: 6px 10px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  min-width: 120px;
}

/* 预览信息 */
.preview-info {
  background-color: var(--color-bg-hover);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
}

.preview-info p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 操作按钮 */
.action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.action-button:hover {
  background-color: var(--color-primary-hover);
}

.action-button .icon {
  font-size: 18px;
}

.last-backup {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: center;
}
</style>
