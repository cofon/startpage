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
// 配置：API 服务地址
// ============================================
/**
 * 环境变量配置说明：
 * 配置文件位置：项目根目录下的 .env 文件
 * 
 * 可用的环境变量：
 * - VITE_API_MODE: API 模式配置 ('local' | 'edgeone' | 'auto')
 * - VITE_LOCAL_API_URL: 本地开发 API 地址
 * - VITE_EDGEONE_API_URL: EdgeOne 边缘函数 API 地址
 * 
 * 模式说明：
 * - 'local': 本地测试环境 (http://localhost:3000)
 * - 'edgeone': EdgeOne 边缘函数（生产环境）
 * - 'auto': 自动切换（生产环境使用EdgeOne，其他环境使用本地）
 */
const API_MODE = import.meta.env.VITE_API_MODE || 'local';

// 本地开发 API 地址
const LOCAL_API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3000';

// EdgeOne 边缘函数 API 地址（需根据实际情况配置）
const EDGEONE_API_BASE_URL = import.meta.env.VITE_EDGEONE_API_URL || '';

/**
 * 获取当前 API 基础 URL
 * @returns {string} API 基础 URL
 */
function getApiBaseUrl() {
  // 如果是 auto 模式，根据环境自动判断
  if (API_MODE === 'auto') {
    const isProduction = import.meta.env.MODE === 'production';
    console.log('[getApiBaseUrl] 自动模式 - 当前环境:', import.meta.env.MODE);
    
    if (isProduction && EDGEONE_API_BASE_URL) {
      console.log('[getApiBaseUrl] ✓ 使用 EdgeOne API (生产环境)');
      return EDGEONE_API_BASE_URL;
    } else {
      console.log('[getApiBaseUrl] ✓ 使用本地 API (开发环境)');
      return LOCAL_API_BASE_URL;
    }
  }
  
  // 显式指定 edgeone 模式
  if (API_MODE === 'edgeone' && EDGEONE_API_BASE_URL) {
    console.log('[getApiBaseUrl] ✓ 使用 EdgeOne API (强制模式)');
    return EDGEONE_API_BASE_URL;
  }
  
  // 默认使用本地 API
  console.log('[getApiBaseUrl] ✓ 使用本地 API (默认)');
  return LOCAL_API_BASE_URL;
}

/**
 * 从 API 获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object|null>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadataFromLocalApi(url) {
  const baseUrl = getApiBaseUrl();
  const isEdgeOne = baseUrl === EDGEONE_API_BASE_URL && EDGEONE_API_BASE_URL;
  
  console.log('[fetchMetadataFromLocalApi] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadataFromLocalApi] 📍 数据来源:', isEdgeOne ? 'EdgeOne 边缘函数（生产环境）' : '本地 API (开发环境)')
  console.log('[fetchMetadataFromLocalApi] URL:', url)
  console.log('[fetchMetadataFromLocalApi] API 地址:', baseUrl)
  console.log('[fetchMetadataFromLocalApi] API 模式:', API_MODE)

  try {
    const apiUrl = `${baseUrl}/api/get-metadata?url=${encodeURIComponent(url)}`;
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

      console.log('[fetchMetadataFromLocalApi] ✓ 成功获取元数据', 
        `(来源：${isEdgeOne ? 'EdgeOne 边缘函数' : '本地 API'})`);
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
