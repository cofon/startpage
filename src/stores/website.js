/**
 * Website Store - 网站数据管理
 * 负责管理网站的增删改查、标记、搜索等功能
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
    websites.value = data.map(website => ({
      // 确保每个网站都有图标相关的字段
      iconUrl: website.url || '',
      iconData: website.iconData || null,
      iconGenerateData: website.iconGenerateData || null,
      iconCanFetch: website.iconCanFetch !== undefined ? website.iconCanFetch : true,
      iconFetchAttempts: website.iconFetchAttempts || 0,
      iconLastFetchTime: website.iconLastFetchTime || null,
      iconError: website.iconError || null,
      isActive: website.isActive !== undefined ? website.isActive : true,  // 添加isActive字段的处理
      isHidden: website.isHidden !== undefined ? website.isHidden : false,  // 添加isHidden字段的处理
      ...website
    }))
  }

  function addWebsite(website) {
    const websiteWithDefaults = {
      ...website,
      id: Date.now(),
      visitCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isHidden: false,  // 默认为false
      // 图标相关字段
      iconUrl: website.url || '',
      iconData: null,
      iconGenerateData: null,
      iconCanFetch: true,
      iconFetchAttempts: 0,
      iconLastFetchTime: null,
      iconError: null
    }
    
    websites.value.push(websiteWithDefaults)
  }

  function updateWebsite(id, data) {
    const index = websites.value.findIndex(w => w.id === id)
    if (index !== -1) {
      websites.value[index] = {
        ...websites.value[index],
        ...data,
        updatedAt: new Date()
      }
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
    const keyword = query.toLowerCase().trim()
    if (!keyword) {
      // 返回所有非隐藏的网站，无论是否标记
      return websites.value.filter(w => w.isActive && !w.isHidden)
    }

    const filtered = websites.value.filter(w => {
      const matchesQuery = 
        (w.name && w.name.toLowerCase().includes(keyword)) ||
        (w.url && w.url.toLowerCase().includes(keyword)) ||
        (w.description && w.description.toLowerCase().includes(keyword)) ||
        (w.tags && w.tags.some(tag => tag.toLowerCase().includes(keyword)))

      return matchesQuery && w.isActive && !w.isHidden
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
