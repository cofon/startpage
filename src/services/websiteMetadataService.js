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
  START_PAGE_REQUEST_UNSYNCED_METAS: 'START_PAGE_REQUEST_UNSYNCED_METAS',
  START_PAGE_SYNC_COMPLETE: 'START_PAGE_SYNC_COMPLETE'
};

/**
 * 检查扩展是否安装
 * @returns {Promise<boolean>} 扩展是否安装
 * @deprecated 不再使用，直接发送消息到扩展
 */
export async function isExtensionInstalled() {
  return new Promise((resolve) => {
    // 总是返回 true，因为即使 window.StartPageExtension 不存在，直接发送消息也可能成功
    resolve(true);
  });
}

/**
 * 发送消息到扩展
 * @param {string} type - 消息类型
 * @param {Object} payload - 消息 payload
 * @param {number} retryCount - 当前重试次数
 * @param {number} maxRetries - 最大重试次数
 * @returns {Promise<Object>} 扩展的响应
 */
export async function sendMessageToExtension(type, payload = {}, retryCount = 0, maxRetries = 3) {
  // 先发送唤醒消息（PING），确保扩展从休眠状态中唤醒
  try {
    await checkExtensionReady();
  } catch (error) {
    // 唤醒失败不影响后续操作，继续发送实际消息
  }

  return new Promise((resolve, reject) => {
    // 生成唯一的请求 ID
    const requestId = Date.now() + '-' + Math.random();
    let isResolved = false;

    // 监听响应
    const handleResponse = (event) => {
      if (event.detail && event.detail.requestId === requestId) {
        window.removeEventListener('StartPageAPI-Response', handleResponse);
        clearTimeout(timeoutId);
        
        // 避免重复 resolve/reject
        if (isResolved) return;
        isResolved = true;
        
        if (event.detail.success) {
          resolve(event.detail);
        } else {
          // 如果失败且未达到最大重试次数，进行重试
          if (retryCount < maxRetries) {
            // 只在非 PING 消息时打印重试信息
            if (type !== 'PING') {
              console.log(`[sendMessageToExtension] 请求失败，正在重试 ${retryCount + 1}/${maxRetries}...`);
            }
            // 延迟 500ms 后重试
            setTimeout(() => {
              sendMessageToExtension(type, payload, retryCount + 1, maxRetries)
                .then(resolve)
                .catch(reject);
            }, 500);
          } else {
            reject(new Error(event.detail.error || 'Request failed'));
          }
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

    // 超时处理 - 缩短超时时间为 5 秒
    const timeoutId = setTimeout(() => {
      window.removeEventListener('StartPageAPI-Response', handleResponse);
      
      // 避免重复 resolve/reject
      if (isResolved) return;
      isResolved = true;
      
      // 如果超时且未达到最大重试次数，进行重试
      if (retryCount < maxRetries) {
        // 只在非 PING 消息时打印重试信息
        if (type !== 'PING') {
          console.log(`[sendMessageToExtension] 请求超时，正在重试 ${retryCount + 1}/${maxRetries}...`);
        }
        sendMessageToExtension(type, payload, retryCount + 1, maxRetries)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Extension communication timeout'));
      }
    }, 5000);
  });
}

/**
 * 检查扩展是否就绪
 * 通过发送一个 PING 消息来检查 Service Worker 是否已启动
 * @returns {Promise<boolean>} 扩展是否就绪
 */
export async function checkExtensionReady() {
  return new Promise((resolve) => {
    const requestId = Date.now() + '-' + Math.random();
    let resolved = false;

    // 监听响应
    const handleResponse = (event) => {
      if (event.detail && event.detail.requestId === requestId) {
        window.removeEventListener('StartPageAPI-Response', handleResponse);
        if (!resolved) {
          resolved = true;
          // 只要能收到响应（无论成功失败），说明 Service Worker 已启动
          resolve(true);
        }
      }
    };

    window.addEventListener('StartPageAPI-Response', handleResponse);

    // 发送 PING 消息
    const event = new CustomEvent('StartPageAPI-Call', {
      detail: {
        type: 'PING',
        payload: {},
        requestId
      }
    });

    window.dispatchEvent(event);

    // 2秒后超时，如果没收到响应，说明 Service Worker 未启动
    setTimeout(() => {
      window.removeEventListener('StartPageAPI-Response', handleResponse);
      if (!resolved) {
        resolved = true;
        // 打印普通信息而不是错误
        console.log('[checkExtensionReady] 扩展可能处于休眠状态，正在唤醒...');
        resolve(false);
      }
    }, 2000);
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
