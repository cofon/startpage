/**
 * 图标管理工具类
 * 负责图标的获取、缓存和生成
 */

// 错误代码定义
const ICON_ERROR_CODES = {
  CORS_ERROR: 'CORS_ERROR', // CORS 限制
  TIMEOUT_ERROR: 'TIMEOUT_ERROR', // 超时
  NETWORK_ERROR: 'NETWORK_ERROR', // 网络错误
  INVALID_URL: 'INVALID_URL', // 无效 URL
  FETCH_FAILED: 'FETCH_FAILED' // 获取失败
}

// 颜色生成函数
function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 70%, 50%)`
}

// 生成首字母 SVG 图标
function generateInitialIcon(name, size = 48) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const backgroundColor = stringToColor(name)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="8"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em"
            font-family="Arial, sans-serif" font-size="${size * 0.5}"
            font-weight="bold" fill="white">${initial}</text>
    </svg>
  `

  // 转换为 data URL
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  return URL.createObjectURL(blob)
}

// 生成域名 SVG 图标
function generateDomainIcon(url, size = 48) {
  try {
    const domain = new URL(url).hostname
    const parts = domain.split('.')
    const name = parts.length > 2 ? parts[1] : parts[0]
    return generateInitialIcon(name, size)
  } catch {
    return generateInitialIcon('?', size)
  }
}

// 图标缓存管理
class IconManager {
  constructor() {
    this.cache = new Map() // 内存缓存
    this.pendingFetches = new Map() // 正在进行的请求
    this.pageFetched = new Set() // 本次页面加载已尝试获取的网站ID
  }

  /**
   * 获取图标
   * @param {Object} website - 网站对象
   * @param {Function} updateWebsite - 更新网站的回调函数
   * @returns {Promise<string>} 图标的 data URL
   */
  async getIcon(website, updateWebsite) {
    const { id, iconData, iconGenerateData, iconCanFetch, iconFetchAttempts } = website

    // 1. 检查 iconData
    if (iconData) {
      return iconData
    }

    // 2. 检查 iconGenerateData
    if (iconGenerateData) {
      // 检查是否应该从网络获取
      if (this.shouldFetchFromNetwork(iconCanFetch, iconFetchAttempts, id)) {
        // 异步从网络获取
        this.fetchFromNetwork(website, updateWebsite)
      }
      return iconGenerateData
    }

    // 3. 生成 SVG 图标
    const generatedIcon = generateInitialIcon(website.name) || generateDomainIcon(website.url)

    // 保存到数据库
    updateWebsite(id, {
      iconGenerateData: generatedIcon
    })

    // 检查是否应该从网络获取
    if (this.shouldFetchFromNetwork(iconCanFetch, iconFetchAttempts, id)) {
      // 异步从网络获取
      this.fetchFromNetwork(website, updateWebsite)
    }

    return generatedIcon
  }

  /**
   * 判断是否应该从网络获取图标
   */
  shouldFetchFromNetwork(iconCanFetch, iconFetchAttempts, websiteId) {
    // 如果本次页面加载已经尝试过，不再尝试
    if (this.pageFetched.has(websiteId)) {
      return false
    }

    // 如果不允许获取，不再尝试
    if (iconCanFetch === false) {
      return false
    }

    // 如果尝试次数超过5次，不再尝试
    if (iconFetchAttempts >= 5) {
      return false
    }

    return true
  }

  /**
   * 从网络获取图标
   */
  async fetchFromNetwork(website, updateWebsite) {
    const { id } = website

    // 标记本次页面加载已尝试
    this.pageFetched.add(id)

    // 检查是否有正在进行的请求
    if (this.pendingFetches.has(id)) {
      return
    }

    const fetchPromise = this.doFetchFromNetwork(website, updateWebsite)
    this.pendingFetches.set(id, fetchPromise)

    try {
      await fetchPromise
    } finally {
      this.pendingFetches.delete(id)
    }
  }

  /**
   * 实际执行网络获取
   */
  async doFetchFromNetwork(website, updateWebsite) {
    const { id, iconUrl } = website

    try {
      // 提取域名
      let domain = iconUrl
      try {
        domain = new URL(iconUrl).hostname
      } catch {
        domain = iconUrl
      }

      // 使用 Google favicon 服务
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`

      // 使用 AbortController 实现超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      let response
      try {
        response = await fetch(googleFaviconUrl, {
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const dataUrl = await this.blobToDataUrl(blob)

      // 保存到数据库
      updateWebsite(id, {
        iconData: dataUrl,
        iconError: null,
        iconLastFetchTime: Date.now()
      })

      // 缓存到内存
      this.cache.set(id, dataUrl)

    } catch (error) {
      // 静默处理错误，不打印到控制台
      const errorCode = this.getErrorCode(error)

      // 更新数据库
      updateWebsite(id, {
        iconFetchAttempts: (website.iconFetchAttempts || 0) + 1,
        iconLastFetchTime: Date.now(),
        iconError: {
          message: error.message,
          code: errorCode,
          timestamp: Date.now()
        }
      })

      // 如果尝试次数达到5次，设置为不再尝试
      if ((website.iconFetchAttempts || 0) + 1 >= 5) {
        updateWebsite(id, {
          iconCanFetch: false
        })
      }
    }
  }

  /**
   * 获取错误代码
   */
  getErrorCode(error) {
    if (error.name === 'AbortError') {
      return ICON_ERROR_CODES.TIMEOUT_ERROR
    }
    if (error.message && error.message.includes('CORS')) {
      return ICON_ERROR_CODES.CORS_ERROR
    }
    if (error.message && error.message.includes('Failed to fetch')) {
      return ICON_ERROR_CODES.FETCH_FAILED
    }
    if (error.message && error.message.includes('Invalid URL')) {
      return ICON_ERROR_CODES.INVALID_URL
    }
    return ICON_ERROR_CODES.NETWORK_ERROR
  }

  /**
   * 将 Blob 转换为 data URL
   */
  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 清除所有图标缓存
   */
  clearCache() {
    this.cache.clear()
    this.pageFetched.clear()
  }
}

// 创建单例实例
const iconManager = new IconManager()

export default iconManager
