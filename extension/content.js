/* global chrome */


// content.js - Content Script（消息中转站）
// 注入到起始页，负责转发插件消息到起始页的全局 API

// ========== 防止重复执行 ==========
if (window.contentScriptLoaded) {
  console.log('[Content Script] 已加载过，跳过')
} else {
  window.contentScriptLoaded = true
  console.log('[Content Script] StartPage Content Script 已加载')
}

// ========== 方法：通过 CustomEvent 与页面通信 ==========
function callStartPageAPI(action, data) {
  return new Promise((resolve, reject) => {
    // 创建一个自定义事件
  const event = new CustomEvent('StartPageAPI-Call', {
      detail: {
        action: action,
        data: data,
        requestId: Date.now() + '-' + Math.random()
      }
    })

    // 监听响应事件
  const responseHandler = (e) => {
   if (e.detail.requestId === event.detail.requestId) {
     console.log('[Content Script] 收到页面响应:', e.detail)

        // 移除监听器
        document.removeEventListener('StartPageAPI-Response', responseHandler)

     if (e.detail.success) {
          resolve(e.detail.result)
        } else {
          reject(new Error(e.detail.error || '操作失败'))
        }
      }
    }

    // 添加响应监听器
    document.addEventListener('StartPageAPI-Response', responseHandler)

    // 分派事件到页面上下文
  console.log('[Content Script] 发送事件到页面:', event.detail)
    document.dispatchEvent(event)
  })
}

// ========== 消息监听器管理 ==========
// 使用一个标志来防止重复处理同一消息
let isProcessingMessage = false
let messageCounter = 0

console.log('[Content Script] 准备注册消息监听器')
if (window.csListenerRegistered) {
  console.warn('[Content Script] ⚠️ 消息监听器已注册过！')
} else {
  window.csListenerRegistered = true
  console.log('[Content Script] 首次注册消息监听器')
}

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const currentMsgId = ++messageCounter
  console.log(`[Content Script] ====== 收到消息 #${currentMsgId} ======`)
  console.log('[Content Script] Action:', message.action)
  console.log('[Content Script] sender:', sender)
  console.log('[Content Script] 当前 isProcessingMessage:', isProcessingMessage)
  
  // 防止重复处理
  if (isProcessingMessage) {
  console.log(`[Content Script] ⚠️ 正在处理其他消息 (#${currentMsgId})，忽略`)
    return false
  }
  
  try {
    isProcessingMessage = true
    
    // 处理添加网站请求
  if (message.action === 'ADD_WEBSITE') {
  console.log(`[Content Script] #${currentMsgId} 🎯 开始处理 ADD_WEBSITE`)
  console.log('[Content Script] 数据:', message.data)
      callStartPageAPI('addWebsite', message.data)
        .then(id => {
   console.log(`[Content Script] #${currentMsgId} ✅ 添加成功，ID:`, id)
          sendResponse({ success: true, id })
        })
        .catch(error => {
   console.error(`[Content Script] #${currentMsgId} ❌ 添加失败:`, error)
          sendResponse({ 
            success: false, 
            error: error.message || '添加网站失败' 
          })
        })
        .finally(() => {
     console.log(`[Content Script] #${currentMsgId} 🔓 处理完成，释放锁`)
          isProcessingMessage = false
        })
      
      // 返回 true 表示异步响应
   console.log('[Content Script] 返回 true，表示异步响应')
      return true
    }
    
    // 处理导入数据请求
  if (message.action === 'IMPORT_WEBSITES') {
  console.log(`[Content Script] #${currentMsgId} 处理 IMPORT_WEBSITES`)
      callStartPageAPI('importWebsites', message.data)
        .then(result => {
   console.log(`[Content Script] #${currentMsgId} 导入完成:`, result)
          sendResponse({ success: true, ...result })
        })
        .catch(error => {
   console.error(`[Content Script] #${currentMsgId} 导入失败:`, error)
          sendResponse({ 
            success: false, 
            error: error.message || '导入数据失败' 
          })
        })
        .finally(() => {
     console.log(`[Content Script] #${currentMsgId} 🔓 处理完成，释放锁`)
          isProcessingMessage = false
        })
      
   console.log('[Content Script] 返回 true，表示异步响应')
      return true
    }

    // 处理导出数据请求
  if (message.action === 'EXPORT_WEBSITES') {
  console.log(`[Content Script] #${currentMsgId} 处理 EXPORT_WEBSITES`)
      callStartPageAPI('exportWebsites')
        .then(result => {
   console.log(`[Content Script] #${currentMsgId} 导出完成:`, result)
          sendResponse({ success: true, ...result })
        })
        .catch(error => {
   console.error(`[Content Script] #${currentMsgId} 导出失败:`, error)
          sendResponse({
            success: false,
            error: error.message || '导出数据失败'
          })
        })
        .finally(() => {
     console.log(`[Content Script] #${currentMsgId} 🔓 处理完成，释放锁`)
          isProcessingMessage = false
        })

   console.log('[Content Script] 返回 true，表示异步响应')
      return true
    }
  } catch (error) {
  console.error(`[Content Script] #${currentMsgId} ❌ 处理消息异常:`, error)
    isProcessingMessage = false
    sendResponse({ 
      success: false, 
      error: error.message || '处理消息失败' 
    })
    return true
  }
  
  // 非处理的消息，返回 false
  console.log('[Content Script] 非处理的消息，返回 false')
  return false
})
