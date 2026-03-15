/**
 * IndexedDB 操作工具类
 * 负责管理网站和设置的数据库操作
 */

import { importSingleWebsite } from '../website/websiteImportUtils'

const DB_NAME = 'StartPageDB'
const DB_VERSION = 7

// 表名
const STORE_WEBSITES = 'websites'
const STORE_SETTINGS = 'settings'
const STORE_ICONS = 'icons' // 版本 4 中已删除
const STORE_THEMES = 'themes'
const STORE_SEARCH_ENGINES = 'searchEngines'

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
        let websiteStore
        if (!db.objectStoreNames.contains(STORE_WEBSITES)) {
          websiteStore = db.createObjectStore(STORE_WEBSITES, {
            keyPath: 'id',
            autoIncrement: true
          })

          // 创建索引
          websiteStore.createIndex('isMarked', 'isMarked', { unique: false })
          websiteStore.createIndex('markOrder', 'markOrder', { unique: false })
          websiteStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
          websiteStore.createIndex('isActive', 'isActive', { unique: false })
          websiteStore.createIndex('isHidden', 'isHidden', { unique: false }) // 添加 isHidden 索引
          websiteStore.createIndex('url', 'url', { unique: false }) // 添加 url 索引
        } else {
          // 如果 websites 存储已存在，通过 transaction 获取它
          const transaction = event.target.transaction
          websiteStore = transaction.objectStore(STORE_WEBSITES)
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

        // 版本 5：创建 themes 和 searchEngines 表
        if (oldVersion < 5) {
          // 创建 themes 表
          if (!db.objectStoreNames.contains(STORE_THEMES)) {
            const themeStore = db.createObjectStore(STORE_THEMES, { keyPath: 'id' })
            themeStore.createIndex('name', 'name', { unique: false })
          }

          // 创建 searchEngines 表
          if (!db.objectStoreNames.contains(STORE_SEARCH_ENGINES)) {
            const engineStore = db.createObjectStore(STORE_SEARCH_ENGINES, { keyPath: 'id' })
            engineStore.createIndex('name', 'name', { unique: false })
            engineStore.createIndex('order', 'order', { unique: false })
          }
        }

        // 版本 6：添加 title 字段索引
        if (oldVersion < 6 && websiteStore) {
          // 添加 title 字段索引
          if (!websiteStore.indexNames.contains('title')) {
            websiteStore.createIndex('title', 'title', { unique: false })
          }
        }

        // 版本 7：删除不需要的字段（iconUrl, iconCanFetch, iconFetchAttempts, iconLastFetchTime）
        if (oldVersion < 7 && websiteStore) {
          // 获取所有网站数据
          const request = websiteStore.getAll()

          request.onsuccess = () => {
            const websites = request.result || []

            // 遍历所有网站，删除不需要的字段
            websites.forEach(website => {
              const updatedWebsite = { ...website }

              // 删除不需要的字段
              delete updatedWebsite.iconUrl
              delete updatedWebsite.iconCanFetch
              delete updatedWebsite.iconFetchAttempts
              delete updatedWebsite.iconLastFetchTime

              // 更新网站数据
              websiteStore.put(updatedWebsite)
            })
          }
        }
      }
    })
  }

  // 添加网站
  async addWebsite(website) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    console.log('[IndexedDB.addWebsite] 准备添加网站:', website.url, website.name)

    const transaction = this.db.transaction([STORE_WEBSITES], 'readwrite')
    const store = transaction.objectStore(STORE_WEBSITES)

    // 确保 website 对象是一个纯净的 JavaScript 对象，而不是响应式对象
    // 使用 JSON.parse(JSON.stringify()) 来深度克隆并移除响应式属性
    const plainWebsite = JSON.parse(JSON.stringify(website))

    // 删除 id 字段，让 IndexedDB 自动生成（因为 keyPath 配置了 autoIncrement: true）
    delete plainWebsite.id

    // 删除已废弃的字段
    delete plainWebsite.iconUrl
    delete plainWebsite.iconCanFetch
    delete plainWebsite.iconFetchAttempts
    delete plainWebsite.iconLastFetchTime

    console.log('[IndexedDB.addWebsite] 执行 store.add...')

    return new Promise((resolve, reject) => {
      const request = store.add(plainWebsite)

      request.onsuccess = () => {
        console.log('[IndexedDB.addWebsite] 添加成功，ID:', request.result)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('[IndexedDB.addWebsite] 添加失败:', request.error)
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

  // 更新网站（用于导入时更新已存在的数据）
  async updateWebsite(website) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_WEBSITES], 'readwrite')
    const store = transaction.objectStore(STORE_WEBSITES)

    // 确保 website 对象是一个纯净的 JavaScript 对象，而不是响应式对象
    // 使用 JSON.parse(JSON.stringify()) 来深度克隆并移除响应式属性
    const plainWebsite = JSON.parse(JSON.stringify(website))
    
    // 删除已废弃的字段（但保留 id 字段作为主键）
    delete plainWebsite.iconUrl
    delete plainWebsite.iconCanFetch
    delete plainWebsite.iconFetchAttempts
    delete plainWebsite.iconLastFetchTime

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
    const themes = await this.getAllThemes()
    const searchEngines = await this.getAllSearchEngines()

    // ========== 新增：按照重构方案规范过滤网站数据字段 ==========
    const exportWebsites = websites.map(site => ({
      // 用户可输入字段（全部导出）
      name: site.name,
      title: site.title,
      url: site.url,
      description: site.description,
      iconData: site.iconData,
      iconGenerateData: site.iconGenerateData,
      tags: site.tags,
      isMarked: site.isMarked,
      isActive: site.isActive,
      isHidden: site.isHidden,

      // 排序字段（保留）
      markOrder: site.markOrder,
      visitCount: site.visitCount,
      lastVisited: site.lastVisited,

      // 系统字段（不导出，让导入时重新生成）
      // id: site.id,
      // createdAt: site.createdAt,
      // updatedAt: site.updatedAt
    }))

    return {
      version: 1,
      exportDate: new Date().toISOString(),
      websites: exportWebsites,
      settings: settings || {},
      themes: themes || [],
      searchEngines: searchEngines || []
    }
  }

  // 迁移网站数据，添加缺失的字段
  async migrateWebsites() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const websites = await this.getAllWebsites()
    let migratedCount = 0

    for (const website of websites) {
      let needsUpdate = false
      const updatedWebsite = { ...website }

      // 如果isActive字段不存在或为undefined，设置为true
      if (updatedWebsite.isActive === undefined) {
        updatedWebsite.isActive = true
        needsUpdate = true
      }

      // 如果isHidden字段不存在或为undefined，设置为false
      if (updatedWebsite.isHidden === undefined) {
        updatedWebsite.isHidden = false
        needsUpdate = true
      }

      // 如果需要更新，则更新数据库
      if (needsUpdate) {
        await this.updateWebsite(updatedWebsite)
        migratedCount++
      }
    }

    return migratedCount
  }

  // 导入数据
  async importData(data) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    // 验证数据格式
    if (!data || typeof data !== 'object') {
      throw new Error('导入数据格式错误：数据必须是一个对象')
    }

    // 检查是否包含至少一个有效的表名
    const validTables = ['websites', 'settings', 'themes', 'searchEngines']
    const hasValidTable = validTables.some(table => data[table])
    if (!hasValidTable) {
      throw new Error('导入数据格式错误：必须包含至少一个有效的表名（websites、settings、themes、searchEngines）')
    }

    // 确定导入顺序：websites → themes → searchEngines → settings
    const importOrder = []
    if (data.websites) importOrder.push('websites')
    if (data.themes) importOrder.push('themes')
    if (data.searchEngines) importOrder.push('searchEngines')
    if (data.settings) importOrder.push('settings')

    // 开启事务处理导入过程
    const transaction = this.db.transaction([STORE_WEBSITES, STORE_SETTINGS, STORE_THEMES, STORE_SEARCH_ENGINES], 'readwrite')
    const websitesStore = transaction.objectStore(STORE_WEBSITES)
    const settingsStore = transaction.objectStore(STORE_SETTINGS)
    const themesStore = transaction.objectStore(STORE_THEMES)
    const searchEnginesStore = transaction.objectStore(STORE_SEARCH_ENGINES)

    return new Promise((resolve, reject) => {
      let currentIndex = 0
      const errors = []

      // 处理单个表的导入
      function processNextTable() {
        if (currentIndex >= importOrder.length) {
          // 所有表处理完成
          if (errors.length > 0) {
            reject(new Error('导入过程中发生错误：\n' + errors.join('\n')))
          } else {
            resolve()
          }
          return
        }

        const tableName = importOrder[currentIndex]
        currentIndex++

        try {
          switch (tableName) {
            case 'websites':
              processWebsites().then(() => processNextTable()).catch(err => {
                errors.push(`导入websites表失败: ${err.message}`)
                processNextTable()
              })
              break
            case 'themes':
              processThemes().then(() => processNextTable()).catch(err => {
                errors.push(`导入themes表失败: ${err.message}`)
                processNextTable()
              })
              break
            case 'searchEngines':
              processSearchEngines().then(() => processNextTable()).catch(err => {
                errors.push(`导入searchEngines表失败: ${err.message}`)
                processNextTable()
              })
              break
            case 'settings':
              processSettings().then(() => processNextTable()).catch(err => {
                errors.push(`导入settings表失败: ${err.message}`)
                processNextTable()
              })
              break
          }
        } catch (err) {
          errors.push(`处理${tableName}表时发生错误: ${err.message}`)
          processNextTable()
        }
      }

      // 开始处理第一个表
      processNextTable()

      // 事务错误处理
      transaction.onerror = () => {
        reject(new Error('事务失败：' + transaction.error))
      }
      // 处理websites表
      function processWebsites() {
        // return new Promise((resolve, reject) => {
        return new Promise((resolve) => {
          if (!data.websites || !Array.isArray(data.websites)) {
            resolve()
            return
          }

          let processedCount = 0
          const total = data.websites.length

          if (total === 0) {
            resolve()
            return
          }

          for (const website of data.websites) {
            importSingleWebsite(website, websitesStore, () => {
              processedCount++
              if (processedCount === total) resolve()
            })
          }
        })
      }

      // 处理themes表
      function processThemes() {
        // return new Promise((resolve, reject) => {
        return new Promise((resolve) => {
          if (!data.themes || !Array.isArray(data.themes)) {
            resolve()
            return
          }

          let processedCount = 0
          const total = data.themes.length

          if (total === 0) {
            resolve()
            return
          }

          for (const theme of data.themes) {
            // 验证必填字段
            if (!theme.id || !theme.name || !theme.colors) {
              console.warn('跳过无效主题：缺少必填字段', theme)
              processedCount++
              if (processedCount === total) resolve()
              continue
            }

            // 验证colors对象中的所有字段
            const colors = theme.colors
            const colorFields = ['primary', 'primaryHover', 'primaryActive', 'textMain', 'textSecondary', 'textDisabled', 'textOnPrimary', 'bgPage', 'bgCard', 'bgHover', 'bgActive', 'borderBase', 'borderFocus', 'shadowLight', 'shadowMedium', 'shadowDark']
            const hasAllColors = colorFields.every(field => colors[field] !== undefined && colors[field] !== null && colors[field] !== '')

            if (!hasAllColors) {
              console.warn('跳过无效主题：colors字段不完整', theme)
              processedCount++
              if (processedCount === total) resolve()
              continue
            }

            // 添加或更新主题
            const putReq = themesStore.put(theme)
            putReq.onsuccess = () => {
              processedCount++
              if (processedCount === total) resolve()
            }
            putReq.onerror = () => {
              console.error('添加主题失败:', theme)
              processedCount++
              if (processedCount === total) resolve()
            }
          }
        })
      }

      // 处理searchEngines表
      function processSearchEngines() {
        // return new Promise((resolve, reject) => {
        return new Promise((resolve) => {
          if (!data.searchEngines || !Array.isArray(data.searchEngines)) {
            resolve()
            return
          }

          let processedCount = 0
          const total = data.searchEngines.length

          if (total === 0) {
            resolve()
            return
          }

          // 获取当前最大的order值
          const getAllReq = searchEnginesStore.getAll()
          getAllReq.onsuccess = () => {
            const existingEngines = getAllReq.result
            const maxOrder = existingEngines.length > 0
              ? Math.max(...existingEngines.map(e => e.order || 0))
              : 0

            for (const engine of data.searchEngines) {
              // 验证必填字段
              // 验证必填字段（本地搜索引擎不需要template）
              const isLocalEngine = engine.id === 'local'
              const requiredFields = ['id', 'name', 'icon', 'iconColor']
              if (!isLocalEngine) {
                requiredFields.push('template')
              }
              const hasAllRequiredFields = requiredFields.every(field => engine[field])

              if (!hasAllRequiredFields) {
                console.warn('跳过无效搜索引擎：缺少必填字段', engine)
                processedCount++
                if (processedCount === total) resolve()
                continue
              }

              // 设置order
              const engineToImport = { ...engine }
              if (engineToImport.order === undefined) {
                engineToImport.order = maxOrder + processedCount + 1
              }

              // 添加或更新搜索引擎
              const putReq = searchEnginesStore.put(engineToImport)
              putReq.onsuccess = () => {
                processedCount++
                if (processedCount === total) resolve()
              }
              putReq.onerror = () => {
                console.error('添加搜索引擎失败:', engine)
                processedCount++
                if (processedCount === total) resolve()
              }
            }
          }
          getAllReq.onerror = () => {
            console.error('获取搜索引擎列表失败')
            resolve()
          }
        })
      }

      // 处理settings表
      function processSettings() {
        // return new Promise((resolve, reject) => {
        return new Promise((resolve) => {
          if (!data.settings || typeof data.settings !== 'object') {
            resolve()
            return
          }

          // 验证id字段
          if (data.settings.id && data.settings.id !== 'settings') {
            console.warn('跳过无效设置：id字段必须为"settings"')
            resolve()
            return
          }

          // 填充默认值
          const settingsToImport = {
            ...data.settings,
            id: 'settings',
            selectedThemeId: data.settings.selectedThemeId || 'auto',
            selectedSearchEngineId: data.settings.selectedSearchEngineId || 'local',
            searchResultLayout: data.settings.searchResultLayout || 'list'
          }

          // 检查selectedThemeId是否存在
          const themeReq = themesStore.get(settingsToImport.selectedThemeId)
          themeReq.onsuccess = () => {
            if (!themeReq.result) {
              // 主题不存在，查询数据库settings表中selectedThemeId是否有值
              const currentSettingsReq = settingsStore.get('settings')
              currentSettingsReq.onsuccess = () => {
                if (currentSettingsReq.result && currentSettingsReq.result.selectedThemeId) {
                  // 有值，则不修改
                  settingsToImport.selectedThemeId = currentSettingsReq.result.selectedThemeId
                  console.warn('主题不存在:', settingsToImport.selectedThemeId, '将保持原值:', settingsToImport.selectedThemeId)
                } else {
                  // 没有值，则修改settings表中selectedThemeId的值为'auto'
                  settingsToImport.selectedThemeId = 'auto'
                  console.warn('主题不存在:', settingsToImport.selectedThemeId, '将使用默认值auto')
                }
                // 检查selectedSearchEngineId是否存在
                const engineReq = searchEnginesStore.get(settingsToImport.selectedSearchEngineId)
                engineReq.onsuccess = () => {
                  if (!engineReq.result) {
                    // 搜索引擎不存在，查询数据库settings表中selectedSearchEngineId是否有值
                    if (currentSettingsReq.result && currentSettingsReq.result.selectedSearchEngineId) {
                      // 有值，则不修改
                      settingsToImport.selectedSearchEngineId = currentSettingsReq.result.selectedSearchEngineId
                      console.warn('搜索引擎不存在:', settingsToImport.selectedSearchEngineId, '将保持原值:', settingsToImport.selectedSearchEngineId)
                    } else {
                      // 没有值，则修改settings表中selectedSearchEngineId的值为'local'
                      settingsToImport.selectedSearchEngineId = 'local'
                      console.warn('搜索引擎不存在:', settingsToImport.selectedSearchEngineId, '将使用默认值local')
                    }
                  }
                  // 更新设置
                  const putSettingsReq = settingsStore.put(settingsToImport)
                  putSettingsReq.onsuccess = () => resolve()
                  putSettingsReq.onerror = () => {
                    console.error('添加设置失败:', settingsToImport)
                    resolve()
                  }
                }
                engineReq.onerror = () => {
                  console.error('检查搜索引擎ID失败:', settingsToImport.selectedSearchEngineId)
                  resolve()
                }
              }
              currentSettingsReq.onerror = () => {
                console.error('获取当前设置失败')
                resolve()
              }
            } else {
              // 主题存在，检查搜索引擎
              const engineReq = searchEnginesStore.get(settingsToImport.selectedSearchEngineId)
              engineReq.onsuccess = () => {
                if (!engineReq.result) {
                  // 搜索引擎不存在，查询数据库settings表中selectedSearchEngineId是否有值
                  const currentSettingsReq = settingsStore.get('settings')
                  currentSettingsReq.onsuccess = () => {
                    if (currentSettingsReq.result && currentSettingsReq.result.selectedSearchEngineId) {
                      // 有值，则不修改
                      settingsToImport.selectedSearchEngineId = currentSettingsReq.result.selectedSearchEngineId
                      console.warn('搜索引擎不存在:', settingsToImport.selectedSearchEngineId, '将保持原值:', settingsToImport.selectedSearchEngineId)
                    } else {
                      // 没有值，则修改settings表中selectedSearchEngineId的值为'local'
                      settingsToImport.selectedSearchEngineId = 'local'
                      console.warn('搜索引擎不存在:', settingsToImport.selectedSearchEngineId, '将使用默认值local')
                    }
                    // 更新设置
                    const putSettingsReq = settingsStore.put(settingsToImport)
                    putSettingsReq.onsuccess = () => resolve()
                    putSettingsReq.onerror = () => {
                      console.error('添加设置失败:', settingsToImport)
                      resolve()
                    }
                  }
                  currentSettingsReq.onerror = () => {
                    console.error('获取当前设置失败')
                    resolve()
                  }
                } else {
                  // 搜索引擎存在，更新设置
                  const putSettingsReq = settingsStore.put(settingsToImport)
                  putSettingsReq.onsuccess = () => resolve()
                  putSettingsReq.onerror = () => {
                    console.error('添加设置失败:', settingsToImport)
                    resolve()
                  }
                }
              }
              engineReq.onerror = () => {
                console.error('检查搜索引擎ID失败:', settingsToImport.selectedSearchEngineId)
                resolve()
              }
            }
          }
          themeReq.onerror = () => {
            console.error('检查主题ID失败:', settingsToImport.selectedThemeId)
            resolve()
          }
        })
      }
    })
  }

  // ==================== 主题管理 ====================

  // 获取所有主题
  async getAllThemes() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_THEMES], 'readonly')
    const store = transaction.objectStore(STORE_THEMES)

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

  // 获取单个主题
  async getTheme(themeId) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_THEMES], 'readonly')
    const store = transaction.objectStore(STORE_THEMES)

    return new Promise((resolve, reject) => {
      const request = store.get(themeId)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 添加主题
  async addTheme(theme) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_THEMES], 'readwrite')
    const store = transaction.objectStore(STORE_THEMES)

    const plainTheme = { ...theme }

    return new Promise((resolve, reject) => {
      const request = store.add(plainTheme)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 更新主题
  async updateTheme(theme) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_THEMES], 'readwrite')
    const store = transaction.objectStore(STORE_THEMES)

    const plainTheme = { ...theme }

    return new Promise((resolve, reject) => {
      const request = store.put(plainTheme)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 删除主题
  async deleteTheme(themeId) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_THEMES], 'readwrite')
    const store = transaction.objectStore(STORE_THEMES)

    return new Promise((resolve, reject) => {
      const request = store.delete(themeId)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // ==================== 搜索引擎管理 ====================

  // 获取所有搜索引擎
  async getAllSearchEngines() {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SEARCH_ENGINES], 'readonly')
    const store = transaction.objectStore(STORE_SEARCH_ENGINES)

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

  // 获取单个搜索引擎
  async getSearchEngine(engineId) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SEARCH_ENGINES], 'readonly')
    const store = transaction.objectStore(STORE_SEARCH_ENGINES)

    return new Promise((resolve, reject) => {
      const request = store.get(engineId)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 添加搜索引擎
  async addSearchEngine(engine) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SEARCH_ENGINES], 'readwrite')
    const store = transaction.objectStore(STORE_SEARCH_ENGINES)

    const plainEngine = { ...engine }

    return new Promise((resolve, reject) => {
      const request = store.add(plainEngine)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 更新搜索引擎
  async updateSearchEngine(engine) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SEARCH_ENGINES], 'readwrite')
    const store = transaction.objectStore(STORE_SEARCH_ENGINES)

    const plainEngine = { ...engine }

    return new Promise((resolve, reject) => {
      const request = store.put(plainEngine)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  // 删除搜索引擎
  async deleteSearchEngine(engineId) {
    if (!this.db) {
      throw new Error('数据库未初始化')
    }

    const transaction = this.db.transaction([STORE_SEARCH_ENGINES], 'readwrite')
    const store = transaction.objectStore(STORE_SEARCH_ENGINES)

    return new Promise((resolve, reject) => {
      const request = store.delete(engineId)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }
}

// 创建并导出实例
const dbInstance = new IndexedDB();
export default dbInstance
