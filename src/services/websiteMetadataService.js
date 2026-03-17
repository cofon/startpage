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
  extractRootDomain
} from '../utils/website/websiteUtils'

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
  batchEnrichMetadata,
  fetchMetadata,
  fetchMetadataFromLocalApi,
  extractRootDomain
}
