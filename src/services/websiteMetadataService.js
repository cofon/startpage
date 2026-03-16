/* global chrome */


/**
 * 网站元数据服务
 * 提供统一的网站数据验证、标准化、补全功能
 *
 * 支持两种模式：
 * 1. 插件模式：通过浏览器插件获取元数据（无跨域限制）
 * 2. 本地 API 模式：通过本地 EdgeOne 模拟服务获取元数据
 */

import {
  isValidUrl,
  extractSiteNameFromUrl,
  generateDefaultIcon,
  extractRootDomain
} from '../utils/website/websiteUtils'

import { createWebsiteObject } from '../utils/website/websiteNormalizer'

// ============================================
// 配置：本地 API 服务地址
// ============================================
const LOCAL_API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3000';

/**
 * 从本地 API 获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object|null>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadataFromLocalApi(url) {
  console.log('[fetchMetadataFromLocalApi] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadataFromLocalApi] 📍 数据来源: Node API (EdgeOne 边缘函数)')
  console.log('[fetchMetadataFromLocalApi] URL:', url)
  console.log('[fetchMetadataFromLocalApi] API 地址:', LOCAL_API_BASE_URL)

  try {
    const apiUrl = `${LOCAL_API_BASE_URL}/api/get-metadata?url=${encodeURIComponent(url)}`;
    console.log('[fetchMetadataFromLocalApi] 请求 API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[fetchMetadataFromLocalApi] 响应结果:', result);

    if (result.success && result.data) {
      // 转换 API 返回格式为前端所需格式
      const metadata = {
        title: result.data.title || '',
        description: result.data.description || '',
        iconData: result.data.iconData || ''
      };

      console.log('[fetchMetadataFromLocalApi] ✓ 成功获取元数据 (来源: Node API)');
      console.log('[fetchMetadataFromLocalApi] - title:', metadata.title);
      console.log('[fetchMetadataFromLocalApi] - description:', metadata.description?.substring(0, 50));
      console.log('[fetchMetadataFromLocalApi] - iconData:', metadata.iconData ?
        (metadata.iconData.startsWith('data:') ? 'base64 格式' : metadata.iconData.substring(0, 50)) : '无');

      return metadata;
    } else {
      console.warn('[fetchMetadataFromLocalApi] ⚠️ API 返回失败:', result.error);
      return null;
    }
  } catch (error) {
    console.error('[fetchMetadataFromLocalApi] ❌ 获取元数据失败:', error.message);
    return null;
  }
}



/**
 * 通用的元数据获取函数
 * 使用本地 API (EdgeOne 边缘函数) 获取数据
 * @param {string} url - 网站 URL
 * @param {Object} options - 选项
 * @param {string} options.source - 数据源：'local-api' | 'auto'
 * @returns {Promise<Object|null>} 元数据对象
 */
export async function fetchMetadata(url, options = {}) {
  const { source = 'auto' } = options;

  console.log('[fetchMetadata] ========== 开始获取元数据 ==========');
  console.log('[fetchMetadata] 数据源模式:', source);

  // 统一使用本地 API (EdgeOne 边缘函数)
  return await fetchMetadataFromLocalApi(url);
}

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
 * URL 规范化处理
 */
function normalizeUrl(url) {
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
    console.warn('[URLChecker] URL 解析失败:', url, error)
    return url
  }
}

/**
 * 检查 URL 是否已存在于数据库中
 */
export function checkUrlExists(url, allWebsites) {
  if (!allWebsites || !Array.isArray(allWebsites)) {
    return { exists: false }
  }

  const normalizedUrl = normalizeUrl(url)

  const existingWebsite = allWebsites.find(w => {
    if (!w.isActive) return false

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

/**
 * 批量补全网站元数据
 * @param {Array} websites - 网站数组
 * @param {Function} progressCallback - 进度回调函数 (processed, total)
 * @param {Object} options - 选项
 * @param {string} options.source - 数据源：'local-api' | 'auto'
 * @returns {Promise<Array>} 补全后的网站数组
 */
export async function batchEnrichMetadata(websites, progressCallback, options = {}) {
  const { source = 'auto' } = options;
  const total = websites.length
  let processed = 0

  for (let i = 0; i < websites.length; i++) {
    const website = websites[i]

    // 检查是否需要补全
    if (!website.title || !website.description || !website.iconData) {
      try {
        // 使用通用函数获取元数据
        const metadata = await fetchMetadata(website.url, { source })

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
      } catch (error) {
        console.warn(`[MetadataService] ⚠ 获取元数据失败 (${website.url}): ${error.message}`)
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

export default {
  validateWebsite,
  normalizeWebsiteData,
  batchEnrichMetadata,
  checkUrlExists,
  fetchMetadata,
  fetchMetadataFromLocalApi,
  extractSiteNameFromUrl,
  extractRootDomain
}
