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

  // 计算属性
  const isLocalSearch = computed(() => {
    return settingStore.selectedSearchEngine === 'local'
  })

  const currentEngine = computed(() => {
    return settingStore.getCurrentSearchEngine()
  })

  // 搜索引擎图标 SVG 内容
  const engineIcons = ref({})

  // 获取当前搜索引擎图标
  const currentEngineIcon = computed(() => {
    return engineIcons.value[settingStore.selectedSearchEngine] || ''
  })

  // 加载搜索引擎图标
  async function loadEngineIcons() {
    for (const [id, engine] of Object.entries(settingStore.searchEngineList)) {
      try {
        const response = await fetch(engine.icon)
        engineIcons.value[id] = await response.text()
      } catch (error) {
        console.error(`加载搜索引擎图标失败: ${id}`, error)
        engineIcons.value[id] = ''
      }
    }
  }

  const currentTags = computed(() => {
    if (!isLocalSearch.value) return []
    // 只在输入框为空时显示 tags
    if (query.value.trim()) return []
    return websiteStore.allTags
  })

  // 监听搜索引擎切换
  watch(() => settingStore.selectedSearchEngine, (newEngine, oldEngine) => {
    if (newEngine === 'local') {
      // 切换到本地搜索，清空输入框
      query.value = ''
      results.value = websiteStore.markedWebsites
    } else if (oldEngine === 'local' && newEngine !== 'local') {
      // 从本地切换到网络搜索，清空输入框和结果
      query.value = ''
      results.value = websiteStore.markedWebsites
    }
  })

  // 监听查询变化
  watch(query, () => {
    if (isLocalSearch.value) {
      performSearch()
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
      results.value = websiteStore.markedWebsites
      return
    }

    // 检查是否是特殊命令（以 -- 开头）
    if (query.value.startsWith('--')) {
      // 特殊命令处理，后续实现
      results.value = []
      return
    }

    // 执行本地搜索
    results.value = websiteStore.searchWebsites(query.value)
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

  return {
    // State
    query,
    results,
    showTagsList,
    engineIcons,
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
    loadEngineIcons
  }
})
