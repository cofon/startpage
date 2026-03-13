/**
 * 显示模式管理工具
 * 用于统一管理显示模式切换和结果更新
 */

/**
 * 更新显示结果
 * @param {Object} searchStore - 搜索 store
 * @param {Object} websiteStore - 网站 store
 * @param {string} mode - 显示模式
 */
export function updateDisplayResults(searchStore, websiteStore, mode) {
  switch (mode) {
    case 'marked':
      searchStore.results = websiteStore.markedWebsites
      break
    case 'search':
      if (searchStore.query && searchStore.query.trim()) {
        searchStore.results = websiteStore.searchWebsites(searchStore.query)
      } else {
        searchStore.results = []
      }
      break
    case 'empty':
      searchStore.results = []
      break
    default:
      searchStore.results = []
  }
}

/**
 * 刷新当前显示
 * @param {Object} searchStore - 搜索 store
 * @param {Object} websiteStore - 网站 store
 */
export function refreshCurrentDisplay(searchStore, websiteStore) {
  updateDisplayResults(searchStore, websiteStore, searchStore.displayMode)
}

/**
 * 处理网站删除后的显示更新
 * @param {Object} searchStore - 搜索 store
 * @param {Object} websiteStore - 网站 store
 * @param {string} websiteId - 被删除的网站ID
 */
export function handleWebsiteDeleted(searchStore, websiteStore, websiteId) {
  if (searchStore.displayMode === 'marked') {
    searchStore.results = websiteStore.markedWebsites
  } else if (searchStore.displayMode === 'search') {
    searchStore.results = searchStore.results.filter(w => w.id !== websiteId)
  }
}

/**
 * 处理网站恢复后的显示更新
 * @param {Object} searchStore - 搜索 store
 * @param {Object} websiteStore - 网站 store
 * @param {string} websiteId - 被恢复的网站ID
 */
export function handleWebsiteRestored(searchStore, websiteStore, websiteId) {
  if (searchStore.displayMode === 'marked') {
    searchStore.results = websiteStore.markedWebsites
  } else if (searchStore.displayMode === 'search') {
    // 重新执行搜索，确保恢复的网站如果匹配搜索词会显示出来
    if (searchStore.query && searchStore.query.trim()) {
      searchStore.results = websiteStore.searchWebsites(searchStore.query)
    } else {
      searchStore.results = []
    }
  }
}

/**
 * 处理网站标记状态变化后的显示更新
 * @param {Object} searchStore - 搜索 store
 * @param {Object} websiteStore - 网站 store
 * @param {boolean} isMarked - 新的标记状态
 */
export function handleWebsiteMarkToggled(searchStore, websiteStore, isMarked) {
  if (searchStore.displayMode === 'marked') {
    searchStore.results = websiteStore.markedWebsites
  } else if (searchStore.displayMode === 'search') {
    if (searchStore.query && searchStore.query.trim()) {
      searchStore.results = websiteStore.searchWebsites(searchStore.query)
    }
  }
}
