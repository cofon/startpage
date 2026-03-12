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
} from '../utils/websiteUtils'

import { createWebsiteObject } from '../utils/websiteNormalizer'

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

  // 4. 如果没有 iconGenerateData，自动生成
  console.log('[normalizeWebsiteData] 检查图标数据...')
  console.log('[normalizeWebsiteData] data.iconData:', data.iconData?.substring(0, 50))
  console.log('[normalizeWebsiteData] data.iconGenerateData:', data.iconGenerateData?.substring(0, 50))
  console.log('[normalizeWebsiteData] 是否有 iconData:', !!data.iconData)
  console.log('[normalizeWebsiteData] iconData 是否以 data:image 开头:', data.iconData?.startsWith('data:image'))
  console.log('[normalizeWebsiteData] 是否有 iconGenerateData:', !!data.iconGenerateData)
  
  const needsIconGeneration = (!data.iconData || !data.iconData.startsWith('data:image')) && !data.iconGenerateData
  console.log('[normalizeWebsiteData] 是否需要生成图标:', needsIconGeneration)
  
  if (needsIconGeneration) {
    console.log('[normalizeWebsiteData] 准备生成SVG，当前 name:', data.name)
    if (data.name) {
      console.log('[normalizeWebsiteData] 调用 generateDefaultIcon("', data.name, '")')
      const svgIcon = generateDefaultIcon(data.name)
      console.log('[normalizeWebsiteData] generateDefaultIcon 返回的 SVG:', svgIcon?.substring(0, 100))
      data.iconGenerateData = encodeSvg(svgIcon)
      console.log('[normalizeWebsiteData] ✓ 已生成SVG图标')
      console.log('[normalizeWebsiteData] 编码后的 SVG 前 100 字符:', data.iconGenerateData.substring(0, 100))
    } else {
      console.warn('[normalizeWebsiteData] ⚠️ 缺少 name，无法生成SVG')
    }
  } else {
    console.log('[normalizeWebsiteData] 已有图标数据，跳过生成')
  }

  // 5. 使用 createWebsiteObject 创建标准对象
  const result = createWebsiteObject({
    ...data,
    visitCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  console.log('[normalizeWebsiteData] 最终结果的 iconGenerateData:', result.iconGenerateData?.substring(0, 100))
  console.log('[normalizeWebsiteData] ========== 标准化完成 ==========')
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
 * 检查 URL 是否已存在于数据库中
 * @param {string} url - 要检查的 URL
 * @param {Array} allWebsites - 所有网站数组（从数据库查询）
 * @returns {{exists: boolean, websiteId?: number, websiteName?: string}}
 */
function checkUrlExists(url, allWebsites) {
  if (!allWebsites || !Array.isArray(allWebsites)) {
    console.error('[URLChecker] 网站数组无效')
    return { exists: false }
  }
  
  const existingWebsite = allWebsites.find(w => w.url === url && w.isActive)
  
  if (existingWebsite) {
    console.log('[URLChecker] ✓ URL 已存在，ID:', existingWebsite.id)
    return {
      exists: true,
      websiteId: existingWebsite.id,
      websiteName: existingWebsite.name
    }
  } else {
    console.log('[URLChecker] - URL 不存在')
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
export { extractSiteNameFromUrl, extractRootDomain, checkUrlExists }
