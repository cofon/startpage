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
          autoIncrement: true
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
          id: request.result
        })
      }
      
      request.onerror = () => {
        reject(new Error('添加失败：' + request.error.message))
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 批量导入网站
async function importWebsites(websites) {
  try {
    const db = await openDatabase()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_WEBSITES], 'readwrite')
      const store = transaction.objectStore(STORE_WEBSITES)
      
      let count = 0
      let errors = []
      
      websites.forEach((website, index) => {
        const cleanData = { ...website }
        
        
        // 删除 id 字段，让 IndexedDB 自动生成
       delete cleanData.id
        
        // 删除已废弃的字段
       delete cleanData.iconUrl
       delete cleanData.iconCanFetch
       delete cleanData.iconFetchAttempts
       delete cleanData.iconLastFetchTime
        
        const request = store.add(cleanData)
        
        request.onsuccess = () => {
          count++
          if (count === websites.length) {
            resolve({
              success: true,
              count: count,
              errors: errors
            })
          }
        }
        
        request.onerror = () => {
          errors.push({
            index: index,
            name: website.name || website.title || '未知',
            error: request.error.message
          })
          
          // 即使有错误也继续
          if (count + errors.length === websites.length) {
            resolve({
              success: true,
              count: count,
              errors: errors
            })
          }
        }
      })
      
      // 如果数组为空
      if (websites.length === 0) {
        resolve({
          success: true,
          count: 0
        })
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error.message
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
            websites: request.result
          },
          count: request.result.length
        })
      }
      
      request.onerror = () => {
        reject(new Error('导出失败：' + request.error.message))
      }
    })
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.action) {
      case 'addWebsite':
        return await addWebsite(message.data)
      
      case 'importWebsites':
        return await importWebsites(message.data)
      
      case 'exportWebsites':
        return await exportWebsites()
      
     default:
        return {
          success: false,
          error: '未知操作：' + message.action
        }
    }
  }
  
  handleAsync().then(sendResponse)
  
  // 返回 true 表示异步响应
  return true
})

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('StartPage 插件已安装')
  openDatabase().then(() => {
    console.log('数据库初始化完成')
  }).catch(err => {
    console.error('数据库初始化失败:', err)
  })
})
