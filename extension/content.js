/* global chrome */

// 扩展内容脚本

console.log('[Content Script] StartPage Content Script 已加载');
console.log('[Content Script] 当前页面 URL:', window.location.href);
console.log('[Content Script] document.readyState:', document.readyState);

// 标记扩展已安装
window.StartPageExtension = true;

// 消息去重，避免无限循环
const processedMessages = new Set();

// 生成消息唯一标识
function generateMessageId(message) {
  if (message.type === 'EXTENSION_SUBMIT_WEBSITE_META' && message.payload && message.payload.url) {
    // 为每个 EXTENSION_SUBMIT_WEBSITE_META 消息生成唯一的 ID，包含时间戳
    // 这样即使是同一个网站，每个消息都会被正确处理
    return `${message.type}_${message.payload.url}_${Date.now()}_${Math.random()}`;
  }
  return `${message.type}_${JSON.stringify(message.payload || {})}`;
}

// 监听来自起始页的消息
window.addEventListener('StartPageAPI-Call', (event) => {
  const { type, payload, requestId } = event.detail;

  // 忽略来自扩展后台的消息，只处理来自起始页的消息
  // 这样可以避免无限循环
  if (type === 'EXTENSION_SUBMIT_WEBSITE_META') {
    console.log('[Content Script] 忽略来自扩展后台的 EXTENSION_SUBMIT_WEBSITE_META 消息');
    return;
  }

  // 生成消息ID
  const messageId = generateMessageId({ type, payload });

  // 检查是否已经处理过
  if (processedMessages.has(messageId)) {
    console.log('[Content Script] 忽略重复消息:', type);
    return;
  }

  // 标记为已处理
  processedMessages.add(messageId);

  console.log('[Content Script] 收到起始页消息:', type, event.detail);

  // 发送消息到后台脚本
  try {
    chrome.runtime.sendMessage(
      { type, payload },
      (response) => {
        // 检查是否有错误
        if (chrome.runtime.lastError) {
          console.error('[Content Script] 发送消息到扩展失败:', chrome.runtime.lastError.message);

          // 发送错误响应回起始页
          const responseEvent = new CustomEvent('StartPageAPI-Response', {
            detail: {
              success: false,
              error: chrome.runtime.lastError.message,
              requestId
            }
          });
          window.dispatchEvent(responseEvent);
          return;
        }

        console.log('[Content Script] 扩展响应:', response);

        // 发送响应回起始页
        const responseEvent = new CustomEvent('StartPageAPI-Response', {
          detail: {
            ...response,
            requestId
          }
        });
        window.dispatchEvent(responseEvent);
      }
    );
  } catch (error) {
    console.error('[Content Script] 发送消息到扩展异常:', error.message);

    // 发送错误响应回起始页
    const responseEvent = new CustomEvent('StartPageAPI-Response', {
      detail: {
        success: false,
        error: error.message,
        requestId
      }
    });
    window.dispatchEvent(responseEvent);
  }
});

// 监听来自扩展后台的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('[Content Script] 收到扩展后台消息:', message.type, message);

    // 生成消息ID
    const messageId = generateMessageId(message);

    // 检查是否已经处理过
    if (processedMessages.has(messageId)) {
      console.log('[Content Script] 忽略重复消息:', message.type);
      sendResponse({
        success: false,
        error: '消息已处理'
      });
      return;
    }

    // 标记为已处理
    processedMessages.add(messageId);

    // 处理扩展提交网站元数据
    if (message.type === 'EXTENSION_SUBMIT_WEBSITE_META') {
      console.log('[Content Script] 处理 EXTENSION_SUBMIT_WEBSITE_META 消息');
      
      // 检查起始页是否存在
      if (window.StartPageExtension) {
        console.log('[Content Script] 起始页扩展标记存在');
      } else {
        console.log('[Content Script] 起始页扩展标记不存在');
      }
      
      // 发送消息给起始页
      const requestId = Date.now() + '-' + Math.random();
      const event = new CustomEvent('StartPageAPI-Call', {
        detail: {
          type: 'EXTENSION_SUBMIT_WEBSITE_META',
          payload: message.payload,
          requestId: requestId
        }
      });

      console.log('[Content Script] 发送消息给起始页:', event.detail);

      // 监听响应
      const handleResponse = (responseEvent) => {
        if (responseEvent.detail && responseEvent.detail.requestId === requestId) {
          console.log('[Content Script] 收到起始页响应:', responseEvent.detail);
          window.removeEventListener('StartPageAPI-Response', handleResponse);
          sendResponse(responseEvent.detail);
        }
      };

      window.addEventListener('StartPageAPI-Response', handleResponse);
      window.dispatchEvent(event);

      // 表示异步响应
      return true;
    }

    // 处理其他消息类型
    sendResponse({
      success: false,
      error: '未知消息类型'
    });
  } catch (error) {
    console.error('[Content Script] 处理扩展后台消息异常:', error.message);
    sendResponse({
      success: false,
      error: error.message
    });
  }
});

console.log('[Content Script] 注册消息监听器');


