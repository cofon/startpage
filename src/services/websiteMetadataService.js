/* global chrome */

/**
 * 网站元数据服务
 * 从 EdgeOne 边缘函数获取网站元数据（title, description, iconData）
 */

import { extractRootDomain } from '../utils/website/websiteUtils'

// ============================================
// Node Functions API 配置
// ============================================
const EDGEONE_API_URL = import.meta.env.VITE_EDGEONE_API_URL || '/'
const IS_DEV = import.meta.env.DEV

/**
 * 从 Node Functions 获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object|null>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadata(url) {
  console.log('[fetchMetadata] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadata] 数据来源：Node Functions')
  console.log('[fetchMetadata] URL:', url)
  console.log('[fetchMetadata] API 地址:', EDGEONE_API_URL)
  console.log('[fetchMetadata] 环境：', IS_DEV ? '开发环境' : '生产环境')

  try {
    // 本地开发环境的模拟数据
    if (IS_DEV) {
      console.log('[fetchMetadata] 使用本地模拟数据')

      // 针对知乎的特殊处理
      if (url.includes('zhihu.com')) {
        console.log('[fetchMetadata] 知乎URL，使用智能模拟数据')

        // 基于URL路径生成模拟数据
        const urlPath = new URL(url).pathname
        let title = '知乎 - 有问题，就会有答案'
        let description = '知乎是中文互联网知名的问答社区，高质量的问答内容和创作者社区。'

        // 根据URL路径生成更具体的模拟数据
        if (urlPath.includes('/question/')) {
          // 提取问题ID
          const questionIdMatch = urlPath.match(/\/question\/(\d+)/)
          if (questionIdMatch) {
            title = `知乎问题 - 问题ID: ${questionIdMatch[1]}`
            description = '这是一个知乎问题页面，包含用户的提问和回答。'
          }
        } else if (urlPath.includes('/answer/')) {
          // 提取回答ID
          const answerIdMatch = urlPath.match(/\/answer\/(\d+)/)
          if (answerIdMatch) {
            title = `知乎回答 - 回答ID: ${answerIdMatch[1]}`
            description = '这是一个知乎回答页面，包含用户的详细回答内容。'
          }
        }

        const metadata = {
          title: title,
          description: description,
          iconData: '', // 模拟无图标数据
        }

        console.log('[fetchMetadata] ✓ 成功获取元数据（智能模拟）')
        console.log('[fetchMetadata] - title:', metadata.title)
        console.log('[fetchMetadata] - description:', metadata.description?.substring(0, 50))
        console.log('[fetchMetadata] - iconData:', metadata.iconData ? 'base64 格式' : '无')

        return metadata
      }
    }

    // 构建正确的 API URL，避免双斜杠问题
    const apiUrl =
      EDGEONE_API_URL === '/'
        ? `/api/get-metadata?url=${encodeURIComponent(url)}`
        : `${EDGEONE_API_URL}/api/get-metadata?url=${encodeURIComponent(url)}`
    console.log('[fetchMetadata] 请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
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
        iconData: result.data.iconData || '',
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

    // 本地开发环境的容错处理
    if (IS_DEV) {
      console.log('[fetchMetadata] 本地开发环境容错处理')
      const metadata = {
        title: new URL(url).hostname,
        description: '',
        iconData: '',
      }
      return metadata
    }

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
    website.tags = website.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
  }

  if (!website.tags.includes('meta_failed')) {
    website.tags.push('meta_failed')
  }
}

export default {
  fetchMetadata,
  batchEnrichMetadata,
  extractRootDomain,
}
