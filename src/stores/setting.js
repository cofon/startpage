/**
 * Setting Store - 设置管理
 * 负责管理主题、搜索引擎、显示模式等设置
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '../utils/database'
import defaultThemes from '../data/defaultThemes'
import defaultSearchEngines from '../data/defaultSearchEngines'

export const useSettingStore = defineStore('setting', () => {
  // 状态
  const selectedThemeId = ref('auto')
  const themes = ref([])
  const selectedSearchEngineId = ref('local')
  const searchEngines = ref([])
  const lastBackupTime = ref(null)

  // ==================== 主题管理 ====================

  // 初始化主题
  async function initThemes() {
    try {
      const existingThemes = await db.getAllThemes()

      if (existingThemes.length === 0) {
        // 如果没有主题，添加默认主题
        for (const theme of defaultThemes) {
          await db.addTheme(theme)
        }
        themes.value = [...defaultThemes]
      } else {
        themes.value = existingThemes
      }

      // 应用选中的主题
      applyTheme(selectedThemeId.value)
    } catch (error) {
      console.error('初始化主题失败:', error)
      themes.value = [...defaultThemes]
    }
  }

  // 应用主题
  function applyTheme(themeId) {
    const theme = themes.value.find(t => t.id === themeId)
    if (!theme) {
      console.error('主题未找到:', themeId)
      return
    }

    // 设置 CSS 变量
    const root = document.documentElement
    const colors = theme.colors

    // 基础颜色
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-hover', colors.primaryHover)
    root.style.setProperty('--color-primary-active', colors.primaryActive)

    // 文本颜色
    root.style.setProperty('--color-text-main', colors.textMain)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    root.style.setProperty('--color-text-disabled', colors.textDisabled)
    root.style.setProperty('--color-text-on-primary', colors.textOnPrimary)

    // 背景颜色
    root.style.setProperty('--color-bg-page', colors.bgPage)
    root.style.setProperty('--color-bg-card', colors.bgCard)
    root.style.setProperty('--color-bg-hover', colors.bgHover)
    root.style.setProperty('--color-bg-active', colors.bgActive)

    // 边框和阴影
    root.style.setProperty('--color-border-base', colors.borderBase)
    root.style.setProperty('--color-border-focus', colors.borderFocus)
    root.style.setProperty('--shadow-light', colors.shadowLight)
    root.style.setProperty('--shadow-medium', colors.shadowMedium)
    root.style.setProperty('--shadow-dark', colors.shadowDark)

    // 处理自动主题
    if (themeId === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const autoTheme = prefersDark ? themes.value.find(t => t.id === 'dark') : themes.value.find(t => t.id === 'light')
      if (autoTheme) {
        const autoColors = autoTheme.colors
        Object.keys(autoColors).forEach(key => {
          root.style.setProperty(`--color-${key}`, autoColors[key])
        })
      }
    }
  }

  // 设置主题
  function setTheme(themeId) {
    selectedThemeId.value = themeId
    applyTheme(themeId)
    saveSettings()
  }

  // 添加主题
  async function addTheme(theme) {
    const newTheme = {
      ...theme,
      id: `theme_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await db.addTheme(newTheme)
    themes.value.push(newTheme)
    return newTheme
  }

  // 更新主题
  async function updateTheme(theme) {
    const updatedTheme = {
      ...theme,
      updatedAt: new Date().toISOString()
    }
    await db.updateTheme(updatedTheme)

    const index = themes.value.findIndex(t => t.id === theme.id)
    if (index !== -1) {
      themes.value[index] = updatedTheme
    }

    // 如果更新的是当前主题，重新应用
    if (selectedThemeId.value === theme.id) {
      applyTheme(theme.id)
    }
  }

  // 删除主题
  async function deleteTheme(themeId) {
    // 不允许删除默认主题
    if (['light', 'dark', 'auto'].includes(themeId)) {
      throw new Error('不能删除默认主题')
    }

    await db.deleteTheme(themeId)
    themes.value = themes.value.filter(t => t.id !== themeId)

    // 如果删除的是当前主题，切换到浅色主题
    if (selectedThemeId.value === themeId) {
      setTheme('light')
    }
  }

  // ==================== 搜索引擎管理 ====================

  // 初始化搜索引擎
  async function initSearchEngines() {
    try {
      const existingEngines = await db.getAllSearchEngines()

      if (existingEngines.length === 0) {
        // 如果没有搜索引擎，添加默认搜索引擎
        for (const engine of defaultSearchEngines) {
          await db.addSearchEngine(engine)
        }
        searchEngines.value = [...defaultSearchEngines]
      } else {
        // 更新现有搜索引擎的图标为内联 SVG
        for (const existingEngine of existingEngines) {
          const defaultEngine = defaultSearchEngines.find(e => e.id === existingEngine.id)
          if (defaultEngine) {
            existingEngine.icon = defaultEngine.icon
            await db.updateSearchEngine(existingEngine)
          }
        }
        // 按照 order 字段排序
        searchEngines.value = existingEngines.sort((a, b) => (a.order || 0) - (b.order || 0))
      }

      // 确保 selectedSearchEngineId 有效
      const engineExists = searchEngines.value.find(e => e.id === selectedSearchEngineId.value)
      if (!engineExists && searchEngines.value.length > 0) {
        selectedSearchEngineId.value = searchEngines.value[0].id
      }
    } catch (error) {
      console.error('初始化搜索引擎失败:', error)
      searchEngines.value = [...defaultSearchEngines]
    }
  }

  // 设置搜索引擎
  function setSelectedSearchEngine(engineId) {
    const engine = searchEngines.value.find(e => e.id === engineId)
    if (engine) {
      selectedSearchEngineId.value = engineId
      saveSettings()
    }
  }

  // 添加搜索引擎
  async function addSearchEngine(engine) {
    const newEngine = {
      ...engine,
      id: `engine_${Date.now()}`,
      order: searchEngines.value.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await db.addSearchEngine(newEngine)
    searchEngines.value.push(newEngine)

    // 重新加载搜索引擎图标
    const { useSearchStore } = await import('./search')
    const searchStore = useSearchStore()
    // 等待 DOM 更新后再加载图标
    await new Promise(resolve => setTimeout(resolve, 100))
    await searchStore.loadEngineIcons()

    return newEngine
  }

  // 更新搜索引擎
  async function updateSearchEngine(engine) {
    const updatedEngine = {
      ...engine,
      updatedAt: new Date().toISOString()
    }
    await db.updateSearchEngine(updatedEngine)

    const index = searchEngines.value.findIndex(e => e.id === engine.id)
    if (index !== -1) {
      searchEngines.value[index] = updatedEngine
    }
  }

  // 删除搜索引擎
  async function deleteSearchEngine(engineId) {
    // 不允许删除本地搜索引擎
    if (engineId === 'local') {
      throw new Error('不能删除本地搜索引擎')
    }

    await db.deleteSearchEngine(engineId)
    searchEngines.value = searchEngines.value.filter(e => e.id !== engineId)

    // 如果删除的是当前搜索引擎，切换到第一个搜索引擎
    if (selectedSearchEngineId.value === engineId) {
      if (searchEngines.value.length > 0) {
        setSelectedSearchEngine(searchEngines.value[0].id)
      }
    }
  }

  // ==================== 其他设置 ====================

  // 设置搜索结果布局
  // function setSearchResultLayout(layout) {
  //   if (layout === 'grid' || layout === 'list') {
  //     searchResultLayout.value = layout
  //     saveSettings()
  //   }
  // }

  // 切换搜索结果布局
  // function toggleLayout() {
  //   searchResultLayout.value = searchResultLayout.value === 'grid' ? 'list' : 'grid'
  //   saveSettings()
  // }

  // 更新最后备份时间
  function updateLastBackupTime() {
    lastBackupTime.value = new Date()
  }

  // 保存设置
  async function saveSettings() {
    const settings = {
      selectedThemeId: selectedThemeId.value,
      selectedSearchEngineId: selectedSearchEngineId.value,
      // searchResultLayout: searchResultLayout.value,
      lastBackupTime: lastBackupTime.value ? lastBackupTime.value.toISOString() : null
    }
    await db.saveSettings(settings)
  }

  // 加载设置
  async function loadSettings() {
    const savedSettings = await db.getSettings()
    if (savedSettings) {
      if (savedSettings.selectedThemeId) {
        selectedThemeId.value = savedSettings.selectedThemeId
      }
      if (savedSettings.selectedSearchEngineId) {
        selectedSearchEngineId.value = savedSettings.selectedSearchEngineId
      }
      // if (savedSettings.searchResultLayout) {
      //   searchResultLayout.value = savedSettings.searchResultLayout
      // }
      if (savedSettings.lastBackupTime) {
        lastBackupTime.value = new Date(savedSettings.lastBackupTime)
      }
    }
  }

  // 获取搜索 URL
  function getSearchUrl(query) {
    const engine = searchEngines.value.find(e => e.id === selectedSearchEngineId.value)
    if (engine && engine.template) {
      return engine.template.replace('{query}', encodeURIComponent(query))
    }
    return null
  }

  // 获取当前搜索引擎
  function getCurrentSearchEngine() {
    return searchEngines.value.find(e => e.id === selectedSearchEngineId.value)
  }

  // 初始化
  async function init() {
    await loadSettings()
    await initThemes()
    await initSearchEngines()
  }

  return {
    // State
    selectedThemeId,
    themes,
    selectedSearchEngineId,
    searchEngines,
    // searchResultLayout,
    lastBackupTime,
    // Actions
    setTheme,
    addTheme,
    updateTheme,
    deleteTheme,
    setSelectedSearchEngine,
    addSearchEngine,
    updateSearchEngine,
    deleteSearchEngine,
    // setSearchResultLayout,
    // toggleLayout,
    updateLastBackupTime,
    saveSettings,
    loadSettings,
    getSearchUrl,
    getCurrentSearchEngine,
    init
  }
})
