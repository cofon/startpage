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

// 监听来自 background.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content Script] 收到消息:', message.action)
  
  // 处理添加网站请求
  if (message.action === 'ADD_WEBSITE') {
    callStartPageAPI('addWebsite', message.data)
      .then(id => {
      console.log('[Content Script] 添加成功，ID:', id)
        sendResponse({ success: true, id })
      })
      .catch(error => {
      console.error('[Content Script] 添加失败:', error)
        sendResponse({ 
          success: false, 
          error: error.message || '添加网站失败' 
        })
      })
    
    // 返回 true 表示异步响应
    return true
  }
  
  // 处理导入数据请求
  if (message.action === 'IMPORT_WEBSITES') {
    callStartPageAPI('importWebsites', message.data)
      .then(result => {
      console.log('[Content Script] 导入完成:', result)
        sendResponse({ success: true, ...result })
      })
      .catch(error => {
      console.error('[Content Script] 导入失败:', error)
        sendResponse({ 
          success: false, 
          error: error.message || '导入数据失败' 
        })
      })
    
    return true
  }
})
