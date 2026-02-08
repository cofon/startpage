/**
 * 网站图标管理器
 * 负责生成和管理网站图标
 */

// 颜色生成函数
function stringToColor(str) {
  // 确保 str 是字符串
  const strToProcess = str && typeof str === 'string' ? str : String(str || '');
  
  let hash = 0
  for (let i = 0; i < strToProcess.length; i++) {
    hash = strToProcess.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 70%, 50%)`
}

// 生成首字母 SVG 图标
function generateInitialIcon(name, size = 48) {
  // 确保 name 是字符串
  const nameStr = name && typeof name === 'string' ? name : String(name || '');
  const initial = nameStr ? nameStr.charAt(0).toUpperCase() : '?'
  const backgroundColor = stringToColor(nameStr)

  // 确保颜色值是安全的（替换可能导致问题的字符）
  const safeBgColor = backgroundColor.replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${safeBgColor}" rx="8" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
            font-family="Arial, sans-serif" font-size="${size * 0.5}"
            font-weight="bold" fill="white">${initial}</text>
    </svg>
  `

  try {
    // 转换为 base64 字符串
    const base64 = btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${base64}`
  } catch (e) {
    console.error('生成图标时发生错误:', e)
    // 如果编码失败，返回一个简单的默认图标
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="%23ccc"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${size * 0.5}" fill="white">?</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`
  }
}

// 生成域名 SVG 图标
function generateDomainIcon(url, size = 48) {
  try {
    // 确保 url 是字符串
    const urlStr = url && typeof url === 'string' ? url : String(url || '');
    if (!urlStr) return generateInitialIcon('?')

    const domain = new URL(urlStr).hostname
    const parts = domain.split('.')
    // 获取倒数第二部分（通常是域名的主要部分）
    const domainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0]
    const initial = domainPart ? domainPart.charAt(0).toUpperCase() : '?'
    return generateInitialIcon(initial, size)
  } catch (e) {
    console.error('从URL生成域名图标时出错:', e, 'URL:', url)
    return generateInitialIcon('?')
  }
}

class IconManager {
  // 页面级别的缓存，记录本次页面加载已尝试获取的网站ID
  pageFetchedWebsites = new Set()

  // 内存缓存，存储已获取的图标
  iconCache = new Map()

  // 图标API列表，按优先级排序
  iconAPIs = [
    {
      name: 'FaviconSnap',
      urlTemplate: (domain) => `https://faviconsnap.com/api/favicon?url=${domain}`
    },
    {
      name: 'IconHorse',
      urlTemplate: (domain) => `https://icon.horse/icon/${domain}`
    },
    {
      name: 'FaviconPub',
      urlTemplate: (domain) => `https://favicon.pub/api/${domain}`
    },
    {
      name: 'AFMAX',
      urlTemplate: (domain) => `https://api.afmax.cn/so/ico/index.php?r=${domain}`
    }
  ]

  /**
   * 获取图标
   * @param {Object} website - 网站对象
   * @param {Function} updateWebsite - 更新网站的回调函数
   * @returns {Promise<string>} 图标的 URL 或 data URL
   */
  async getIcon(website, updateWebsite) {
    const {
      id,
      iconData,
      iconGenerateData,
      iconCanFetch,
      iconFetchAttempts
    } = website

    // 1. 优先使用缓存的 iconData（如果存在则使用）
    if (iconData) {
      return iconData
    }

    // 2. 检查 iconGenerateData（生成的图标）
    if (iconGenerateData) {
      // 如果存在iconGenerateData，先显示它，然后尝试从网络获取
      if (this.shouldFetchFromNetwork(website, updateWebsite)) {
        this.fetchFromNetwork(website, updateWebsite)
      }
      return iconGenerateData
    }

    // 3. 生成 SVG 图标，优先使用网站名称，如果没有则使用域名
    let generatedIcon;
    if (website.name && website.name.trim() !== '') {
      generatedIcon = generateInitialIcon(website.name)
    } else {
      generatedIcon = generateDomainIcon(website.url)
    }

    // 保存到数据库，但如果网站没有ID，则不更新数据库
    if (id) {
      updateWebsite(id, {
        iconGenerateData: generatedIcon
      })
    }

    // 4. 检查是否应该从网络获取
    if (this.shouldFetchFromNetwork(website, updateWebsite)) {
      // 异步获取网络图标，不阻塞UI
      this.fetchFromNetwork(website, updateWebsite)
    }

    // 直接返回生成的图标
    return generatedIcon
  }

  /**
   * 判断是否应该从网络获取图标
   */
  shouldFetchFromNetwork(website, updateWebsite) {
    const { id, iconCanFetch, iconFetchAttempts, url } = website

    // 如果没有URL，不获取
    if (!url) return false

    // 如果不允许获取，不获取
    if (iconCanFetch === false) return false

    // 如果尝试次数超过5次，不获取
    if (iconFetchAttempts >= 5) return false

    // 如果页面已经尝试获取过，不获取
    if (id && this.pageFetchedWebsites.has(id)) return false

    return true
  }

  /**
   * 从网络获取图标
   */
  async fetchFromNetwork(website, updateWebsite) {
    const { id, url, name } = website

    // 标记为已尝试获取
    if (id) {
      this.pageFetchedWebsites.add(id)
    }

    // 检查内存缓存
    const cacheKey = url
    if (this.iconCache.has(cacheKey)) {
      const cachedIcon = this.iconCache.get(cacheKey)
      if (cachedIcon) {
        updateWebsite(id, { iconData: cachedIcon })
      }
      return
    }

    try {
      // 更新最后获取时间
      updateWebsite(id, { iconLastFetchTime: Date.now() })

      // 提取域名
      const domain = this.extractDomain(url)
      if (!domain) {
        throw new Error('无法提取域名')
      }

      // 尝试从各个API获取
      let iconData = null
      for (const api of this.iconAPIs) {
        try {
          iconData = await this.fetchIconFromAPI(api.urlTemplate(domain), name)
          if (iconData) {
            console.log(`${name || domain} icon获取成功`)
            break
          }
        } catch {
          // 继续尝试下一个API
        }
      }

      if (iconData) {
        // 获取成功，保存到数据库和内存缓存
        this.iconCache.set(cacheKey, iconData)

        // 先更新store，触发Vue的响应式更新
        updateWebsite(id, {
          iconData: iconData,
          iconFetchAttempts: 0  // 成功后重置尝试次数
        })

        // 触发自定义事件，通知WebsiteIcon组件立即更新
        window.dispatchEvent(new CustomEvent('icon-updated', {
          detail: { websiteId: id, iconData: iconData }
        }))
      } else {
        // 所有API都失败，增加尝试次数
        const newAttempts = (website.iconFetchAttempts || 0) + 1
        const updateData = {
          iconFetchAttempts: newAttempts
        }

        // 如果达到最大尝试次数，停止尝试
        if (newAttempts >= 5) {
          updateData.iconCanFetch = false
        }

        updateWebsite(id, updateData)
        console.log(`${name || domain} icon获取失败，使用自动生成的icon`)
      }
    } catch (error) {
      // 发生错误，增加尝试次数
      const newAttempts = (website.iconFetchAttempts || 0) + 1
      const updateData = {
        iconFetchAttempts: newAttempts
      }

      // 如果达到最大尝试次数，停止尝试
      if (newAttempts >= 5) {
        updateData.iconCanFetch = false
      }

      updateWebsite(id, updateData)
    }
  }

  /**
   * 从指定API获取图标
   */
  async fetchIconFromAPI(url, websiteName) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      const blob = await response.blob()
      return await this.blobToBase64(blob)

    } catch {
      // 使用 console.log 而不是 console.error
      return null
    }
  }

  /**
   * 将Blob转换为base64字符串
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 从URL中提取域名
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return null
    }
  }

  /**
   * 清除页面级别的缓存（在页面卸载时调用）
   */
  clearPageCache() {
    this.pageFetchedWebsites.clear()
  }
}

export default new IconManager()