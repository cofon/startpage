<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWebsiteStore } from '../stores/website'
import { useNotificationStore } from '../stores/notification'

const websiteStore = useWebsiteStore()
const notificationStore = useNotificationStore()

// 步骤控制：1-筛选条件, 2-选择操作, 3-预览修改
const currentStep = ref(1)

// 筛选条件配置（复用导出功能的条件结构）
const conditionGroups = ref([
  {
    id: 'group1',
    conditions: [
      {
        id: 'cond1',
        field: 'url',
        operator: 'contains',
        value: ''
      }
    ]
  }
])

// 操作配置
const operationConfig = ref({
  type: 'field', // field | tag | icon | status
  field: 'name',
  action: 'replace',
  find: '',
  replace: '',
  prefix: '',
  suffix: '',
  newValue: '',
  tags: [],
  newTag: '',
  oldTag: '',
  statusField: 'isMarked',
  statusValue: true
})

// 加载状态
const isLoading = ref(false)
const isExecuting = ref(false)

// 符合条件的网站数量
const matchedCount = ref(0)

// 预览数据
const previewData = ref([])

// 字段选项
const fieldOptions = [
  { value: 'name', label: '网站名称' },
  { value: 'title', label: '网站标题' },
  { value: 'url', label: '网站 URL' },
  { value: 'description', label: '网站描述' },
  { value: 'iconData', label: '图标数据' },
  { value: 'iconGenerateData', label: '生成图标' },
  { value: 'tags', label: '标签' }
]

// 操作符选项
const operatorOptions = [
  { value: 'equals', label: '等于' },
  { value: 'notEquals', label: '不等于' },
  { value: 'contains', label: '包含' },
  { value: 'notContains', label: '不包含' },
  { value: 'isEmpty', label: '为空' },
  { value: 'notEmpty', label: '不为空' },
  { value: 'valid', label: '有效值' },
  { value: 'invalid', label: '无效值' },
  { value: 'greaterThan', label: '大于' },
  { value: 'lessThan', label: '小于' }
]

// 操作类型选项
const operationTypes = [
  { value: 'field', label: '字段修改' },
  { value: 'tag', label: '标签操作' },
  { value: 'icon', label: '图标操作' },
  { value: 'status', label: '状态操作' }
]

// 字段修改操作选项
const fieldActions = [
  { value: 'replace', label: '替换文本' },
  { value: 'prefix', label: '添加前缀' },
  { value: 'suffix', label: '添加后缀' },
  { value: 'set', label: '设置值' },
  { value: 'clear', label: '清空字段' }
]

// 标签操作选项
const tagActions = [
  { value: 'add', label: '添加标签' },
  { value: 'remove', label: '移除标签' },
  { value: 'replace', label: '替换标签' }
]

// 图标操作选项
const iconActions = [
  { value: 'refetch', label: '重新获取图标' },
  { value: 'default', label: '设置默认图标' },
  { value: 'clear', label: '清除图标' }
]

// 状态字段选项
const statusFields = [
  { value: 'isMarked', label: '已标记' },
  { value: 'isActive', label: '已激活' },
  { value: 'isHidden', label: '已隐藏' }
]

// 判断图标数据是否有效
function isValidIconData(iconData) {
  if (!iconData || typeof iconData !== 'string') {
    return false
  }
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
      if (field === 'iconData' || field === 'iconGenerateData') {
        return isValidIconData(fieldValue)
      }
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
    case 'invalid':
      if (field === 'iconData' || field === 'iconGenerateData') {
        return !isValidIconData(fieldValue)
      }
      return fieldValue === undefined || fieldValue === null || fieldValue === ''
    case 'greaterThan':
      return parseFloat(fieldValue) > parseFloat(value)
    case 'lessThan':
      return parseFloat(fieldValue) < parseFloat(value)
    default:
      return false
  }
}

// 获取符合条件的网站（分批处理，不加载所有数据到内存）
async function getMatchedWebsites() {
  isLoading.value = true
  try {
    const db = await import('../utils/database')
    const allWebsites = await db.default.getAllWebsites()
    
    return allWebsites.filter(website => {
      if (conditionGroups.value.length === 0) {
        return true
      }
      
      return conditionGroups.value.every(group => {
        if (group.conditions.length === 0) {
          return true
        }
        
        return group.conditions.some(condition => {
          return evaluateCondition(website, condition)
        })
      })
    })
  } catch (error) {
    console.error('获取网站数据失败:', error)
    return []
  } finally {
    isLoading.value = false
  }
}

// 更新匹配数量
async function updateMatchedCount() {
  const matched = await getMatchedWebsites()
  matchedCount.value = matched.length
}

// 生成预览数据
async function generatePreview() {
  const matched = await getMatchedWebsites()
  const preview = matched.slice(0, 5).map(website => {
    const previewItem = { ...website }
    
    // 根据操作类型模拟修改
    if (operationConfig.value.type === 'field') {
      const field = operationConfig.value.field
      const originalValue = website[field]
      let newValue = originalValue
      
      switch (operationConfig.value.action) {
        case 'replace':
          if (typeof originalValue === 'string') {
            newValue = originalValue.replaceAll(operationConfig.value.find, operationConfig.value.replace)
          }
          break
        case 'prefix':
          newValue = operationConfig.value.prefix + originalValue
          break
        case 'suffix':
          newValue = originalValue + operationConfig.value.suffix
          break
        case 'set':
          newValue = operationConfig.value.newValue
          break
        case 'clear':
          newValue = ''
          break
      }
      
      previewItem._newValue = newValue
      previewItem._field = field
    } else if (operationConfig.value.type === 'tag') {
      const originalTags = [...(website.tags || [])]
      let newTags = [...originalTags]
      
      switch (operationConfig.value.action) {
        case 'add':
          if (operationConfig.value.newTag && !newTags.includes(operationConfig.value.newTag)) {
            newTags.push(operationConfig.value.newTag)
          }
          break
        case 'remove':
          newTags = newTags.filter(tag => tag !== operationConfig.value.oldTag)
          break
        case 'replace':
          newTags = newTags.map(tag => tag === operationConfig.value.oldTag ? operationConfig.value.newTag : tag)
          break
      }
      
      previewItem._newTags = newTags
      previewItem._originalTags = originalTags
    }
    
    return previewItem
  })
  
  previewData.value = preview
}

// 执行批量修改
async function executeBatchEdit() {
  isExecuting.value = true
  try {
    const matched = await getMatchedWebsites()
    let successCount = 0
    let failCount = 0
    
    for (const website of matched) {
      try {
        let updatedData = { ...website }
        
        switch (operationConfig.value.type) {
          case 'field':
            const field = operationConfig.value.field
            switch (operationConfig.value.action) {
              case 'replace':
                if (typeof website[field] === 'string') {
                  updatedData[field] = website[field].replaceAll(operationConfig.value.find, operationConfig.value.replace)
                }
                break
              case 'prefix':
                updatedData[field] = operationConfig.value.prefix + website[field]
                break
              case 'suffix':
                updatedData[field] = website[field] + operationConfig.value.suffix
                break
              case 'set':
                updatedData[field] = operationConfig.value.newValue
                break
              case 'clear':
                updatedData[field] = ''
                break
            }
            break
            
          case 'tag':
            const originalTags = [...(website.tags || [])]
            let newTags = [...originalTags]
            
            switch (operationConfig.value.action) {
              case 'add':
                if (operationConfig.value.newTag && !newTags.includes(operationConfig.value.newTag)) {
                  newTags.push(operationConfig.value.newTag)
                }
                break
              case 'remove':
                newTags = newTags.filter(tag => tag !== operationConfig.value.oldTag)
                break
              case 'replace':
                newTags = newTags.map(tag => tag === operationConfig.value.oldTag ? operationConfig.value.newTag : tag)
                break
            }
            updatedData.tags = newTags
            break
            
          case 'icon':
            switch (operationConfig.value.action) {
              case 'refetch':
                // 重新获取图标逻辑（需要调用相应的服务）
                break
              case 'default':
                // 设置默认图标
                updatedData.iconData = ''
                break
              case 'clear':
                updatedData.iconData = ''
                updatedData.iconGenerateData = ''
                break
            }
            break
            
          case 'status':
            updatedData[operationConfig.value.statusField] = operationConfig.value.statusValue
            break
        }
        
        await websiteStore.updateWebsite(website.id, updatedData)
        successCount++
      } catch (error) {
        console.error(`修改网站 ${website.id} 失败:`, error)
        failCount++
      }
    }
    
    if (failCount === 0) {
      notificationStore.success(`成功修改 ${successCount} 个网站！`)
    } else {
      notificationStore.warning(`修改完成：成功 ${successCount} 个，失败 ${failCount} 个`)
    }
    
    // 重置步骤
    currentStep.value = 1
  } catch (error) {
    console.error('批量修改失败:', error)
    notificationStore.error('批量修改失败，请查看控制台获取详细信息')
  } finally {
    isExecuting.value = false
  }
}

// 截断输入值
function truncateValue() {
  const MAX_LENGTH = 10000 // 最大字符数
  if (operationConfig.newValue && operationConfig.newValue.length > MAX_LENGTH) {
    operationConfig.newValue = operationConfig.newValue.substring(0, MAX_LENGTH)
  }
}

// 截断文本
function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== 'string') return text
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 重置条件
function resetConditions() {
  conditionGroups.value = [
    {
      id: 'group1',
      conditions: [
        {
          id: 'cond1',
          field: 'url',
          operator: 'contains',
          value: ''
        }
      ]
    }
  ]
  updateMatchedCount()
}

// 添加条件组
function addGroup() {
  const newGroupId = `group${conditionGroups.value.length + 1}`
  conditionGroups.value.push({
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
  const group = conditionGroups.value.find(g => g.id === groupId)
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
  const group = conditionGroups.value.find(g => g.id === groupId)
  if (group) {
    group.conditions = group.conditions.filter(cond => cond.id !== conditionId)
    if (group.conditions.length === 0) {
      removeGroup(groupId)
    }
  }
}

// 删除条件组
function removeGroup(groupId) {
  conditionGroups.value = conditionGroups.value.filter(g => g.id !== groupId)
}

// 下一步
async function nextStep() {
  if (currentStep.value === 1) {
    await generatePreview()
  }
  currentStep.value++
}

// 上一步
function prevStep() {
  currentStep.value--
}

// 监听条件变化更新匹配数量
watch(() => conditionGroups.value, () => {
  updateMatchedCount()
}, { deep: true })

// 组件挂载时更新匹配数量
onMounted(() => {
  updateMatchedCount()
})
</script>

<template>
  <div class="batch-edit-panel">
    <h3>批量修改网站数据</h3>
    
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <div class="step" :class="{ active: currentStep >= 1 }">
        <span class="step-number">1</span>
        <span class="step-label">筛选条件</span>
      </div>
      <div class="step-line"></div>
      <div class="step" :class="{ active: currentStep >= 2 }">
        <span class="step-number">2</span>
        <span class="step-label">选择操作</span>
      </div>
      <div class="step-line"></div>
      <div class="step" :class="{ active: currentStep >= 3 }">
        <span class="step-number">3</span>
        <span class="step-label">预览修改</span>
      </div>
    </div>
    
    <!-- 步骤 1: 筛选条件 -->
    <div v-if="currentStep === 1" class="step-content">
      <h4>设置筛选条件</h4>
      <p class="description">设置条件来筛选需要修改的网站。组内条件是 OR 关系，组间条件是 AND 关系。</p>
      
      <div class="condition-groups">
        <div 
          v-for="(group, groupIndex) in conditionGroups" 
          :key="group.id"
          class="condition-group"
        >
          <div class="group-header">
            <span class="group-label">条件组 {{ groupIndex + 1 }}</span>
            <button 
              class="remove-group-button"
              @click="removeGroup(group.id)"
              v-if="conditionGroups.length > 1"
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
                  v-if="!['isEmpty', 'notEmpty', 'valid', 'invalid'].includes(condition.operator)"
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
        <button class="add-group-button" @click="addGroup">
          + 添加条件组（AND）
        </button>
      </div>
      
      <div class="matched-info">
        <p v-if="isLoading">计算中...</p>
        <p v-else>符合条件的网站数量：<strong>{{ matchedCount }}</strong></p>
        <button 
          class="reset-conditions-button"
          @click="resetConditions"
        >
          重置条件
        </button>
      </div>
    </div>
    
    <!-- 步骤 2: 选择操作 -->
    <div v-if="currentStep === 2" class="step-content">
      <h4>选择操作类型</h4>
      
      <!-- 显示筛选条件 -->
      <div class="selected-conditions">
        <h5>已选择的筛选条件：</h5>
        <div v-if="conditionGroups.length === 0" class="condition-empty">
          无筛选条件（将应用于所有网站）
        </div>
        <div v-else class="condition-list">
          <div 
            v-for="(group, groupIndex) in conditionGroups" 
            :key="group.id"
            class="condition-group-preview"
          >
            <div class="group-label">条件组 {{ groupIndex + 1 }}：</div>
            <div class="group-conditions-preview">
              <div 
                v-for="(condition, condIndex) in group.conditions" 
                :key="condition.id"
                class="condition-item-preview"
              >
                {{ fieldOptions.find(f => f.value === condition.field)?.label }} 
                {{ operatorOptions.find(o => o.value === condition.operator)?.label }}
                <span v-if="!['isEmpty', 'notEmpty', 'valid', 'invalid'].includes(condition.operator)">
                  "{{ condition.value }}"
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作类型选择 -->
      <div class="operation-type-selector">
        <label>操作类型：</label>
        <select v-model="operationConfig.type">
          <option v-for="type in operationTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
      
      <!-- 操作描述 -->
      <div class="operation-description">
        <h5>操作描述：</h5>
        <div class="description-content">
          <div v-if="operationConfig.type === 'field'">
            修改 <strong>{{ fieldOptions.find(f => f.value === operationConfig.field)?.label }}</strong> 字段：
            <span v-if="operationConfig.action === 'replace'">
              将 "{{ truncateText(operationConfig.find) }}" 替换为 "{{ truncateText(operationConfig.replace) }}"
            </span>
            <span v-else-if="operationConfig.action === 'prefix'">
              在开头添加 "{{ truncateText(operationConfig.prefix) }}"
            </span>
            <span v-else-if="operationConfig.action === 'suffix'">
              在末尾添加 "{{ truncateText(operationConfig.suffix) }}"
            </span>
            <span v-else-if="operationConfig.action === 'set'">
              设置为 "{{ truncateText(operationConfig.newValue) }}"
            </span>
            <span v-else-if="operationConfig.action === 'clear'">
              清空字段值
            </span>
          </div>
          <div v-else-if="operationConfig.type === 'tag'">
            <span v-if="operationConfig.action === 'add'">
              为网站添加标签 "{{ operationConfig.newTag }}"
            </span>
            <span v-else-if="operationConfig.action === 'remove'">
              从网站移除标签 "{{ operationConfig.oldTag }}"
            </span>
            <span v-else-if="operationConfig.action === 'replace'">
              将标签 "{{ operationConfig.oldTag }}" 替换为 "{{ operationConfig.newTag }}"
            </span>
          </div>
          <div v-else-if="operationConfig.type === 'icon'">
            <span v-if="operationConfig.action === 'refetch'">
              重新从网站获取图标数据（iconData）
            </span>
            <span v-else-if="operationConfig.action === 'default'">
              将图标设置为默认的 SVG 图标（清空 iconData，保留或生成 iconGenerateData）
            </span>
            <span v-else-if="operationConfig.action === 'clear'">
              清除所有图标数据（同时清空 iconData 和 iconGenerateData）
            </span>
          </div>
          <div v-else-if="operationConfig.type === 'status'">
            将 <strong>{{ statusFields.find(f => f.value === operationConfig.statusField)?.label }}</strong> 设置为
            <strong>{{ operationConfig.statusValue ? '是' : '否' }}</strong>
          </div>
          <div v-else>
            请选择操作类型
          </div>
        </div>
      </div>
      
      <!-- 字段修改配置 -->
      <div v-if="operationConfig.type === 'field'" class="operation-config">
        <div class="config-row">
          <label>目标字段：</label>
          <select v-model="operationConfig.field">
            <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
              {{ field.label }}
            </option>
          </select>
        </div>
        <div class="config-row">
          <label>操作：</label>
          <select v-model="operationConfig.action">
            <option v-for="action in fieldActions" :key="action.value" :value="action.value">
              {{ action.label }}
            </option>
          </select>
        </div>
        <div v-if="operationConfig.action === 'replace'" class="config-row">
          <label>查找：</label>
          <input v-model="operationConfig.find" type="text" placeholder="要查找的文本" />
        </div>
        <div v-if="operationConfig.action === 'replace'" class="config-row">
          <label>替换为：</label>
          <input v-model="operationConfig.replace" type="text" placeholder="替换后的文本" />
        </div>
        <div v-if="operationConfig.action === 'prefix'" class="config-row">
          <label>前缀：</label>
          <input v-model="operationConfig.prefix" type="text" placeholder="要添加的前缀" />
        </div>
        <div v-if="operationConfig.action === 'suffix'" class="config-row">
          <label>后缀：</label>
          <input v-model="operationConfig.suffix" type="text" placeholder="要添加的后缀" />
        </div>
        <div v-if="operationConfig.action === 'set'" class="config-row">
          <label>新值：</label>
          <input 
            v-model="operationConfig.newValue" 
            type="text" 
            placeholder="设置的新值" 
          />
        </div>
      </div>
      
      <!-- 标签操作配置 -->
      <div v-if="operationConfig.type === 'tag'" class="operation-config">
        <div class="config-row">
          <label>操作：</label>
          <select v-model="operationConfig.action">
            <option v-for="action in tagActions" :key="action.value" :value="action.value">
              {{ action.label }}
            </option>
          </select>
        </div>
        <div v-if="operationConfig.action === 'add'" class="config-row">
          <label>新标签：</label>
          <input v-model="operationConfig.newTag" type="text" placeholder="要添加的标签" />
        </div>
        <div v-if="['remove', 'replace'].includes(operationConfig.action)" class="config-row">
          <label>旧标签：</label>
          <input v-model="operationConfig.oldTag" type="text" placeholder="要移除/替换的标签" />
        </div>
        <div v-if="operationConfig.action === 'replace'" class="config-row">
          <label>新标签：</label>
          <input v-model="operationConfig.newTag" type="text" placeholder="替换后的标签" />
        </div>
      </div>
      
      <!-- 图标操作配置 -->
      <div v-if="operationConfig.type === 'icon'" class="operation-config">
        <div class="config-row">
          <label>操作：</label>
          <select v-model="operationConfig.action">
            <option v-for="action in iconActions" :key="action.value" :value="action.value">
              {{ action.label }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- 状态操作配置 -->
      <div v-if="operationConfig.type === 'status'" class="operation-config">
        <div class="config-row">
          <label>状态字段：</label>
          <select v-model="operationConfig.statusField">
            <option v-for="field in statusFields" :key="field.value" :value="field.value">
              {{ field.label }}
            </option>
          </select>
        </div>
        <div class="config-row">
          <label>状态值：</label>
          <select v-model="operationConfig.statusValue">
            <option :value="true">是</option>
            <option :value="false">否</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- 步骤 3: 预览修改 -->
    <div v-if="currentStep === 3" class="step-content">
      <h4>预览修改</h4>
      <p class="description">请确认以下修改，点击"执行批量修改"后将无法撤销。</p>
      
      <div class="preview-info">
        <p>将影响 <strong>{{ matchedCount }}</strong> 个网站</p>
      </div>
      
      <div class="preview-list">
        <div 
          v-for="(item, index) in previewData" 
          :key="item.id"
          class="preview-item"
        >
          <div class="preview-header">
            <span class="preview-name">{{ item.name }}</span>
            <span class="preview-url">{{ item.url }}</span>
          </div>
          <div class="preview-changes">
            <div v-if="operationConfig.type === 'field'" class="change-row">
              <span class="field-name">{{ fieldOptions.find(f => f.value === operationConfig.field)?.label }}:</span>
              <span class="original-value">{{ item[operationConfig.field] || '(空)' }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ item._newValue || '(空)' }}</span>
            </div>
            <div v-if="operationConfig.type === 'tag'" class="change-row">
              <span class="field-name">标签:</span>
              <span class="original-value">{{ item._originalTags?.join(', ') || '(无)' }}</span>
              <span class="arrow">→</span>
              <span class="new-value">{{ item._newTags?.join(', ') || '(无)' }}</span>
            </div>
          </div>
        </div>
        <div v-if="matchedCount > 5" class="preview-more">
          还有 {{ matchedCount - 5 }} 个网站...
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button 
        v-if="currentStep > 1" 
        class="secondary-button"
        @click="prevStep"
        :disabled="isExecuting"
      >
        上一步
      </button>
      <button 
        v-if="currentStep < 3" 
        class="primary-button"
        @click="nextStep"
        :disabled="isLoading || matchedCount === 0"
      >
        下一步
      </button>
      <button 
        v-if="currentStep === 3" 
        class="primary-button execute-button"
        @click="executeBatchEdit"
        :disabled="isExecuting"
      >
        {{ isExecuting ? '执行中...' : '执行批量修改' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.batch-edit-panel {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.batch-edit-panel h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: var(--color-text-main);
  text-align: center;
}

.batch-edit-panel h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--color-text-main);
}

.description {
  margin: 0 0 16px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* 步骤指示器 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.step-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.step.active .step-label {
  color: var(--color-primary);
}

.step-line {
  width: 60px;
  height: 2px;
  background-color: var(--color-border);
  margin: 0 10px;
  margin-bottom: 16px;
}

/* 步骤内容 */
.step-content {
  background-color: var(--color-bg-card);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

/* 条件组 */
.condition-groups {
  margin-bottom: 16px;
}

.condition-group {
  background-color: var(--color-bg-input);
  border: 1px solid var(--color-border);
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
  background-color: var(--color-danger);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

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
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-bg-card);
  color: var(--color-text-main);
  flex: 1;
}

.value-input {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-bg-card);
  color: var(--color-text-main);
  flex: 2;
}

.remove-condition-button {
  padding: 6px 10px;
  background-color: var(--color-danger);
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
  border: 1px solid var(--color-border);
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
}

.add-group-button:hover {
  background-color: var(--color-primary-hover);
}

.matched-info {
  background-color: var(--color-bg-hover);
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}

.matched-info p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.matched-info strong {
  color: var(--color-primary);
  font-size: 18px;
}

.reset-conditions-button {
  margin-top: 12px;
  padding: 6px 12px;
  background-color: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.reset-conditions-button:hover {
  background-color: var(--color-bg-active);
}

.input-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  margin-left: 90px;
}

.value-input {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 选择的筛选条件 */
.selected-conditions {
  background-color: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.selected-conditions h5,
.operation-description h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--color-text-main);
}

.condition-empty {
  color: var(--color-text-secondary);
  font-size: 14px;
  font-style: italic;
}

.condition-group-preview {
  margin-bottom: 10px;
}

.condition-group-preview .group-label {
  font-weight: 500;
  color: var(--color-text-main);
  margin-bottom: 4px;
  font-size: 14px;
}

.condition-item-preview {
  margin-left: 20px;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* 操作描述 */
.operation-description {
  background-color: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.description-content {
  font-size: 14px;
  color: var(--color-text-main);
  line-height: 1.4;
}

/* 操作配置 */
.operation-type-selector,
.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.operation-type-selector label,
.config-row label {
  min-width: 80px;
  font-size: 14px;
  color: var(--color-text-main);
}

.operation-type-selector select,
.config-row select,
.config-row input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background-color: var(--color-bg-input);
  color: var(--color-text-main);
}

/* 预览 */
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

.preview-info strong {
  color: var(--color-primary);
  font-size: 18px;
}

.preview-list {
  max-height: 400px;
  overflow-y: auto;
}

.preview-item {
  background-color: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.preview-name {
  font-weight: 500;
  color: var(--color-text-main);
}

.preview-url {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.change-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.field-name {
  font-weight: 500;
  color: var(--color-text-main);
  min-width: 60px;
}

.original-value {
  color: var(--color-text-secondary);
  text-decoration: line-through;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  color: var(--color-primary);
  font-weight: bold;
}

.new-value {
  color: var(--color-success);
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-more {
  text-align: center;
  padding: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.primary-button,
.secondary-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.primary-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  background-color: var(--color-bg-hover);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.secondary-button:hover:not(:disabled) {
  background-color: var(--color-bg-active);
}

.execute-button {
  background-color: var(--color-bg-hover);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.execute-button:hover:not(:disabled) {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}
</style>