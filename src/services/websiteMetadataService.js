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
} from '../utils/website/websiteUtils'

import { createWebsiteObject } from '../utils/website/websiteNormalizer'

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
    // 静默处理，允许后续自动生成
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
  // 1. 如果 name 为空，从 URL 提取
  if (!data.name && data.url) {
    data.name = extractSiteNameFromUrl(data.url)
  }

  // ========== 删除：不再自动用 name 填充 title ==========
  // 理由：保持 title 为空，下次导入时可以重新获取元数据
  // 有些网站可能暂时无法访问，过段时间又能访问了
  // 显示逻辑会在 DisplayModule 中处理优先级：title > desc > name

  // 2. description 保持为空（不自动填充）
  // description 字段保持原样，由用户输入或插件获取

  // 3. 如果 tags 为空，添加默认标签 'new'
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    data.tags = ['new']
  }

  // 4. 处理 markOrder
  if (!data.markOrder) {
    data.markOrder = data.isMarked ? 0 : 0
  }

  // 5. iconGenerateData 必须有值，与 iconData 无关
  if (!data.iconGenerateData) {
    // 如果有 name 则用 name 生成，否则用 URL 生成
    const iconSource = data.name || data.url
    const svgIcon = generateDefaultIcon(iconSource)
    data.iconGenerateData = encodeSvg(svgIcon)
  }

  // 6. 使用 createWebsiteObject 创建标准对象
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
          // 获取失败：添加 meta_failed 标签
          console.warn(`[MetadataService] ⚠ 无法获取元数据：${website.url}`)
          if (!website.tags) {
            website.tags = []
          } else if (typeof website.tags === 'string') {
            website.tags = website.tags.split(',').map(t => t.trim()).filter(t => t)
          }
          
          if (!website.tags.includes('meta_failed')) {
            website.tags.push('meta_failed')
          }
        }
      } catch (error) {
        // 网络错误、SSL 问题等不处理，静默失败
        // 获取失败：添加 meta_failed 标签
        if (!website.tags) {
          website.tags = []
        } else if (typeof website.tags === 'string') {
          website.tags = website.tags.split(',').map(t => t.trim()).filter(t => t)
        }
        
        if (!website.tags.includes('meta_failed')) {
          website.tags.push('meta_failed')
        }
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
 * URL 规范化处理
 * - 移除末尾斜杠
 * - 统一协议为 https（如果没有协议）
 * - 移除 hash 和 search 参数
 * @param {string} url - 要规范化的 URL
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
 * 检查 URL 是否已存在于数据库中（使用规范化后的 URL 比较）
 * @param {string} url - 要检查的 URL
 * @param {Array} allWebsites - 所有网站数组（从数据库查询）
 * @returns {{exists: boolean, websiteId?: number, websiteName?: string}}
 */
function checkUrlExists(url, allWebsites) {
  if (!allWebsites || !Array.isArray(allWebsites)) {
    return { exists: false }
  }

  // ========== 新增：URL 规范化处理 ==========
  // 移除末尾斜杠，确保 https://www.bilibili.com 和 https://www.bilibili.com/ 被视为相同
  const normalizedUrl = normalizeUrl(url)
  
  const existingWebsite = allWebsites.find(w => {
    if (!w.isActive) return false
    
    // 对数据库中的 URL 也进行规范化
    const normalizedExistingUrl = normalizeUrl(w.url)
    return normalizedExistingUrl === normalizedUrl
  })

  if (existingWebsite) {
    return {
      exists: true,
      websiteId: existingWebsite.id,
      websiteName: existingWebsite.name,
      website: existingWebsite
    }
  } else {
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