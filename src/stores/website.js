/**
 * Website Store - 网站数据管理
 * 负责管理网站的增删改查、标记、搜索等功能
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parseSearchQuery, applyFilters } from '../utils/search/searchParser'
import { createWebsiteObject } from '../utils/website/websiteUtils'
import db from '../utils/database'

export const useWebsiteStore = defineStore('website', () => {
  // 状态
  const websites = ref([])
  const loading = ref(false)
  const error = ref(null)

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
    websites.value = data.map(website => createWebsiteObject(website))
  }

  async function addWebsite(website) {
  console.log('[websiteStore.addWebsite] 准备添加网站:', website)
  console.log('[websiteStore.addWebsite] 当前 websites 数量:', websites.value.length)
    
   const websiteWithDefaults = createWebsiteObject({
      ...website,
      visitCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isHidden: false
    })

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

    // 添加到 store
  console.log('[websiteStore.addWebsite] 准备添加到 store:', websiteWithDefaults)
    websites.value.push(websiteWithDefaults)
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
      websites.value[index] = updatedWebsite
      // 更新数据库
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

  return {
    // State
    websites,
    loading,
    error,
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
    reorderMarkedWebsites
  }
})
