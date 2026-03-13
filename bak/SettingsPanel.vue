<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingStore } from '../src/stores/setting'
import { useWebsiteStore } from '../src/stores/website'
import { useNotificationStore } from '../src/stores/notification'
import db from '../src/utils/database'
// import iconManager from '../utils/iconManager'
import ThemeSettings from './ThemeSettings.vue'
import SearchSettings from './SearchSettings.vue'
import AddWebsitePanel from './AddWebsitePanel.vue'
import { importData } from '../src/services/importService'
import { classifyError, getUserFriendlyMessage, shouldStopImport, ErrorType } from '../src/utils/errorHandler'
// import LayoutSwitch from './LayoutSwitch-伪删除.vue'

// 点击外部关闭指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  },
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'blur-settings-button'])

const settingStore = useSettingStore()
const websiteStore = useWebsiteStore()
const notificationStore = useNotificationStore()

// 当前显示的面板
const activePanel = ref('theme') // 'theme' | 'search' | 'add-website' | ''

// 导入/导出
const importFile = ref(null)

// 导入状态管理
const importState = ref({
  isImporting: false,
  progress: 0,
  total: 0,
  phase: '',
  message: '',
  result: null,
  showResult: false
})

// 更多菜单
const showMoreMenu = ref(false)

// 关闭更多菜单
function closeMoreMenu() {
  showMoreMenu.value = false
}

// 延迟关闭更多菜单
function closeMoreMenuDelayed() {
  setTimeout(() => {
    showMoreMenu.value = false
  }, 100)
}

// 触发导入
function triggerImport() {
  importFile.value?.click()
  closeMoreMenuDelayed()
}

// 切换面板
function setActivePanel(panel) {
  activePanel.value = activePanel.value === panel ? '' : panel
}

// 导出数据
async function handleExport() {
  try {
    const data = await db.exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // 生成日期时间字符串，格式为：YYYYMMDDHHmmss
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0') // 月份从0开始，需要加1
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}`
    a.download = `startpage-backup-${dateTimeStr}.json`

    a.click()
    URL.revokeObjectURL(url)
    settingStore.updateLastBackupTime()
    await saveSettings()
    notificationStore.success('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    notificationStore.error('导出失败，请查看控制台获取详细信息')
  }
}

// 导入数据
async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    // 1. 验证文件类型
    if (!file.name.endsWith('.json')) {
      const errorInfo = classifyError(new Error('Invalid file type'), { fileName: file.name })
      notificationStore.error(getUserFriendlyMessage(errorInfo))
      event.target.value = ''
      return
    }

    // 2. 检查文件大小（10MB 限制）
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      const errorInfo = classifyError(new Error('File too large'), {
        fileName: file.name,
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE
      })
      notificationStore.error(getUserFriendlyMessage(errorInfo))
      event.target.value = ''
      return
    }

    // 3. 读取文件
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        // 4. 解析 JSON
        let data
        try {
          data = JSON.parse(e.target.result)
        } catch (error) {
          const errorInfo = classifyError(error, { fileName: file.name })
          console.error('JSON 解析失败:', errorInfo)
          notificationStore.error(getUserFriendlyMessage(errorInfo))
          event.target.value = ''
          return
        }

        // 5. 开始导入
        importState.value.isImporting = true
        importState.value.progress = 0
        importState.value.total = 0
        importState.value.phase = 'starting'
        importState.value.message = '正在准备导入...'
        importState.value.result = null

        // 6. 调用导入服务
        const result = await importData(data, {
          mode: 'auto',
          onDuplicate: 'skip',
          onIncomplete: 'enrich',
          batchSize: 20,
          timeout: 10000,
          onProgress: (progress) => {
            importState.value.progress = progress.processed
            importState.value.total = progress.total
            importState.value.phase = progress.phase
            importState.value.message = progress.message
          },
          onComplete: (result) => {
            importState.value.result = result
          }
        })

        // 7. 导入完成，显示结果
        importState.value.isImporting = false
        importState.value.result = result
        importState.value.showResult = true

        // 显示导入结果
        const resultMessage = `
          导入完成！
          ✓ 成功导入：${result.success} 个网站
          ${result.skipped > 0 ? `⚠ 跳过数据：${result.skipped} 个（重复或无效）` : ''}
          ${result.failed > 0 ? `❌ 导入失败：${result.failed} 个` : ''}
          ${result.updated > 0 ? `🔄 更新数据：${result.updated} 个` : ''}
        `

        notificationStore.success(resultMessage.trim())

        // 8. 重新加载数据
        const websites = await db.getAllWebsites()
        websiteStore.setWebsites(websites)
        settingStore.loadSettings()

        // 9. 延迟刷新页面（如果有错误，不自动刷新）
        if (result.failed === 0) {
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }

      } catch (error) {
        const errorInfo = classifyError(error, { fileName: file.name })
        console.error('导入失败:', errorInfo)

        // 根据错误类型决定是否停止
        if (shouldStopImport(errorInfo)) {
          notificationStore.error(getUserFriendlyMessage(errorInfo))
          importState.value.isImporting = false
        } else {
          // 可恢复错误，记录并继续
          console.warn('可恢复错误:', errorInfo)
          notificationStore.warning(getUserFriendlyMessage(errorInfo))
        }
      }
    }

    reader.readAsText(file)
  } catch (error) {
    const errorInfo = classifyError(error, { fileName: file.name })
    console.error('导入失败:', errorInfo)
    notificationStore.error(getUserFriendlyMessage(errorInfo))
    importState.value.isImporting = false
  }

  // 清空文件输入
  event.target.value = ''
}

// 保存设置
async function saveSettings() {
  try {
    await settingStore.saveSettings()
  } catch (error) {
    console.error('保存设置失败:', error)
    notificationStore.error('保存设置失败')
  }
}

// 关闭面板
function closePanel() {
  emit('update:modelValue', false)
  emit('blur-settings-button')
}

// 取消导入
function cancelImport() {
  importState.value.isImporting = false
  importState.value.message = '导入已取消'
  notificationStore.info('导入已取消')
}

// 关闭结果面板
function closeResultPanel() {
  importState.value.showResult = false
  importState.value.result = null
}

// 导出失败数据
function exportFailedData() {
  if (!importState.value.result || !importState.value.result.errors) {
    notificationStore.warning('没有可导出的失败数据')
    return
  }

  const failedData = importState.value.result.errors.map(err => ({
    url: err.url,
    error: err.error
  }))

  const blob = new Blob([JSON.stringify(failedData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import-failed-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  notificationStore.success('失败数据已导出')
}

// 获取阶段文本
function getPhaseText(phase) {
  const phaseMap = {
    'starting': '准备中',
    'enriching': '获取元数据',
    'importing': '导入数据库',
    'completed': '完成'
  }
  return phaseMap[phase] || phase
}

// 键盘事件处理
function handleKeyDown(event) {
  if (event.key === 'Escape' && props.modelValue) {
    closePanel()
    event.preventDefault()
    event.stopPropagation()
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div v-if="modelValue" class="settings-overlay" @click.self="closePanel">
    <div class="settings-panel">
      <div class="panel-header">
        <div class="header-left">
          <button
            class="header-button"
            :class="{ active: activePanel === 'theme' }"
            @click="setActivePanel('theme')"
            title="主题"
          >
            <span class="icon">🎨</span>
          </button>
          <button
            class="header-button"
            :class="{ active: activePanel === 'search' }"
            @click="setActivePanel('search')"
            title="搜索"
          >
            <span class="icon">🔍</span>
          </button>
          <button
            class="header-button"
            :class="{ active: activePanel === 'add-website' }"
            @click="setActivePanel('add-website')"
            title="添加网站"
          >
            <span class="icon">➕</span>
          </button>
        </div>
        <div class="header-right">
          <LayoutSwitch />
          <div class="more-menu-container" v-click-outside="closeMoreMenu">
            <button
              class="header-button more-button"
              :class="{ active: showMoreMenu }"
              @click="showMoreMenu = !showMoreMenu"
              title="更多"
            >
              <span class="icon">⋮</span>
            </button>
            <transition name="dropdown">
              <div v-if="showMoreMenu" class="more-menu">
                <button
                  class="menu-item"
                  @click="
                    handleExport()
                    closeMoreMenu()
                  "
                >
                  <span class="menu-icon">⬇️</span>
                  <span>导出数据</span>
                </button>
                <button class="menu-item" @click="triggerImport">
                  <span class="menu-icon">⬆️</span>
                  <span>导入数据</span>
                  <input
                    ref="importFile"
                    id="import-file"
                    type="file"
                    accept=".json"
                    @change="handleImport"
                    style="display: none"
                  />
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="panel-content">
        <!-- 导入进度显示 -->
        <transition name="panel" mode="out-in">
          <div v-if="importState.isImporting" class="import-progress-panel">
            <h3>正在导入数据</h3>

            <!-- 进度条 -->
            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: importState.total > 0 ? (importState.progress / importState.total * 100) + '%' : '0%' }"
                ></div>
              </div>
              <div class="progress-text">
                {{ importState.total > 0 ? `${importState.progress} / ${importState.total}` : '准备中...' }}
              </div>
            </div>

            <!-- 当前状态 -->
            <div class="progress-status">
              <div class="status-message">{{ importState.message }}</div>
              <div class="status-phase">阶段：{{ getPhaseText(importState.phase) }}</div>
            </div>

            <!-- 取消按钮 -->
            <button class="cancel-button" @click="cancelImport">
              取消导入
            </button>
          </div>
        </transition>

        <!-- 导入结果展示 -->
        <transition name="panel" mode="out-in">
          <div v-if="importState.showResult && importState.result" class="import-result-panel">
            <h3>导入完成</h3>

            <!-- 结果统计 -->
            <div class="result-summary">
              <div class="result-item success">
                <div class="result-icon">✓</div>
                <div class="result-content">
                  <div class="result-label">成功导入</div>
                  <div class="result-value">{{ importState.result.success }} 个网站</div>
                </div>
              </div>

              <div v-if="importState.result.skipped > 0" class="result-item skipped">
                <div class="result-icon">⚠</div>
                <div class="result-content">
                  <div class="result-label">跳过数据</div>
                  <div class="result-value">{{ importState.result.skipped }} 个</div>
                </div>
              </div>

              <div v-if="importState.result.failed > 0" class="result-item failed">
                <div class="result-icon">✗</div>
                <div class="result-content">
                  <div class="result-label">导入失败</div>
                  <div class="result-value">{{ importState.result.failed }} 个</div>
                </div>
              </div>

              <div v-if="importState.result.updated > 0" class="result-item updated">
                <div class="result-icon">🔄</div>
                <div class="result-content">
                  <div class="result-label">更新数据</div>
                  <div class="result-value">{{ importState.result.updated }} 个</div>
                </div>
              </div>
            </div>

            <!-- 失败详情 -->
            <div v-if="importState.result.errors && importState.result.errors.length > 0" class="result-errors">
              <h4>失败详情</h4>
              <div class="error-list">
                <div v-for="(error, index) in importState.result.errors" :key="index" class="error-item">
                  <div class="error-url">{{ error.url }}</div>
                  <div class="error-message">{{ error.error }}</div>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="result-actions">
              <button v-if="importState.result.errors && importState.result.errors.length > 0"
                      class="action-button secondary"
                      @click="exportFailedData">
                导出失败数据
              </button>
              <button class="action-button primary" @click="closeResultPanel">
                关闭
              </button>
            </div>
          </div>
        </transition>

        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'theme'" key="theme">
            <ThemeSettings />
          </div>
        </transition>
        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'search'" key="search">
            <SearchSettings />
          </div>
        </transition>
        <transition name="panel" mode="out-in">
          <div v-show="activePanel === 'add-website'" key="add-website">
            <AddWebsitePanel @close="closePanel" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-panel {
  background-color: var(--color-bg-card);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-dark);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 32px;
  border-bottom: 1px solid var(--color-border-base);
  position: sticky;
  top: 0;
  background-color: var(--color-bg-card);
  z-index: 10;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  background-color: var(--color-bg-page);
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 24px;
  flex-shrink: 0;
}

.header-button:hover {
  background-color: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

.header-button.active {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: var(--shadow-medium);
}

.header-button .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: inherit;
}

.panel-content {
  padding: 32px;
  height: 70vh;
  overflow-y: auto;
}

/* 更多菜单 */
.more-menu-container {
  position: relative;
}

.more-button {
  font-size: 28px;
  line-height: 1;
}

.more-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border-base);
  border-radius: 12px;
  box-shadow: var(--shadow-dark);
  padding: 8px 0;
  z-index: 100;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 14px;
}

.menu-item:hover {
  background-color: var(--color-bg-hover);
}

.menu-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 面板切换动画 */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 导入进度面板 */
.import-progress-panel {
  padding: 32px;
  text-align: center;
}

.import-progress-panel h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.progress-container {
  margin-bottom: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--color-bg-page);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-primary);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.progress-status {
  margin-bottom: 24px;
  padding: 16px;
  background-color: var(--color-bg-page);
  border-radius: 8px;
}

.status-message {
  font-size: 14px;
  color: var(--color-text-main);
  margin-bottom: 8px;
}

.status-phase {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cancel-button {
  padding: 12px 32px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-focus);
}

/* 导入结果面板 */
.import-result-panel {
  padding: 32px;
}

.import-result-panel h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: var(--color-text-main);
}

.result-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--color-bg-page);
  border-radius: 8px;
  border: 1px solid var(--color-border-base);
}

.result-item.success {
  border-color: var(--color-success, #4caf50);
}

.result-item.skipped {
  border-color: var(--color-warning, #ff9800);
}

.result-item.failed {
  border-color: var(--color-error, #f44336);
}

.result-item.updated {
  border-color: var(--color-primary);
}

.result-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
}

.result-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.result-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-main);
}

.result-errors {
  margin-bottom: 24px;
}

.result-errors h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--color-text-main);
}

.error-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border-base);
  border-radius: 8px;
}

.error-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-base);
}

.error-item:last-child {
  border-bottom: none;
}

.error-url {
  font-size: 14px;
  color: var(--color-text-main);
  margin-bottom: 4px;
  word-break: break-all;
}

.error-message {
  font-size: 12px;
  color: var(--color-error);
}

.result-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-button {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-button.primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.action-button.primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

.action-button.secondary {
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
}

.action-button.secondary:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-focus);
}
</style>
