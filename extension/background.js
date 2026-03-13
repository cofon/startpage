/* global chrome */

// IndexedDB 数据库配置
const DB_NAME = 'StartPageDB'
const DB_VERSION = 7
const STORE_WEBSITES = 'websites'

// 初始化数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('无法打开数据库'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      const oldVersion = event.oldVersion || 0

      // 创建 websites 表
      if (!db.objectStoreNames.contains(STORE_WEBSITES)) {
        const websiteStore = db.createObjectStore(STORE_WEBSITES, {
          keyPath: 'id',
          autoIncrement: true,
        })

        // 创建索引
        websiteStore.createIndex('isMarked', 'isMarked', { unique: false })
        websiteStore.createIndex('markOrder', 'markOrder', { unique: false })
        websiteStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        websiteStore.createIndex('isActive', 'isActive', { unique: false })
        websiteStore.createIndex('isHidden', 'isHidden', { unique: false })
        websiteStore.createIndex('url', 'url', { unique: false })
        websiteStore.createIndex('title', 'title', { unique: false })
      }

      // 版本升级处理（如果需要）
      if (oldVersion < 6) {
        const transaction = event.target.transaction
        const websiteStore = transaction.objectStore(STORE_WEBSITES)
        if (!websiteStore.indexNames.contains('title')) {
          websiteStore.createIndex('title', 'title', { unique: false })
        }
      }
    }
  })
}

// 添加单个网站
async function addWebsite(websiteData) {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WEBSITES], 'readwrite')
      const store = transaction.objectStore(STORE_WEBSITES)

      // 清理数据
      const cleanData = { ...websiteData }
      delete cleanData.id // 让 IndexedDB 自动生成

      // 删除已废弃的字段
      delete cleanData.iconUrl
      delete cleanData.iconCanFetch
      delete cleanData.iconFetchAttempts
      delete cleanData.iconLastFetchTime

      const request = store.add(cleanData)

      request.onsuccess = () => {
        resolve({
          success: true,
          id: request.result,
        })
      }

      request.onerror = () => {
        reject(new Error('添加失败：' + request.error.message))
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// 批量导入网站
async function importWebsites(websites) {
  try {
    console.log('[Background] 📥 开始导入网站，数量:', websites.length)

    // 转发到起始页，调用 window.StartPageAPI.importWebsites
    const response = await forwardToStartPage({
      action: 'IMPORT_WEBSITES',
      data: websites,
    })

    if (response.success) {
      console.log('[Background] ✅ 导入成功:', response)
    } else {
      console.error('[Background] ❌ 导入失败:', response.error)
    }

    return response
  } catch (error) {
    console.error('[Background] 导入失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// 导出所有网站
async function exportWebsites() {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WEBSITES], 'readonly')
      const store = transaction.objectStore(STORE_WEBSITES)

      const request = store.getAll()

      request.onsuccess = () => {
        resolve({
          success: true,
          data: {
            websites: request.result,
          },
          count: request.result.length,
        })
      }

      request.onerror = () => {
        reject(new Error('导出失败：' + request.error.message))
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// 获取所有网站
async function getAllWebsites() {
  try {
    const db = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WEBSITES], 'readonly')
      const store = transaction.objectStore(STORE_WEBSITES)

      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(new Error('查询失败：' + request.error.message))
      }
    })
  } catch (error) {
    console.error('[Background] 查询所有网站失败:', error)
    return []
  }
}

// ========== 统一消息处理器 ==========
let bgMessageCounter = 0
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const currentMsgId = ++bgMessageCounter
  console.log(`[Background] ====== 收到消息 #${currentMsgId} ======`)
  console.log('[Background] Action:', message.action)
  console.log('[Background] fromCurrentTab:', message.fromCurrentTab)
  console.log('[Background] url:', message.url)
  console.log('[Background] sender:', sender)

  const handleAsync = async () => {
    switch (message.action) {
      case 'addWebsite':
        console.log(`[Background] #${currentMsgId} 处理 addWebsite`)
        return await addWebsite(message.data)

      case 'importWebsites':
        console.log(`[Background] #${currentMsgId} 处理 importWebsites`)
        return await importWebsites(message.data)

      case 'exportWebsites':
        console.log(`[Background] #${currentMsgId} 处理 exportWebsites`)
        return await exportWebsites()

      // ========== 转发给起始页的消息 ==========
      case 'ADD_WEBSITE':
        console.log(`[Background] #${currentMsgId} ⚡ 转发 ADD_WEBSITE 到起始页`)
        console.log('[Background] 数据:', message.data)
        // 转发到起始页的 content.js
        return await forwardToStartPage(message)

      case 'EXPORT_WEBSITES':
        console.log(`[Background] #${currentMsgId} ⚡ 转发 EXPORT_WEBSITES 到起始页`)
        // 转发到起始页的 content.js
        return await forwardToStartPage(message)

      case 'IMPORT_WEBSITES':
        console.log(`[Background] #${currentMsgId} 📥 转发 IMPORT_WEBSITES 到起始页`)
        console.log('[Background] 导入数据:', message.data?.length, '个网站')
        // 转发到起始页的 content.js
        return await forwardToStartPage(message)

      // ========== 调用 StartPageAPI 通用方法 ==========
      case 'CALL_STARTPAGE_API':
        console.log(
          `[Background] #${currentMsgId} ⚡ 处理 CALL_STARTPAGE_API (method: ${message.method})`,
        )

        // Method 白名单验证
        const ALLOWED_METHODS = new Set([
          'normalizeWebsite',
          'checkUrlExists',
          'validateWebsite',
          'generateDefaultIcon'
        ])

        if (!message.method) {
          console.error('[Background] ❌ 缺少 method 参数')
          return {
            success: false,
            error: '缺少 method 参数'
          }
        }

        if (!ALLOWED_METHODS.has(message.method)) {
          console.error('[Background] ❌ 不支持的 method:', message.method)
          return {
            success: false,
            error: `不支持的 method: ${message.method}`
          }
        }

        // Method 日志前缀映射
        const METHOD_LOG_PREFIX = {
          normalizeWebsite: '🎨',
          checkUrlExists: '🔍',
          validateWebsite: '✅',
          generateDefaultIcon: '🎨'
        }

        try {
          const method = message.method
          const logPrefix = METHOD_LOG_PREFIX[method] || '⚡'

          console.log(
            `[Background] ${logPrefix} 收到 ${method} 请求，准备转发到起始页:`,
            message.data,
          )

          const response = await forwardToStartPage({
            action: 'CALL_STARTPAGE_API',
            method: method,
            data: message.data,
          })

          console.log(`[Background] 收到起始页返回的 ${method} 结果:`, response)
          return response
        } catch (error) {
          console.error(`[Background] #${currentMsgId} 处理 ${message.method} 失败:`, error)
          return {
            success: false,
            error: error.message || 'API 调用失败',
          }
        }

      // ========== 获取元数据 ==========
      case 'FETCH_METADATA': {
        console.log('[Background] 开始处理 FETCH_METADATA 请求')

        if (message.fromCurrentTab) {
          console.log('[Background] 从当前标签页获取元数据')
          return await fetchMetadataFromCurrentTab()
        } else if (message.url) {
          console.log('[Background] 从 URL 获取元数据:', message.url)
          return await fetchMetadataFromURL(message.url)
        }
        console.log('[Background] 无效的请求参数')
        return null
      }

      // ========== 获取图标 ==========
      case 'FETCH_ICON': {
        return await fetchIconAsBase64(message.url)
      }

      default:
        console.log(`[Background] #${currentMsgId} 未知操作：`, message.action)
        return {
          success: false,
          error: '未知操作：' + message.action,
        }
    }
  }

  handleAsync()
    .then((result) => {
      console.log(
        `[Background] #${currentMsgId} ✅ 发送响应:`,
        message.action,
        result ? '有数据' : 'null',
      )
      sendResponse(result)
    })
    .catch((err) => {
      console.error(`[Background] #${currentMsgId} ❌ 处理消息出错:`, err)
      sendResponse({
        success: false,
        error: err.message || '处理失败',
      })
    })

  // 返回 true 表示异步响应
  console.log('[Background] 返回 true，表示异步响应')
  return true
})

// ========== 转发消息到起始页 ==========
async function forwardToStartPage(message) {
  try {
    console.log('[Background] 转发消息到起始页:', message.action, 'method:', message.method)

    // 查找起始页的标签页
    const tabs = await chrome.tabs.query({
      url: [
        'http://localhost/*',
        'http://localhost:*/*',
        'file:///*/startpage/dist/index.html',
        'file:///*/startpage/dist*/index.html',
      ],
    })

    if (tabs.length === 0) {
      console.error('[Background] 未找到起始页标签页')
      return {
        success: false,
        error: '起始页未打开，请先打开起始页后再试',
      }
    }

    // 使用第一个匹配的标签页
    const targetTab = tabs[0]
    console.log('[Background] 找到起始页标签页 ID:', targetTab.id)
    console.log('[Background] 标签页状态:', targetTab.status)

    // 检查标签页状态
    if (targetTab.status !== 'complete') {
      console.warn('[Background] 起始页标签页尚未完全加载，状态:', targetTab.status)
      return {
        success: false,
        error: '起始页正在加载中，请稍后再试',
      }
    }

    // 构建要发送的消息
    const payload = {
      action: message.action || 'StartPageAPI-Call',
      method: message.method,
      data: message.data,
      requestId: Date.now(),
    }

    console.log('[Background] 发送 payload:', payload)

    // 发送到 content.js，添加重试和重新注入机制
    return new Promise((resolve) => {
      const maxRetries = 3
      let retryCount = 0

      async function sendMessage() {
        chrome.tabs.sendMessage(targetTab.id, payload, async (response) => {
          if (chrome.runtime.lastError) {
            retryCount++

            // 如果是第一次失败，尝试重新注入 content.js
            if (retryCount === 1) {
              console.warn('[Background] 发送消息失败，尝试重新注入 content.js...')
              try {
                await chrome.scripting.executeScript({
                  target: { tabId: targetTab.id },
                  files: ['content.js']
                })
                console.log('[Background] content.js 重新注入成功')
              } catch (error) {
                console.error('[Background] content.js 重新注入失败:', error)
              }
            }

            if (retryCount < maxRetries) {
              console.warn(`[Background] 发送消息失败，第 ${retryCount} 次重试...`)
              setTimeout(sendMessage, 300)
            } else {
              console.error(
                '[Background] 发送消息失败，已达最大重试次数:',
                chrome.runtime.lastError.message,
              )
              resolve({
                success: false,
                error: '无法连接到起始页，请刷新起始页后重试',
              })
            }
          } else {
            console.log('[Background] 收到起始页响应:', response)
            resolve(response)
          }
        })
      }

      sendMessage()
    })
  } catch (error) {
    console.error('[Background] 转发消息异常:', error)
    return {
      success: false,
      error: error.message || '转发消息失败',
    }
  }
}

// ========== 新增：获取网页元数据（当前页面） ==========
/**
 * 从当前激活的标签页获取元数据（title/description/icon）
 */
async function fetchMetadataFromCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab) {
      throw new Error('未找到当前标签页')
    }

    // 注入脚本获取详细信息
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 在页面上下文中执行
        const iconLink =
          document.querySelector('link[rel="icon"]') ||
          document.querySelector('link[rel="shortcut icon"]')

        let iconUrl = ''
        if (iconLink && iconLink.href) {
          iconUrl = new URL(iconLink.href, location.href).href
        }

        return {
          title: document.title,
          url: location.href,
          description: document.querySelector('meta[name="description"]')?.content || '',
          iconUrl,
        }
      },
    })

    const metadata = results[0].result

    // 获取图标数据（转为 base64）
    let iconData = null
    if (metadata.iconUrl) {
      iconData = await fetchIconAsBase64(metadata.iconUrl)
    }

    return {
      ...metadata,
      iconData,
    }
  } catch (error) {
    console.error('[Background] 获取元数据失败:', error)
    return null
  }
}

// ========== 从 URL 获取网页元数据 ==========
/**
 * 通过 fetch 获取目标页面的 title/description/icon（Service Worker 环境）
 * 注意：Service Worker 没有 DOMParser，需要使用正则或注入脚本到页面解析
 */
async function fetchMetadataFromURL(url) {
  try {
    console.log('[Background] 从 URL 获取元数据:', url)

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

    const html = await response.text()
    console.log('[Background] HTML 长度:', html.length)

    // ========== 改进的 title 提取逻辑 ==========
    let title = ''

    // 方法 1: 从 <title> 标签获取（支持属性和换行）
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
      console.log('[Background] 从 <title> 标签获取 title:', title)
    }

    // 方法 2: 如果 title 为空，从 og:title meta 标签获取
    if (!title) {
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                           html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i)
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim()
        console.log('[Background] 从 og:title 获取 title:', title)
      }
    }

    // 方法 3: 如果 title 仍为空，从 twitter:title meta 标签获取
    if (!title) {
      const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                                html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:title["'][^>]*>/i)
      if (twitterTitleMatch) {
        title = twitterTitleMatch[1].trim()
        console.log('[Background] 从 twitter:title 获取 title:', title)
      }
    }

    // 方法 4: 如果 title 仍为空，从 URL 提取
    if (!title) {
      try {
        const urlObj = new URL(url)
        title = urlObj.hostname.replace('www.', '')
        console.log('[Background] 从 URL 提取 title:', title)
      } catch (e) {
        console.warn('[Background] 从 URL 提取 title 失败:', e)
      }
    }

    // ========== 改进的 description 提取逻辑 ==========
    let description = ''

    // 方法 1: 从 name="description" meta 标签获取
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)
    if (descMatch) {
      description = descMatch[1].trim()
      console.log('[Background] 从 description meta 标签获取 description')
    }

    // 方法 2: 如果 description 为空，从 og:description meta 标签获取
    if (!description) {
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i)
      if (ogDescMatch) {
        description = ogDescMatch[1].trim()
        console.log('[Background] 从 og:description 获取 description')
      }
    }

    // 方法 3: 如果 description 仍为空，从 twitter:description meta 标签获取
    if (!description) {
      const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                               html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:description["'][^>]*>/i)
      if (twitterDescMatch) {
        description = twitterDescMatch[1].trim()
        console.log('[Background] 从 twitter:description 获取 description')
      }
    }

    // ========== 改进的 icon 提取逻辑 ==========
    let iconUrl = ''

    // 方法 1: 从 rel="icon" link 标签获取
    const iconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']icon["'][^>]*>/i)
    if (iconMatch) {
      iconUrl = new URL(iconMatch[1], url).href
      console.log('[Background] 从 rel="icon" 获取 icon:', iconUrl)
    }

    // 方法 2: 如果 iconUrl 为空，从 rel="shortcut icon" link 标签获取
    if (!iconUrl) {
      const shortcutIconMatch = html.match(/<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                                html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']shortcut icon["'][^>]*>/i)
      if (shortcutIconMatch) {
        iconUrl = new URL(shortcutIconMatch[1], url).href
        console.log('[Background] 从 rel="shortcut icon" 获取 icon:', iconUrl)
      }
    }

    // 方法 3: 如果 iconUrl 仍为空，从 rel="apple-touch-icon" link 标签获取
    if (!iconUrl) {
      const appleIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                             html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']apple-touch-icon["'][^>]*>/i)
      if (appleIconMatch) {
        iconUrl = new URL(appleIconMatch[1], url).href
        console.log('[Background] 从 rel="apple-touch-icon" 获取 icon:', iconUrl)
      }
    }

    // 方法 4: 如果 iconUrl 仍为空，回退到 /favicon.ico
    if (!iconUrl) {
      iconUrl = new URL('/favicon.ico', url).href
      console.log('[Background] 使用默认 /favicon.ico:', iconUrl)
    }

    // 获取图标数据
    const iconData = await fetchIconAsBase64(iconUrl)

    console.log('[Background] 最终结果:', { title, description, iconUrl, hasIconData: !!iconData })

    return {
      title,
      description,
      iconUrl,
      iconData,
    }
  } catch (error) {
    console.error(`[Background] 获取元数据失败 (${url}):`, error)
    return null
  }
}

// ========== 新增：获取图标并转为 base64 ==========
/**
 * 将图标图片转换为 base64 格式（包含 data:image 前缀）
 */
async function fetchIconAsBase64(iconUrl) {
  try {
    const response = await fetch(iconUrl)
    const blob = await response.blob()

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error(`[Background] 获取图标失败 (${iconUrl}):`, error)
    return null
  }
}

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('StartPage 插件已安装')
  openDatabase()
    .then(() => {
      console.log('数据库初始化完成')
    })
    .catch((err) => {
      console.error('数据库初始化失败:', err)
    })
})

// ========== 新增：工具函数（避免使用 import） ==========


/**
 * 从 URL 提取网站名称
 * @param {string} url - URL
 * @returns {string} 网站名称
 */
function extractSiteNameFromUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'http://' + url)
    const hostname = urlObj.hostname

    // 移除 www. 前缀
    const name = hostname.replace(/^www\./i, '')

    // 移除端口号
    const withoutPort = name.split(':')[0]

    // 移除根域名之前的部分（如 news.cn → cn，但保留主要部分）
    const parts = withoutPort.split('.')
    if (parts.length > 2) {
      // 取第一个子域名作为名称（如 news.baidu.com → news）
      return parts[0].toUpperCase()
    } else {
      // 如果是根域名（如 baidu.com），返回大写
      return withoutPort.toUpperCase()
    }
  } catch (_e) {
    return 'Unknown'
  }
}

/**
 * 标准化网站数据
 * @param {Object} data - 原始网站数据
 * @returns {Object} 标准化的网站对象
 */
function normalizeWebsiteData(data) {
  const normalized = { ...data }

  // 确保 URL 有协议前缀
  if (!normalized.url.startsWith('http://') && !normalized.url.startsWith('https://')) {
    normalized.url = 'https://' + normalized.url
  }

  // 如果名称为空，从 URL 提取
  if (!normalized.name || normalized.name.trim() === '') {
    normalized.name = extractSiteNameFromUrl(normalized.url)
  }

  // 确保 tags 是数组
  if (typeof normalized.tags === 'string') {
    normalized.tags = normalized.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)
  } else if (!Array.isArray(normalized.tags)) {
    normalized.tags = []
  }

  // 设置默认值
  normalized.isMarked = normalized.isMarked ?? false
  normalized.isActive = normalized.isActive ?? true
  normalized.isHidden = normalized.isHidden ?? false

  // 删除可能存在的废弃字段
  delete normalized.iconUrl
  delete normalized.iconCanFetch
  delete normalized.iconFetchAttempts
  delete normalized.iconLastFetchTime

  return normalized
}
