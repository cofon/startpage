<script setup>
import { ref } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

// 导入文件
const importFile = ref(null)

// 导入数据
async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        console.log('[ImportDataPanel] 解析导入数据:', data)

        // 使用 importService 统一处理导入逻辑
        const { importData } = await import('../services/importService')

        console.log('[ImportDataPanel] 使用 importService 统一导入...')

        const result = await importData(data, {
          mode: 'auto',
          onIncomplete: 'enrich',
          onProgress: (progress) => {
            console.log('[ImportDataPanel] 导入进度:', progress)
            if (progress.phase === 'enriching') {
              notificationStore.info(progress.message)
            }
          },
          onComplete: (result) => {
            console.log('[ImportDataPanel] 导入完成:', result)
          },
        })

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

        setTimeout(() => {
          window.location.reload()
        }, 15000000000)
      } catch (error) {
        console.error('解析导入文件失败:', error)
        notificationStore.error('导入文件格式错误: ' + error.message)
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('导入失败:', error)
    notificationStore.error('导入失败，请查看控制台获取详细信息')
  }

  // 清空文件输入
  event.target.value = ''
}

// 触发导入
function triggerImport() {
  importFile.value?.click()
}
</script>

<template>
  <div class="import-export-panel">
    <h3>导入数据</h3>
    <p class="description">从备份文件中导入网站和设置数据。</p>
    <button class="action-button" @click="triggerImport">
      <span class="icon">📥</span>
      选择文件导入
    </button>
    <input
      ref="importFile"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImport"
    />
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

.action-button:hover {
  background-color: var(--color-primary-hover);
}

.action-button .icon {
  font-size: 18px;
}
</style>
