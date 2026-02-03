/**
 * Setting Store - 设置管理
 * 负责管理主题、搜索引擎、显示模式等设置
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingStore = defineStore('setting', () => {
  // 默认主题列表
  const defaultThemes = [
    { id: 'light', name: '浅色', class: 'light-theme' },
    { id: 'dark', name: '深色', class: 'dark-theme' },
    { id: 'auto', name: '跟随系统', class: 'auto-theme' }
  ]

  // 默认搜索引擎列表
  const defaultSearchEngines = {
    baidu: {
      name: '百度',
      url: 'https://www.baidu.com/s?wd={query}',
      icon: '/icons/search-engines/baidu.svg'
    },
    bing: {
      name: '必应',
      url: 'https://www.bing.com/search?q={query}',
      icon: '/icons/search-engines/bing.svg'
    },
    yandex: {
      name: 'Yandex',
      url: 'https://yandex.com/search/?text={query}',
      icon: '/icons/search-engines/yandex.svg'
    },
    local: {
      name: '本地',
      url: '',
      icon: '/icons/search-engines/local.svg'
    }
  }

  // 状态
  const selectedTheme = ref('light')
  const themes = ref(defaultThemes)
  const selectedSearchEngine = ref('baidu')
  const searchEngineList = ref(defaultSearchEngines)
  const searchResultLayout = ref('grid') // 'grid' 或 'list'
  const lastBackupTime = ref(null)

  // Actions
  function setTheme(themeId) {
    selectedTheme.value = themeId
    applyTheme(themeId)
  }

  function applyTheme(themeId) {
    const theme = themes.value.find(t => t.id === themeId)
    if (theme) {
      document.documentElement.className = theme.class
    }
  }

  function setSelectedSearchEngine(engineId) {
    if (searchEngineList.value[engineId]) {
      selectedSearchEngine.value = engineId
    }
  }

  function addSearchEngine(id, engine) {
    if (!searchEngineList.value[id]) {
      searchEngineList.value[id] = engine
    }
  }

  function updateSearchEngine(id, data) {
    if (searchEngineList.value[id]) {
      searchEngineList.value[id] = {
        ...searchEngineList.value[id],
        ...data
      }
    }
  }

  function deleteSearchEngine(id) {
    if (id !== 'local') { // 不允许删除本地搜索引擎
      delete searchEngineList.value[id]
      if (selectedSearchEngine.value === id) {
        selectedSearchEngine.value = 'local'
      }
    }
  }

  function setSearchResultLayout(layout) {
    if (layout === 'grid' || layout === 'list') {
      searchResultLayout.value = layout
    }
  }

  function toggleLayout() {
    searchResultLayout.value = searchResultLayout.value === 'grid' ? 'list' : 'grid'
  }

  function updateLastBackupTime() {
    lastBackupTime.value = new Date()
  }

  function getSearchUrl(query) {
    const engine = searchEngineList.value[selectedSearchEngine.value]
    if (engine && engine.url) {
      return engine.url.replace('{query}', encodeURIComponent(query))
    }
    return null
  }

  function getCurrentSearchEngine() {
    return searchEngineList.value[selectedSearchEngine.value]
  }

  // 初始化
  function init() {
    applyTheme(selectedTheme.value)
  }

  return {
    // State
    selectedTheme,
    themes,
    selectedSearchEngine,
    searchEngineList,
    searchResultLayout,
    lastBackupTime,
    // Actions
    setTheme,
    setSelectedSearchEngine,
    addSearchEngine,
    updateSearchEngine,
    deleteSearchEngine,
    setSearchResultLayout,
    toggleLayout,
    updateLastBackupTime,
    getSearchUrl,
    getCurrentSearchEngine,
    init
  }
})
