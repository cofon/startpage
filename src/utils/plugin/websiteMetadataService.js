/* global chrome */


/**
 * 网站元数据服务
 * 提供统一的网站数据验证、标准化、补全功能
 */

import {
  isValidUrl,
  extractSiteNameFromUrl,
  generateDefaultIcon,
  extractRootDomain
} from '../website/websiteUtils'

import { createWebsiteObject } from '../website/websiteNormalizer'

/**
 * 验证网站数据
 * @param {Object} data - 待验证的网站数据
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateWebsite(data) {
  const errors = []

  // 1. URL 验证（必填）
  if (!data.url) {
    errors.push('URL 为必填字段')
  } else if (!isValidUrl(data.url)) {
    errors.push('URL 格式不正确')
  }

  // 2. name/title/description至少有一个不为空
  const hasName = data.name && data.name.trim() !== ''
  const hasTitle = data.title && data.title.trim() !== ''
  const hasDescription = data.description && data.description.trim() !== ''

  if (!hasName && !hasTitle && !hasDescription) {
    errors.push('网站名称、标题或描述必须填写至少一项')
  }

  // 3. iconData/iconGenerateData至少有一个不为空
  // ========== 修改：更宽松的验证规则 ==========
  const hasValidIconData = data.iconData &&
    (data.iconData.startsWith('data:image/') || data.iconData.length > 0)

  const hasValidIconGenerateData = data.iconGenerateData &&
    (data.iconGenerateData.startsWith('data:image/svg') || data.iconGenerateData.length > 0)

  // 批量导入时放宽要求，允许后续自动生成
  if (!hasValidIconData && !hasValidIconGenerateData) {
    // 只在 URL 有效时才记录警告（避免输入过程中频繁打印）
    if (data.url && isValidUrl(data.url)) {
      console.warn(`[validateWebsite] ⚠️ 网站 ${data.url} 缺少图标数据，将自动生成SVG`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 标准化网站数据
 * @param {Object} data - 原始网站数据
 * @returns {Object} 标准化的网站对象
 */
export function normalizeWebsiteData(data) {
  console.log('[normalizeWebsiteData] ========== 开始标准化 ==========')
  console.log('[normalizeWebsiteData] 输入数据:', JSON.stringify(data, null, 2))

  // 1. 如果 name 为空，从 URL 提取
  if (!data.name && data.url) {
    data.name = extractSiteNameFromUrl(data.url)
    console.log('[normalizeWebsiteData] 从 URL 提取名称:', data.name)
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
    updatedAt: new Date()
  })

  return result
}

/**
 * 编码 SVG 为 Base64
 */
function encodeSvg(svg) {
  if (!svg) return ''
  if (svg.startsWith('data:image/svg+xml;base64,') || svg.startsWith('data:image/svg+xml;utf8,')) {
    return svg
  }
  const encodedSvg = encodeURIComponent(svg)
    .replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))
  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`
}

/**
 * 批量补全网站元数据（仅插件可用）
 * @param {Array} websites - 网站数组
 * @param {Function} progressCallback - 进度回调函数 (processed, total)
 * @returns {Promise<Array>} 补全后的网站数组
 */
export async function batchEnrichMetadata(websites, progressCallback) {
  const total = websites.length
  let processed = 0

  for (let i = 0; i < websites.length; i++) {
    const website = websites[i]

    // 检查是否需要补全
    if (!website.title || !website.description || !website.iconData) {
      try {
        // 使用插件的 background.js 获取元数据
        const metadata = await chrome.runtime.sendMessage({
          action: 'FETCH_METADATA',
          url: website.url,
          fromCurrentTab: false
        })

        if (metadata) {
          // 只补全缺失的字段
          if (!website.title && metadata.title) {
            website.title = metadata.title
          }
          if (!website.description && metadata.description) {
            website.description = metadata.description
          }
          if (!website.iconData && metadata.iconData) {
            website.iconData = metadata.iconData
          }
        } else {
          console.warn(`[MetadataService] ⚠ 无法获取元数据：${website.url}`)
        }
      } catch (error) {
        // 网络错误、SSL 问题等不处理，只记录日志
        console.warn(`[MetadataService] ⚠ 获取元数据失败 (${website.url}): ${error.message}`)
      }
    }

    processed++
    if (progressCallback) {
      progressCallback(processed, total)
    }
  }

  return websites
}

/**
 * 从插件获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadataFromPlugin(url) {
  console.log('[fetchMetadataFromPlugin] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadataFromPlugin] URL:', url)

  try {
    // 检查是否在扩展环境中（通过 content.js）
    if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
      // 直接在扩展环境中运行
      const metadata = await chrome.runtime.sendMessage({
        action: 'FETCH_METADATA',
        url: url,
        fromCurrentTab: false
      })

      if (metadata) {
        console.log('[fetchMetadataFromPlugin] ✓ 成功获取元数据')
        console.log('[fetchMetadataFromPlugin] - title:', metadata.title)
        console.log('[fetchMetadataFromPlugin] - description:', metadata.description?.substring(0, 50))
        console.log('[fetchMetadataFromPlugin] - iconData:', metadata.iconData?.substring(0, 50))
        return metadata
      } else {
        console.warn('[fetchMetadataFromPlugin] ⚠️ 未能获取元数据')
        return null
      }
    } else {
      // 在起始页中运行，通过 content.js 转发
      console.log('[fetchMetadataFromPlugin] 在起始页中运行，通过 content.js 转发')

      // 创建一个 Promise 来等待响应
      return new Promise((resolve, reject) => {
        const requestId = Date.now() + '-' + Math.random()

        // 创建超时定时器
        const timeoutId = setTimeout(() => {
          document.removeEventListener('StartPageAPI-MetadataResponse', responseHandler)
          console.error('[fetchMetadataFromPlugin] ❌ 请求超时')
          resolve(null)
        }, 10000)

        // 监听响应事件
        const responseHandler = (e) => {
          if (e.detail.requestId === requestId) {
            clearTimeout(timeoutId)
            document.removeEventListener('StartPageAPI-MetadataResponse', responseHandler)

            if (e.detail.success && e.detail.result) {
              console.log('[fetchMetadataFromPlugin] ✓ 成功获取元数据')
              console.log('[fetchMetadataFromPlugin] - title:', e.detail.result.title)
              console.log('[fetchMetadataFromPlugin] - description:', e.detail.result.description?.substring(0, 50))
              console.log('[fetchMetadataFromPlugin] - iconData:', e.detail.result.iconData?.substring(0, 50))
              resolve(e.detail.result)
            } else {
              console.warn('[fetchMetadataFromPlugin] ⚠️ 未能获取元数据')
              resolve(null)
            }
          }
        }

        // 添加响应监听器
        document.addEventListener('StartPageAPI-MetadataResponse', responseHandler)

        // 发送请求到 content.js
        const event = new CustomEvent('StartPageAPI-FetchMetadata', {
          detail: {
            url: url,
            requestId: requestId
          }
        })

        console.log('[fetchMetadataFromPlugin] 发送请求到 content.js')
        document.dispatchEvent(event)
      })
    }
  } catch (error) {
    console.error('[fetchMetadataFromPlugin] ❌ 获取元数据失败:', error)
    return null
  }
}

/**
 * 规范化 URL（移除尾部斜杠、统一协议等）
 * @param {string} url - 原始 URL
 * @returns {string} 规范化后的 URL
 */
function normalizeUrl(url) {
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
    console.warn('[URLChecker] URL 解析失败:', url, error)
    return url
  }
}

/**
 * 检查 URL 是否已存在于数据库中
 * @param {string} url - 要检查的 URL
 * @param {Array} allWebsites - 所有网站数组（从数据库查询）
 * @returns {{exists: boolean, websiteId?: number, websiteName?: string}}
 */
export function checkUrlExists(url, allWebsites) {
  if (!allWebsites || !Array.isArray(allWebsites)) {
    console.error('[URLChecker] 网站数组无效')
    return { exists: false }
  }

  // 规范化要检查的 URL
  const normalizedUrl = normalizeUrl(url)
  console.log('[URLChecker] 规范化后的 URL:', normalizedUrl)

  // 在所有网站中查找匹配的 URL
  const existingWebsite = allWebsites.find(w => {
    if (!w.isActive) return false

    // 规范化数据库中的 URL
    const normalizedExistingUrl = normalizeUrl(w.url)

    // 比较规范化的 URL
    return normalizedExistingUrl === normalizedUrl
  })

  if (existingWebsite) {
    console.log('[URLChecker] ✓ URL 已存在，ID:', existingWebsite.id, '原始URL:', url, '数据库URL:', existingWebsite.url)
    return {
      exists: true,
      websiteId: existingWebsite.id,
      websiteName: existingWebsite.name,
      website: existingWebsite
    }
  } else {
    console.log('[URLChecker] - URL 不存在:', normalizedUrl)
    return {
      exists: false
    }
  }
}

export default {
  validateWebsite,
  normalizeWebsiteData,
  batchEnrichMetadata,
  checkUrlExists,
  // 导出工具函数供组件直接使用
  extractSiteNameFromUrl,
  extractRootDomain
}

// 同时提供命名导出，方便组件按需导入
export { extractSiteNameFromUrl, extractRootDomain }
