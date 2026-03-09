/**
 * 网站工具函数
 * 用于处理网站相关的通用功能，如URL验证、获取网站信息、生成图标等
 */

/**
 * 验证URL是否有效
 * @param {string} url - 要验证的URL
 * @returns {boolean} URL是否有效
 */
export function isValidUrl(url) {
  if (!url) return false

  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 从URL中提取域名
 * @param {string} url - 网站URL
 * @returns {string} 域名（如：baidu.com）
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return ''
  }
}

/**
 * 从域名中提取网站名称
 * @param {string} domain - 域名（如：www.baidu.com）
 * @returns {string} 网站名称（如：baidu）
 */
export function extractSiteName(domain) {
  if (!domain) return ''

  // 移除 www. 前缀
  let siteName = domain.replace(/^www\./, '')

  // 提取主域名（第一部分）
  const parts = siteName.split('.')
  if (parts.length > 0) {
    siteName = parts[0]
  }

  return siteName
}

/**
 * 从URL中提取网站名称
 * @param {string} url - 网站URL
 * @returns {string} 网站名称
 */
export function extractSiteNameFromUrl(url) {
  const domain = extractDomain(url)
  return extractSiteName(domain)
}

/**
 * 生成默认的网站图标SVG
 * @param {string} siteName - 网站名称
 * @returns {string} SVG字符串
 */
export function generateDefaultIcon(siteName) {
  if (!siteName) return ''

  // 获取首字母
  const firstLetter = siteName.charAt(0).toUpperCase()

  // 生成颜色（基于首字母的ASCII码）
  const colorCode = siteName.charCodeAt(0)
  const hue = (colorCode * 137) % 360
  const color = `hsl(${hue}, 70%, 50%)`

  // 生成SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect width="48" height="48" fill="${color}"/>
    <text x="50%" y="50%" dy=".35em" 
          text-anchor="middle" 
          font-size="28" 
          font-weight="bold" 
          fill="white">${firstLetter}</text>
  </svg>`
}

/**
 * 获取网站标题和描述
 * @param {string} url - 网站URL
 * @returns {Promise<{title: string, description: string}>} 网站标题和描述
 */
export async function fetchWebsiteInfo(url) {
  try {
    // 使用多个CORS代理服务，按优先级尝试
    const corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://api.codetabs.com/v1/proxy?quest='
    ]

    let html = ''
    let lastError = null

    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url)

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        html = await response.text()

        // 如果成功获取到HTML，跳出循环
        if (html && html.length > 0) {
          break
        }
      } catch (error) {
        console.log(`使用代理 ${proxy} 失败:`, error)
        lastError = error
        // 继续尝试下一个代理
      }
    }

    // 如果所有代理都失败，抛出错误
    if (!html) {
      throw lastError || new Error('所有代理服务都失败')
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // 尝试获取title
    let title = ''
    const titleElement = doc.querySelector('title')
    if (titleElement) {
      title = titleElement.textContent.trim()
    }

    // 如果没有title，使用og:title
    if (!title) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')
      if (ogTitle) {
        title = ogTitle.getAttribute('content')
      }
    }

    // 尝试获取description
    let description = ''
    const descElement = doc.querySelector('meta[name="description"]')
    if (descElement) {
      description = descElement.getAttribute('content')
    }

    // 如果没有description，使用og:description
    if (!description) {
      const ogDesc = doc.querySelector('meta[property="og:description"]')
      if (ogDesc) {
        description = ogDesc.getAttribute('content')
      }
    }

    return { title, description }
  } catch (error) {
    console.error('获取网站信息失败:', error)
    return { title: '', description: '' }
  }
}

/**
 * 从网络获取网站图标
 * @param {string} url - 网站URL
 * @returns {Promise<string>} 图标的 data URL
 */
export async function fetchWebsiteIcon(url) {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // 图标API列表，按优先级排序
    const iconAPIs = [
      `https://faviconsnap.com/api/favicon?url=${domain}`,
      `https://icon.horse/icon/${domain}`,
      `https://favicon.pub/api/${domain}`,
      `https://api.afmax.cn/so/ico/index.php?r=${domain}`
    ]

    // 尝试从各个API获取
    for (const apiUrl of iconAPIs) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          mode: 'cors'
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          continue
        }

        const blob = await response.blob()

        // 验证图片大小
        if (blob.size < 100) {
          continue
        }

        // 转换为base64
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        // 验证图片是否有效
        const isValid = await validateIcon(base64)
        if (isValid) {
          return base64
        }
      } catch (error) {
        console.log(`从 ${apiUrl} 获取图标失败:`, error)
        // 继续尝试下一个API
      }
    }

    return ''
  } catch (error) {
    console.error('获取网站图标失败:', error)
    return ''
  }
}

/**
 * 验证图标是否有效
 * @param {string} iconData - 图标的data URL
 * @returns {Promise<boolean>} - 是否有效
 */
function validateIcon(iconData) {
  return new Promise((resolve) => {
    // 基本格式检查
    if (!iconData || !iconData.startsWith('data:image/')) {
      resolve(false)
      return
    }

    // 提取base64数据
    const base64Data = iconData.split(',')[1]
    if (!base64Data) {
      resolve(false)
      return
    }

    // 检查base64解码后的数据长度
    try {
      const decodedData = atob(base64Data)
      if (decodedData.length < 100) {
        resolve(false)
        return
      }
    } catch {
      resolve(false)
      return
    }

    // 尝试加载图片
    const img = new Image()
    const timeout = setTimeout(() => resolve(false), 5000)

    img.onload = function() {
      clearTimeout(timeout)
      // 检查图片尺寸是否合理（至少16x16）
      resolve(img.width >= 16 && img.height >= 16)
    }

    img.onerror = function() {
      clearTimeout(timeout)
      resolve(false)
    }

    img.src = iconData
  })
}

/**
 * 创建默认的网站数据
 * @param {string} url - 网站URL
 * @returns {Object} 默认网站数据
 */
export function createDefaultWebsiteData(url) {
  const siteName = extractSiteNameFromUrl(url)
  const iconSvg = generateDefaultIcon(siteName)

  return {
    name: siteName,
    title: '',
    url: url,
    description: '',
    tags: [],
    isMarked: false,
    markOrder: 0,
    visitCount: 0,
    isActive: true,
    isHidden: false,
    iconData: iconSvg,
    iconGenerateData: {
      type: 'default',
      siteName: siteName
    }
  }
}
