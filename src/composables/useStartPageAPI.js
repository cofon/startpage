// 统一日志前缀
const LOG_PREFIX = '[StartPageAPI]'

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

export function useStartPageAPI(db, websiteStore, searchStore) {
  /**
   * 初始化 StartPageAPI
   */
  async function initStartPageAPI() {
    // ========== 一次性导入所有需要的模块 ==========
    log('正在加载依赖模块...')
    const [
      { validateWebsite, normalizeWebsiteData, checkUrlExists, batchEnrichMetadata, fetchMetadataFromLocalApi },
      { extractRootDomain, generateDefaultIcon }
    ] = await Promise.all([
      import('../services/websiteMetadataService'),
      import('../utils/website/websiteUtils')
    ])
    log('依赖模块加载完成')

    // ========== 暴露全局 API 给插件调用 ==========
    log('准备设置 window.StartPageAPI')

    // 检查是否已存在
    if (window.StartPageAPI) {
      logWarn('⚠️ window.StartPageAPI 已存在，将被覆盖！')
    }

    // ========== 内部方法定义 ==========

    /**
     * 添加单个网站
     */
    async function addWebsite(data) {
      // 参数验证
      if (!data || typeof data !== 'object') {
        throw new Error('无效的网站数据')
      }
      if (!data.url) {
        throw new Error('网站 URL 不能为空')
      }

      log('添加网站:', data)

      // 验证数据
      const validation = validateWebsite(data)
      if (!validation.valid) {
        logError('❌ 验证失败:', validation.errors)
        throw new Error(validation.errors.join('、'))
      }

      // 检查 URL 是否已存在
      const allWebsites = await db.getAllWebsites()
      const urlCheckResult = checkUrlExists(data.url, allWebsites)

      if (urlCheckResult.exists) {
        logError('❌ URL 已存在:', {
          url: data.url,
          websiteId: urlCheckResult.websiteId
        })
        throw new Error(`该网址已存在（ID: ${urlCheckResult.websiteId}），请勿重复添加`)
      }

      // 根域名复用策略
      try {
        const urlObj = new URL(data.url.startsWith('http') ? data.url : 'http://' + data.url)
        const hostname = urlObj.hostname
        const rootDomain = extractRootDomain(hostname)

        log('提取的根域名:', rootDomain)

        if (rootDomain) {
          const websiteWithSameRoot = allWebsites.find((w) => {
            try {
              const wUrlObj = new URL(w.url)
              const wRootDomain = extractRootDomain(wUrlObj.hostname)
              return wRootDomain === rootDomain && w.iconGenerateData
            } catch {
              return false
            }
          })

          if (websiteWithSameRoot) {
            data.iconGenerateData = websiteWithSameRoot.iconGenerateData
            log('✓ 找到相同根域名的网站，已复用 SVG:', {
              name: websiteWithSameRoot.name,
              url: websiteWithSameRoot.url
            })
          } else {
            log('- 未找到相同根域名的网站，将生成新 SVG')
          }
        }
      } catch (error) {
        logWarn('无法提取根域名，将生成新 SVG:', error.message)
      }

      // 标准化数据
      const normalizedData = normalizeWebsiteData(data)
      log('验证通过，标准化后的数据:', normalizedData)

      // 保存到数据库和 store
      const newWebsite = await websiteStore.addWebsite(normalizedData)
      log('添加成功，ID:', newWebsite.id)

      return newWebsite.id
    }

    /**
     * 批量导入网站
     */
    async function importWebsites(websites) {
      // 参数验证
      if (!Array.isArray(websites)) {
        throw new Error('网站数据必须是数组')
      }

      log('批量导入网站，数量:', websites.length)

      let successCount = 0
      let errorCount = 0
      const errors = []

      for (let i = 0; i < websites.length; i++) {
        try {
          const website = websites[i]

          // 验证数据（宽松验证）
          const validation = validateWebsite(website)
          if (!validation.valid) {
            logWarn(`⚠️ 第 ${i + 1} 个网站验证失败:`, validation.errors)
          }

          // 标准化数据
          let normalizedData = normalizeWebsiteData(website)
          log(`标准化后的数据 (${i + 1}):`, normalizedData)

          // 如果缺少 title、description 或 iconData，尝试从插件获取
          if (!normalizedData.title || !normalizedData.description || !normalizedData.iconData) {
            log(`尝试从插件获取元数据：${normalizedData.url}`)
            try {
              const metadata = await fetchMetadataFromLocalApi(normalizedData.url)
              if (metadata) {
                // 只补全缺失的字段
                if (!normalizedData.title && metadata.title) {
                  normalizedData.title = metadata.title
                }
                if (!normalizedData.description && metadata.description) {
                  normalizedData.description = metadata.description
                }
                if (!normalizedData.iconData && metadata.iconData) {
                  normalizedData.iconData = metadata.iconData
                }
                log(`插件返回的元数据:`, metadata)
                log(`补全后的数据 (${i + 1}):`, normalizedData)
              } else {
                // 获取失败：添加 meta_failed 标签
                logWarn(`⚠️ 无法获取元数据：${normalizedData.url}`)
                if (!normalizedData.tags) {
                  normalizedData.tags = []
                } else if (typeof normalizedData.tags === 'string') {
                  normalizedData.tags = normalizedData.tags.split(',').map(t => t.trim()).filter(t => t)
                }
                
                if (!normalizedData.tags.includes('meta_failed')) {
                  normalizedData.tags.push('meta_failed')
                  log(`✗ 已添加 "meta_failed" 标签到：${normalizedData.url}`)
                }
              }
            } catch (error) {
              // 网络错误、SSL 问题等不处理，只记录日志
              logWarn(`获取元数据失败 (${normalizedData.url}): ${error.message}`)
              
              // 获取失败：添加 meta_failed 标签
              if (!normalizedData.tags) {
                normalizedData.tags = []
              } else if (typeof normalizedData.tags === 'string') {
                normalizedData.tags = normalizedData.tags.split(',').map(t => t.trim()).filter(t => t)
              }
              
              if (!normalizedData.tags.includes('meta_failed')) {
                normalizedData.tags.push('meta_failed')
                log(`✗ 已添加 "meta_failed" 标签到：${normalizedData.url}`)
              }
            }
          }

          // 保存
          await websiteStore.addWebsite(normalizedData)
          successCount++
        } catch (error) {
          logError(`导入第 ${i + 1} 个网站失败:`, error)
          errorCount++
          errors.push({
            index: i,
            url: websites[i]?.url || 'unknown',
            error: error.message,
          })
        }
      }

      log(`导入完成：成功 ${successCount}, 失败 ${errorCount}`)

      return {
        total: websites.length,
        success: successCount,
        failed: errorCount,
        errors,
      }
    }

    /**
     * 获取所有网站
     */
    async function getWebsites() {
      return await db.getAllWebsites()
    }

    /**
     * 更新网站
     */
    async function updateWebsite(id, data) {
      // 参数验证
      if (!id) {
        throw new Error('网站 ID 不能为空')
      }
      if (!data || typeof data !== 'object') {
        throw new Error('无效的更新数据')
      }

      log('更新网站:', { id, data })
      await db.updateWebsite(id, data)
      websiteStore.updateWebsite(id, data)
    }

    /**
     * 导出所有网站
     */
    async function exportWebsites() {
      log('导出所有网站')
      const websites = await db.getAllWebsites()
      return {
        websites,
        count: websites.length,
      }
    }

    /**
     * 批量补全网站元数据
     */
    async function enrichWebsites(websites, progressCallback) {
      // 参数验证
      if (!Array.isArray(websites)) {
        throw new Error('网站数据必须是数组')
      }

      log('补全网站元数据，数量:', websites.length)
      return await batchEnrichMetadata(websites, progressCallback)
    }

    /**
     * 验证网站数据
     */
    async function validateWebsiteAPI(websiteData) {
      // 参数验证
      if (!websiteData || typeof websiteData !== 'object') {
        throw new Error('无效的网站数据')
      }
      return validateWebsite(websiteData)
    }

    /**
     * 标准化网站数据
     */
    async function normalizeWebsiteAPI(websiteData) {
      // 参数验证
      if (!websiteData || typeof websiteData !== 'object') {
        throw new Error('无效的网站数据')
      }
      return normalizeWebsiteData(websiteData)
    }

    /**
     * 生成默认 SVG 图标
     */
    async function generateDefaultIconAPI(name) {
      // 参数验证
      if (!name || typeof name !== 'string') {
        throw new Error('网站名称或 URL 不能为空')
      }
      return generateDefaultIcon(name)
    }

    /**
     * 检查 URL 是否已存在
     */
    async function checkUrlExistsAPI(data) {
      // 参数验证
      if (!data || !data.url) {
        throw new Error('URL 不能为空')
      }
      const allWebsites = await db.getAllWebsites()
      return checkUrlExists(data.url, allWebsites)
    }

    /**
     * 获取所有标签
     */
    async function getAllTags() {
      const allWebsites = await db.getAllWebsites()
      const tagsSet = new Set()
      allWebsites.forEach(website => {
        if (website.tags && Array.isArray(website.tags)) {
          website.tags.forEach(tag => tagsSet.add(tag))
        }
      })
      return Array.from(tagsSet).sort()
    }

    // ========== 暴露全局 API ==========
    window.StartPageAPI = {
      addWebsite,
      importWebsites,
      getWebsites,
      updateWebsite,
      exportWebsites,
      enrichWebsites,
      validateWebsite: validateWebsiteAPI,
      normalizeWebsite: normalizeWebsiteAPI,
      generateDefaultIcon: generateDefaultIconAPI,
      checkUrlExists: checkUrlExistsAPI,
      getAllTags,
    }

    // ========== 监听来自 Content Script 的 CustomEvent ==========
    // 防止重复注册监听器
    if (!window.startPageAPIListenerRegistered) {
      window.startPageAPIListenerRegistered = true
      console.log('[App.vue] 注册 StartPageAPI-Call 监听器')

      document.addEventListener('StartPageAPI-Call', async (event) => {
        log('收到 StartPageAPI-Call 事件:', event.detail)

        const { action, method, data, requestId } = event.detail

        try {
          // Action 白名单
          const ALLOWED_ACTIONS = new Set([
            'addWebsite',
            'importWebsites',
            'exportWebsites',
            'getWebsites',
            'updateWebsite'
          ])

          // Method 白名单
          const ALLOWED_METHODS = new Set([
            'normalizeWebsite',
            'checkUrlExists',
            'validateWebsite',
            'generateDefaultIcon',
            'getAllTags'
          ])

          // 验证 action 或 method
          if (!action && !method) {
            throw new Error('缺少 action 或 method 参数')
          }

          if (action && !ALLOWED_ACTIONS.has(action)) {
            throw new Error(`不支持的 action: ${action}`)
          }

          if (method && !ALLOWED_METHODS.has(method)) {
            throw new Error(`不支持的 method: ${method}`)
          }

          let result

          // 处理 action 类型的调用（保持向后兼容）
          if (action === 'addWebsite') {
            result = await addWebsite(data)
          } else if (action === 'importWebsites') {
            result = await importWebsites(data)
          } else if (action === 'exportWebsites') {
            result = await exportWebsites()
          } else if (action === 'getWebsites') {
            result = await getWebsites()
          } else if (action === 'updateWebsite') {
            result = await updateWebsite(data.id, data)
          }
          // 处理 method 类型的调用（通用 API）
          else if (method === 'normalizeWebsite') {
            result = await normalizeWebsiteAPI(data)
          } else if (method === 'generateDefaultIcon') {
            result = await generateDefaultIconAPI(data)
          } else if (method === 'validateWebsite') {
            result = await validateWebsiteAPI(data)
          } else if (method === 'checkUrlExists') {
            result = await checkUrlExistsAPI(data)
          } else if (method === 'getAllTags') {
            result = await getAllTags()
          } else {
            throw new Error('未知操作：' + (action || method))
          }

          // 发送响应事件
          const responseEvent = new CustomEvent('StartPageAPI-Response', {
            detail: {
              requestId,
              success: true,
              result,
            },
          })
          document.dispatchEvent(responseEvent)
          log('已发送响应事件')
        } catch (error) {
          logError('处理请求失败:', error)

          // 发送错误响应
          const responseEvent = new CustomEvent('StartPageAPI-Response', {
            detail: {
              requestId,
              success: false,
              error: error.message || '操作失败',
            },
          })
          document.dispatchEvent(responseEvent)
        }
      })

      console.log('[StartPageAPI] 全局 API 已就绪，CustomEvent 监听器已添加')
    } else {
      console.log('[App.vue] StartPageAPI-Call 监听器已注册过，跳过')
    }
  }

  return {
    initStartPageAPI
  }
}
