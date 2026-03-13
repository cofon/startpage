/* global chrome */

// content.js - Content Script（消息中转站）
// 注入到起始页，负责转发插件消息到起始页的全局 API

// ========== 防止重复执行 ==========
if (window.contentScriptLoaded) {
  console.log('[Content Script] 已加载过，重新注册消息监听器')
  // 重新注册消息监听器
  window.csListenerRegistered = false
} else {
  window.contentScriptLoaded = true
  console.log('[Content Script] StartPage Content Script 已加载')
}

// 统一日志前缀
const LOG_PREFIX = '[Content Script]'

// 日志工具函数
function log(message, data) {
  console.log(`${LOG_PREFIX} ${message}`, data)
}

function logError(message, error) {
  console.error(`${LOG_PREFIX} ${message}`, error)
}

function logWarn(message, data) {
  console.warn(`${LOG_PREFIX} ${message}`, data)
}

// ========== 方法：通过 CustomEvent 与页面通信 ==========
function callStartPageAPI(action, data, method = null, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now() + '-' + Math.random()

    // 创建超时定时器
    const timeoutId = setTimeout(() => {
      document.removeEventListener('StartPageAPI-Response', responseHandler)
      logError(`请求超时 (requestId: ${requestId})`, { action, method })
      reject(new Error('请求超时，请重试'))
    }, timeout)

    // 创建一个自定义事件
    const event = new CustomEvent('StartPageAPI-Call', {
      detail: {
        action: action,
        method: method,
        data: data,
        requestId: requestId,
      },
    })

    // 监听响应事件
    const responseHandler = (e) => {
      if (e.detail.requestId === requestId) {
        clearTimeout(timeoutId)
        document.removeEventListener('StartPageAPI-Response', responseHandler)
        log('收到页面响应:', e.detail)

        if (e.detail.success !== undefined) {
          // 新的响应格式（带 success 字段）
          if (e.detail.success) {
            resolve(e.detail.result)
          } else {
            reject(new Error(e.detail.error || '操作失败'))
          }
        } else {
          // 旧的响应格式（直接返回 result）
          resolve(e.detail.result)
        }
      }
    }

    // 添加响应监听器
    document.addEventListener('StartPageAPI-Response', responseHandler)

    // 分派事件到页面上下文
    log('发送事件到页面:', event.detail)
    document.dispatchEvent(event)
  })
}

// ========== 消息监听器管理 ==========
// 使用 Map 管理并发请求，每个请求有独立的 requestId
const pendingRequests = new Map()
let messageCounter = 0

log('准备注册消息监听器')
if (window.csListenerRegistered) {
  logWarn('⚠️ 消息监听器已注册过！')
} else {
  window.csListenerRegistered = true
  log('首次注册消息监听器')
}

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const requestId = message.requestId || `msg-${Date.now()}-${++messageCounter}`

  // 检查是否已存在相同 requestId 的请求
  if (pendingRequests.has(requestId)) {
    logWarn(`请求正在处理中，忽略重复请求: ${requestId}`)
    return false
  }

  // 标记请求为处理中
  pendingRequests.set(requestId, true)

  log(`====== 收到消息 #${messageCounter} ======`, { 
    action: message.action, 
    requestId,
    sender: sender.id 
  })

  try {
    // 处理添加网站请求
    if (message.action === 'ADD_WEBSITE') {
      log(`🎯 开始处理 ADD_WEBSITE`, { requestId, data: message.data })
      callStartPageAPI('addWebsite', message.data)
        .then((id) => {
          log(`✅ 添加成功`, { requestId, id })
          sendResponse({ success: true, id })
        })
        .catch((error) => {
          logError(`❌ 添加失败`, { requestId, error: error.message })
          sendResponse({
            success: false,
            error: error.message || '添加网站失败',
          })
        })
        .finally(() => {
          pendingRequests.delete(requestId)
          log(`🔓 处理完成`, { requestId })
        })

      return true
    }

    // 处理导入数据请求
    if (message.action === 'IMPORT_WEBSITES') {
      log(`处理 IMPORT_WEBSITES`, { requestId })
      callStartPageAPI('importWebsites', message.data)
        .then((result) => {
          log(`导入完成`, { requestId, result })
          sendResponse({ success: true, ...result })
        })
        .catch((error) => {
          logError(`导入失败`, { requestId, error: error.message })
          sendResponse({
            success: false,
            error: error.message || '导入数据失败',
          })
        })
        .finally(() => {
          pendingRequests.delete(requestId)
          log(`🔓 处理完成`, { requestId })
        })

      return true
    }

    // 处理导出数据请求
    if (message.action === 'EXPORT_WEBSITES') {
      log(`处理 EXPORT_WEBSITES`, { requestId })
      callStartPageAPI('exportWebsites')
        .then((result) => {
          log(`导出完成`, { requestId, result })
          sendResponse({ success: true, ...result })
        })
        .catch((error) => {
          logError(`导出失败`, { requestId, error: error.message })
          sendResponse({
            success: false,
            error: error.message || '导出数据失败',
          })
        })
        .finally(() => {
          pendingRequests.delete(requestId)
          log(`🔓 处理完成`, { requestId })
        })

      return true
    }

    // 处理通用 API 调用
    if (message.action === 'CALL_STARTPAGE_API') {
      // Method 白名单验证
      const ALLOWED_METHODS = new Set([
        'normalizeWebsite',
        'checkUrlExists',
        'validateWebsite',
        'generateDefaultIcon'
      ])

      if (!message.method) {
        logError(`❌ 缺少 method 参数`, { requestId })
        sendResponse({
          success: false,
          error: '缺少 method 参数'
        })
        pendingRequests.delete(requestId)
        return true
      }

      if (!ALLOWED_METHODS.has(message.method)) {
        logError(`❌ 不支持的 method`, { requestId, method: message.method })
        sendResponse({
          success: false,
          error: `不支持的 method: ${message.method}`
        })
        pendingRequests.delete(requestId)
        return true
      }

      log(`🎯 处理 CALL_STARTPAGE_API`, { requestId, method: message.method })

      callStartPageAPI(null, message.data, message.method)
        .then((result) => {
          log(`✅ API 调用成功`, { requestId })
          sendResponse({ success: true, result })
        })
        .catch((error) => {
          logError(`❌ API 调用失败`, { requestId, error: error.message })
          sendResponse({
            success: false,
            error: error.message || 'API 调用失败',
          })
        })
        .finally(() => {
          pendingRequests.delete(requestId)
          log(`🔓 处理完成`, { requestId })
        })

      return true
    }
  } catch (error) {
    logError(`❌ 处理消息异常`, { requestId, error: error.message })
    pendingRequests.delete(requestId)
    sendResponse({
      success: false,
      error: error.message || '处理消息失败',
    })
    return true
  }

  // 非处理的消息，返回 false
  log('非处理的消息，返回 false')
  return false
})
