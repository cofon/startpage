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

/**
 * URL 规范化处理
 * @param {string} url
 * @returns {string} 规范化后的 URL
 * 添加http:// 或 https:// 前缀
 * 去除末尾的斜杠
 * baidu.com -> https://baidu.com
 * http://www.baidu.com/ -> https://www.baidu.com
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
 * 从主机名中提取根域名
 *
 * 该函数能够从主机名中提取根域名，支持常见的复合后缀如 .co.uk, .com.cn 等。
 * 例如：
 * - www.baidu.com -> baidu.com
 * - mail.google.com -> google.com
 * - subdomain.co.uk -> co.uk
 *
 * @param {string} hostname - 主机名（如：www.baidu.com）
 * @returns {string|null} 根域名，如果无法提取则返回 null
 */
export function extractRootDomain(hostname) {
  if (!hostname) return null

  // 分割主机名为各个部分
  const parts = hostname.split('.')
  if (parts.length < 2) return null

  // 常见的复合后缀列表
  const complexSuffixes = [
    'co.uk', // 英国商业域名
    'com.au', // 澳大利亚商业域名
    'com.cn', // 中国商业域名
    'org.uk', // 英国组织域名
    'net.uk', // 英国网络域名
    'ac.uk', // 英国学术域名
    'gov.uk', // 英国政府域名
    'nhs.uk', // 英国国家医疗服务域名
    'sch.uk', // 英国学校域名
    'co.jp', // 日本商业域名
    'com.tw', // 台湾商业域名
    'org.tw', // 台湾组织域名
    'edu.tw', // 台湾教育域名
    'gov.tw', // 台湾政府域名
    'co.in', // 印度商业域名
    'com.in', // 印度商业域名
    'org.in', // 印度组织域名
    'edu.in', // 印度教育域名
    'gov.in', // 印度政府域名
    'co.ca', // 加拿大商业域名
    'com.ca', // 加拿大商业域名
    'org.ca', // 加拿大组织域名
    'edu.ca', // 加拿大教育域名
    'gov.ca', // 加拿大政府域名
    'eu.org', // 欧盟组织域名
  ]

  // 检查是否是复合后缀
  if (parts.length >= 3) {
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
 * 标准化网站数据
 *
 * 该函数对网站数据进行标准化处理，确保所有必要的字段都有合理的值，
 * 包括从 URL 提取名称、添加默认标签、生成图标等操作。
 *
 * @param {Object} data - 原始网站数据
 * @returns {Object} 标准化的网站对象
 */
export function normalizeWebsiteData(data) {
  // 1. 如果 name 为空，从 URL 提取网站名称
  if (!data.name && data.url) {
    data.name = extractSiteNameFromUrl(data.url)
  }

  // 2. 如果 tags 为空，添加默认标签 'new'
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    data.tags = ['new']
  }

  // 3. 处理 markOrder（标记顺序）
  if (!data.markOrder) {
    data.markOrder = data.isMarked ? 0 : 0
  }

  // 4. 确保 iconGenerateData 有值（与 iconData 无关）
  if (!data.iconGenerateData) {
    // 如果有 name 则用 name 生成图标，否则用 URL 生成
    const iconSource = data.name || data.url
    const svgIcon = generateSVG(iconSource)
    data.iconGenerateData = encodeSVG(svgIcon)
  }

  // 5. 使用 createWebsiteObject 创建标准对象，设置默认值
  const result = createWebsiteObject({
    ...data,
    visitCount: 0, // 初始访问次数为 0
    createdAt: new Date(), // 设置创建时间为当前时间
    updatedAt: new Date(), // 设置更新时间为当前时间
  })

  return result
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
    url: website.url,
    name: website.name,
    title: website.title || '',
    description: website.description || '',
    iconData: website.iconData || null,
    iconGenerateData: website.iconGenerateData || null,
    tags: Array.isArray(website.tags) ? [...website.tags] : [],
    isMarked: website.isMarked,
    isHidden: website.isHidden !== undefined ? website.isHidden : false,
    isActive: website.isActive !== undefined ? website.isActive : true,
    visitCount: website.visitCount || 0,
    markOrder: website.isMarked ? website.markOrder || 0 : 0,
    createdAt: website.createdAt,
    updatedAt: website.updatedAt,
    lastVisited: website.lastVisited,
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
export function getMissingMeatFields(website) {
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

/**
 * 生成默认的网站图标 SVG（简化版本，无缓存）
 *
 * 该函数根据网站名称或域名生成一个默认的 SVG 图标，
 * 使用首字母作为图标内容，并根据域名哈希值选择背景色，
 * 以避免相同首字母的网站图标无法区分。
 *
 * @param {string} name - 网站名称或域名
 * @returns {string} SVG 字符串，包含一个带背景色的首字母图标
 */
export function generateSVG(name) {
  if (!name) return ''

  // 从 URL 提取域名（如果有协议前缀）
  let displayName = name
  try {
    if (name.startsWith('http://') || name.startsWith('https://')) {
      const urlObj = new URL(name)
      displayName = urlObj.hostname.replace(/^www\./, '')
    }
  } catch {
    // 不是 URL 则直接使用 name
  }

  // 取首字母大写
  const firstLetter = displayName.charAt(0).toUpperCase()

  // 根据域名哈希选择背景色（避免相同首字母无法区分）
  const colorPalette = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#98D8C8', // 浅青色
    '#F7DC6F', // 金黄色
  ]

  // 计算哈希值
  let hash = 0
  for (let i = 0; i < displayName.length; i++) {
    hash = (hash << 5) - hash + displayName.charCodeAt(i)
    hash |= 0 // 转换为32位整数
  }

  // 根据哈希值选择背景色
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
 * 编码 SVG 为 Base64
 * @param {string} svg - SVG 字符串
 * @returns {string} Base64 编码的 SVG 数据 URL
 */
export function encodeSVG(svg) {
  if (!svg) return ''
  if (svg.startsWith('data:image/svg+xml;base64,') || svg.startsWith('data:image/svg+xml;utf8,')) {
    return svg
  }
  const encodedSvg = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode('0x' + p1),
  )
  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`
}
