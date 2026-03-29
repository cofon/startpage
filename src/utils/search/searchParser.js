/**
 * 搜索解析器 - 处理高级搜索命令
 * 支持特殊命令和组合搜索
 */

/**
 * 解析搜索查询
 * @param {string} query - 搜索查询字符串
 * @returns {Object} 解析结果，包含过滤器和关键词
 */
export function parseSearchQuery(query) {
  // 处理 undefined、null 或非字符串的情况
  if (!query || typeof query !== 'string') {
    return {
      isAdvanced: false,
      keywords: [],
      filters: null,
      pageCommand: null
    }
  }

  const keyword = query.toLowerCase().trim()

  if (!keyword) {
    return {
      isAdvanced: false,
      keywords: [],
      filters: null,
      pageCommand: null
    }
  }

  // 检查是否是特殊命令（以 -- 开头）
  if (keyword.startsWith('--')) {
    // 如果只有 "--" 两个字符，不显示任何网站
    if (keyword === '--') {
      return {
        isAdvanced: true,
        filters: { noResults: true },
        pageCommand: null,
        keywords: []
      }
    }
    // 命令模式：解析高级搜索命令
    return parseAdvancedSearch(keyword)
  }

  // 检查普通搜索中是否包含逻辑运算符
  if (keyword.includes('|') || keyword.includes('&')) {
    return parseNormalSearchWithOperators(keyword)
  }

  // 普通搜索：支持多个关键词（空格分隔，AND关系）
  const keywords = keyword.split(/\s+/).filter(k => k.length > 0)

  return {
    isAdvanced: false,
    keywords,
    filters: null,
    pageCommand: null
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
          isAdvanced: false,
          keywords,
          filters: null,
          pageCommand: null
        }
      } else {
        // 多个 AND 子组，构建单个过滤器，所有关键词都必须匹配
        const allKeywords = andSubGroups.flatMap(subGroup => subGroup.split(/\s+/).filter(k => k.length > 0))
        return {
          isAdvanced: true,
          filters: {
            isActive: true,
            isMarked: undefined,
            isHidden: false,
            searchFields: {},
            keywords: allKeywords
          },
          pageCommand: null,
          keywords: []
        }
      }
    } else {
      // 不包含 & 运算符，按普通搜索处理
      const keywords = andGroup.split(/\s+/).filter(k => k.length > 0)
      return {
        isAdvanced: false,
        keywords,
        filters: null,
        pageCommand: null
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
    isAdvanced: true,
    filters: filterGroups,
    pageCommand: null,
    keywords: []
  }
}

/**
 * 解析高级搜索命令
 * @param {string} command - 以 -- 开头的命令
 * @returns {Object} 解析结果
 */
function parseAdvancedSearch(command) {
  // 移除开头的 --
  const cmd = command.substring(2).trim()
  
  // 首先按 | 分割成多个 OR 组
  const orGroups = cmd.split('|').map(group => group.trim()).filter(group => group.length > 0)
  
  // 检查是否是页面命令（第一个部分）
  const pageCommands = ['theme', 'search', 'add', 'import', 'export', 'batch', 'help']
  const firstPart = orGroups[0]?.split(/\s+/)[0]?.startsWith('--') 
    ? orGroups[0].split(/\s+/)[0].substring(2) 
    : orGroups[0]?.split(/\s+/)[0]
  if (firstPart && pageCommands.includes(firstPart)) {
    return {
      isAdvanced: true,
      filters: null,
      pageCommand: firstPart,
      keywords: []
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
        isActive: undefined,
        isMarked: undefined,
        isHidden: undefined,
        searchFields: {},
        keywords: []
      }
      
      let i = 0
      while (i < parts.length) {
        let part = parts[i]
        
        // 如果 part 以 -- 开头，移除 --
        if (part.startsWith('--')) {
          part = part.substring(2)
        }
        
        // 检查是否是状态命令
        if (isStatusCommand(part)) {
          handleStatusCommand(part, filter)
          i++
        }
        // 检查是否是搜索命令
        else if (isSearchCommand(part)) {
          const { nextIndex, field, params } = parseSearchCommand(parts, i)
          filter.searchFields[field] = params
          i = nextIndex
        }
        // 普通关键字
        else {
          filter.keywords.push(part)
          i++
        }
      }
      
      return filter
    })
    
    // 合并所有 AND 子组的过滤器
    return andFilters.reduce((combinedFilter, currentFilter) => {
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
      isActive: undefined,
      isMarked: undefined,
      isHidden: undefined,
      searchFields: {},
      keywords: []
    })
  })
  
  // 检查是否有有效的命令
  const hasValidCommand = filterGroups.some(group => {
    return group.isActive !== undefined || 
           group.isMarked !== undefined || 
           group.isHidden !== undefined || 
           Object.keys(group.searchFields).length > 0 || 
           group.keywords.length > 0
  })
  
  if (!hasValidCommand) {
    return {
      isAdvanced: true,
      filters: { noResults: true },
      pageCommand: null,
      keywords: []
    }
  }
  
  return {
    isAdvanced: true,
    filters: filterGroups.length === 1 ? filterGroups[0] : filterGroups,
    pageCommand: null,
    keywords: []
  }
}

/**
 * 检查是否是状态命令
 * @param {string} command - 命令字符串
 * @returns {boolean} 是否是状态命令
 */
function isStatusCommand(command) {
  const statusCommands = ['active', 'unactive', 'marked', 'unmarked', 'hidden', 'unhidden', 'all']
  return statusCommands.includes(command)
}

/**
 * 检查是否是搜索命令
 * @param {string} command - 命令字符串
 * @returns {boolean} 是否是搜索命令
 */
function isSearchCommand(command) {
  const searchCommands = ['name', 'title', 'desc', 'url', 'tag']
  return searchCommands.includes(command)
}

/**
 * 处理状态命令
 * @param {string} command - 状态命令
 * @param {Object} filters - 过滤器对象
 */
function handleStatusCommand(command, filters) {
  switch (command) {
    case 'active':
      filters.isActive = true
      filters.isHidden = false
      break
    case 'unactive':
      filters.isActive = false
      break
    case 'marked':
      filters.isMarked = true
      break
    case 'unmarked':
      filters.isMarked = false
      break
    case 'hidden':
      filters.isHidden = true
      break
    case 'unhidden':
      filters.isHidden = false
      break
    case 'all':
      // --all 命令显示除了 isActive === false 和 isHidden === true 之外的所有网站
      filters.isActive = true
      filters.isHidden = false
      break
  }
}

/**
 * 解析搜索命令
 * @param {Array} parts - 命令部分数组
 * @param {number} startIndex - 开始索引
 * @returns {Object} 解析结果，包含下一个索引、字段名和参数
 */
function parseSearchCommand(parts, startIndex) {
  // 获取命令，移除 -- 前缀
  const command = parts[startIndex].startsWith('--') 
    ? parts[startIndex].substring(2) 
    : parts[startIndex]
  const field = command
  const params = []
  let i = startIndex + 1

  // 收集参数，直到遇到命令边界
  while (i < parts.length) {
    const part = parts[i]
    if (part === '&' || part === '|' || part.startsWith('--')) {
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
function matchesKeyword(website, keyword) {
  return (
    (website.name && website.name.toLowerCase().includes(keyword)) ||
    (website.title && website.title.toLowerCase().includes(keyword)) ||
    (website.url && website.url.toLowerCase().includes(keyword)) ||
    (website.description && website.description.toLowerCase().includes(keyword)) ||
    (website.tags && website.tags.some(tag => tag.toLowerCase().includes(keyword)))
  )
}

/**
 * 应用单个过滤器组到网站
 * @param {Object} website - 网站对象
 * @param {Object} filter - 过滤器对象
 * @param {Array} allTags - 所有有效的标签列表
 * @returns {boolean} 是否匹配
 */
function applySingleFilter(website, filter, allTags = []) {
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
      if (field === 'desc' || field === 'tag') {
        // --desc 和 --tag 没有参数时不显示任何网站
        return false
      }
      // 其他字段没有参数时显示所有网站
    } else {
      // 有参数的情况
      if (field === 'tag') {
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
          const value = website[field]
          return value && value.toLowerCase().includes(param)
        })
        if (!matchesAllParams) {
          return false
        }
      }
    }
  }

  // 检查关键词
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
