/**
 * 网站工具函数
 * 用于处理网站相关的通用功能，如 URL 验证、获取网站信息、生成图标等
 */

/**
 * 导入 valid-url 库
 * 用于验证 URL 是否有效
 * 该库支持 http、https、file 协议，以及 localhost 和内网 IP 地址
 * 该库还支持自定义验证规则，如域名长度、协议支持等
 * 该库的验证结果是布尔值，true 表示 URL 有效，false 表示无效
 * 在函数 isValidUrl 中使用该库
 * 已测试，此库无效
 * npm install whatwg-url
 * npm install valid-url
 * 要记得把这两个安装删掉
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
        error: 'URL 必须使用 HTTP、HTTPS 或 FILE 协议',
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
    const ipPattern =
      /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/
    if (ipPattern.test(hostname)) {
      return { valid: true }
    }

    // 对于普通域名，验证基本格式
    // 规则：
    // 1. 不能以点开头或结尾
    // 2. 必须包含至少一个点（有 TLD）
    // 3. 每个标签（label）由字母、数字、连字符组成
    // 4. 每个标签不能以连字符开头或结尾
    // 5. 每个标签长度在 1-63 个字符之间
    // 6. TLD 必须是 2-63 个字母（符合 DNS 规范）

    // 特殊处理：www.xxx 格式（如 www.ba、www.bai）应该被判定为无效
    const parts = hostname.split('.')
    if (parts.length === 2 && parts[0] === 'www') {
      return { valid: false, error: '域名格式不正确，顶级域名长度不足' }
    }

    const domainPattern =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/

    if (domainPattern.test(hostname)) {
      return { valid: true }
    }

    // 额外检查：确保TLD部分只包含字母且长度至少为2
    if (parts.length >= 2) {
      const tld = parts[parts.length - 1]
      if (!/^[a-zA-Z]{2,}$/.test(tld)) {
        return { valid: false, error: '域名的顶级域名（TLD）必须至少包含2个字母' }
      }
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
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
  ]

  let hash = 0
  for (let i = 0; i < displayName.length; i++) {
    hash = (hash << 5) - hash + displayName.charCodeAt(i)
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
      'https://api.codetabs.com/v1/proxy?quest=',
    ]

    let html = ''
    let lastError = null

    for (const proxy of corsProxies) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url)

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
          },
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
      `https://api.afmax.cn/so/ico/index.php?r=${domain}`,
    ]

    // 尝试从各个 API 获取
    for (const apiUrl of iconAPIs) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          mode: 'cors',
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

    img.onload = function () {
      clearTimeout(timeout)
      // 检查图片尺寸是否合理（至少 16x16）
      resolve(img.width >= 16 && img.height >= 16)
    }

    img.onerror = function () {
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
      siteName: siteName,
    },
  }
}

/**
 * 从主机名中提取根域名
 * 例如：www.baidu.com -> baidu.com, mail.google.com -> google.com, subdomain.co.uk -> co.uk
 * 支持常见的复合后缀如 .co.uk, .com.cn 等
 * @param {string} hostname - 主机名（如：www.baidu.com）
 * @returns {string|null} 根域名，如果无法提取则返回 null
 */
export function extractRootDomain(hostname) {
  if (!hostname) return null

  const parts = hostname.split('.')
  if (parts.length < 2) return null

  // 常见的复合后缀列表
  const complexSuffixes = [
    'co.uk',
    'com.au',
    'com.cn',
    'org.uk',
    'net.uk',
    'ac.uk',
    'gov.uk',
    'nhs.uk',
    'sch.uk',
    'co.jp',
    'com.tw',
    'org.tw',
    'edu.tw',
    'gov.tw',
    'co.in',
    'com.in',
    'org.in',
    'edu.in',
    'gov.in',
    'co.ca',
    'com.ca',
    'org.ca',
    'edu.ca',
    'gov.ca',
    'eu.org',
  ]

  // 检查是否是复合后缀
  if (parts.length >= 3) {
    // const lastThreeParts = parts.slice(-3).join('.')
    const lastTwoParts = parts.slice(-2).join('.')

    // 检查是否匹配已知的复合后缀
    for (const suffix of complexSuffixes) {
      if (lastTwoParts === suffix) {
        return suffix
      }
    }
  }

  // 对于普通域名，取最后两部分
  const rootParts = parts.slice(-2)
  return rootParts.join('.')
}

// ============================================
// 第二部分：数据标准化工具（来自 websiteNormalizer.js）
// ============================================

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
    markOrder: data.isMarked ? data.markOrder || 0 : 0,
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
    lastVisited: data.lastVisited || null,
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
    markOrder: website.isMarked ? website.markOrder || 0 : 0,
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
    lastVisited: website.lastVisited,
  }
}

/**
 * 批量标准化网站对象（用于数据库操作）
 * @param {Array} websites - 响应式网站对象数组
 * @returns {Array} 普通网站对象数组
 */
export function normalizeWebsitesForDB(websites) {
  if (!Array.isArray(websites)) return []
  return websites.map((website) => normalizeWebsiteForDB(website))
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
    updatedAt: new Date(),
  }
}

// ============================================
// 第三部分：导入辅助工具（来自 websiteImportUtils.js）
// ============================================

// /**
//  * 验证网站数据是否完整
//  * @param {Object} website - 网站数据对象
//  * @returns {boolean} - 是否完整
//  */
// export function validateWebsite(website) {
//   // 验证 URL 是否存在
//   if (!website || !website.url) {
//     return false
//   }

//   // 验证必需字段是否都有值
//   const hasName = website.name && website.name.trim() !== ''
//   const hasTitle = website.title && website.title.trim() !== ''
//   const hasDescription = website.description && website.description.trim() !== ''
//   const hasIconData = website.iconData && website.iconData.trim() !== ''
//   const hasIconGenerateData = website.iconGenerateData && website.iconGenerateData.trim() !== ''

//   // 数据完整的标准：name、title、description、iconData、iconGenerateData 都有值
//   return hasName && hasTitle && hasDescription && hasIconData && hasIconGenerateData
// }

/**
 * 填充网站的默认字段
 * @param {Object} website - 网站数据对象
 * @returns {Object} - 处理后的网站数据
 */
export function fillDefaultFields(website) {
  return {
    ...website,
    name: website.name || '',
    title: website.title || '',
    description: website.description || '',
    iconData: website.iconData || '',
    iconGenerateData: website.iconGenerateData || '',
    tags: Array.isArray(website.tags) ? website.tags : ['new'],
    isMarked: website.isMarked !== undefined ? website.isMarked : false,
    markOrder: website.markOrder !== undefined ? website.markOrder : 0,
    isActive: website.isActive !== undefined ? website.isActive : true,
    isHidden: website.isHidden !== undefined ? website.isHidden : false,
  }
}

// ============================================
// 第四部分：导入辅助工具（来自 importService.js）
// ============================================

/**
 * URL 规范化处理（与 AddWebsitePanel 保持一致）
 * - 移除末尾斜杠
 * - 统一协议（如果没有协议）
 * - 移除 hash 和 search 参数
 * @param {string} url - 要规范化的 URL
 * @returns {string} 规范化后的 URL
 */
export function normalizeImportUrl(url) {
  if (!url) return ''

  try {
    // 确保有协议
    let normalized = url
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }

    // 创建 URL 对象以解析各个部分
    const urlObj = new URL(normalized)

    // 移除尾部斜杠
    let pathname = urlObj.pathname
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    // 重新构建 URL（不包含 hash 和 search）
    return `${urlObj.protocol}//${urlObj.host}${pathname}`
  } catch (error) {
    console.warn('[WebsiteUtils] URL 规范化失败:', url, error)
    return url
  }
}

/**
 * 检查网站数据完整性
 * 所有用户可编辑字段
 * - url
 * - name
 * - title
 * - description
 * - iconData
 * - iconGenerateData
 * - tags
 * 除了iconData其他字段都要检查
 * 有些网站可能确实获取不到完整的数据
 * 例如：一些网站的只有title，没有提供description
 * 这种情况下，我们仍然认为网站数据完整的
 * @param {Object} website - 网站数据
 * @returns {boolean} 是否完整
 */
export function isWebsiteComplete(website) {
  // 必须有 URL
  if (!website.url || !isValidUrl(website.url)) {
    return false
  }

  // 必须有 name
  if (!website.name || website.name.trim() === '') {
    return false
  }

  // title 或 description 至少有一个
  const hasTitle = website.title && website.title.trim() !== ''
  const hasDescription = website.description && website.description.trim() !== ''
  const hasTitleOrDescription = hasTitle || hasDescription
  if (!hasTitleOrDescription) {
    return false
  }

  // 必须有 iconGenerateData
  if (!website.iconGenerateData || website.iconGenerateData.trim() === '') {
    return false
  }

  // 必须有 tags
  if (
    !website.tags ||
    (Array.isArray(website.tags) && website.tags.length === 0) ||
    (typeof website.tags === 'string' && website.tags.trim() === '')
  ) {
    return false
  }

  return true
}

/**
 * 获取缺失的字段列表，针对 title、description、icon
 * @param {Object} website - 网站数据
 * @returns {Array} 缺失字段数组
 */
export function getMissingFields(website) {
  const missingFields = []

  if (!website.title || website.title.trim() === '') {
    missingFields.push('title')
  }

  if (!website.description || website.description.trim() === '') {
    missingFields.push('description')
  }

  if (!website.iconData || website.iconData.trim() === '') {
    missingFields.push('iconData')
  }

  return missingFields
}

// ============================================
// 第五部分：数据验证和标准化工具（来自 websiteMetadataService.js）
// ============================================

/**
 * 编码 SVG 为 Base64
 * @param {string} svg - SVG 字符串
 * @returns {string} Base64 编码的 SVG 数据 URL
 */
export function encodeSvg(svg) {
  if (!svg) return ''
  if (svg.startsWith('data:image/svg+xml;base64,') || svg.startsWith('data:image/svg+xml;utf8,')) {
    return svg
  }
  const encodedSvg = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode('0x' + p1),
  )
  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`
}

/**
 * URL 规范化处理
 * @param {string} url - 要规范化的 URL
 * @returns {string} 规范化后的 URL
 */
export function normalizeUrl(url) {
  if (!url) return ''

  try {
    let normalized = url
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }

    const urlObj = new URL(normalized)
    let pathname = urlObj.pathname
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }

    return `${urlObj.protocol}//${urlObj.host}${pathname}`
  } catch (error) {
    console.warn('[WebsiteUtils] URL 解析失败:', url, error)
    return url
  }
}

/**
 * 标准化网站数据
 * @param {Object} data - 原始网站数据
 * @returns {Object} 标准化的网站对象
 */
export function normalizeWebsiteData(data) {
  // 1. 如果 name 为空，从 URL 提取
  if (!data.name && data.url) {
    data.name = extractSiteNameFromUrl(data.url)
  }

  // 2. 如果 tags 为空，添加默认标签 'new'
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    data.tags = ['new']
  }

  // 3. 处理 markOrder
  if (!data.markOrder) {
    data.markOrder = data.isMarked ? 0 : 0
  }

  // 4. iconGenerateData 必须有值，与 iconData 无关
  if (!data.iconGenerateData) {
    // 如果有 name 则用 name 生成，否则用 URL 生成
    const iconSource = data.name || data.url
    const svgIcon = generateDefaultIcon(iconSource)
    data.iconGenerateData = encodeSvg(svgIcon)
  }

  // 5. 使用 createWebsiteObject 创建标准对象
  const result = createWebsiteObject({
    ...data,
    visitCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return result
}

/**
 * 检查 URL 是否已存在于数据库中
 * @param {string} url - 要检查的 URL
 * @param {Array} allWebsites - 所有网站数组
 * @returns {Object} { exists: boolean, websiteId?: string, websiteName?: string, website?: Object }
 */
export function checkUrlExists(url, allWebsites) {
  if (!allWebsites || !Array.isArray(allWebsites)) {
    return { exists: false }
  }

  const normalizedUrl = normalizeUrl(url)

  const existingWebsite = allWebsites.find((w) => {
    if (!w.isActive) return false

    const normalizedExistingUrl = normalizeUrl(w.url)
    return normalizedExistingUrl === normalizedUrl
  })

  if (existingWebsite) {
    return {
      exists: true,
      websiteId: existingWebsite.id,
      websiteName: existingWebsite.name,
      website: existingWebsite,
    }
  } else {
    return {
      exists: false,
    }
  }
}

// ============================================
// 第六部分：数据验证工具（来自 websiteMetadataService.js）
// ============================================

/**
 * 验证网站数据
 * 验证字段：URL、name/title/description、iconData/iconGenerateData、tags
 * @param {Object} data - 待验证的网站数据
 * @returns {Object} { valid: boolean, errors: string[] }
 */
// export function validateWebsite(data) {
//   const errors = []

//   // 1. URL 验证（必填）
//   if (!data.url) {
//     errors.push('URL 为必填字段')
//   } else if (!isValidUrl(data.url)) {
//     errors.push('URL 格式不正确')
//   }

//   // 2. name/title/description至少有一个不为空
//   const hasName = data.name && data.name.trim() !== ''
//   const hasTitle = data.title && data.title.trim() !== ''
//   const hasDescription = data.description && data.description.trim() !== ''

//   if (!hasName && !hasTitle && !hasDescription) {
//     errors.push('网站名称、标题或描述必须填写至少一项')
//   }

//   // 3. iconData/iconGenerateData至少有一个不为空
//   const hasValidIconData =
//     data.iconData && (data.iconData.startsWith('data:image/') || data.iconData.length > 0)

//   const hasValidIconGenerateData =
//     data.iconGenerateData &&
//     (data.iconGenerateData.startsWith('data:image/svg') || data.iconGenerateData.length > 0)

//   if (!hasValidIconData && !hasValidIconGenerateData) {
//     errors.push('图标数据（iconData）或生成数据（iconGenerateData）必须填写至少一项')
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//   }
// }
