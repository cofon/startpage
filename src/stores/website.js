/**
 * Website Store - 网站数据管理
 * 负责管理网站的增删改查、标记、搜索等功能
 * 优化：使用分层缓存策略，按需加载图标数据
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseSearchQuery, applyFilters } from '../utils/search/searchParser'
import { createWebsiteObject, normalizeWebsiteData } from '../utils/website/websiteUtils'
import db from '../utils/database'

export const useWebsiteStore = defineStore('website', () => {
  // 状态
  const websites = ref([]) // 只存储核心数据，不含图标
  const loading = ref(false)
  const error = ref(null)
  const iconCache = ref(new Map()) // 图标缓存，键为网站 ID
  const iconCacheSize = ref(50) // 缓存大小限制

  // 计算属性
  const markedWebsites = computed(() => {
    return websites.value
      .filter(w => w.isMarked && w.isActive)
      .sort((a, b) => a.markOrder - b.markOrder)
  })

  const activeWebsites = computed(() => {
    return websites.value.filter(w => w.isActive)
  })

  const allTags = computed(() => {
    const tags = new Set()
    websites.value.forEach(w => {
      if (w.isActive && w.tags) {
        w.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags)
  })

  // Actions
  function setWebsites(data) {
    // 过滤掉 iconData 和 iconGenerateData 字段，只存储核心数据
    websites.value = data.map(website => {
      const { iconData, iconGenerateData, ...coreData } = website
      return createWebsiteObject(coreData)
    })
  }

  async function addWebsite(website) {
    console.log('[websiteStore.addWebsite] 准备添加网站:', website)
    console.log('[websiteStore.addWebsite] 当前 websites 数量:', websites.value.length)

    // 检查 URL 是否已存在
    const existingWebsite = websites.value.find(w => w.url === website.url)
    if (existingWebsite) {
      console.log('[websiteStore.addWebsite] 网站已存在，返回现有网站:', existingWebsite)
      return existingWebsite
    }

    // 先创建网站对象
    let websiteWithDefaults = createWebsiteObject({
      ...website,
      visitCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isHidden: false
    })

    // 检查是否需要生成 SVG 图标
    if (!websiteWithDefaults.iconGenerateData) {
      console.log('[websiteStore.addWebsite] 生成 SVG 图标...')
      // 使用 normalizeWebsiteData 函数生成 SVG 图标
      websiteWithDefaults = normalizeWebsiteData(websiteWithDefaults)
      console.log('[websiteStore.addWebsite] SVG 图标生成完成:', websiteWithDefaults.iconGenerateData ? '成功' : '失败')
    }

    // 提取图标数据
    const { iconData, iconGenerateData } = websiteWithDefaults

    // 先保存到数据库，获取 ID
    let dbId
    try {
      console.log('[websiteStore.addWebsite] 准备保存到数据库...')
      dbId = await db.addWebsite(websiteWithDefaults)
      console.log('[websiteStore.addWebsite] 数据库返回 ID:', dbId)
    } catch (error) {
      console.error('保存网站到数据库失败:', error)
      throw error
    }

    // 使用数据库返回的 ID
    websiteWithDefaults.id = dbId

    // 添加到 store（过滤掉图标数据）
    console.log('[websiteStore.addWebsite] 准备添加到 store:', websiteWithDefaults)
    const { iconData: _, iconGenerateData: __, ...coreData } = websiteWithDefaults
    websites.value.push(createWebsiteObject(coreData))

    // 将图标数据添加到缓存
    if (iconData || iconGenerateData) {
      updateIconCache(dbId, iconData, iconGenerateData)
    }

    console.log('[websiteStore.addWebsite] 完成，当前 websites 数量:', websites.value.length)

    return websiteWithDefaults
  }

  async function updateWebsite(id, data) {
    const index = websites.value.findIndex(w => w.id === id)
    if (index !== -1) {
      // 创建一个新的网站对象，确保数组类型的字段也被正确更新
      const updatedWebsite = {
        ...websites.value[index],
        ...data,
        updatedAt: new Date()
      }
      // 如果 data 中包含 tags，确保创建一个新的数组
      if (data.tags && Array.isArray(data.tags)) {
        updatedWebsite.tags = [...data.tags]
      }

      // 提取图标数据
      const { iconData, iconGenerateData } = updatedWebsite

      // 更新 store（过滤掉图标数据）
      const { iconData: _, iconGenerateData: __, ...coreData } = updatedWebsite
      websites.value[index] = createWebsiteObject(coreData)

      // 更新图标缓存
      if (iconData || iconGenerateData) {
        updateIconCache(id, iconData, iconGenerateData)
      }

      // 更新数据库（保存完整数据）
      await db.updateWebsite(updatedWebsite)
    }
  }

  function deleteWebsite(id) {
    const index = websites.value.findIndex(w => w.id === id)
    if (index !== -1) {
      websites.value[index].isActive = false
      websites.value[index].updatedAt = new Date()
    }
  }

  function markWebsite(id, order) {
    const website = websites.value.find(w => w.id === id)
    if (website) {
      website.isMarked = true
      website.markOrder = order
      website.updatedAt = new Date()
    }
  }

  function unmarkWebsite(id) {
    const website = websites.value.find(w => w.id === id)
    if (website) {
      website.isMarked = false
      website.markOrder = null
      website.updatedAt = new Date()
    }
  }

  function incrementVisitCount(id) {
    const website = websites.value.find(w => w.id === id)
    if (website) {
      website.visitCount++
      website.lastVisited = new Date()
      website.updatedAt = new Date()
    }
  }

  function searchWebsites(query) {
    const parsed = parseSearchQuery(query)

    // 如果没有搜索词，返回所有非隐藏的网站
    if (!parsed.isAdvanced && parsed.keywords.length === 0) {
      return websites.value.filter(w => w.isActive && !w.isHidden)
    }

    // 如果是高级搜索（特殊命令）
    if (parsed.isAdvanced) {
      return applyFilters(websites.value, parsed.filters)
    }

    // 普通搜索：支持多个关键词（空格分隔，AND关系）
    const filtered = websites.value.filter(w => {
      // 检查是否匹配所有关键词
      const matchesAllKeywords = parsed.keywords.every(kw => {
        return (w.name && w.name.toLowerCase().includes(kw)) ||
               (w.title && w.title.toLowerCase().includes(kw)) ||
               (w.url && w.url.toLowerCase().includes(kw)) ||
               (w.description && w.description.toLowerCase().includes(kw)) ||
               (w.tags && w.tags.some(tag => tag.toLowerCase().includes(kw)))
      })

      return matchesAllKeywords && w.isActive && !w.isHidden
    })
    return filtered
  }

  function searchByTag(tag) {
    return websites.value.filter(w =>
      w.isActive && !w.isHidden && w.tags?.includes(tag)
    )
  }

  function reorderMarkedWebsites(newOrder) {
    // newOrder 是一个包含网站ID的数组，按照新的顺序排列
    newOrder.forEach((websiteId, index) => {
      const website = websites.value.find(w => w.id === websiteId)
      if (website) {
        website.markOrder = index + 1
        website.updatedAt = new Date()
      }
    })
  }

  // ========== 图标缓存管理方法 ==========

  /**
   * 更新图标缓存（LRU 策略）
   * @param {number} id - 网站 ID
   * @param {string} iconData - 图标数据
   * @param {string} iconGenerateData - 生成的图标数据
   */
  function updateIconCache(id, iconData, iconGenerateData) {
    // 如果缓存已满，移除最久未使用的项
    if (iconCache.value.size >= iconCacheSize.value) {
      const firstKey = iconCache.value.keys().next().value
      iconCache.value.delete(firstKey)
    }

    // 添加到缓存
    iconCache.value.set(id, {
      iconData,
      iconGenerateData,
      lastAccessed: Date.now()
    })
  }

  /**
   * 获取网站的图标数据（优先从缓存获取）
   * @param {number} id - 网站 ID
   * @returns {Object|null} - 图标数据对象
   */
  function getIconFromCache(id) {
    const cached = iconCache.value.get(id)
    if (cached) {
      // 更新访问时间
      cached.lastAccessed = Date.now()
      return cached
    }
    return null
  }

  /**
   * 按需加载网站图标数据
   * @param {number} id - 网站 ID
   * @returns {Promise<Object|null>} - 图标数据对象
   */
  async function loadWebsiteIcon(id) {
    // 检查缓存
    const cached = getIconFromCache(id)
    if (cached) {
      return cached
    }

    // 从数据库获取完整数据
    try {
      const website = await db.getWebsiteById(id)
      if (website) {
        updateIconCache(id, website.iconData, website.iconGenerateData)
        return {
          iconData: website.iconData,
          iconGenerateData: website.iconGenerateData
        }
      }
    } catch (error) {
      console.error('[websiteStore] 加载图标失败:', error)
    }

    return null
  }

  /**
   * 获取包含图标的完整网站信息
   * @param {number} id - 网站 ID
   * @returns {Promise<Object|null>} - 包含图标的网站对象
   */
  async function getWebsiteWithIcon(id) {
    const website = websites.value.find(w => w.id === id)
    if (!website) return null

    // 获取图标数据
    const iconData = await loadWebsiteIcon(id)

    return {
      ...website,
      iconData: iconData?.iconData || '',
      iconGenerateData: iconData?.iconGenerateData || ''
    }
  }

  /**
   * 清空图标缓存
   */
  function clearIconCache() {
    iconCache.value.clear()
  }

  return {
    // State
    websites,
    loading,
    error,
    iconCache,
    iconCacheSize,
    // Computed
    markedWebsites,
    activeWebsites,
    allTags,
    // Actions
    setWebsites,
    addWebsite,
    updateWebsite,
    deleteWebsite,
    markWebsite,
    unmarkWebsite,
    incrementVisitCount,
    searchWebsites,
    searchByTag,
    reorderMarkedWebsites,
    // 图标缓存管理
    updateIconCache,
    getIconFromCache,
    loadWebsiteIcon,
    getWebsiteWithIcon,
    clearIconCache
  }
})
