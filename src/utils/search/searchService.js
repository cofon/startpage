/**
 * 搜索系统重构
 * 基于 TEST_RESULT.md 的要求实现
 */

// 命令类型定义
export const CommandType = {
  STATUS: 'status',
  SEARCH: 'search',
  PAGE: 'page'
}

// 状态命令定义
export const StatusCommands = {
  ACTIVE: 'active',
  UNACTIVE: 'unactive',
  MARKED: 'marked',
  UNMARKED: 'unmarked',
  HIDDEN: 'hidden',
  UNHIDDEN: 'unhidden',
  ALL: 'all'
}

// 搜索命令定义
export const SearchCommands = {
  NAME: 'name',
  TITLE: 'title',
  DESC: 'desc',
  URL: 'url',
  TAG: 'tag'
}

// 页面命令定义
export const PageCommands = {
  THEME: 'theme',
  SEARCH: 'search',
  ADD: 'add',
  IMPORT: 'import',
  EXPORT: 'export',
  BATCH: 'batch',
  HELP: 'help'
}

/**
 * 解析搜索查询
 * @param {string} query - 搜索查询字符串
 * @returns {Object} 解析结果
 */
export function parseSearchQuery(query) {
  // 处理 undefined、null 或非字符串的情况
  if (!query || typeof query !== 'string') {
    return {
      type: 'normal',
      keywords: [],
      filters: null,
      pageCommand: null,
      hasIncompleteCommand: false
    }
  }

  const trimmedQuery = query.toLowerCase().trim()

  if (!trimmedQuery) {
    return {
      type: 'normal',
      keywords: [],
      filters: null,
      pageCommand: null,
      hasIncompleteCommand: false
    }
  }

  // 检查是否是命令模式（以 - 开头）
  if (trimmedQuery.startsWith('-')) {
    // 命令模式：解析命令
    const result = parseCommand(trimmedQuery)
    return result
  }

  // 检查是否包含命令（包含 - 开头的部分）
  if (trimmedQuery.includes(' -')) {
    // 包含命令，按命令模式处理
    const result = parseCommand('-' + trimmedQuery)
    return result
  }

  // 检查普通搜索中是否包含逻辑运算符
  if (trimmedQuery.includes('|') || trimmedQuery.includes('&')) {
    const result = parseNormalSearchWithOperators(trimmedQuery)
    return result
  }

  // 普通搜索：支持多个关键词（空格分隔，AND关系）
  const keywords = trimmedQuery.split(/\s+/).filter(k => k.length > 0)

  return {
    type: 'normal',
    keywords,
    filters: null,
    pageCommand: null,
    hasIncompleteCommand: false
  }
}

/**
 * 解析命令
 * @param {string} command - 命令字符串
 * @returns {Object} 解析结果
 */
function parseCommand(command) {
  // 移除开头的 -
  const cmd = command.substring(1).trim()
  
  // 首先按 | 分割成多个 OR 组
  const orGroups = cmd.split('|').map(group => group.trim()).filter(group => group.length > 0)
  
  // 检查是否是页面命令（第一个部分）
  const firstPart = orGroups[0]?.split(/\s+/)[0]
  if (firstPart && Object.values(PageCommands).includes(firstPart)) {
    return {
      type: 'command',
      keywords: [],
      filters: null,
      pageCommand: firstPart,
      hasIncompleteCommand: false
    }
  }
  
  let hasIncompleteCommand = false
  let hasValidCommand = false
  
  // 检查是否是单纯的 -xxx 形式的不完整命令
  if (orGroups.length === 1) {
    const andGroups = orGroups[0].split('&').map(group => group.trim()).filter(group => group.length > 0)
    if (andGroups.length === 1) {
      const parts = andGroups[0].split(/\s+/)
      if (parts.length === 1) {
        const part = parts[0]
        // 检查是否是状态命令或搜索命令
        if (Object.values(StatusCommands).includes(part) || Object.values(SearchCommands).includes(part)) {
          // 有效命令，继续处理
        } else {
          // 单纯的 -xxx 形式的不完整命令，返回 noResults: true
          return {
            type: 'command',
            keywords: [],
            filters: { noResults: true },
            pageCommand: null,
            hasIncompleteCommand: true
          }
        }
      }
    }
  }
  
  // 解析每个 OR 组
  const filterGroups = orGroups.map(orGroup => {
    // 按 & 分割成多个 AND 子组
    const andGroups = orGroup.split('&').map(group => group.trim()).filter(group => group.length > 0)
    
    // 解析每个 AND 子组
    const andFilters = andGroups.map(andGroup => {
      const parts = andGroup.split(/\s+/)
      const filter = {
        isActive: true,
        isMarked: undefined,
        isHidden: false,
        searchFields: {},
        keywords: []
      }
      
      let i = 0
      while (i < parts.length) {
        let part = parts[i]
        
        // 检查是否是状态命令（支持带 - 前缀的情况）
        if (Object.values(StatusCommands).includes(part) || (part.startsWith('-') && Object.values(StatusCommands).includes(part.substring(1)))) {
          let cmdName = part
          if (part.startsWith('-')) {
            cmdName = part.substring(1)
          }
          handleStatusCommand(cmdName, filter)
          hasValidCommand = true
          i++
        }
        // 检查是否是搜索命令（支持带 - 前缀的情况）
        else if (Object.values(SearchCommands).includes(part) || (part.startsWith('-') && Object.values(SearchCommands).includes(part.substring(1)))) {
          let cmdName = part
          if (part.startsWith('-')) {
            cmdName = part.substring(1)
          }
          // 提取搜索命令的参数
          const params = []
          i++
          while (i < parts.length) {
            const param = parts[i]
            // 如果参数以 - 开头，停止提取，将其视为新的命令
            if (param.startsWith('-')) {
              break
            }
            params.push(param)
            i++
          }
          filter.searchFields[cmdName] = params
          // 检查搜索命令是否有参数
          if (params.length === 0) {
            // 搜索命令没有参数，标记为不完整命令
            hasIncompleteCommand = true
          } else {
            hasValidCommand = true
          }
        }
        // 检查是否是不完整的命令（以 - 开头，但不是有效命令）
        else if (part.startsWith('-')) {
          hasIncompleteCommand = true
          i++
        }
        // 普通关键字
        else {
          // 只有当没有不完整命令时，才将其视为关键字
          if (!hasIncompleteCommand) {
            filter.keywords.push(part)
            hasValidCommand = true
          }
          i++
        }
      }
      
      return filter
    })
    
    // 合并所有 AND 子组的过滤器
    const combinedFilter = andFilters.reduce((combinedFilter, currentFilter) => {
      // 合并状态命令
      if (currentFilter.isActive !== undefined) combinedFilter.isActive = currentFilter.isActive
      if (currentFilter.isMarked !== undefined) combinedFilter.isMarked = currentFilter.isMarked
      if (currentFilter.isHidden !== undefined) combinedFilter.isHidden = currentFilter.isHidden
      
      // 合并搜索字段
      combinedFilter.searchFields = { ...combinedFilter.searchFields, ...currentFilter.searchFields }
      
      // 合并关键字
      combinedFilter.keywords = [...combinedFilter.keywords, ...currentFilter.keywords]
      
      return combinedFilter
    }, {
      isActive: true,
      isMarked: undefined,
      isHidden: false,
      searchFields: {},
      keywords: []
    })
    
    return combinedFilter
  })
  
  // 检查是否有不完整的命令（单个 - 字符）
  if (cmd === '') {
    hasIncompleteCommand = true
  }
  
  // 检查是否有有效的命令（如果没有明确设置，检查过滤器组）
  if (!hasValidCommand) {
    // 如果没有有效的命令，且有不完整的命令，返回 noResults: true
    if (hasIncompleteCommand) {
      return {
        type: 'command',
        keywords: [],
        filters: { noResults: true },
        pageCommand: null,
        hasIncompleteCommand: true
      }
    }
    
    // 检查过滤器组是否有有效内容
    hasValidCommand = filterGroups.some(group => {
      // 检查是否有明确的状态命令、搜索命令或关键字
      const hasStatusCommand = group.isActive !== undefined || group.isMarked !== undefined || group.isHidden !== undefined
      const hasSearchCommand = Object.keys(group.searchFields).length > 0
      const hasKeywords = group.keywords.length > 0
      
      return hasStatusCommand || hasSearchCommand || hasKeywords
    })
  }
  
  // 如果有不完整的命令，返回 noResults: true
  if (hasIncompleteCommand) {
    // 检查是否有普通关键字
    const hasKeywords = filterGroups.some(group => group.keywords.length > 0)
    return {
      type: 'command',
      keywords: [],
      filters: hasValidCommand || hasKeywords ? (filterGroups.length === 1 ? filterGroups[0] : filterGroups) : { noResults: true },
      pageCommand: null,
      hasIncompleteCommand: true
    }
  }
  
  return {
    type: 'command',
    keywords: [],
    filters: hasValidCommand ? (filterGroups.length === 1 ? filterGroups[0] : filterGroups) : { noResults: true },
    pageCommand: null,
    hasIncompleteCommand: false
  }
}

/**
 * 解析包含逻辑运算符的普通搜索
 * @param {string} query - 搜索查询字符串
 * @returns {Object} 解析结果
 */
function parseNormalSearchWithOperators(query) {
  // 按 | 分割成多个 OR 组
  const orGroups = query.split('|').map(group => group.trim()).filter(group => group.length > 0)

  if (orGroups.length === 1) {
    // 只有一个 OR 组，检查是否包含 & 运算符
    const andGroup = orGroups[0]
    if (andGroup.includes('&')) {
      // 按 & 分割成多个 AND 子组
      const andSubGroups = andGroup.split('&').map(subGroup => subGroup.trim()).filter(subGroup => subGroup.length > 0)
      if (andSubGroups.length === 1) {
        // 只有一个 AND 子组，按普通搜索处理
        const keywords = andSubGroups[0].split(/\s+/).filter(k => k.length > 0)
        return {
          type: 'normal',
          keywords,
          filters: null,
          pageCommand: null,
          hasIncompleteCommand: false
        }
      } else {
        // 多个 AND 子组，构建单个过滤器，所有关键词都必须匹配
        const allKeywords = andSubGroups.flatMap(subGroup => subGroup.split(/\s+/).filter(k => k.length > 0))
        return {
          type: 'command',
          keywords: [],
          filters: {
            isActive: true,
            isMarked: undefined,
            isHidden: false,
            searchFields: {},
            keywords: allKeywords
          },
          pageCommand: null,
          hasIncompleteCommand: false
        }
      }
    } else {
      // 不包含 & 运算符，按普通搜索处理
      const keywords = andGroup.split(/\s+/).filter(k => k.length > 0)
      return {
        type: 'normal',
        keywords,
        filters: null,
        pageCommand: null,
        hasIncompleteCommand: false
      }
    }
  }

  // 多个 OR 组，构建过滤器组
  const filterGroups = orGroups.map(orGroup => {
    if (orGroup.includes('&')) {
      // 按 & 分割成多个 AND 子组
      const andSubGroups = orGroup.split('&').map(subGroup => subGroup.trim()).filter(subGroup => subGroup.length > 0)
      const allKeywords = andSubGroups.flatMap(subGroup => subGroup.split(/\s+/).filter(k => k.length > 0))
      return {
        isActive: true,
        isMarked: undefined,
        isHidden: false,
        searchFields: {},
        keywords: allKeywords
      }
    } else {
      // 不包含 & 运算符，直接处理
      const keywords = orGroup.split(/\s+/).filter(k => k.length > 0)
      return {
        isActive: true,
        isMarked: undefined,
        isHidden: false,
        searchFields: {},
        keywords
      }
    }
  })

  return {
    type: 'command',
    keywords: [],
    filters: filterGroups,
    pageCommand: null,
    hasIncompleteCommand: false
  }
}

/**
 * 处理状态命令
 * @param {string} command - 状态命令
 * @param {Object} filter - 过滤器对象
 */
function handleStatusCommand(command, filter) {
  switch (command) {
    case StatusCommands.ACTIVE:
      filter.isActive = true
      filter.isHidden = false
      break
    case StatusCommands.UNACTIVE:
      filter.isActive = false
      break
    case StatusCommands.MARKED:
      filter.isMarked = true
      break
    case StatusCommands.UNMARKED:
      filter.isMarked = false
      break
    case StatusCommands.HIDDEN:
      filter.isHidden = true
      break
    case StatusCommands.UNHIDDEN:
      filter.isHidden = false
      break
    case StatusCommands.ALL:
      // -all 命令显示除了 isActive === false 和 isHidden === true 之外的所有网站
      filter.isActive = true
      filter.isHidden = false
      break
  }
}

/**
 * 解析搜索命令
 * @param {Array} parts - 命令部分数组
 * @param {number} startIndex - 开始索引
 * @returns {Object} 解析结果
 */
function parseSearchCommand(parts, startIndex) {
  // 获取命令
  const command = parts[startIndex]
  const field = command
  const params = []
  let i = startIndex + 1

  // 收集参数，直到遇到命令边界
  while (i < parts.length) {
    const part = parts[i]
    if (part === '&' || part === '|' || Object.values(StatusCommands).includes(part) || (part.startsWith('-') && Object.values(SearchCommands).includes(part.substring(1)))) {
      break
    }
    params.push(part)
    i++
  }

  return { nextIndex: i, field, params }
}

/**
 * 检查网站是否匹配关键字
 * @param {Object} website - 网站对象
 * @param {string} keyword - 关键字
 * @returns {boolean} 是否匹配
 */
export function matchesKeyword(website, keyword) {
  return (
    (website.name && website.name.toLowerCase().includes(keyword)) ||
    (website.title && website.title.toLowerCase().includes(keyword)) ||
    (website.url && website.url.toLowerCase().includes(keyword)) ||
    (website.description && website.description.toLowerCase().includes(keyword)) ||
    (website.tags && website.tags.some(tag => tag.toLowerCase().includes(keyword)))
  )
}

/**
 * 应用单个过滤器到网站
 * @param {Object} website - 网站对象
 * @param {Object} filter - 过滤器对象
 * @param {Array} allTags - 所有有效的标签列表
 * @returns {boolean} 是否匹配
 */
export function applySingleFilter(website, filter, allTags = []) {
  // 检查是否需要不显示任何网站
  if (filter.noResults) {
    return false
  }

  // 检查 isActive
  if (filter.isActive !== undefined && website.isActive !== filter.isActive) {
    return false
  }

  // 检查 isMarked
  if (filter.isMarked !== undefined && website.isMarked !== filter.isMarked) {
    return false
  }

  // 检查 isHidden
  if (filter.isHidden !== undefined && website.isHidden !== filter.isHidden) {
    return false
  }

  // 检查搜索字段
  for (const [field, params] of Object.entries(filter.searchFields)) {
    if (params.length === 0) {
      // 没有参数的情况
      if (field === SearchCommands.DESC || field === SearchCommands.TAG) {
        // -desc 和 -tag 没有参数时，不影响其他条件的检查
        // 继续检查其他条件，比如关键字
        continue
      }
      // 其他字段没有参数时显示所有网站
    } else {
      // 有参数的情况
      if (field === SearchCommands.TAG) {
        // tag 是 OR 关系，并且只考虑有效标签
        const validTags = params.filter(tag => allTags.includes(tag))
        if (validTags.length === 0) {
          // 没有有效标签，不显示任何网站
          return false
        }
        const hasAnyTag = validTags.some(tag => 
          website.tags && website.tags.some(t => t.toLowerCase() === tag)
        )
        if (!hasAnyTag) {
          return false
        }
      } else {
        // 其他字段是 AND 关系
        const matchesAllParams = params.every(param => {
          let value
          // 映射字段名
          if (field === SearchCommands.DESC) {
            value = website.description
          } else {
            value = website[field]
          }
          return value && value.toLowerCase().includes(param)
        })
        if (!matchesAllParams) {
          return false
        }
      }
    }
  }

  // 检查关键字
  if (filter.keywords.length > 0) {
    const matchesAllKeywords = filter.keywords.every(kw => matchesKeyword(website, kw))
    if (!matchesAllKeywords) {
      return false
    }
  }

  return true
}

/**
 * 应用过滤器到网站列表
 * @param {Array} websites - 网站列表
 * @param {Object|Array} filters - 过滤器对象或过滤器组数组
 * @param {Array} allTags - 所有有效的标签列表
 * @returns {Array} 过滤后的网站列表
 */
export function applyFilters(websites, filters, allTags = []) {
  // 如果 filters 为 null，返回所有活跃且非隐藏的网站
  if (!filters) {
    return websites.filter(w => w.isActive && !w.isHidden)
  }

  // 检查是否是过滤器组数组（OR 关系）
  if (Array.isArray(filters)) {
    // OR 逻辑：只要匹配任何一个过滤器组就通过
    const matchedWebsites = filters
      .map(filter => websites.filter(website => applySingleFilter(website, filter, allTags)))
      .flat()
    // 使用 Set 去重
    return [...new Set(matchedWebsites)]
  } else {
    // 单个过滤器（AND 关系）
    return websites.filter(website => applySingleFilter(website, filters, allTags))
  }
}

/**
 * 执行搜索
 * @param {Array} websites - 网站列表
 * @param {Object} parsedQuery - 解析后的搜索查询
 * @param {Array} allTags - 所有有效的标签列表
 * @returns {Array} 搜索结果
 */
export function executeSearch(websites, parsedQuery, allTags = []) {
  if (parsedQuery.type === 'normal') {
    // 普通搜索
    if (parsedQuery.keywords.length === 0) {
      // 空查询，返回所有活跃且非隐藏的网站
      return websites.filter(w => w.isActive && !w.isHidden)
    }
    // 普通搜索：所有关键字都必须匹配
    return websites.filter(website => {
      // 过滤掉 isActive === false 或 isHidden === true 的网站
      if (!website.isActive || website.isHidden) {
        return false
      }
      // 检查所有关键字是否匹配
      return parsedQuery.keywords.every(keyword => matchesKeyword(website, keyword))
    })
  } else if (parsedQuery.type === 'command') {
    // 命令搜索
    if (parsedQuery.filters) {
      return applyFilters(websites, parsedQuery.filters, allTags)
    }
    return []
  }
  return []
}