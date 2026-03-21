// 扩展后台脚本

// 存储键名
const STORAGE_KEYS = {
  METAS: 'metas'
};

// 消息类型
const MESSAGE_TYPES = {
  // 扩展发送的消息
  EXTENSION_SUBMIT_WEBSITE_META: 'EXTENSION_SUBMIT_WEBSITE_META',
  // 扩展接收的消息
  START_PAGE_REQUEST_WEBSITE_META: 'START_PAGE_REQUEST_WEBSITE_META',
  START_PAGE_BATCH_REQUEST_METAS: 'START_PAGE_BATCH_REQUEST_METAS',
  START_PAGE_REQUEST_UNSYNCED_METAS: 'START_PAGE_REQUEST_UNSYNCED_METAS',
  // 扩展内部消息
  GET_CURRENT_PAGE_METADATA: 'GET_CURRENT_PAGE_METADATA',
  // 扩展响应的消息
  EXTENSION_RESPONSE_WEBSITE_META: 'EXTENSION_RESPONSE_WEBSITE_META',
  EXTENSION_RESPONSE_BATCH_METAS: 'EXTENSION_RESPONSE_BATCH_METAS',
  EXTENSION_RESPONSE_UNSYNCED_METAS: 'EXTENSION_RESPONSE_UNSYNCED_METAS'
};

// 初始化存储
async function initStorage() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.METAS);
    if (!result[STORAGE_KEYS.METAS]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.METAS]: [] });
    }
  } catch (error) {
    console.error('初始化存储失败:', error);
  }
}

// 获取存储的元数据
async function getMetas() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.METAS);
    return result[STORAGE_KEYS.METAS] || [];
  } catch (error) {
    console.error('获取元数据失败:', error);
    return [];
  }
}

// 保存元数据
async function saveMetas(metas) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.METAS]: metas });
    return true;
  } catch (error) {
    console.error('保存元数据失败:', error);
    return false;
  }
}

// 从当前标签页获取元数据
async function getMetadataFromCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error('未找到当前标签页');
    }

    const tab = tabs[0];
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 获取标题
        const title = document.title || '';
        
        // 获取描述
        let description = '';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          description = metaDesc.content || '';
        }
        
        // 获取图标
        let iconUrl = '';
        const iconElements = document.querySelectorAll('link[rel*="icon"]');
        if (iconElements.length > 0) {
          iconUrl = iconElements[0].href;
        } else {
          // 尝试使用默认图标
          const domain = window.location.origin;
          iconUrl = `${domain}/favicon.ico`;
        }
        
        // 确保图标URL是完整的
        if (iconUrl && !iconUrl.startsWith('http')) {
          const baseUrl = window.location.origin;
          iconUrl = new URL(iconUrl, baseUrl).href;
        }
        
        return {
          url: window.location.href,
          title,
          description,
          iconUrl
        };
      }
    });

    if (result && result[0] && result[0].result) {
      const data = result[0].result;
      // 转换图标为base64
      const iconData = await fetchIconAsBase64(data.iconUrl);
      return {
        url: data.url,
        title: data.title,
        description: data.description,
        iconData
      };
    }
  } catch (error) {
    console.error('从当前标签页获取元数据失败:', error);
  }
  return null;
}

// 从URL获取元数据
async function getMetadataFromUrl(url) {
  try {
    // 尝试使用fetch获取
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 获取标题
    const title = doc.title || '';

    // 获取描述
    let description = '';
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
      description = metaDesc.content || '';
    }

    // 获取图标
    let iconUrl = '';
    const iconElements = doc.querySelectorAll('link[rel*="icon"]');
    if (iconElements.length > 0) {
      iconUrl = iconElements[0].href;
    } else {
      // 尝试使用默认图标
      const domain = new URL(url).origin;
      iconUrl = `${domain}/favicon.ico`;
    }

    // 确保图标URL是完整的
    if (iconUrl && !iconUrl.startsWith('http')) {
      const baseUrl = new URL(url).origin;
      iconUrl = new URL(iconUrl, baseUrl).href;
    }

    // 转换图标为base64
    const iconData = await fetchIconAsBase64(iconUrl);

    return {
      url,
      title,
      description,
      iconData
    };
  } catch (error) {
    console.error('使用fetch获取元数据失败:', error);
    // 尝试使用打开标签页的方式
    return await getMetadataFromNewTab(url);
  }
}

// 从新标签页获取元数据
async function getMetadataFromNewTab(url) {
  try {
    const tab = await chrome.tabs.create({ url, active: false });

    // 等待标签页加载完成
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    // 注入脚本获取数据
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 获取标题
        const title = document.title || '';
        
        // 获取描述
        let description = '';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          description = metaDesc.content || '';
        }
        
        // 获取图标
        let iconUrl = '';
        const iconElements = document.querySelectorAll('link[rel*="icon"]');
        if (iconElements.length > 0) {
          iconUrl = iconElements[0].href;
        } else {
          // 尝试使用默认图标
          const domain = window.location.origin;
          iconUrl = `${domain}/favicon.ico`;
        }
        
        // 确保图标URL是完整的
        if (iconUrl && !iconUrl.startsWith('http')) {
          const baseUrl = window.location.origin;
          iconUrl = new URL(iconUrl, baseUrl).href;
        }
        
        return {
          url: window.location.href,
          title,
          description,
          iconUrl
        };
      }
    });

    // 关闭标签页
    await chrome.tabs.remove(tab.id);

    if (result && result[0] && result[0].result) {
      const data = result[0].result;
      // 转换图标为base64
      const iconData = await fetchIconAsBase64(data.iconUrl);
      return {
        url: data.url,
        title: data.title,
        description: data.description,
        iconData
      };
    }
  } catch (error) {
    console.error('从新标签页获取元数据失败:', error);
  }
  return null;
}

// 获取图标并转换为base64
async function fetchIconAsBase64(iconUrl) {
  if (!iconUrl) {
    return '';
  }

  try {
    const response = await fetch(iconUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result || '');
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('获取图标失败:', error);
    return '';
  }
}

// 处理消息
function handleMessage(message, sender, sendResponse) {
  console.log('收到消息:', message.type, message, '来自:', sender.tab?.url || sender.url || 'background');

  switch (message.type) {
    case MESSAGE_TYPES.GET_CURRENT_PAGE_METADATA:
      handleGetCurrentPageMetadata(sendResponse);
      return true;

    case MESSAGE_TYPES.START_PAGE_REQUEST_WEBSITE_META:
      handleStartPageRequestWebsiteMeta(message, sendResponse);
      return true;

    case MESSAGE_TYPES.START_PAGE_BATCH_REQUEST_METAS:
      handleStartPageBatchRequestMetas(message, sendResponse);
      return true;

    case MESSAGE_TYPES.START_PAGE_REQUEST_UNSYNCED_METAS:
      handleStartPageRequestUnsyncedMetas(sendResponse);
      return true;

    case MESSAGE_TYPES.EXTENSION_SUBMIT_WEBSITE_META:
      handleExtensionSubmitWebsiteMeta(message, sendResponse);
      return true;

    default:
      console.warn('未知消息类型:', message.type);
      sendResponse({
        success: false,
        error: '未知消息类型'
      });
  }
}

// 处理起始页请求单个网站元数据
async function handleStartPageRequestWebsiteMeta(message, sendResponse) {
  try {
    const { url } = message.payload;
    if (!url) {
      throw new Error('缺少URL参数');
    }

    const metadata = await getMetadataFromUrl(url);
    if (metadata) {
      sendResponse({
        success: true,
        data: metadata
      });
    } else {
      sendResponse({
        success: false,
        error: '获取元数据失败'
      });
    }
  } catch (error) {
    console.error('处理起始页请求单个网站元数据失败:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 处理起始页批量请求元数据
async function handleStartPageBatchRequestMetas(message, sendResponse) {
  try {
    const { urls } = message.payload;
    if (!Array.isArray(urls)) {
      throw new Error('缺少URL数组参数');
    }

    const metas = [];
    for (const url of urls) {
      const metadata = await getMetadataFromUrl(url);
      if (metadata) {
        metas.push(metadata);
      }
    }

    sendResponse({
      success: true,
      data: metas
    });
  } catch (error) {
    console.error('处理起始页批量请求元数据失败:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 处理起始页请求未同步的元数据
async function handleStartPageRequestUnsyncedMetas(sendResponse) {
  try {
    const metas = await getMetas();
    // 过滤出未同步的元数据
    const unsyncedMetas = metas.filter(meta => !meta.synced);

    sendResponse({
      success: true,
      data: unsyncedMetas
    });
  } catch (error) {
    console.error('处理起始页请求未同步的元数据失败:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 处理获取当前页面元数据
async function handleGetCurrentPageMetadata(sendResponse) {
  try {
    const metadata = await getMetadataFromCurrentTab();
    if (metadata) {
      sendResponse({
        success: true,
        data: metadata
      });
    } else {
      sendResponse({
        success: false,
        error: '获取当前页面元数据失败'
      });
    }
  } catch (error) {
    console.error('处理获取当前页面元数据失败:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 检测是否有起始页实例
async function checkStartPageInstance() {
  try {
    // 查询所有标签页
    const tabs = await chrome.tabs.query({});
    
    // 查找起始页标签页（这里假设起始页的URL包含 localhost:5173 或其他特定标识）
    for (const tab of tabs) {
      if (tab.url && (tab.url.includes('localhost:5173') || tab.url.includes('startpage'))) {
        return tab;
      }
    }
    return null;
  } catch (error) {
    console.error('检测起始页实例失败:', error);
    return null;
  }
}

// 发送消息给起始页
async function sendMessageToStartPage(tab, message) {
  try {
    // 尝试向标签页发送消息（通过内容脚本）
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    console.error('发送消息给起始页失败:', error);
    return null;
  }
}

// 处理扩展提交网站元数据
async function handleExtensionSubmitWebsiteMeta(message, sendResponse) {
  try {
    const meta = message.payload;
    if (!meta || !meta.url) {
      throw new Error('缺少元数据参数');
    }

    // 检测是否有起始页实例
    const startPageTab = await checkStartPageInstance();
    
    if (startPageTab) {
      console.log('找到起始页实例，尝试发送数据');
      // 发送消息给起始页
      const response = await sendMessageToStartPage(startPageTab, {
        type: 'EXTENSION_SUBMIT_WEBSITE_META',
        payload: meta
      });
      
      if (response && response.success) {
        console.log('起始页添加网站成功');
        sendResponse({
          success: true,
          message: '网站已添加到起始页'
        });
      } else {
        console.log('起始页添加网站失败，保存到扩展仓库');
        // 保存到存储
        const metas = await getMetas();
        // 检查是否已存在
        const existingIndex = metas.findIndex(m => m.url === meta.url);
        if (existingIndex !== -1) {
          // 更新现有数据
          metas[existingIndex] = { ...meta, synced: false };
        } else {
          // 添加新数据
          metas.push({ ...meta, synced: false });
        }

        const saved = await saveMetas(metas);
        if (saved) {
          sendResponse({
            success: true,
            message: '元数据保存到扩展仓库'
          });
        } else {
          sendResponse({
            success: false,
            error: '元数据保存失败'
          });
        }
      }
    } else {
      console.log('未找到起始页实例，保存到扩展仓库');
      // 保存到存储
      const metas = await getMetas();
      // 检查是否已存在
      const existingIndex = metas.findIndex(m => m.url === meta.url);
      if (existingIndex !== -1) {
        // 更新现有数据
        metas[existingIndex] = { ...meta, synced: false };
      } else {
        // 添加新数据
        metas.push({ ...meta, synced: false });
      }

      const saved = await saveMetas(metas);
      if (saved) {
        sendResponse({
          success: true,
          message: '元数据保存到扩展仓库'
        });
      } else {
        sendResponse({
          success: false,
          error: '元数据保存失败'
        });
      }
    }
  } catch (error) {
    console.error('处理扩展提交网站元数据失败:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// 处理命令
function handleCommand(command) {
  console.log('收到命令:', command);
  
  if (command === 'open-panel') {
    // 打开弹出面板
    chrome.action.openPopup();
  }
}

// 初始化
async function init() {
  await initStorage();
  // 监听消息
  chrome.runtime.onMessage.addListener(handleMessage);
  // 监听命令（键盘快捷键）
  chrome.commands.onCommand.addListener(handleCommand);
  console.log('扩展后台脚本初始化完成');
}

// 启动初始化
init();