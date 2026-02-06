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
      keywords: []
    }
  }

  const keyword = query.toLowerCase().trim()

  if (!keyword) {
    return {
      isAdvanced: false,
      keywords: []
    }
  }

  // 检查是否是特殊命令（以 -- 开头）
  if (keyword.startsWith('--')) {
    return parseAdvancedSearch(keyword)
  }

  // 普通搜索：支持多个关键词（空格分隔，AND关系）
  const keywords = keyword.split(/\s+/).filter(k => k.length > 0)

  return {
    isAdvanced: false,
    keywords
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
  const parts = cmd.split(/\s+/)

  // 解析命令
  const filters = {
    isActive: undefined,
    isMarked: undefined,
    isHidden: undefined,
    tags: [],
    keywords: [],
    sortBy: null // 'visit', 'recent'
  }

  let i = 0
  while (i < parts.length) {
    const part = parts[i]

    switch (part) {
      case 'all':
        // 显示所有网站（包括已删除和隐藏的）
        filters.isActive = undefined
        filters.isHidden = undefined
        break

      case 'active':
        // 检查下一个参数是否是 true/false
        if (i + 1 < parts.length && (parts[i + 1] === 'true' || parts[i + 1] === 'false')) {
          filters.isActive = parts[i + 1] === 'true'
          i++
        } else {
          filters.isActive = true
        }
        break

      case 'inactive':
        filters.isActive = false
        break

      case 'marked':
        // 检查下一个参数是否是 true/false
        if (i + 1 < parts.length && (parts[i + 1] === 'true' || parts[i + 1] === 'false')) {
          filters.isMarked = parts[i + 1] === 'true'
          i++
        } else {
          filters.isMarked = true
        }
        break

      case 'unmarked':
        filters.isMarked = false
        break

      case 'hidden':
        filters.isHidden = true
        break

      case 'visible':
        filters.isHidden = false
        break

      case 'tag':
        // 下一个参数是标签名
        if (i + 1 < parts.length) {
          filters.tags.push(parts[i + 1].toLowerCase())
          i++
        }
        break

      case 'visit':
        filters.sortBy = 'visit'
        break

      case 'recent':
        filters.sortBy = 'recent'
        break

      default:
        // 如果不是命令，则作为关键词
        filters.keywords.push(part)
        break
    }

    i++
  }

  return {
    isAdvanced: true,
    filters
  }
}

/**
 * 应用过滤器到网站列表
 * @param {Array} websites - 网站列表
 * @param {Object} filters - 过滤器对象
 * @returns {Array} 过滤后的网站列表
 */
export function applyFilters(websites, filters) {
  let results = websites.filter(w => {
    // 检查 isActive
    if (filters.isActive !== undefined && w.isActive !== filters.isActive) {
      return false
    }

    // 检查 isMarked
    if (filters.isMarked !== undefined && w.isMarked !== filters.isMarked) {
      return false
    }

    // 检查 isHidden
    if (filters.isHidden !== undefined && w.isHidden !== filters.isHidden) {
      return false
    }

    // 检查标签
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => 
        w.tags && w.tags.some(t => t.toLowerCase() === tag)
      )
      if (!hasAllTags) {
        return false
      }
    }

    // 检查关键词
    if (filters.keywords.length > 0) {
      const matchesAllKeywords = filters.keywords.every(kw => {
        return (w.name && w.name.toLowerCase().includes(kw)) ||
               (w.url && w.url.toLowerCase().includes(kw)) ||
               (w.description && w.description.toLowerCase().includes(kw)) ||
               (w.tags && w.tags.some(tag => tag.toLowerCase().includes(kw)))
      })
      if (!matchesAllKeywords) {
        return false
      }
    }

    return true
  })

  // 应用排序
  if (filters.sortBy === 'visit') {
    results = results.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
  } else if (filters.sortBy === 'recent') {
    results = results.sort((a, b) => {
      const aTime = a.lastVisited ? new Date(a.lastVisited).getTime() : 0
      const bTime = b.lastVisited ? new Date(b.lastVisited).getTime() : 0
      return bTime - aTime
    })
  }

  return results
}
