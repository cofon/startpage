<script setup>
import { ref, computed } from 'vue'
import { useSettingStore } from '../stores/setting'
import { useWebsiteStore } from '../stores/website'
import db from '../utils/indexedDB'
import iconManager from '../utils/iconManager'

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'openAddWebsite'])

const settingStore = useSettingStore()
const websiteStore = useWebsiteStore()

// 添加搜索引擎表单
const showAddEngine = ref(false)
const newEngine = ref({
  id: '',
  name: '',
  url: '',
  icon: ''
})

// 导入/导出
const importFile = ref(null)

// 当前选中的主题
const currentTheme = computed(() => settingStore.selectedTheme)

// 切换主题
function setTheme(themeId) {
  settingStore.setTheme(themeId)
  saveSettings()
  closePanel()
}

// 切换显示模式
function setLayout(layout) {
  settingStore.setSearchResultLayout(layout)
  saveSettings()
  closePanel()
}

// 添加搜索引擎
async function addSearchEngine() {
  if (!newEngine.value.id || !newEngine.value.name || !newEngine.value.url) {
    alert('请填写完整的搜索引擎信息')
    return
  }

  settingStore.addSearchEngine(newEngine.value.id, {
    name: newEngine.value.name,
    url: newEngine.value.url,
    icon: newEngine.value.icon || '/icons/search-engines/default.svg'
  })

  // 重置表单
  newEngine.value = {
    id: '',
    name: '',
    url: '',
    icon: ''
  }
  showAddEngine.value = false

  // 保存设置
  await saveSettings()
}

// 删除搜索引擎
async function deleteSearchEngine(engineId) {
  if (confirm(`确定要删除 "${settingStore.searchEngineList[engineId]?.name}" 搜索引擎吗？`)) {
    settingStore.deleteSearchEngine(engineId)
    await saveSettings()
  }
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
    const month = String(now.getMonth() + 1).padStart(2, '0')  // 月份从0开始，需要加1
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    const dateTimeStr = `${year}${month}${day}${hours}${minutes}${seconds}`
    a.download = `startpage-backup-${dateTimeStr}.json`
    
    a.click()
    URL.revokeObjectURL(url)
    settingStore.updateLastBackupTime()
    await saveSettings()
    alert('导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请查看控制台获取详细信息')
  }
}

// 导入数据
async function handleImport(event) {
  const file = event.target.files[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        await db.importData(data)
        // 重新加载网站和设置
        await websiteStore.loadWebsites()
        settingStore.loadSettings()
        
        alert('导入成功！页面即将刷新...')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } catch (error) {
        console.error('解析导入文件失败:', error)
        alert('导入文件格式错误')
      }
    }
    reader.readAsText(file)
  } catch (error) {
    console.error('导入失败:', error)
    alert('导入失败，请查看控制台获取详细信息')
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
    alert('保存设置失败')
  }
}

// 关闭面板
function closePanel() {
  emit('update:modelValue', false)
}

// 打开添加网站对话框
function openAddWebsite() {
  closePanel()
  emit('openAddWebsite')
}

// 清除图标缓存
async function clearIconCache() {
  if (confirm('确定要清除所有图标缓存吗？这将重新从网络获取图标。')) {
    try {
      // 清除内存缓存
      iconManager.clearCache()

      // 清除数据库中的图标数据
      const websites = await websiteStore.websites
      for (const website of websites) {
        if (website.iconData || website.iconGenerateData) {
          websiteStore.updateWebsite(website.id, {
            iconData: null,
            iconGenerateData: null,
            iconCanFetch: true,
            iconFetchAttempts: 0
          })
          // 同步更新到 IndexedDB
          await db.updateWebsite({
            id: website.id,
            iconData: null,
            iconGenerateData: null,
            iconCanFetch: true,
            iconFetchAttempts: 0
          })
        }
      }

      alert('图标缓存已清除')
    } catch (error) {
      console.error('清除图标缓存失败:', error)
      alert('清除图标缓存失败，请查看控制台获取详细信息')
    }
  }
}
</script>

<template>
  <div v-if="modelValue" class="settings-overlay" @click.self="closePanel">
    <div class="settings-panel">
      <div class="panel-header">
        <h2>设置</h2>
        <button class="close-button" @click="closePanel">×</button>
      </div>

      <div class="panel-content">
        <!-- 主题设置 -->
        <section class="settings-section">
          <h3>主题</h3>
          <div class="theme-options">
            <div
              v-for="theme in settingStore.themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: currentTheme === theme.id }"
              @click="setTheme(theme.id)"
            >
              {{ theme.name }}
            </div>
          </div>
        </section>

        <!-- 显示设置 -->
        <section class="settings-section">
          <h3>显示模式</h3>
          <div class="layout-options">
            <div
              class="layout-option"
              :class="{ active: settingStore.searchResultLayout === 'grid' }"
              @click="setLayout('grid')"
            >
              <span class="layout-icon">⊞</span>
              <span>网格</span>
            </div>
            <div
              class="layout-option"
              :class="{ active: settingStore.searchResultLayout === 'list' }"
              @click="setLayout('list')"
            >
              <span class="layout-icon">☰</span>
              <span>列表</span>
            </div>
          </div>
        </section>

        <!-- 搜索引擎管理 -->
        <section class="settings-section">
          <h3>搜索引擎</h3>
          <div class="engine-list">
            <div
              v-for="(engine, id) in settingStore.searchEngineList"
              :key="id"
              class="engine-item"
            >
              <div class="engine-info">
                <span class="engine-name">{{ engine.name }}</span>
                <span class="engine-id">{{ id }}</span>
              </div>
              <button
                v-if="id !== 'local'"
                class="delete-button"
                @click="deleteSearchEngine(id)"
              >
                删除
              </button>
            </div>
          </div>
          <button v-if="!showAddEngine" class="add-button" @click="showAddEngine = true">
            + 添加搜索引擎
          </button>
          <div v-else class="add-engine-form">
            <div class="form-group">
              <label>ID</label>
              <input v-model="newEngine.id" type="text" placeholder="唯一标识符" class="form-input">
            </div>
            <div class="form-group">
              <label>名称</label>
              <input v-model="newEngine.name" type="text" placeholder="搜索引擎名称" class="form-input">
            </div>
            <div class="form-group">
              <label>URL</label>
              <input v-model="newEngine.url" type="text" placeholder="搜索URL（使用 {query} 作为查询参数）" class="form-input">
            </div>
            <div class="form-group">
              <label>图标</label>
              <input v-model="newEngine.icon" type="text" placeholder="图标URL" class="form-input">
            </div>
            <div class="form-actions">
              <button class="button button-secondary" @click="showAddEngine = false">取消</button>
              <button class="button button-primary" @click="addSearchEngine">添加</button>
            </div>
          </div>
        </section>

        <!-- 数据管理 -->
        <section class="settings-section">
          <h3>数据管理</h3>
          <div class="data-actions">
            <button class="action-button" @click="openAddWebsite">
              <span class="action-icon">+</span>
              <span>添加网站</span>
            </button>
            <button class="action-button" @click="handleExport">
              <span class="action-icon">⬇</span>
              <span>导出数据</span>
            </button>
            <label class="action-button">
              <span class="action-icon">⬆</span>
              <span>导入数据</span>
              <input
                ref="importFile"
                type="file"
                accept=".json"
                style="display: none"
                @change="handleImport"
              >
            </label>
          </div>
          <div v-if="settingStore.lastBackupTime" class="backup-info">
            上次备份时间：{{ new Date(settingStore.lastBackupTime).toLocaleString() }}
          </div>
        </section>

        <!-- 图标缓存管理 -->
        <section class="settings-section">
          <h3>图标缓存</h3>
          <div class="data-actions">
            <button class="action-button" @click="clearIconCache">
              <span class="action-icon">🗑</span>
              <span>清除图标缓存</span>
            </button>
          </div>
          <p class="info-text">
            图标会被缓存到本地，以加快加载速度。如果图标显示异常，可以清除缓存重新获取。
          </p>
        </section>
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
  background-color: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 10;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: #f5f5f5;
}

.panel-content {
  padding: 24px;
}

.settings-section {
  margin-bottom: 32px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 主题选项 */
.theme-options {
  display: flex;
  gap: 12px;
}

.theme-option {
  flex: 1;
  padding: 12px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.theme-option:hover {
  background-color: #e8e8e8;
}

.theme-option.active {
  background-color: #1890ff;
  color: white;
}

/* 显示模式选项 */
.layout-options {
  display: flex;
  gap: 12px;
}

.layout-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.layout-option:hover {
  background-color: #e8e8e8;
}

.layout-option.active {
  background-color: #1890ff;
  color: white;
}

.layout-icon {
  font-size: 18px;
}

/* 搜索引擎列表 */
.engine-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.engine-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.engine-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.engine-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.engine-id {
  font-size: 12px;
  color: #999;
}

.delete-button {
  padding: 6px 12px;
  border: none;
  background-color: #fff1f0;
  color: #ff4d4f;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.delete-button:hover {
  background-color: #ffccc7;
}

.add-button {
  width: 100%;
  padding: 12px;
  border: 2px dashed #d9d9d9;
  background-color: transparent;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 添加搜索引擎表单 */
.add-engine-form {
  margin-top: 16px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #1890ff;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.button-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.button-secondary:hover {
  background-color: #e8e8e8;
}

.button-primary {
  background-color: #1890ff;
  color: white;
}

.button-primary:hover {
  background-color: #40a9ff;
}

/* 数据管理操作 */
.data-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #e8e8e8;
}

.action-icon {
  font-size: 18px;
}

.backup-info {
  margin-top: 12px;
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  font-size: 13px;
  color: #096dd9;
}

.info-text {
  margin-top: 12px;
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}
</style>
