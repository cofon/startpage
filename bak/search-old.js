/**
 * Search Store - 搜索状态管理
 * 负责管理搜索输入、结果和搜索引擎状态
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from './website'
import { useSettingStore } from './setting'
import { updateDisplayResults, refreshCurrentDisplay } from '../utils/ui/displayModeManager'

export const useSearchStore = defineStore('search', () => {
  // Stores
  const websiteStore = useWebsiteStore()
  const settingStore = useSettingStore()

  // 状态
  const query = ref('')
  const results = ref([])
  const showTagsList = ref(false)

  // 显示模式 - 控制显示模块应该显示什么内容
  const displayMode = ref('marked') // 'marked' | 'search' | 'history' | 'favorites' | 'empty' | 'settings' | 'help'

  // 命令模式
  const commandMode = ref(null) // 'theme' | 'search' | 'add' | 'import' | 'export' | 'layout' | 'help' | null

  // 计算属性
  const isLocalSearch = computed(() => {
    return settingStore.selectedSearchEngineId === 'local'
  })

  const currentEngine = computed(() => {
    return settingStore.getCurrentSearchEngine()
  })

  // 搜索引擎图标 SVG 内容
  const engineIcons = ref({})

  // 获取当前搜索引擎图标
  const currentEngineIcon = computed(() => {
    return engineIcons.value[settingStore.selectedSearchEngineId] || ''
  })

  // 加载搜索引擎图标
  async function loadEngineIcons() {
    for (const engine of settingStore.searchEngines) {
      // 图标已经是内联的 SVG 字符串, 直接使用
      engineIcons.value[engine.id] = engine.icon
    }
  }

  const currentTags = computed(() => {
    if (!isLocalSearch.value) return []
    // 只在输入框为空时显示 tags
    if (query.value.trim()) return []
    return websiteStore.allTags
  })

  // 监听搜索引擎切换
  watch(() => settingStore.selectedSearchEngineId, (newEngine, oldEngine) => {
    if (newEngine === 'local' || (oldEngine === 'local' && newEngine !== 'local')) {
      // 切换搜索引擎，清空输入框
      query.value = ''
      refreshCurrentDisplay({ results, displayMode }, websiteStore)
    }
  })

  // 监听查询变化
  watch(query, () => {
    if (isLocalSearch.value) {
      performSearch()
      // 如果不是命令模式且查询词为空，刷新当前显示
      if (!query.value.trim() && !commandMode.value) {
        refreshCurrentDisplay({ results, displayMode }, websiteStore)
      }
    }
  })

  // Actions
  function init() {
    // 初始化时显示已标记的网站
    results.value = websiteStore.markedWebsites
  }

  function setQuery(newQuery) {
    query.value = newQuery
  }

  function clearQuery() {
    query.value = ''
    results.value = websiteStore.markedWebsites
  }

  function performSearch() {
    if (!isLocalSearch.value) {
      results.value = websiteStore.markedWebsites
      return
    }

    if (!query.value.trim()) {
      // 查询词为空时显示已标记的网站
      refreshCurrentDisplay({ results, displayMode }, websiteStore)
      commandMode.value = null
      return
    }

    // 检查是否是命令模式（以 -- 开头）
    const trimmedQuery = query.value.trim()
    if (trimmedQuery.startsWith('--')) {
      handleCommand(trimmedQuery)
      return
    }

    // 执行本地搜索
    results.value = websiteStore.searchWebsites(query.value)
    setDisplayMode('search')
    commandMode.value = null
  }

  // 处理命令模式
  function handleCommand(command) {
    const cmd = command.toLowerCase().substring(2).trim()

    switch (cmd) {
      case 'theme':
        commandMode.value = 'theme'
        setDisplayMode('settings')
        break
      case 'search':
        commandMode.value = 'search'
        setDisplayMode('settings')
        break
      case 'help':
        commandMode.value = 'help'
        setDisplayMode('help')
        break
      case 'add':
        commandMode.value = 'add'
        setDisplayMode('settings')
        break
      case 'import':
        commandMode.value = 'import'
        setDisplayMode('settings')
        break
      case 'export':
        commandMode.value = 'export'
        setDisplayMode('settings')
        break
      case 'layout':
        commandMode.value = 'layout'
        setDisplayMode('settings')
        break
      default:
        // 其他命令（如 --inactive, --active false）传递给现有的搜索逻辑
        results.value = websiteStore.searchWebsites(command)
        setDisplayMode('search')
        commandMode.value = null
        break
    }
  }

  // 清除命令模式
  function clearCommandMode() {
    commandMode.value = null
    query.value = ''
    refreshCurrentDisplay({ results, displayMode }, websiteStore)
  }

  function searchByTag(tag) {
    setQuery(tag)
    results.value = websiteStore.searchByTag(tag)
  }

  function setShowTagsList(show) {
    showTagsList.value = show
  }

  function toggleTagsList() {
    showTagsList.value = !showTagsList.value
  }

  function executeSearch() {
    if (isLocalSearch.value) {
      performSearch()
    } else {
      // 网络搜索
      const url = settingStore.getSearchUrl(query.value)
      if (url) {
        window.open(url, '_blank')
      }
    }
  }

  function setDisplayMode(mode) {
    displayMode.value = mode
  }

  function getDisplayMode() {
    return displayMode.value
  }

  return {
    // State
    query,
    results,
    showTagsList,
    engineIcons,
    displayMode,
    commandMode,
    // Computed
    isLocalSearch,
    currentEngine,
    currentTags,
    currentEngineIcon,
    // Actions
    init,
    setQuery,
    clearQuery,
    performSearch,
    searchByTag,
    setShowTagsList,
    toggleTagsList,
    executeSearch,
    loadEngineIcons,
    setDisplayMode,
    getDisplayMode,
    handleCommand,
    clearCommandMode
  }
})
