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

    if (!isLocalSearch.value) {
      return []
    }
    
    const trimmedQuery = query.value.trim()
    
    if (!trimmedQuery) {
      // 输入框为空时显示所有 tags
      return websiteStore.allTags
    }

    // 检查是否包含 -tag 命令
    const tagCommandPattern = /-tag\s*(.*)$/
    const match = trimmedQuery.match(tagCommandPattern)
    
    if (match) {
      // 提取 -tag 后面的所有内容
      const tagsInput = match[1].trim()
      
      // 检查原始查询末尾是否有空格（表示tag输入结束）
      const endsWithSpace = query.value.endsWith(' ')
      
      if (!tagsInput) {
        // -tag 后面没有输入，显示所有 tags
        return websiteStore.allTags
      }
      
      // 分割 tags（按空格分割）
      const tags = tagsInput.split(/\s+/)
      
      // 获取最后一个 tag
      const lastTag = tags[tags.length - 1].toLowerCase()
      
      if (endsWithSpace) {
        // 如果末尾有空格，表示最后一个 tag 输入结束
        // 检查是否是完整的tag
        const isTagComplete = websiteStore.allTags.some(tag => 
          tag.toLowerCase() === lastTag
        )
        
        if (isTagComplete) {
          // tag 是完整的，显示除了已输入的所有 tags 之外的所有 tags
          const completedTags = tags.map(tag => tag.toLowerCase())
          const filteredTags = websiteStore.allTags.filter(tag => 
            !completedTags.includes(tag.toLowerCase())
          )
          return filteredTags
        }
      }
      
      // 过滤匹配的 tags
      const filteredTags = websiteStore.allTags.filter(tag => 
        tag.toLowerCase().startsWith(lastTag)
      )
      return filteredTags
    }

    return []
  })

  // 是否应该显示标签列表
  const shouldShowTagsList = computed(() => {
    if (!isLocalSearch.value) {
      return false
    }

    const trimmedQuery = query.value.trim()
    
    if (!trimmedQuery) {
      // 输入框为空时不自动显示 tags，只在获得焦点时显示
      return false
    }

    // 检查是否包含 -tag 命令
    const tagCommandPattern = /-tag\s*(.*)$/
    const match = trimmedQuery.match(tagCommandPattern)
    


    if (!match) {
      // 没有 -tag 命令，不显示 tags
      return false
    }
    
    // 提取 -tag 后面的所有内容
    const tagsInput = match[1].trim()

    // 检查原始查询末尾是否有空格（表示tag输入结束）
    const endsWithSpace = query.value.endsWith(' ')



    // 如果 -tag 后面没有输入，检查是否末尾有空格
    if (!tagsInput) {
      if (endsWithSpace) {
        // -tag 后面只有空格，显示所有 tags
        return true
      }
      // -tag 后面没有输入也没有空格，不显示 tags
      return false
    }
    
    // 分割 tags（按空格分割）
    const tags = tagsInput.split(/\s+/)
    
    // 获取最后一个 tag
    const currentTagInput = tags[tags.length - 1].toLowerCase()




    

    
    if (endsWithSpace) {
      // 如果有输入tag且末尾有空格，表示tag输入结束
      // 检查是否是完整的tag
      const isTagComplete = websiteStore.allTags.some(tag => 
        tag.toLowerCase() === currentTagInput
      )
      
      if (isTagComplete) {
        return true
      }
    }

    // 检查-tag命令之后是否包含特殊字符（-、&、|）
    const tagCommandIndex = trimmedQuery.lastIndexOf('-tag')
    const afterTagCommand = trimmedQuery.substring(tagCommandIndex + 4)
    if (afterTagCommand.includes(' -') || afterTagCommand.includes(' &') || afterTagCommand.includes(' |')) {
      return false
    }

    // 检查是否有匹配的 tags
    const hasMatchingTags = currentTags.value.length > 0

    if (!hasMatchingTags) {
      return false
    }

    // 检查是否输入了完整的 tag（且末尾没有空格）
    if (!endsWithSpace && currentTagInput) {
      const isTagComplete = websiteStore.allTags.some(tag => 
        tag.toLowerCase() === currentTagInput
      )

      if (isTagComplete) {
        return false
      }
    }

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
    if (!isLocalSearch.value) {
      return []
    }
    
    const trimmedQuery = query.value.trim()
    
    // 检查是否包含命令（以 - 开头或包含 空格-）
    const hasCommandPrefix = trimmedQuery.startsWith('-') || trimmedQuery.includes(' -')
    if (!trimmedQuery || !hasCommandPrefix) {
      return []
    }
    
    // 提取当前正在输入的命令部分
    const parts = trimmedQuery.split(/\s+/)
    const lastPart = parts[parts.length - 1]
    
    if (!lastPart.startsWith('-')) {
      return []
    }
    
    const commandPrefix = lastPart.substring(1).toLowerCase()
    
    // 检查是否已经输入了页面命令
    const hasPageCommand = parts.some(part => {
      const cmd = part.startsWith('-') ? part.substring(1).toLowerCase() : part.toLowerCase()
      return Object.values(PageCommands).includes(cmd)
    })

    // 检查是否已经输入了搜索命令或状态命令
    const hasSearchOrStatusCommand = parts.some(part => {
      const cmd = part.startsWith('-') ? part.substring(1).toLowerCase() : part.toLowerCase()
      return Object.values(SearchCommands).includes(cmd) || Object.values(StatusCommands).includes(cmd)
    })

    // 获取已经输入的命令列表（排除当前正在输入的命令）
    const enteredCommands = parts.slice(0, -1).map(part => {
      const cmd = part.startsWith('-') ? part.substring(1).toLowerCase() : part.toLowerCase()
      return cmd
    })

    // 过滤匹配的命令
    const matchedCommands = allCommands.value.filter(cmd => {
      // 排除已经输入的命令
      if (enteredCommands.includes(cmd.toLowerCase())) {
        return false
      }
      
      // 如果已经输入了页面命令，只显示页面命令
      if (hasPageCommand) {
        return Object.values(PageCommands).includes(cmd) && cmd.toLowerCase().startsWith(commandPrefix)
      }
      // 如果已经输入了搜索命令或状态命令，只显示搜索命令和状态命令
      if (hasSearchOrStatusCommand) {
        return (Object.values(SearchCommands).includes(cmd) || Object.values(StatusCommands).includes(cmd)) && cmd.toLowerCase().startsWith(commandPrefix)
      }
      // 默认情况下，显示所有匹配的命令
      return cmd.toLowerCase().startsWith(commandPrefix)
    })
    return matchedCommands
  })

  // 是否应该显示命令列表
  const shouldShowCommandList = computed(() => {
    if (!isLocalSearch.value) {
      return false
    }
    
    const trimmedQuery = query.value.trim()
    
    // 检查是否包含命令（以 - 开头或包含 空格-）
    const hasCommandPrefix = trimmedQuery.startsWith('-') || trimmedQuery.includes(' -')
    if (!trimmedQuery || !hasCommandPrefix) {
      return false
    }
    
    // 检查原始查询末尾是否有空格（表示命令输入结束）
    const endsWithSpace = query.value.endsWith(' ')
    if (endsWithSpace) {
      return false
    }

    // 提取当前正在输入的命令部分
    const parts = trimmedQuery.split(/\s+/)
    const lastPart = parts[parts.length - 1]
    
    if (!lastPart.startsWith('-')) {
      return false
    }
    
    const commandPrefix = lastPart.substring(1).toLowerCase()
    
    // 检查是否已经输入了完整的页面命令
    const hasCompletePageCommand = parts.some(part => {
      const cmd = part.startsWith('-') ? part.substring(1).toLowerCase() : part.toLowerCase()
      return Object.values(PageCommands).includes(cmd)
    })

    // 如果已经输入了完整的页面命令，则不显示命令列表
    // 因为页面命令是打开一个页面，不能与其他命令组合使用
    if (hasCompletePageCommand) {
      return false
    }

    // 检查命令是否已完成
    const isCommandComplete = commandPrefix && allCommands.value.some(cmd => {
      return cmd.toLowerCase() === commandPrefix
    })
    
    // 如果命令已完成，关闭命令列表
    if (isCommandComplete) {
      return false
    }
    
    // 检查是否有匹配的命令
    const hasMatches = currentCommands.value.length > 0
    
    // 如果没有匹配的命令，关闭命令列表
    if (!hasMatches) {
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
    
    if (isLocalSearch.value) {
      performSearch()
      // 如果不是命令模式且查询词为空，刷新当前显示
      if (!query.value.trim() && !commandMode.value) {
        refreshCurrentDisplay({ results, displayMode }, websiteStore)
      }
      // 更新命令列表显示状态
      setShowCommandList(shouldShowCommandList.value)
      
      // 如果显示命令列表，隐藏标签列表
      if (shouldShowCommandList.value) {
        setShowTagsList(false)
      } else {
        // 否则根据 shouldShowTagsList 更新标签列表显示状态
        setShowTagsList(shouldShowTagsList.value)
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
    showTagsList.value = false
    showCommandList.value = false
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
    // 获取当前查询
    const currentQuery = query.value.trim()
    
    // 检查是否包含 -tag 命令
    const tagCommandPattern = /-tag\s*(.*)$/
    const match = currentQuery.match(tagCommandPattern)

    let commandQuery
    
    if (match) {
      // 提取 -tag 后面的所有内容
      const tagsInput = match[1].trim()
      
      // 检查原始查询末尾是否有空格（表示tag输入结束）
      const endsWithSpace = query.value.endsWith(' ')
      
      if (tagsInput) {
        // -tag 后面有输入
        if (endsWithSpace) {
          // -tag 后面有输入且末尾有空格，添加 tag
          commandQuery = `${currentQuery} ${tag}`
        } else {
          // -tag 后面有输入但末尾没有空格，替换最后一个 tag
          const parts = currentQuery.split(/\s+/)
          parts[parts.length - 1] = tag
          commandQuery = parts.join(' ')
        }
      } else {
        // -tag 后面没有输入，添加 tag
        commandQuery = `${currentQuery} ${tag}`
      }
    } else {
      // 没有 -tag 命令，创建新的 -tag 命令
      commandQuery = `-tag ${tag}`
    }
    
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
