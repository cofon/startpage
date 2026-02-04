/**
 * IndexedDB 操作工具类
 * 负责管理网站和设置的数据库操作
 */

const DB_NAME = 'StartPageDB'
const DB_VERSION = 4

// 表名
const STORE_WEBSITES = 'websites'
const STORE_SETTINGS = 'settings'
const STORE_ICONS = 'icons'

class IndexedDB {
  constructor() {
    this.db = null
  }

  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('无法打开数据库'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
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
          websiteStore.createIndex('isHidden', 'isHidden', { unique: false }) // 添加isHidden索引
        } else {
          // 如果websites存储已存在，我们不需要做任何事，因为索引已经存在或将在数据库版本升级时添加
        }

        // 创建 settings 表
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' })
        }

        // 如果是从老版本升级，需要确保所有索引都已创建
        if (oldVersion < 4) {
          // 在老版本升级情况下，可能需要重新创建对象存储以添加新索引
          // 但IndexedDB不允许在同一个upgrade事务中删除和重建存储，所以我们只处理特殊情况
        }

        // 版本 4：删除 icons 表
        if (oldVersion < 4 && db.objectStoreNames.contains(STORE_ICONS)) {
          db.deleteObjectStore(STORE_ICONS)
        }
      }
    })
  }

  // 添加网站
  async addWebsite(website) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_WEBSITES], 'readwrite')
    const store = transaction.objectStore(STORE_WEBSITES)
    
    // 确保website对象是一个纯净的JavaScript对象，而不是响应式对象
    const plainWebsite = {
      ...website
    }
    
    return new Promise((resolve, reject) => {
      const request = store.add(plainWebsite)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 更新网站
  async updateWebsite(website) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_WEBSITES], 'readwrite')
    const store = transaction.objectStore(STORE_WEBSITES)
    
    // 确保website对象是一个纯净的JavaScript对象，而不是响应式对象
    const plainWebsite = {
      ...website
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(plainWebsite)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 删除网站
  async deleteWebsite(id) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_WEBSITES], 'readwrite')
    const store = transaction.objectStore(STORE_WEBSITES)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 获取所有网站
  async getAllWebsites() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_WEBSITES], 'readonly')
    const store = transaction.objectStore(STORE_WEBSITES)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 获取设置
  async getSettings() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SETTINGS], 'readonly')
    const store = transaction.objectStore(STORE_SETTINGS)
    
    return new Promise((resolve, reject) => {
      const request = store.get('settings')
      
      request.onsuccess = () => {
        // 如果没有找到设置，返回null
        resolve(request.result || null)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 保存设置
  async saveSettings(settings) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SETTINGS], 'readwrite')
    const store = transaction.objectStore(STORE_SETTINGS)
    
    const settingsToSave = {
      id: 'settings',
      ...settings
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(settingsToSave)
      
      request.onsuccess = () => {
        resolve(request.result)
      }
      
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 导出数据
  async exportData() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const websites = await this.getAllWebsites()
    const settings = await this.getSettings()
    
    return {
      websites,
      settings: settings || {}
    }
  }

  // 导入数据
  async importData(data) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    // 开启事务处理导入过程
    const transaction = this.db.transaction([STORE_WEBSITES, STORE_SETTINGS], 'readwrite')
    const websitesStore = transaction.objectStore(STORE_WEBSITES)
    const settingsStore = transaction.objectStore(STORE_SETTINGS)
    
    return new Promise((resolve, reject) => {
      // 清空现有数据
      const clearWebsitesReq = websitesStore.clear()
      
      clearWebsitesReq.onsuccess = () => {
        // 添加网站数据
        if (data.websites && data.websites.length > 0) {
          let count = 0
          const total = data.websites.length
          
          for (const website of data.websites) {
            const addReq = websitesStore.add(website)
            
            addReq.onsuccess = () => {
              count++
              if (count === total) {
                // 所有网站添加完成后，添加设置
                if (data.settings) {
                  const putSettingsReq = settingsStore.put(data.settings)
                  
                  putSettingsReq.onsuccess = () => resolve()
                  putSettingsReq.onerror = () => reject(putSettingsReq.error)
                } else {
                  resolve()
                }
              }
            }
            
            addReq.onerror = () => reject(addReq.error)
          }
          
          if (total === 0 && data.settings) {
            // 如果没有网站数据但有设置数据
            const putSettingsReq = settingsStore.put(data.settings)
            
            putSettingsReq.onsuccess = () => resolve()
            putSettingsReq.onerror = () => reject(putSettingsReq.error)
          }
        } else if (data.settings) {
          // 如果没有网站数据但有设置数据
          const putSettingsReq = settingsStore.put(data.settings)
          
          putSettingsReq.onsuccess = () => resolve()
          putSettingsReq.onerror = () => reject(putSettingsReq.error)
        } else {
          // 如果都没有数据
          resolve()
        }
      }
      
      clearWebsitesReq.onerror = () => reject(clearWebsitesReq.error)
    })
  }
}

// 创建并导出实例
const dbInstance = new IndexedDB();
export default dbInstance;