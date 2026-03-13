/**
 * 网站对象标准化工具
 * 用于统一网站对象的创建和转换，消除重复代码
 */

/**
 * 创建标准网站对象
 * @param {Object} data - 网站数据
 * @returns {Object} 标准化的网站对象
 */
export function createWebsiteObject(data = {}) {
  return {
    id: data.id || null,
    name: data.name || '',
    title: data.title || '',
    url: data.url || '',
    description: data.description || '',
    tags: Array.isArray(data.tags) ? [...data.tags] : [],
    visitCount: data.visitCount || 0,
    isMarked: data.isMarked || false,
    markOrder: data.isMarked ? (data.markOrder || 0) : 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isHidden: data.isHidden !== undefined ? data.isHidden : false,
    // 图标相关字段
    iconUrl: data.url || '',
    iconData: data.iconData || null,
    iconGenerateData: data.iconGenerateData || null,
    iconCanFetch: data.iconCanFetch !== undefined ? data.iconCanFetch : true,
    iconFetchAttempts: data.iconFetchAttempts || 0,
    iconLastFetchTime: data.iconLastFetchTime || null,
    iconError: data.iconError || null,
    // 时间戳
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    lastVisited: data.lastVisited || null
  }
}

/**
 * 从响应式对象创建普通对象（用于数据库操作）
 * @param {Object} website - 响应式网站对象
 * @returns {Object} 普通网站对象
 */
export function normalizeWebsiteForDB(website) {
  if (!website) return null

  return {
    id: website.id,
    name: website.name,
    title: website.title || '',
    url: website.url,
    description: website.description || '',
    tags: Array.isArray(website.tags) ? [...website.tags] : [],
    visitCount: website.visitCount || 0,
    isMarked: website.isMarked,
    markOrder: website.isMarked ? (website.markOrder || 0) : 0,
    isActive: website.isActive !== undefined ? website.isActive : true,
    isHidden: website.isHidden !== undefined ? website.isHidden : false,
    iconUrl: website.iconUrl || '',
    iconData: website.iconData || null,
    iconGenerateData: website.iconGenerateData || null,
    iconCanFetch: website.iconCanFetch !== undefined ? website.iconCanFetch : true,
    iconFetchAttempts: website.iconFetchAttempts || 0,
    iconLastFetchTime: website.iconLastFetchTime || null,
    iconError: website.iconError || null,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
    lastVisited: website.lastVisited
  }
}

/**
 * 批量标准化网站对象（用于数据库操作）
 * @param {Array} websites - 响应式网站对象数组
 * @returns {Array} 普通网站对象数组
 */
export function normalizeWebsitesForDB(websites) {
  if (!Array.isArray(websites)) return []
  return websites.map(website => normalizeWebsiteForDB(website))
}

/**
 * 创建用于更新的网站对象（只包含需要更新的字段）
 * @param {Object} website - 原始网站对象
 * @param {Object} updates - 更新的字段
 * @returns {Object} 更新后的网站对象
 */
export function createUpdateObject(website, updates = {}) {
  const normalized = normalizeWebsiteForDB(website)
  return {
    ...normalized,
    ...updates,
    updatedAt: new Date()
  }
}
