/**
 * Search Store - 搜索状态管理
 * 负责管理搜索输入、结果和搜索引擎状态
 */
import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { useWebsiteStore } from './website'
import { useSettingStore } from './setting'
import { updateDisplayResults, refreshCurrentDisplay } from '../utils/ui/displayModeManager'
import { parseSearchQuery, SearchCommands, StatusCommands, PageCommands } from '../utils/search/searchService.js'

export const useSearchStore = defineStore('search', () => {
  // Stores
  const websiteStore = useWebsiteStore()
  const settingStore = useSettingStore()

  // 状态
  const query = ref('')
  const results = ref([])
  const showTagsList = ref(false)
  const showCommandList = ref(false)

  // 显示模式 - 控制显示模块应该显示什么内容
  const displayMode = ref('marked') // 'marked' | 'search' | 'history' | 'favorites' | 'empty' | 'settings' | 'help'

  // 命令模式
  const commandMode = ref(null) // 'theme' | 'search' | 'add' | 'import' | 'export' | 'layout' | 'help' | ...

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
    console.log('SearchStore - currentTags computed')
    if (!isLocalSearch.value) {
      console.log('SearchStore - currentTags: isLocalSearch is false')
      return []
    }
    
    const trimmedQuery = query.value.trim()
    console.log('SearchStore - currentTags: trimmedQuery:', trimmedQuery)
    
    if (!trimmedQuery) {
      // 输入框为空时显示所有 tags
      console.log('SearchStore - currentTags: query is empty, returning all tags')
      return websiteStore.allTags
    }

    // 检查是否包含 -tag 命令（-tag 后面可以有空格也可以没有）
    const tagCommandPattern = /-tag(\s+(\w*))?$/
    const match = trimmedQuery.match(tagCommandPattern)
    console.log('SearchStore - currentTags: tagCommandPattern match:', match)
    
    if (match) {
      // 提取当前正在输入的 tag（如果没有空格则为空字符串）
      const currentTagInput = (match[2] || '').toLowerCase()
      console.log('SearchStore - currentTags: currentTagInput:', currentTagInput)
      
      // 过滤匹配的 tags
      if (currentTagInput) {
        const filteredTags = websiteStore.allTags.filter(tag => 
          tag.toLowerCase().startsWith(currentTagInput)
        )
        console.log('SearchStore - currentTags: filteredTags:', filteredTags)
        return filteredTags
      }
      
      // -tag 后面没有输入，显示所有 tags
      console.log('SearchStore - currentTags: no tag input, returning all tags')
      return websiteStore.allTags
    }

    console.log('SearchStore - currentTags: no -tag command found, returning empty array')
    return []
  })

  // 是否应该显示标签列表
  const shouldShowTagsList = computed(() => {
    console.log('SearchStore - shouldShowTagsList computed')
    if (!isLocalSearch.value) {
      console.log('SearchStore - shouldShowTagsList: isLocalSearch is false')
      return false
    }

    const trimmedQuery = query.value.trim()
    console.log('SearchStore - shouldShowTagsList: trimmedQuery:', trimmedQuery)
    console.log('SearchStore - shouldShowTagsList: query.value:', query.value)
    
    if (!trimmedQuery) {
      // 输入框为空时显示 tags
      console.log('SearchStore - shouldShowTagsList: query is empty, showing tags')
      return true
    }

    // 检查是否包含 -tag 命令（-tag 后面可以有空格也可以没有）
    const tagCommandPattern = /-tag(\s+(\w*))?$/
    const match = trimmedQuery.match(tagCommandPattern)
    
    console.log('SearchStore - shouldShowTagsList: tagCommandPattern match:', match)

    if (!match) {
      // 没有 -tag 命令，不显示 tags
      console.log('SearchStore - shouldShowTagsList: no -tag command found')
      return false
    }
    
    // 提取当前正在输入的 tag（如果没有空格则为空字符串）
    const currentTagInput = (match[2] || '').toLowerCase()
    console.log('SearchStore - shouldShowTagsList: currentTagInput:', currentTagInput)

    // 检查原始查询末尾是否有空格（表示tag输入结束）
    const endsWithSpace = query.value.endsWith(' ')
    console.log('SearchStore - shouldShowTagsList: endsWithSpace:', endsWithSpace)
    
    // 如果 -tag 后面没有输入，显示所有 tags
    if (!currentTagInput) {
      console.log('SearchStore - shouldShowTagsList: no tag input, showing all tags')
      return true
    }
    
    if (endsWithSpace) {
      // 如果有输入tag且末尾有空格，表示tag输入结束
      // 检查是否是完整的tag
      const isTagComplete = websiteStore.allTags.some(tag => 
        tag.toLowerCase() === currentTagInput
      )
      if (isTagComplete) {
        console.log('SearchStore - shouldShowTagsList: tag is complete, showing tags for next tag')
        return true
      }
    }

    // 检查-tag命令之后是否包含特殊字符（-、&、|）
    const tagCommandIndex = trimmedQuery.lastIndexOf('-tag')
    const afterTagCommand = trimmedQuery.substring(tagCommandIndex + 4)
    if (afterTagCommand.includes(' -') || afterTagCommand.includes(' &') || afterTagCommand.includes(' |')) {
      console.log('SearchStore - shouldShowTagsList: contains special characters after -tag, not showing tags')
      return false
    }

    // 检查是否有匹配的 tags
    const hasMatchingTags = currentTags.value.length > 0
    console.log('SearchStore - shouldShowTagsList: hasMatchingTags:', hasMatchingTags, 'currentTags.length:', currentTags.value.length)

    if (!hasMatchingTags) {
      console.log('SearchStore - shouldShowTagsList: no matching tags, not showing tags')
      return false
    }

    // 检查是否输入了完整的 tag（且末尾没有空格）
    if (!endsWithSpace && currentTagInput) {
      const isTagComplete = websiteStore.allTags.some(tag => 
        tag.toLowerCase() === currentTagInput
      )
      console.log('SearchStore - shouldShowTagsList: isTagComplete:', isTagComplete)

      if (isTagComplete) {
        console.log('SearchStore - shouldShowTagsList: tag is complete, not showing tags')
        return false
      }
    }

    console.log('SearchStore - shouldShowTagsList: showing tags')
    return true
  })

  // 所有可用的命令列表（排除 hidden, unhidden, unactive）
  const allCommands = computed(() => {
    const commands = []
    
    // 状态命令
    Object.values(StatusCommands).forEach(cmd => {
      if (!['hidden', 'unhidden', 'unactive'].includes(cmd)) {
        commands.push(cmd)
      }
    })
    
    // 搜索命令
    Object.values(SearchCommands).forEach(cmd => {
      commands.push(cmd)
    })
    
    // 页面命令
    Object.values(PageCommands).forEach(cmd => {
      commands.push(cmd)
    })
    
    return commands
  })

  // 当前匹配的命令列表
  const currentCommands = computed(() => {
    console.log('SearchStore - currentCommands computed')
    if (!isLocalSearch.value) {
      console.log('SearchStore - currentCommands: isLocalSearch is false')
      return []
    }
    
    const trimmedQuery = query.value.trim()
    console.log('SearchStore - currentCommands: trimmedQuery:', trimmedQuery)
    
    // 检查是否包含命令（以 - 开头或包含 空格-）
    const hasCommandPrefix = trimmedQuery.startsWith('-') || trimmedQuery.includes(' -')
    if (!trimmedQuery || !hasCommandPrefix) {
      console.log('SearchStore - currentCommands: query does not contain command')
      return []
    }
    
    // 提取当前正在输入的命令部分
    const parts = trimmedQuery.split(/\s+/)
    const lastPart = parts[parts.length - 1]
    console.log('SearchStore - currentCommands: lastPart:', lastPart)
    
    if (!lastPart.startsWith('-')) {
      console.log('SearchStore - currentCommands: last part does not start with -')
      return []
    }
    
    const commandPrefix = lastPart.substring(1).toLowerCase()
    console.log('SearchStore - currentCommands: commandPrefix:', commandPrefix)
    
    // 过滤匹配的命令
    const matchedCommands = allCommands.value.filter(cmd => {
      return cmd.toLowerCase().startsWith(commandPrefix)
    })
    console.log('SearchStore - currentCommands: matchedCommands:', matchedCommands)
    return matchedCommands
  })

  // 是否应该显示命令列表
  const shouldShowCommandList = computed(() => {
    console.log('SearchStore - shouldShowCommandList computed')
    if (!isLocalSearch.value) {
      console.log('SearchStore - shouldShowCommandList: isLocalSearch is false')
      return false
    }
    
    const trimmedQuery = query.value.trim()
    console.log('SearchStore - shouldShowCommandList: trimmedQuery:', trimmedQuery)
    
    // 检查是否包含命令（以 - 开头或包含 空格-）
    const hasCommandPrefix = trimmedQuery.startsWith('-') || trimmedQuery.includes(' -')
    if (!trimmedQuery || !hasCommandPrefix) {
      console.log('SearchStore - shouldShowCommandList: query does not contain command')
      return false
    }
    
    // 检查原始查询末尾是否有空格（表示命令输入结束）
    const endsWithSpace = query.value.endsWith(' ')
    console.log('SearchStore - shouldShowCommandList: endsWithSpace:', endsWithSpace)
    if (endsWithSpace) {
      console.log('SearchStore - shouldShowCommandList: query ends with space, closing command list')
      return false
    }

    // 提取当前正在输入的命令部分
    const parts = trimmedQuery.split(/\s+/)
    const lastPart = parts[parts.length - 1]
    console.log('SearchStore - shouldShowCommandList: lastPart:', lastPart)
    
    if (!lastPart.startsWith('-')) {
      console.log('SearchStore - shouldShowCommandList: last part does not start with -')
      return false
    }
    
    const commandPrefix = lastPart.substring(1).toLowerCase()
    console.log('SearchStore - shouldShowCommandList: commandPrefix:', commandPrefix)
    
    // 检查命令是否已完成
    const isCommandComplete = commandPrefix && allCommands.value.some(cmd => {
      return cmd.toLowerCase() === commandPrefix
    })
    console.log('SearchStore - shouldShowCommandList: isCommandComplete:', isCommandComplete)
    
    // 如果命令已完成，关闭命令列表
    if (isCommandComplete) {
      console.log('SearchStore - shouldShowCommandList: command is complete, closing command list')
      return false
    }
    
    // 检查是否有匹配的命令
    const hasMatches = currentCommands.value.length > 0
    console.log('SearchStore - shouldShowCommandList: hasMatches:', hasMatches, 'currentCommands.length:', currentCommands.value.length)
    
    // 如果没有匹配的命令，关闭命令列表
    if (!hasMatches) {
      console.log('SearchStore - shouldShowCommandList: no matching commands, closing command list')
      return false
    }

    return true
  })

  // 可用的布局模式
  const availableLayoutModes = computed(() => {
    return [
      { id: 'simple', name: '极简模式' },
      { id: 'default', name: '默认模式' },
      { id: 'full', name: '完整模式' }
    ]
  })

  // 当前布局模式（从 settingStore 获取）
  const currentLayoutMode = computed(() => {
    return settingStore.searchResultLayout || 'default'
  })

  // 监听搜索引擎切换
  watch(
    () => settingStore.selectedSearchEngineId,
    (newEngine, oldEngine) => {
      // 切换搜索引擎，清空输入框并显示 marked list
      query.value = ''
      displayMode.value = 'marked'
      results.value = websiteStore.markedWebsites
    },
  )

  // 监听查询变化
  watch(query, () => {
    console.log('SearchStore - query changed:', query.value)
    console.log('SearchStore - isLocalSearch:', isLocalSearch.value)
    console.log('SearchStore - shouldShowCommandList:', shouldShowCommandList.value)
    
    if (isLocalSearch.value) {
      performSearch()
      // 如果不是命令模式且查询词为空，刷新当前显示
      if (!query.value.trim() && !commandMode.value) {
        refreshCurrentDisplay({ results, displayMode }, websiteStore)
      }
      // 更新命令列表显示状态
      setShowCommandList(shouldShowCommandList.value)
      console.log('SearchStore - showCommandList after update:', showCommandList.value)
      console.log('SearchStore - shouldShowTagsList:', shouldShowTagsList.value)
      
      // 如果显示命令列表，隐藏标签列表
      if (shouldShowCommandList.value) {
        setShowTagsList(false)
      } else {
        // 否则根据 shouldShowTagsList 更新标签列表显示状态
        setShowTagsList(shouldShowTagsList.value)
        console.log('SearchStore - showTagsList after update:', showTagsList.value)
      }
    } else {
      // 网络搜索时，始终显示 marked list
      displayMode.value = 'marked'
      results.value = websiteStore.markedWebsites
      // 网络搜索时，隐藏命令列表
      setShowCommandList(false)
    }
  })

  // Actions
  function init() {
    // 使用 nextTick 确保 websiteStore 已经初始化
    nextTick(() => {
      displayMode.value = 'marked'
      results.value = websiteStore.markedWebsites
    })
  }

  function setQuery(newQuery) {
    query.value = newQuery
  }

  function clearQuery() {
    query.value = ''
    displayMode.value = 'marked'
    results.value = websiteStore.markedWebsites
  }

  function performSearch() {
    if (!isLocalSearch.value) {
      // 网络搜索时，始终显示 marked list
      displayMode.value = 'marked'
      results.value = websiteStore.markedWebsites
      return
    }

    if (!query.value.trim()) {
      // 查询词为空时显示已标记的网站
      results.value = websiteStore.markedWebsites
      setDisplayMode('marked')
      commandMode.value = null
      return
    }

    // 检查是否是命令模式（以 - 开头）
    const trimmedQuery = query.value.trim()
    if (trimmedQuery.startsWith('-')) {
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
    // 先解析命令，获取完整的解析结果
    const parsedResult = parseSearchQuery(command)

    // 检查是否是页面命令
    const pageCommands = ['theme', 'search', 'help', 'add', 'import', 'export', 'batch', 'layout']
    const cmd = command.toLowerCase().substring(1).trim()
    const mainCmd = cmd.split(/\s+/)[0]

    if (pageCommands.includes(mainCmd)) {
      commandMode.value = mainCmd
      if (mainCmd === 'help') {
        setDisplayMode('help')
      } else if (mainCmd === 'layout') {
        setDisplayMode('layout')
      } else {
        setDisplayMode('settings')
      }
    } else {
      // 检查是否有不完整的命令
      if (parsedResult.hasIncompleteCommand) {
        // 检查是否有有效的过滤器
        if (parsedResult.filters && parsedResult.filters.noResults) {
          // 没有有效的命令或关键字，显示空结果
          results.value = []
          setDisplayMode('search')
        } else if (parsedResult.filters) {
          // 有有效的命令或关键字，执行搜索
          const parsed = websiteStore.searchWebsites(command)
          results.value = parsed
          setDisplayMode('search')
          commandMode.value = null
        }
        return
      }
      // 执行搜索
      const parsed = websiteStore.searchWebsites(command)
      results.value = parsed
      setDisplayMode('search')
      commandMode.value = null
    }
  }

  // 清除命令模式
  function clearCommandMode() {
    commandMode.value = null
    query.value = ''
    displayMode.value = 'marked'
    results.value = websiteStore.markedWebsites
  }

  function searchByTag(tag) {
    // 填充命令格式 -tag item值
    const commandQuery = `-tag ${tag}`
    setQuery(commandQuery)
    // 执行搜索
    performSearch()
  }

  function setShowTagsList(show) {
    showTagsList.value = show
  }

  function toggleTagsList() {
    showTagsList.value = !showTagsList.value
  }

  function setShowCommandList(show) {
    showCommandList.value = show
  }

  function toggleCommandList() {
    showCommandList.value = !showCommandList.value
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

  function setLayoutMode(mode) {
    settingStore.setSearchResultLayout(mode)
  }

  return {
    // State
    query,
    results,
    showTagsList,
    showCommandList,
    engineIcons,
    displayMode,
    commandMode,
    // Computed
    isLocalSearch,
    currentEngine,
    currentTags,
    currentCommands,
    allCommands,
    shouldShowCommandList,
    shouldShowTagsList,
    currentEngineIcon,
    availableLayoutModes,
    currentLayoutMode,
    // Actions
    init,
    setQuery,
    clearQuery,
    performSearch,
    searchByTag,
    setShowTagsList,
    toggleTagsList,
    setShowCommandList,
    toggleCommandList,
    executeSearch,
    loadEngineIcons,
    setDisplayMode,
    getDisplayMode,
    setLayoutMode,
    handleCommand,
    clearCommandMode,
  }
})
