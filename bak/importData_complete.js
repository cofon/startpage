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

      // 处理websites表
      function processWebsites() {
        return new Promise((resolve, reject) => {
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
            // 验证url字段
            if (!website.url) {
              console.warn('跳过无效网站：缺少url字段', website)
              processedCount++
              if (processedCount === total) resolve()
              continue
            }

            // 填充默认字段
            const websiteToImport = {
              ...website,
              iconCanFetch: website.iconCanFetch !== undefined ? website.iconCanFetch : true,
              isMarked: website.isMarked !== undefined ? website.isMarked : false,
              isActive: website.isActive !== undefined ? website.isActive : true,
              isHidden: website.isHidden !== undefined ? website.isHidden : false
            }

            // 检查是否需要生成新ID
            let needNewId = false
            if (websiteToImport.id) {
              // 如果有ID，检查数据库是否存在相同ID
              const getReq = websitesStore.get(websiteToImport.id)
              getReq.onsuccess = () => {
                const existingWebsite = getReq.result
                if (existingWebsite) {
                  // 如果ID存在，检查URL是否相同
                  if (existingWebsite.url !== websiteToImport.url) {
                    // URL不同，生成新ID
                    delete websiteToImport.id
                    needNewId = true
                  } else {
                    // URL相同，跳过
                    console.warn('跳过重复网站：URL已存在', websiteToImport.url)
                    processedCount++
                    if (processedCount === total) resolve()
                    return
                  }
                }

                if (needNewId) {
                  // 检查URL是否已存在
                  const indexReq = websitesStore.index('url').get(websiteToImport.url)
                  indexReq.onsuccess = () => {
                    if (indexReq.result) {
                      // URL已存在，跳过
                      console.warn('跳过重复网站：URL已存在', websiteToImport.url)
                      processedCount++
                      if (processedCount === total) resolve()
                      return
                    } else {
                      // URL不存在，添加
                      const addReq = websitesStore.add(websiteToImport)
                      addReq.onsuccess = () => {
                        processedCount++
                        if (processedCount === total) resolve()
                      }
                      addReq.onerror = () => {
                        console.error('添加网站失败:', websiteToImport)
                        processedCount++
                        if (processedCount === total) resolve()
                      }
                    }
                  }
                  indexReq.onerror = () => {
                    console.error('检查URL失败:', websiteToImport.url)
                    processedCount++
                    if (processedCount === total) resolve()
                  }
                } else {
                  const addReq = websitesStore.add(websiteToImport)
                  addReq.onsuccess = () => {
                    processedCount++
                    if (processedCount === total) resolve()
                  }
                  addReq.onerror = () => {
                    console.error('添加网站失败:', websiteToImport)
                    processedCount++
                    if (processedCount === total) resolve()
                  }
                }
              }
              getReq.onerror = () => {
                console.error('检查网站ID失败:', websiteToImport.id)
                processedCount++
                if (processedCount === total) resolve()
              }
            } else {
              // 没有ID，检查URL是否已存在
              const indexReq = websitesStore.index('url').get(websiteToImport.url)
              indexReq.onsuccess = () => {
                if (indexReq.result) {
                  // URL已存在，跳过
                  console.warn('跳过重复网站：URL已存在', websiteToImport.url)
                  processedCount++
                  if (processedCount === total) resolve()
                  return
                } else {
                  // URL不存在，添加
                  const addReq = websitesStore.add(websiteToImport)
                  addReq.onsuccess = () => {
                    processedCount++
                    if (processedCount === total) resolve()
                  }
                  addReq.onerror = () => {
                    console.error('添加网站失败:', websiteToImport)
                    processedCount++
                    if (processedCount === total) resolve()
                  }
                }
              }
              indexReq.onerror = () => {
                console.error('检查URL失败:', websiteToImport.url)
                processedCount++
                if (processedCount === total) resolve()
              }
            }
          }
        })
      }

      // 处理themes表
      function processThemes() {
        return new Promise((resolve, reject) => {
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
            const colorFields = ['primary', 'primaryHover', 'background', 'surface', 'text', 'textSecondary', 'border']
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
        return new Promise((resolve, reject) => {
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
              if (!engine.id || !engine.name || !engine.icon || !engine.iconColor || !engine.template) {
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
        return new Promise((resolve, reject) => {
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
              // 主题不存在，保持原值
              const currentSettingsReq = settingsStore.get('settings')
              currentSettingsReq.onsuccess = () => {
                if (currentSettingsReq.result) {
                  settingsToImport.selectedThemeId = currentSettingsReq.result.selectedThemeId
                }
                // 检查selectedSearchEngineId是否存在
                const engineReq = searchEnginesStore.get(settingsToImport.selectedSearchEngineId)
                engineReq.onsuccess = () => {
                  if (!engineReq.result) {
                    // 搜索引擎不存在，保持原值
                    if (currentSettingsReq.result) {
                      settingsToImport.selectedSearchEngineId = currentSettingsReq.result.selectedSearchEngineId
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
                  // 搜索引擎不存在，保持原值
                  const currentSettingsReq = settingsStore.get('settings')
                  currentSettingsReq.onsuccess = () => {
                    if (currentSettingsReq.result) {
                      settingsToImport.selectedSearchEngineId = currentSettingsReq.result.selectedSearchEngineId
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

      // 开始处理第一个表
      processNextTable()

      // 事务错误处理
      transaction.onerror = () => {
        reject(new Error('事务失败：' + transaction.error))
      }
    })
  }