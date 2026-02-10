/**
 * Search Store - 搜索状态管理
 * 负责管理搜索输入、结果和搜索引擎状态
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from './website'
import { useSettingStore } from './setting'

export const useSearchStore = defineStore('search', () => {
  // Stores
  const websiteStore = useWebsiteStore()
  const settingStore = useSettingStore()

  // 状态
  const query = ref('')
  const results = ref([])
  const showTagsList = ref(false)

  // 显示模式 - 控制显示模块应该显示什么内容
  const displayMode = ref('marked') // 'marked' | 'search' | 'history' | 'favorites' | 'empty'

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
    if (newEngine === 'local') {
      // 切换到本地搜索, 清空输入框
      query.value = ''
      results.value = websiteStore.markedWebsites
      setDisplayMode('marked')
    } else if (oldEngine === 'local' && newEngine !== 'local') {
      // 从本地切换到网络搜索, 清空输入框和结果
      query.value = ''
      results.value = websiteStore.markedWebsites
      setDisplayMode('marked')
    }
  })

  // 监听查询变化
  watch(query, () => {
    if (isLocalSearch.value) {
      performSearch()
      if (query.value.trim()) {
        setDisplayMode('search')
      } else {
        // 当查询词为空时, 显示已标记的网站
        results.value = websiteStore.markedWebsites
        setDisplayMode('marked')
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
    setDisplayMode('marked')
  }

  function performSearch() {
    if (!isLocalSearch.value) {
      results.value = websiteStore.markedWebsites
      setDisplayMode('marked')
      return
    }

    if (!query.value.trim()) {
      // 查询词为空时显示已标记的网站
      results.value = websiteStore.markedWebsites
      setDisplayMode('marked')
      return
    }

    // 执行本地搜索（包括特殊命令处理）
    results.value = websiteStore.searchWebsites(query.value)
    setDisplayMode('search')
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
    getDisplayMode
  }
})
