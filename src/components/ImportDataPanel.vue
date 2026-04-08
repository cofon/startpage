<script setup>
import { ref, reactive } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

// 导入文件
const importFile = ref(null)

// 导入选项
const importOptions = reactive({
  originalImport: false,
  onDuplicate: 'skip',
  addNewTag: false,
  addMetaFailedTag: true
})

// 导入状态
const importStatus = reactive({
  isProcessing: false,
  progress: 0,
  message: '',
  result: null
})

// 选中的文件
const selectedFile = ref(null)

// 导入数据
async function handleImport() {
  if (!selectedFile.value) {
    notificationStore.error('请先选择要导入的文件')
    return
  }

  try {
    importStatus.isProcessing = true
    importStatus.progress = 0
    importStatus.message = '准备导入...'
    importStatus.result = null

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        let data
        let mode = 'auto'

        // 检查文件类型
        if (selectedFile.value.name.endsWith('.html')) {
          // Edge收藏夹文件
          const { parseEdgeFavorites } = await import('../services/importService')
          const websites = parseEdgeFavorites(e.target.result)
          data = { websites }
          mode = 'websites'
        } else {
          // JSON文件
          data = JSON.parse(e.target.result)
        }

        console.log('[ImportDataPanel] 解析导入数据:', data)

        // 使用 importService 统一处理导入逻辑
        const { importData } = await import('../services/importService')

        console.log('[ImportDataPanel] 使用 importService 统一导入...')

        const result = await importData(data, {
          mode,
          originalImport: importOptions.originalImport,
          onDuplicate: importOptions.onDuplicate,
          addNewTag: importOptions.addNewTag,
          addMetaFailedTag: importOptions.addMetaFailedTag,
          onIncomplete: 'enrich',
          onProgress: (progress) => {
            console.log('[ImportDataPanel] 导入进度:', progress)
            importStatus.message = progress.message || '导入中...'
            if (progress.processed && progress.total) {
              importStatus.progress = Math.round((progress.processed / progress.total) * 100)
            }
            if (progress.phase === 'enriching') {
              notificationStore.info(progress.message)
            }
          },
          onComplete: (result) => {
            console.log('[ImportDataPanel] 导入完成:', result)
          },
        })

        importStatus.result = result

        // 计算总数：成功 + 失败 + 跳过
        const total = (result.success || 0) + (result.failed || 0) + (result.skipped || 0)

        // 根据导入结果显示不同的成功消息
        if (total > 0) {
          notificationStore.success(
            `导入成功！共 ${total} 个网站，成功 ${result.success} 个，失败 ${result.failed} 个${result.skipped > 0 ? `，跳过 ${result.skipped} 个` : ''}`,
          )
        } else {
          notificationStore.success('导入成功！页面即将刷新...')
        }

        setTimeout(async () => {
          // 避免使用 window.location.reload()
          // 从数据库重新加载网站数据并更新 store
          const { useWebsiteStore } = await import('../stores/website')
          const websiteStore = useWebsiteStore()
          const { default: db } = await import('../utils/database')
          
          try {
            const websites = await db.getAllWebsites()
            websiteStore.setWebsites(websites)
          } catch (error) {
            console.error('重新加载网站数据失败:', error)
            // 如果重新加载失败，回退到页面刷新
            window.location.reload()
          }
        }, 1000)
      } catch (error) {
        console.error('解析导入文件失败:', error)
        notificationStore.error('导入文件格式错误: ' + error.message)
      } finally {
        importStatus.isProcessing = false
      }
    }
    reader.readAsText(selectedFile.value)
  } catch (error) {
    console.error('导入失败:', error)
    notificationStore.error('导入失败，请查看控制台获取详细信息')
    importStatus.isProcessing = false
  }
}

// 选择文件
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    notificationStore.info(`已选择文件: ${file.name}`)
  }
  // 清空文件输入，以便可以重新选择同一个文件
  event.target.value = ''
}

// 触发文件选择
function triggerFileSelect() {
  importFile.value?.click()
}
</script>

<template>
  <div class="import-export-panel">
    <h3>导入数据</h3>
    <p class="description">从备份文件或浏览器收藏夹中导入网站和设置数据。</p>
    
    <!-- 文件选择 -->
    <div class="file-section">
      <button class="action-button" @click="triggerFileSelect" :disabled="importStatus.isProcessing">
        <span class="icon">📥</span>
        {{ selectedFile ? '更换文件' : '选择文件' }}
      </button>
      <input
        ref="importFile"
        type="file"
        accept=".json,.html"
        style="display: none"
        @change="handleFileSelect"
      />
      <p class="selected-file" v-if="selectedFile">
        已选择：{{ selectedFile.name }}
      </p>
    </div>
    
    <!-- 操作设置 -->
    <div class="options-section" v-if="!importStatus.isProcessing && selectedFile">
      <h4>导入选项</h4>
      
      <!-- 原数据导入选项 -->
      <div class="option-item">
        <label>
          <input type="checkbox" v-model="importOptions.originalImport" />
          原数据导入（直接导入，不做任何修改）
        </label>
        <p class="option-desc">如果选择此选项，其他选项将被忽略，且要求数据库为空</p>
      </div>
      
      <!-- 重复数据处理 -->
      <div class="option-item" v-if="!importOptions.originalImport">
        <label>重复URL处理：</label>
        <div class="radio-group">
          <label class="radio-item">
            <input type="radio" value="skip" v-model="importOptions.onDuplicate" />
            跳过
          </label>
          <label class="radio-item">
            <input type="radio" value="overwrite" v-model="importOptions.onDuplicate" />
            覆盖
          </label>
        </div>
      </div>
      
      <!-- Tags处理 -->
      <div class="option-item" v-if="!importOptions.originalImport">
        <label>
          <input type="checkbox" v-model="importOptions.addNewTag" />
          如果tags为空，添加"new"标签
        </label>
      </div>
      
      <!-- meta_failed标签处理 -->
      <div class="option-item" v-if="!importOptions.originalImport">
        <label>
          <input type="checkbox" v-model="importOptions.addMetaFailedTag" />
          当获取元数据失败时添加"meta_failed"标签
        </label>
        <p class="option-desc">只有当网站没有title和description时才会添加</p>
      </div>
      
      <!-- 确认导入按钮 -->
      <div class="confirm-section">
        <button class="action-button confirm-button" @click="handleImport" :disabled="importStatus.isProcessing">
          <span class="icon">🚀</span>
          确认导入
        </button>
      </div>
    </div>
    
    <!-- 进度显示 -->
    <div class="progress-section" v-if="importStatus.isProcessing">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: importStatus.progress + '%' }"></div>
      </div>
      <p class="progress-message">{{ importStatus.message }}</p>
    </div>
    
    <!-- 结果显示 -->
    <div class="result-section" v-if="importStatus.result">
      <h4>导入结果</h4>
      <div class="result-item">成功：{{ importStatus.result.success }}</div>
      <div class="result-item">失败：{{ importStatus.result.failed }}</div>
      <div class="result-item">跳过：{{ importStatus.result.skipped }}</div>
      <div class="result-item">更新：{{ importStatus.result.updated }}</div>
    </div>
  </div>
</template>

<style scoped>
.import-export-panel {
  text-align: center;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.import-export-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.import-export-panel .description {
  margin: 0 0 20px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

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
}

.file-section {
  margin-bottom: 20px;
}

.selected-file {
  margin-top: 10px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.confirm-section {
  margin-top: 20px;
  text-align: center;
}

.confirm-button {
  background-color: var(--color-success);
}

.confirm-button:hover:not(:disabled) {
  background-color: var(--color-success-hover);
}

.action-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.action-button:disabled {
  background-color: var(--color-text-secondary);
  cursor: not-allowed;
}

.action-button .icon {
  font-size: 18px;
}

.options-section {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  text-align: left;
}

.options-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: var(--color-text-main);
}

.option-item {
  margin-bottom: 12px;
}

.option-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-main);
}

.option-item .option-desc {
  margin: 5px 0 0 24px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.radio-group {
  display: flex;
  gap: 20px;
  margin-left: 10px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: var(--color-text-main);
}

.progress-section {
  margin-top: 20px;
  text-align: left;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-background-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-message {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.result-section {
  margin-top: 20px;
  padding: 15px;
  background-color: var(--color-background-secondary);
  border-radius: 8px;
  text-align: left;
}

.result-section h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: var(--color-text-main);
}

.result-item {
  font-size: 14px;
  color: var(--color-text-main);
  margin-bottom: 5px;
}
</style>
