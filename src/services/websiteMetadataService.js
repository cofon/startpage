/* global chrome */

/**
 * 网站元数据服务
 * 从 EdgeOne 边缘函数获取网站元数据（title, description, iconData）
 */

import { extractRootDomain } from '../utils/website/websiteUtils'

// ============================================
// EdgeOne API 配置
// ============================================
const EDGEONE_API_URL = import.meta.env.VITE_EDGEONE_API_URL || 'https://startpage-rjh1mdmj.edgeone.cool'

/**
 * 从 EdgeOne 边缘函数获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object|null>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadata(url) {
  console.log('[fetchMetadata] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadata] 数据来源：EdgeOne 边缘函数')
  console.log('[fetchMetadata] URL:', url)
  console.log('[fetchMetadata] API 地址:', EDGEONE_API_URL)

  try {
    const apiUrl = `${EDGEONE_API_URL}/api/get-metadata?url=${encodeURIComponent(url)}`
    console.log('[fetchMetadata] 请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('[fetchMetadata] 响应结果:', result)

    if (result.success && result.data) {
      const metadata = {
        title: result.data.title || '',
        description: result.data.description || '',
        iconData: result.data.iconData || ''
      }

      console.log('[fetchMetadata] ✓ 成功获取元数据')
      console.log('[fetchMetadata] - title:', metadata.title)
      console.log('[fetchMetadata] - description:', metadata.description?.substring(0, 50))
      console.log('[fetchMetadata] - iconData:', metadata.iconData ? 'base64 格式' : '无')

      return metadata
    } else {
      console.warn('[fetchMetadata] ⚠️ API 返回失败:', result.error)
      return null
    }
  } catch (error) {
    console.error('[fetchMetadata] ❌ 获取元数据失败:', error.message)
    return null
  }
}

/**
 * 批量补全网站元数据
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
        const metadata = await fetchMetadata(website.url)

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
          console.warn(`[batchEnrichMetadata] ⚠ 无法获取元数据：${website.url}`)
          addMetaFailedTag(website)
        }
      } catch (error) {
        console.warn(`[batchEnrichMetadata] ❌ 获取元数据失败 (${website.url}): ${error.message}`)
        addMetaFailedTag(website)
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
 * 添加 meta_failed 标签
 * @param {Object} website - 网站对象
 */
function addMetaFailedTag(website) {
  if (!website.tags) {
    website.tags = []
  } else if (typeof website.tags === 'string') {
    website.tags = website.tags.split(',').map(t => t.trim()).filter(t => t)
  }

  if (!website.tags.includes('meta_failed')) {
    website.tags.push('meta_failed')
  }
}

export default {
  fetchMetadata,
  batchEnrichMetadata,
  extractRootDomain
}
