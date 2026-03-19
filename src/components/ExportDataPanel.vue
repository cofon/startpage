<script setup>
import { useSettingStore } from '../stores/setting'
import { useNotificationStore } from '../stores/notification'

const settingStore = useSettingStore()
const notificationStore = useNotificationStore()

// 导出数据
async function handleExport() {
  try {
    const db = await import('../utils/database')
    const data = await db.default.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 生成日期时间字符串，格式为：YYYYMMDDHHmmss
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}`
    a.download = `startpage-backup-${dateTimeStr}.json`

    a.click()
    URL.revokeObjectURL(url)
    settingStore.updateLastBackupTime()
    await settingStore.saveSettings()
    notificationStore.success('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    notificationStore.error('导出失败，请查看控制台获取详细信息')
  }
}
</script>

<template>
  <div class="import-export-panel">
    <h3>导出数据</h3>
    <p class="description">导出所有网站和设置数据到备份文件。</p>
    <button class="action-button" @click="handleExport">
      <span class="icon">📤</span>
      导出数据
    </button>
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

.last-backup {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>