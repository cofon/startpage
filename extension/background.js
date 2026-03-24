/* global chrome */

// 扩展后台脚本

// 存储键名
const STORAGE_KEYS = {
  METAS: 'metas',
}

// 消息类型
const MESSAGE_TYPES = {
  // 扩展发送的消息
  EXTENSION_SUBMIT_WEBSITE_META: 'EXTENSION_SUBMIT_WEBSITE_META',
  // 扩展接收的消息
  START_PAGE_REQUEST_WEBSITE_META: 'START_PAGE_REQUEST_WEBSITE_META',
  START_PAGE_BATCH_REQUEST_METAS: 'START_PAGE_BATCH_REQUEST_METAS',
  START_PAGE_REQUEST_UNSYNCED_METAS: 'START_PAGE_REQUEST_UNSYNCED_METAS',
  START_PAGE_SYNC_COMPLETE: 'START_PAGE_SYNC_COMPLETE',
  // 扩展内部消息
  GET_CURRENT_PAGE_METADATA: 'GET_CURRENT_PAGE_METADATA',
  // 扩展响应的消息
  EXTENSION_RESPONSE_WEBSITE_META: 'EXTENSION_RESPONSE_WEBSITE_META',
  EXTENSION_RESPONSE_BATCH_METAS: 'EXTENSION_RESPONSE_BATCH_METAS',
  EXTENSION_RESPONSE_UNSYNCED_METAS: 'EXTENSION_RESPONSE_UNSYNCED_METAS',
}

// 初始化存储
async function initStorage() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.METAS)
    if (!result[STORAGE_KEYS.METAS]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.METAS]: [] })
    }
  } catch (error) {
    console.error('初始化存储失败:', error)
  }
}

// 获取存储的元数据
async function getMetas() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.METAS)
    return result[STORAGE_KEYS.METAS] || []
  } catch (error) {
    console.error('获取元数据失败:', error)
    return []
  }
}

// 保存元数据
async function saveMetas(metas) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.METAS]: metas })
    return true
  } catch (error) {
    console.error('保存元数据失败:', error)
    return false
  }
}

// 从当前标签页获取元数据
async function getMetadataFromCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs.length === 0) {
      throw new Error('未找到当前标签页')
    }

    const tab = tabs[0]
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 获取标题
        const title = document.title || ''

        // 获取描述
        let description = ''
        const metaDesc = document.querySelector('meta[name="description"]')
        if (metaDesc) {
          description = metaDesc.content || ''
        }

        // 获取图标
        let iconUrl = ''
        const iconElements = document.querySelectorAll('link[rel*="icon"]')
        if (iconElements.length > 0) {
          iconUrl = iconElements[0].href
        } else {
          // 尝试使用默认图标
          const domain = window.location.origin
          iconUrl = `${domain}/favicon.ico`
        }

        // 确保图标URL是完整的
        if (iconUrl && !iconUrl.startsWith('http')) {
          const baseUrl = window.location.origin
          iconUrl = new URL(iconUrl, baseUrl).href
        }

        return {
          url: window.location.href,
          title,
          description,
          iconUrl,
        }
      },
    })

    if (result && result[0] && result[0].result) {
      const data = result[0].result
      // 转换图标为base64
      const iconData = await fetchIconAsBase64(data.iconUrl)
      return {
        url: data.url,
        title: data.title,
        description: data.description,
        iconData,
      }
    }
  } catch (error) {
    console.error('从当前标签页获取元数据失败:', error)
  }
  return null
}

// 从URL获取元数据
async function getMetadataFromUrl(url) {
  try {

    // 直接返回error，让代码执行catch中的逻辑
    // throw new Error('fetch error, goto catch block');

    // 清理URL中的反引号
    url = url.replace(/[`]/g, '')

    // 优先使用fetch获取
    console.log('[Background] 优先使用fetch获取元数据')
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'User-Agent': navigator.userAgent,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 修复编码问题：统一使用 arrayBuffer + TextDecoder
    // 1. 首先尝试从 Content-Type 头获取字符集
    const contentType = response.headers.get('content-type') || ''
    const charsetMatch = contentType.match(/charset=(['"]?)([^'"\s]*)\1/i)
    let charset = charsetMatch ? charsetMatch[2] : null

    // 2. 如果没有指定字符集，尝试检测 HTML 中的 meta charset
    if (!charset) {
      const buffer = await response.arrayBuffer()
      const decoder = new TextDecoder('utf-8')
      const textChunk = decoder.decode(buffer.slice(0, 1024)) // 只读取前 1KB 用于检测

      const metaCharsetMatch = textChunk.match(/<meta\s+charset=["']?([^"'\s>]+)/i)
      if (metaCharsetMatch) {
        charset = metaCharsetMatch[1]
        console.log('[Background] 从 meta charset 检测到编码:', charset)
      }

      // 3. 如果还是没有，尝试从 http-equiv 获取
      if (!charset) {
        const httpEquivMatch = textChunk.match(
          /<meta\s+http-equiv=["']?content-type["']?\s+content=["']?text\/html;\s*charset=([^"'\s>]+)/i,
        )
        if (httpEquivMatch) {
          charset = httpEquivMatch[1]
          console.log('[Background] 从 http-equiv 检测到编码:', charset)
        }
      }

      // 4. 使用检测到的编码或默认 UTF-8 解码
      const finalCharset = charset || 'utf-8'
      console.log('[Background] 使用编码解码:', finalCharset)

      try {
        const html = new TextDecoder(finalCharset).decode(buffer)
        return parseHtmlMetadata(html, url)
      } catch (e) {
        console.warn('[Background] 使用检测的编码解码失败，回退到 UTF-8:', e)
        const html = new TextDecoder('utf-8').decode(buffer)
        return parseHtmlMetadata(html, url)
      }
    } else {
      // 5. 如果从响应头获取到了 charset，也使用 arrayBuffer + TextDecoder 方式
      console.log('[Background] 从 Content-Type 获取编码:', charset)
      const buffer = await response.arrayBuffer()
      const html = new TextDecoder(charset).decode(buffer)
      console.log('[Background] 使用 Content-Type 编码解码:', charset)
      return parseHtmlMetadata(html, url)
    }
  } catch (error) {
    console.error('使用fetch获取元数据失败:', error)
    // 尝试使用打开标签页的方式
    console.log('[Background] fetch失败，尝试使用标签页方式获取元数据')
    return await getMetadataFromNewTab(url)
  }
}

/**
 * 解析 HTML 元数据
 * @param {string} html - HTML 内容
 * @param {string} url - 网页 URL
 * @returns {Promise<Object>} 元数据对象
 */
async function parseHtmlMetadata(html, url) {
  console.log('[Background] HTML 长度:', html.length)

  // 改进的 title 提取逻辑（优先级从高到低）
  let title = ''

  // 方法 1: 从 <title> 标签获取（支持属性和换行）
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    title = titleMatch[1].trim()
    console.log('[Background] ✅ 从 <title> 标签获取 title:', title)
  }

  // 方法 2: 从 og:title meta 标签获取（属性顺序兼容）
  if (!title) {
    const ogTitleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i)
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim()
      console.log('[Background] ✅ 从 og:title 获取 title:', title)
    }
  }

  // 方法 3: 从 twitter:title meta 标签获取（属性顺序兼容）
  if (!title) {
    const twitterTitleMatch =
      html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:title["'][^>]*>/i)
    if (twitterTitleMatch) {
      title = twitterTitleMatch[1].trim()
      console.log('[Background] ✅ 从 twitter:title 获取 title:', title)
    }
  }

  // 方法 4: 从 JSON-LD structured data 获取
  if (!title) {
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    )
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1])
        if (jsonData.name || jsonData.headline) {
          title = (jsonData.name || jsonData.headline).trim()
          console.log('[Background] ✅ 从 JSON-LD 获取 title:', title)
        }
      } catch (e) {
        console.warn('[Background] 解析 JSON-LD 失败:', e)
      }
    }
  }

  // 方法 5: 从 h1 标签提取（作为最后手段）
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (h1Match) {
      title = h1Match[1].replace(/<[^>]+>/g, '').trim()
      console.log('[Background] ✅ 从 <h1> 标签获取 title:', title)
    }
  }

  // 方法 6: 从 URL 提取（兜底方案）
  if (!title) {
    try {
      const urlObj = new URL(url)
      title = urlObj.hostname.replace('www.', '')
      console.log('[Background] ✅ 从 URL 提取 title:', title)
    } catch (e) {
      console.warn('[Background] 从 URL 提取 title 失败:', e)
    }
  }

  // 改进的 description 提取逻辑（优先级从高到低）
  let description = ''

  // 方法 1: 从 name="description" meta 标签获取（支持各种属性顺序和中文内容）
  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i)
  if (descMatch) {
    description = descMatch[1].trim()
    console.log('[Background] ✅ 从 description meta 标签获取 description')
  }

  // 方法 1.1: 从 name="Description" meta 标签获取（大小写不敏感）
  if (!description) {
    const descMatchCase =
      html.match(/<meta[^>]*name=["']Description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']Description["'][^>]*>/i)
    if (descMatchCase) {
      description = descMatchCase[1].trim()
      console.log('[Background] ✅ 从 Description meta 标签获取 description')
    }
  }

  // 方法 1.2: 从 name="description" meta 标签获取（无引号版本）
  if (!description) {
    const descMatchNoQuote = html.match(/<meta[^>]*name=description[^>]*content=([^>\s]*)/i)
    if (descMatchNoQuote) {
      description = descMatchNoQuote[1].trim()
      console.log('[Background] ✅ 从 description meta 标签（无引号）获取 description')
    }
  }

  // 方法 2: 从 og:description meta 标签获取（属性顺序兼容）
  if (!description) {
    const ogDescMatch =
      html.match(
        /<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i,
      ) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:description["'][^>]*>/i)
    if (ogDescMatch) {
      description = ogDescMatch[1].trim()
      console.log('[Background] ✅ 从 og:description 获取 description')
    }
  }

  // 方法 3: 从 twitter:description meta 标签获取（属性顺序兼容）
  if (!description) {
    const twitterDescMatch =
      html.match(
        /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i,
      ) ||
      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']twitter:description["'][^>]*>/i)
    if (twitterDescMatch) {
      description = twitterDescMatch[1].trim()
      console.log('[Background] ✅ 从 twitter:description 获取 description')
    }
  }

  // 方法 4: 从 JSON-LD structured data 获取 description
  if (!description) {
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    )
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1])
        if (jsonData.description) {
          description = jsonData.description.trim()
          console.log('[Background] ✅ 从 JSON-LD 获取 description')
        }
      } catch (e) {
        console.warn('[Background] 解析 JSON-LD 失败:', e)
      }
    }
  }

  // 方法 5: 从 meta keywords 提取（作为备用方案）
  if (!description) {
    const keywordsMatch =
      html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']keywords["'][^>]*>/i)
    if (keywordsMatch) {
      description = keywordsMatch[1].trim()
      console.log('[Background] ✅ 从 keywords meta 标签获取 description')
    }
  }

  // 方法 6: 从第一个段落提取（限制长度，作为最后手段）
  if (!description) {
    const pMatch = html.match(/<p[^>]*>([\s\S]{50,300}?)<\/p>/i)
    if (pMatch) {
      description = pMatch[1].replace(/<[^>]+>/g, '').trim()
      console.log('[Background] ✅ 从 <p> 标签获取 description')
    }
  }

  // 改进的 icon 提取逻辑（优先级从高到低）
  let iconUrl = ''

  // 方法 1: 从 rel="icon" link 标签获取（属性顺序兼容）
  const iconMatch =
    html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']icon["'][^>]*>/i)
  if (iconMatch) {
    iconUrl = new URL(iconMatch[1], url).href
    console.log('[Background] ✅ 从 rel="icon" 获取 icon:', iconUrl)
  }

  // 方法 2: 从 rel="shortcut icon" link 标签获取（属性顺序兼容）
  if (!iconUrl) {
    const shortcutIconMatch =
      html.match(/<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']shortcut icon["'][^>]*>/i)
    if (shortcutIconMatch) {
      iconUrl = new URL(shortcutIconMatch[1], url).href
      console.log('[Background] ✅ 从 rel="shortcut icon" 获取 icon:', iconUrl)
    }
  }

  // 方法 3: 从 rel="apple-touch-icon" link 标签获取（属性顺序兼容）
  if (!iconUrl) {
    const appleIconMatch =
      html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']apple-touch-icon["'][^>]*>/i)
    if (appleIconMatch) {
      iconUrl = new URL(appleIconMatch[1], url).href
      console.log('[Background] ✅ 从 rel="apple-touch-icon" 获取 icon:', iconUrl)
    }
  }

  // 方法 4: 从 rel="mask-icon" link 标签获取（Safari）
  if (!iconUrl) {
    const maskIconMatch =
      html.match(/<link[^>]*rel=["']mask-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']mask-icon["'][^>]*>/i)
    if (maskIconMatch) {
      iconUrl = new URL(maskIconMatch[1], url).href
      console.log('[Background] ✅ 从 rel="mask-icon" 获取 icon:', iconUrl)
    }
  }

  // 方法 5: 从 SVG 图标文件获取
  if (!iconUrl) {
    const svgIconMatch =
      html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*\.svg)["'][^>]*>/i) ||
      html.match(/<link[^>]*href=["']([^"']*\.svg)["'][^>]*rel=["']icon["'][^>]*>/i)
    if (svgIconMatch) {
      iconUrl = new URL(svgIconMatch[1], url).href
      console.log('[Background] ✅ 从 SVG 文件获取 icon:', iconUrl)
    }
  }

  // 方法 6: 回退到 /favicon.ico
  if (!iconUrl) {
    iconUrl = new URL('/favicon.ico', url).href
    console.log('[Background] ✅ 使用默认 /favicon.ico:', iconUrl)
  }

  // 获取图标数据
  const iconData = await fetchIconAsBase64(iconUrl)

  console.log('[Background] 📊 最终结果:', {
    title: title ? `${title.substring(0, 50)}...` : '(空)',
    description: description ? `${description.substring(0, 50)}...` : '(空)',
    iconUrl,
    hasIconData: !!iconData,
  })

  return {
    url,
    title,
    description,
    iconData,
  }
}

// 管理离屏文档
async function ensureOffscreenDocument() {
  // 检查是否已经存在离屏文档
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // 创建离屏文档
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_SCRAPING'],
    justification: '获取网站元数据'
  });
}

// 从离屏文档获取元数据
async function getMetadataFromNewTab(url) {
  console.log('[getMetadataFromNewTab] 开始执行，URL:', url);
  try {
    // 清理URL中的反引号
    url = url.replace(/[`]/g, '');
    console.log('[getMetadataFromNewTab] 清理后的URL:', url);

    // 确保离屏文档存在
    console.log('[getMetadataFromNewTab] 确保离屏文档存在...');
    await ensureOffscreenDocument();
    console.log('[getMetadataFromNewTab] 离屏文档准备就绪');

    // 向离屏文档发送消息
    console.log('[getMetadataFromNewTab] 向离屏文档发送获取元数据请求...');
    const response = await chrome.runtime.sendMessage({
      type: 'FETCH_METADATA',
      url
    });
    console.log('[getMetadataFromNewTab] 收到离屏文档响应:', response);

    if (response.error) {
      console.error('[getMetadataFromNewTab] 离屏文档返回错误:', response.error);
      throw new Error(response.error);
    }

    // 解析响应数据
    console.log('[getMetadataFromNewTab] 开始解析元数据...');
    console.log('[getMetadataFromNewTab] 拿到了title:', response.title);
    console.log('[getMetadataFromNewTab] 拿到了description:', response.description);
    console.log('[getMetadataFromNewTab] 拿到了iconUrl:', response.iconUrl);

    // 转换图标为base64
    console.log('[getMetadataFromNewTab] 开始获取iconData...');
    const iconData = await fetchIconAsBase64(response.iconUrl);
    console.log('[getMetadataFromNewTab] 拿到了iconData:', iconData ? 'base64 格式' : '无');

    // 准备返回数据
    const metadata = {
      url: response.url,
      title: response.title,
      description: response.description,
      iconData,
    };
    console.log('[getMetadataFromNewTab] 元数据获取完成:', metadata);

    return metadata;
  } catch (error) {
    console.error('[getMetadataFromNewTab] 从离屏文档获取元数据失败:', error);
    return null;
  }
}

// 获取图标并转换为base64
async function fetchIconAsBase64(iconUrl) {
  if (!iconUrl) {
    return ''
  }

  try {
    const response = await fetch(iconUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result || '')
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('获取图标失败:', error)
    return ''
  }
}

// 处理消息
function handleMessage(message, sender, sendResponse) {
  console.log(
    '收到消息:',
    message.type,
    message,
    '来自:',
    sender.tab?.url || sender.url || 'background',
  )

  switch (message.type) {
    case MESSAGE_TYPES.GET_CURRENT_PAGE_METADATA:
      handleGetCurrentPageMetadata(sendResponse)
      return true

    case MESSAGE_TYPES.START_PAGE_REQUEST_WEBSITE_META:
      handleStartPageRequestWebsiteMeta(message, sendResponse)
      return true

    case MESSAGE_TYPES.START_PAGE_BATCH_REQUEST_METAS:
      handleStartPageBatchRequestMetas(message, sendResponse)
      return true

    case MESSAGE_TYPES.START_PAGE_REQUEST_UNSYNCED_METAS:
      handleStartPageRequestUnsyncedMetas(sendResponse)
      return true

    case MESSAGE_TYPES.START_PAGE_SYNC_COMPLETE:
      handleStartPageSyncComplete(message, sendResponse)
      return true

    case MESSAGE_TYPES.EXTENSION_SUBMIT_WEBSITE_META:
      handleExtensionSubmitWebsiteMeta(message, sendResponse)
      return true

    default:
      console.warn('未知消息类型:', message.type)
      sendResponse({
        success: false,
        error: '未知消息类型',
      })
  }
}

// 处理起始页请求单个网站元数据
async function handleStartPageRequestWebsiteMeta(message, sendResponse) {
  try {
    let { url } = message.payload
    if (!url) {
      throw new Error('缺少URL参数')
    }

    // 清理URL中的反引号
    url = url.replace(/[`]/g, '')

    const metadata = await getMetadataFromUrl(url)
    if (metadata) {
      sendResponse({
        success: true,
        data: metadata,
      })
    } else {
      sendResponse({
        success: false,
        error: '获取元数据失败',
      })
    }
  } catch (error) {
    console.error('处理起始页请求单个网站元数据失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 处理起始页批量请求元数据
async function handleStartPageBatchRequestMetas(message, sendResponse) {
  try {
    const { urls } = message.payload
    if (!Array.isArray(urls)) {
      throw new Error('缺少URL数组参数')
    }

    const metas = []
    for (const url of urls) {
      const metadata = await getMetadataFromUrl(url)
      if (metadata) {
        metas.push(metadata)
      }
    }

    sendResponse({
      success: true,
      data: metas,
    })
  } catch (error) {
    console.error('处理起始页批量请求元数据失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 处理起始页请求未同步的元数据
async function handleStartPageRequestUnsyncedMetas(sendResponse) {
  try {
    const metas = await getMetas()
    // 现在仓库中只保存未同步的元数据，直接返回所有
    sendResponse({
      success: true,
      data: metas,
    })
  } catch (error) {
    console.error('处理起始页请求未同步的元数据失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 处理起始页同步完成
async function handleStartPageSyncComplete(message, sendResponse) {
  try {
    const { syncedWebsiteIds } = message.payload
    if (!Array.isArray(syncedWebsiteIds)) {
      throw new Error('缺少同步网站ID数组参数')
    }

    const metas = await getMetas()
    // 删除已同步的元数据
    const updatedMetas = metas.filter((meta) => !syncedWebsiteIds.includes(meta.url))

    // 保存更新后的元数据
    await saveMetas(updatedMetas)

    console.log('[Background] 起始页同步完成，已删除', syncedWebsiteIds.length, '条元数据')

    sendResponse({
      success: true,
      data: { deleted: syncedWebsiteIds.length },
    })
  } catch (error) {
    console.error('处理起始页同步完成失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 处理获取当前页面元数据
async function handleGetCurrentPageMetadata(sendResponse) {
  try {
    const metadata = await getMetadataFromCurrentTab()
    if (metadata) {
      sendResponse({
        success: true,
        data: metadata,
      })
    } else {
      sendResponse({
        success: false,
        error: '获取当前页面元数据失败',
      })
    }
  } catch (error) {
    console.error('处理获取当前页面元数据失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 检测是否有起始页实例
async function checkStartPageInstance() {
  try {
    // 查询所有标签页
    const tabs = await chrome.tabs.query({})
    console.log('[checkStartPageInstance] 找到标签页数量:', tabs.length)
    
    // 打印所有标签页的URL
    for (const tab of tabs) {
      console.log('[checkStartPageInstance] 标签页 URL:', tab.url)
    }

    // 查找起始页标签页（这里假设起始页的URL包含 localhost:5173 或其他特定标识）
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('localhost:5173') || tab.url.includes('startpage'))) {
        console.log('[checkStartPageInstance] 找到起始页标签页:', tab.url)
        return tab
      }
    }
    console.log('[checkStartPageInstance] 未找到起始页标签页')
    return null
  } catch (error) {
    console.error('检测起始页实例失败:', error)
    return null
  }
}

// 发送消息给起始页
async function sendMessageToStartPage(tab, message) {
  try {
    // 尝试向标签页发送消息（通过内容脚本）
    const response = await chrome.tabs.sendMessage(tab.id, message)
    return response
  } catch (error) {
    console.error('发送消息给起始页失败:', error)
    return null
  }
}

// 处理扩展提交网站元数据
async function handleExtensionSubmitWebsiteMeta(message, sendResponse) {
  try {
    const meta = message.payload
    if (!meta || !meta.url) {
      throw new Error('缺少元数据参数')
    }

    // 检测是否有起始页实例
    const startPageTab = await checkStartPageInstance()

    if (startPageTab) {
      console.log('找到起始页实例，尝试发送数据')
      // 发送消息给起始页
      const response = await sendMessageToStartPage(startPageTab, {
        type: 'EXTENSION_SUBMIT_WEBSITE_META',
        payload: meta,
      })

      if (response && response.success) {
        console.log('起始页添加网站成功')
        sendResponse({
          success: true,
          message: '网站已添加到起始页',
        })
      } else {
        // 检查错误信息，如果是"网站已存在"，则不保存到本地存储
        if (response && response.error === '网站已存在') {
          console.log('起始页添加网站失败：网站已存在，不保存到扩展仓库')
          sendResponse({
            success: false,
            error: '网站已存在',
          })
        } else {
          console.log('起始页添加网站失败，保存到扩展仓库')
          // 保存到存储
          const metas = await getMetas()
          // 检查是否已存在
          const existingIndex = metas.findIndex((m) => m.url === meta.url)
          if (existingIndex !== -1) {
            // 更新现有数据
            metas[existingIndex] = { ...meta }
          } else {
            // 添加新数据
            metas.push({ ...meta })
          }

          const saved = await saveMetas(metas)
          if (saved) {
            sendResponse({
              success: true,
              message: '元数据保存到扩展仓库',
            })
          } else {
            sendResponse({
              success: false,
              error: '元数据保存失败',
            })
          }
        }
      }
    } else {
      console.log('未找到起始页实例，保存到扩展仓库')
      // 保存到存储
      const metas = await getMetas()
      // 检查是否已存在
      const existingIndex = metas.findIndex((m) => m.url === meta.url)
      if (existingIndex !== -1) {
        // 更新现有数据
        metas[existingIndex] = { ...meta }
      } else {
        // 添加新数据
        metas.push({ ...meta })
      }

      const saved = await saveMetas(metas)
      if (saved) {
        sendResponse({
          success: true,
          message: '元数据保存到扩展仓库',
        })
      } else {
        sendResponse({
          success: false,
          error: '元数据保存失败',
        })
      }
    }
  } catch (error) {
    console.error('处理扩展提交网站元数据失败:', error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// 处理命令
function handleCommand(command) {
  console.log('收到命令:', command)

  if (command === 'open-panel') {
    // 打开弹出面板
    chrome.action.openPopup()
  }
}

// 初始化
async function init() {
  await initStorage()
  // 监听消息
  chrome.runtime.onMessage.addListener(handleMessage)
  // 监听命令（键盘快捷键）
  chrome.commands.onCommand.addListener(handleCommand)
  console.log('扩展后台脚本初始化完成')
}

// 启动初始化
init()
