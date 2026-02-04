/**
 * IndexedDB 操作工具类
 * 负责管理网站和设置的数据库操作
 */

const DB_NAME = 'StartPageDB'
const DB_VERSION = 2

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
          websiteStore.createIndex('iconUrl', 'iconUrl', { unique: false })
          websiteStore.createIndex('iconCanFetch', 'iconCanFetch', { unique: false })
        }

        // 创建 settings 表
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' })
        }

        // 创建 icons 表（版本 2）
        if (oldVersion < 2 && !db.objectStoreNames.contains(STORE_ICONS)) {
          const iconStore = db.createObjectStore(STORE_ICONS, { keyPath: 'url' })
          iconStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Website 操作
   */
  async getAllWebsites() {
    return this.getAll(STORE_WEBSITES)
  }

  async getWebsite(id) {
    return this.get(STORE_WEBSITES, id)
  }

  async addWebsite(website) {
    return this.add(STORE_WEBSITES, website)
  }

  async updateWebsite(website) {
    return this.put(STORE_WEBSITES, website)
  }

  async deleteWebsite(id) {
    return this.delete(STORE_WEBSITES, id)
  }

  async getMarkedWebsites() {
    return this.getByIndex(STORE_WEBSITES, 'isMarked', true)
  }

  async searchByTag(tag) {
    return this.getByIndex(STORE_WEBSITES, 'tags', tag)
  }

  /**
   * Setting 操作
   */
  async getSettings() {
    const settings = await this.getAll(STORE_SETTINGS)
    // settings 表应该只有一条记录，id 为 'global'
    return settings.find(s => s.id === 'global') || null
  }

  async saveSettings(settings) {
    const data = { id: 'global', ...settings }
    return this.put(STORE_SETTINGS, data)
  }

  /**
   * 通用操作
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 导出所有数据
   */
  async exportData() {
    const websites = await this.getAllWebsites()
    const settings = await this.getSettings()
    return {
      version: DB_VERSION,
      exportTime: new Date().toISOString(),
      data: {
        websites,
        settings
      }
    }
  }

  /**
   * 导入数据
   */
  async importData(exportedData) {
    const { websites, settings } = exportedData.data

    // 导入网站数据
    for (const website of websites) {
      await this.put(STORE_WEBSITES, website)
    }

    // 导入设置数据
    if (settings) {
      await this.saveSettings(settings)
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll() {
    await this.clearStore(STORE_WEBSITES)
    await this.clearStore(STORE_SETTINGS)
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// 创建单例实例
const db = new IndexedDB()

export default db
