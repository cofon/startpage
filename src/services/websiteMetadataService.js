/* global chrome */

/**
 * 网站元数据服务
 * 从扩展获取网站元数据（title, description, iconData）
 */

import { extractRootDomain } from '../utils/website/websiteUtils'

// 消息类型
const MESSAGE_TYPES = {
  START_PAGE_REQUEST_WEBSITE_META: 'START_PAGE_REQUEST_WEBSITE_META',
  START_PAGE_BATCH_REQUEST_METAS: 'START_PAGE_BATCH_REQUEST_METAS',
  START_PAGE_REQUEST_UNSYNCED_METAS: 'START_PAGE_REQUEST_UNSYNCED_METAS'
};

/**
 * 检查扩展是否安装
 * @returns {Promise<boolean>} 扩展是否安装
 */
export async function isExtensionInstalled() {
  return new Promise((resolve) => {
    // 检查 window.StartPageExtension，这个变量由 content.js 设置
    if (typeof window.StartPageExtension !== 'undefined') {
      resolve(true);
      return;
    }

    // 立即检查
    resolve(false);
  });
}

/**
 * 发送消息到扩展
 * @param {string} type - 消息类型
 * @param {Object} payload - 消息 payload
 * @returns {Promise<Object>} 扩展的响应
 */
export async function sendMessageToExtension(type, payload = {}) {
  return new Promise((resolve, reject) => {
    // 生成唯一的请求 ID
    const requestId = Date.now() + '-' + Math.random();

    // 监听响应
    const handleResponse = (event) => {
      if (event.detail && event.detail.requestId === requestId) {
        window.removeEventListener('StartPageAPI-Response', handleResponse);
        if (event.detail.success) {
          resolve(event.detail);
        } else {
          reject(new Error(event.detail.error || 'Request failed'));
        }
      }
    };

    window.addEventListener('StartPageAPI-Response', handleResponse);

    // 发送请求
    const event = new CustomEvent('StartPageAPI-Call', {
      detail: {
        type,
        payload,
        requestId
      }
    });

    window.dispatchEvent(event);

    // 超时处理
    setTimeout(() => {
      window.removeEventListener('StartPageAPI-Response', handleResponse);
      reject(new Error('Extension communication timeout'));
    }, 30000);
  });
}

/**
 * 从扩展获取网站元数据
 * @param {string} url - 网站 URL
 * @returns {Promise<Object|null>} 元数据对象 { title, description, iconData }
 */
export async function fetchMetadata(url) {
  console.log('[fetchMetadata] ========== 开始获取元数据 ==========')
  console.log('[fetchMetadata] 数据来源：扩展')
  console.log('[fetchMetadata] URL:', url)

  try {
    // 直接发送消息到扩展，不检查扩展是否安装
    const response = await sendMessageToExtension(MESSAGE_TYPES.START_PAGE_REQUEST_WEBSITE_META, { url });
    
    if (response.success && response.data) {
      const metadata = {
        title: response.data.title || '',
        description: response.data.description || '',
        iconData: response.data.iconData || '',
      }

      console.log('[fetchMetadata] ✓ 成功获取元数据')
      console.log('[fetchMetadata] - title:', metadata.title)
      console.log('[fetchMetadata] - description:', metadata.description?.substring(0, 50))
      console.log('[fetchMetadata] - iconData:', metadata.iconData ? 'base64 格式' : '无')

      return metadata
    } else {
      console.warn('[fetchMetadata] ⚠️ 扩展返回失败:', response.error)
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

  // 检查扩展是否安装
  const installed = await isExtensionInstalled();
  
  if (installed) {
    // 使用扩展批量获取元数据
    try {
      const urls = websites.filter(website => 
        !website.title || !website.description || !website.iconData
      ).map(website => website.url);
      
      if (urls.length > 0) {
        const response = await sendMessageToExtension(
          MESSAGE_TYPES.START_PAGE_BATCH_REQUEST_METAS, 
          { urls }
        );
        
        if (response.success && response.data) {
          const metaMap = new Map();
          response.data.forEach(meta => {
            metaMap.set(meta.url, meta);
          });
          
          for (let i = 0; i < websites.length; i++) {
            const website = websites[i];
            const metadata = metaMap.get(website.url);
            
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
            } else if (!website.title || !website.description || !website.iconData) {
              console.warn(`[batchEnrichMetadata] ⚠ 无法获取元数据：${website.url}`)
              addMetaFailedTag(website)
            }
            
            processed++
            if (progressCallback) {
              progressCallback(processed, total)
            }
          }
        } else {
          // 批量请求失败，回退到单个请求
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
        }
      } else {
        // 所有网站都有完整的元数据
        for (let i = 0; i < websites.length; i++) {
          processed++
          if (progressCallback) {
            progressCallback(processed, total)
          }
        }
      }
    } catch (error) {
      console.error('[batchEnrichMetadata] ❌ 批量获取元数据失败:', error.message)
      // 回退到单个请求
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
    }
  } else {
    // 扩展未安装，使用原有逻辑（如果有的话）
    for (let i = 0; i < websites.length; i++) {
      const website = websites[i]

      // 检查是否需要补全
      if (!website.title || !website.description || !website.iconData) {
        console.warn(`[batchEnrichMetadata] ⚠ 扩展未安装，无法获取元数据：${website.url}`)
        addMetaFailedTag(website)
      }

      processed++
      if (progressCallback) {
        progressCallback(processed, total)
      }
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
