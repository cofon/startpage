/**
 * 网站工具函数
 * 用于处理网站相关的通用功能，如 URL 验证、获取网站信息、生成图标等
 */

/**
 * 验证 URL 是否有效（增强版）
 * 支持 http、https、file 协议，支持 localhost 和内网 IP
 * @param {string} urlString - 待验证的 URL 字符串
 * @returns {{valid: boolean, error?: string}} - 验证结果
 */
export function isValidUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL 不能为空' }
  }

  // 去除首尾空格
  const urlTrimmed = urlString.trim()

  // 检查长度
  if (urlTrimmed.length === 0) {
    return { valid: false, error: 'URL 不能为空' }
  }

  if (urlTrimmed.length > 2048) {
    return { valid: false, error: 'URL 长度不能超过 2048 个字符' }
  }

  try {
    // 使用浏览器原生 URL API 验证
    const urlObj = new URL(urlTrimmed)

    // 验证协议：支持 http、https、file
    if (!['http:', 'https:', 'file:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'URL 必须使用 HTTP、HTTPS 或 FILE 协议'
      }
    }

    // 针对 file:// 协议的特殊处理
    if (urlObj.protocol === 'file:') {
      // file:// 协议只需要路径有效
      if (!urlObj.pathname || urlObj.pathname.length < 2) {
        return { valid: false, error: '文件路径不正确' }
      }
      return { valid: true }
    }

    // 针对 http/https 协议的验证
    // 验证主机名
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return { valid: false, error: 'URL 必须包含有效的域名' }
    }

    // 支持 localhost 和本地 IP 地址
    const hostname = urlObj.hostname.toLowerCase()

    // 允许的本地主机名
    const allowedLocalHostnames = ['localhost', '127.0.0.1', '0.0.0.0']

    // 如果是本地主机名，直接通过
    if (allowedLocalHostnames.includes(hostname)) {
      return { valid: true }
    }

    // 如果是内网 IP 地址（如 192.168.x.x, 10.x.x.x, 172.16-31.x.x）
    const ipPattern = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/
    if (ipPattern.test(hostname)) {
      return { valid: true }
    }

    // 对于普通域名，验证基本格式
    // 规则：
    // 1. 不能以点开头或结尾
    // 2. 必须包含至少一个点（有 TLD）
    // 3. 每个标签（label）由字母、数字、连字符组成
    // 4. 每个标签不能以连字符开头或结尾
    // 5. TLD 必须是 2-63 个字母（符合 DNS 规范）
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/

    if (domainPattern.test(hostname)) {
      return { valid: true }
    }

    // 如果以上都不匹配，说明域名格式有问题
    return { valid: false, error: '域名格式不正确' }
  } catch {
    return { valid: false, error: 'URL 格式不正确，无法解析' }
  }
}

// 兼容旧版本的简单布尔返回值
export function isValidUrlSimple(url) {
  const result = isValidUrl(url)
  return result.valid
}

/**
 * 从 URL 中提取域名
 * @param {string} url - 网站 URL(如：https://www.baidu.com)
 * @returns {string} 域名（如：www.baidu.com）
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
 * 从 URL 中提取网站名称
 * @param {string} url - 网站 URL
 * @returns {string} 网站名称
 */
export function extractSiteNameFromUrl(url) {
  const domain = extractDomain(url)
  return extractSiteName(domain)
}

/**
 * 生成默认的网站图标 SVG（简化版本，无缓存）
 * @param {string} name - 网站名称或域名
 * @returns {string} SVG 字符串
 */
export function generateDefaultIcon(name) {
  if (!name) return ''

  // 从 URL 提取域名（如果有协议前缀）
  let displayName = name
  try {
    if (name.startsWith('http://') || name.startsWith('https://')) {
      // 上边有的 extractSiteNameFromUrl 函数做的就是这个事情
      // 之后要用 extractSiteName 函数替代下面两行代码
      const urlObj = new URL(name)
      displayName = urlObj.hostname.replace(/^www\./, '')
    }
  } catch {
    // 不是 URL 则直接使用 name
  }

  // 取首字母大写
  const firstLetter = displayName.charAt(0).toUpperCase()

  // 以下是生成SVG的逻辑，是不是应该把下边代码分拆独立出来

  // 根据域名哈希选择背景色（避免相同首字母无法区分）
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]

  let hash = 0
  for (let i = 0; i < displayName.length; i++) {
    hash = ((hash << 5) - hash) + displayName.charCodeAt(i)
    hash |= 0
  }
  const backgroundColor = colorPalette[Math.abs(hash) % colorPalette.length]

  // 生成 SVG（带背景色区分）- 适配 48x48 尺寸
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect width="48" height="48" fill="${backgroundColor}"/>
      <text x="50%" y="50%" dy=".35em"
            text-anchor="middle"
            font-size="28"
            font-weight="bold"
            fill="white">${firstLetter}</text>
    </svg>
  `
}

/**
 * 获取网站标题和描述
 * @param {string} url - 网站 URL
 * @returns {Promise<{title: string, description: string}>} 网站标题和描述
 */
export async function fetchWebsiteInfo(url) {
  try {
    // 使用多个 CORS 代理服务，按优先级尝试
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

        // 如果成功获取到 HTML，跳出循环
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

    // 尝试获取 title
    let title = ''
    const titleElement = doc.querySelector('title')
    if (titleElement) {
      title = titleElement.textContent.trim()
    }

    // 如果没有 title，使用 og:title
    if (!title) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')
      if (ogTitle) {
        title = ogTitle.getAttribute('content')
      }
    }

    // 尝试获取 description
    let description = ''
    const descElement = doc.querySelector('meta[name="description"]')
    if (descElement) {
      description = descElement.getAttribute('content')
    }

    // 如果没有 description，使用 og:description
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
 * @param {string} url - 网站 URL
 * @returns {Promise<string>} 图标的 data URL
 */
export async function fetchWebsiteIcon(url) {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname

    // 图标 API 列表，按优先级排序
    const iconAPIs = [
      `https://faviconsnap.com/api/favicon?url=${domain}`,
      `https://icon.horse/icon/${domain}`,
      `https://favicon.pub/api/${domain}`,
      `https://api.afmax.cn/so/ico/index.php?r=${domain}`
    ]

    // 尝试从各个 API 获取
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

        // 转换为 base64
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
        // 继续尝试下一个 API
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
 * @param {string} iconData - 图标的 data URL
 * @returns {Promise<boolean>} - 是否有效
 */
function validateIcon(iconData) {
  return new Promise((resolve) => {
    // 基本格式检查
    if (!iconData || !iconData.startsWith('data:image/')) {
      resolve(false)
      return
    }

    // 提取 base64 数据
    const base64Data = iconData.split(',')[1]
    if (!base64Data) {
      resolve(false)
      return
    }

    // 检查 base64 解码后的数据长度
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
      // 检查图片尺寸是否合理（至少 16x16）
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
 * @param {string} url - 网站 URL
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

/**
 * 从主机名中提取根域名
 * 例如：www.baidu.com -> baidu.com, mail.google.com -> google.com
 * 注意：对于 .co.uk 等复合后缀，简化处理为最后两部分
 * @param {string} hostname - 主机名（如：www.baidu.com）
 * @returns {string|null} 根域名，如果无法提取则返回 null
 */
export function extractRootDomain(hostname) {
  if (!hostname) return null

  const parts = hostname.split('.')
  if (parts.length < 2) return null

  // 取最后两部分作为根域名
  const rootParts = parts.slice(-2)
  return rootParts.join('.')
}
