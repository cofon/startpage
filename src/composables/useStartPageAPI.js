export function useStartPageAPI(db, websiteStore, searchStore) {
  /**
   * 初始化 StartPageAPI
   */
  async function initStartPageAPI() {
    // ========== 暴露全局 API 给插件调用 ==========
    console.log('[App.vue] 准备设置 window.StartPageAPI')

    // 检查是否已存在
    if (window.StartPageAPI) {
      console.warn('[App.vue] ⚠️ window.StartPageAPI 已存在，将被覆盖！')
    }

    window.StartPageAPI = {
      /**
       * 添加单个网站
       * @param {Object} data - 网站数据对象
       * @returns {Promise<number>} - 返回新网站的 ID
       */
      addWebsite: async (data) => {
        console.log('[StartPageAPI] 添加网站:', data)

        // ========== 验证数据 ==========
        const { validateWebsite } = await import('../services/websiteMetadataService')
        const validation = validateWebsite(data)

        if (!validation.valid) {
          console.error('[StartPageAPI] ❌ 验证失败:', validation.errors)
          throw new Error(validation.errors.join('、'))
        }

        // ========== 检查 URL 是否已存在（双重保护） ==========
        const allWebsites = await db.getAllWebsites()
        const { checkUrlExists } = await import('../services/websiteMetadataService')
        const urlCheckResult = checkUrlExists(data.url, allWebsites)

        if (urlCheckResult.exists) {
          console.error(
            '[StartPageAPI] ❌ URL 已存在:',
            data.url,
            '现有网站 ID:',
            urlCheckResult.websiteId,
          )
          throw new Error(`该网址已存在（ID: ${urlCheckResult.websiteId}），请勿重复添加`)
        }

        // ========== 根域名复用策略 ==========
        const { extractRootDomain } = await import('../utils/websiteUtils')

        try {
          const urlObj = new URL(data.url.startsWith('http') ? data.url : 'http://' + data.url)
          const hostname = urlObj.hostname
          const rootDomain = extractRootDomain(hostname)

          console.log('[StartPageAPI] 提取的根域名:', rootDomain)

          if (rootDomain) {
            // 在现有网站中查找是否有相同根域名的
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
              // 找到相同根域名的网站，复用它的 SVG
              data.iconGenerateData = websiteWithSameRoot.iconGenerateData
              console.log(
                '[StartPageAPI] ✓ 找到相同根域名的网站，已复用 SVG:',
                websiteWithSameRoot.name,
              )
              console.log('[StartPageAPI]   来源网站:', websiteWithSameRoot.url)
            } else {
              console.log('[StartPageAPI] - 未找到相同根域名的网站，将生成新 SVG')
            }
          }
        } catch (error) {
          console.warn('[StartPageAPI] 无法提取根域名，将生成新 SVG:', error.message)
        }

        // ========== 标准化数据 ==========
        const { normalizeWebsiteData } = await import('../services/websiteMetadataService')
        const normalizedData = normalizeWebsiteData(data)

        console.log('[StartPageAPI] 验证通过，标准化后的数据:', normalizedData)

        // 使用标准化后的数据更新 store（store 内部会保存到数据库）
        const newWebsite = await websiteStore.addWebsite(normalizedData)

        console.log('[StartPageAPI] 添加成功，ID:', newWebsite.id)

        return newWebsite.id
      },

      /**
       * 批量导入网站
       * @param {Array} websites - 网站数组
       * @returns {Promise<Object>} - 返回导入结果统计
       */
      importWebsites: async (websites) => {
        console.log('[StartPageAPI] 批量导入网站，数量:', websites.length)

        let successCount = 0
        let errorCount = 0
        const errors = []

        for (let i = 0; i < websites.length; i++) {
          try {
            const website = websites[i]

            // ========== 修改：使用新的 websiteMetadataService ==========
            // 1. 验证数据（宽松验证）
            const { validateWebsite } = await import('../services/websiteMetadataService')
            const validation = validateWebsite(website)

            if (!validation.valid) {
              console.warn(`[StartPageAPI] ⚠️ 第 ${i + 1} 个网站验证失败:`, validation.errors)
              // 继续尝试标准化和保存
            }

            // 2. 标准化数据（会自动生成缺失的字段）
            const { normalizeWebsiteData } = await import('../services/websiteMetadataService')
            const normalizedData = normalizeWebsiteData(website)

            console.log(`[StartPageAPI] 标准化后的数据 (${i + 1}):`, normalizedData)

            // 3. 使用 websiteStore.addWebsite 统一处理保存逻辑
            await websiteStore.addWebsite(normalizedData)

            successCount++
          } catch (error) {
            console.error(`[StartPageAPI] 导入第 ${i + 1} 个网站失败:`, error)
            errorCount++
            errors.push({
              index: i,
              url: websites[i]?.url || 'unknown',
              error: error.message,
            })
          }
        }

        console.log(`[StartPageAPI] 导入完成：成功 ${successCount}, 失败 ${errorCount}`)

        return {
          total: websites.length,
          success: successCount,
          failed: errorCount,
          errors,
        }
      },

      /**
       * 获取所有网站
       * @returns {Promise<Array>} - 返回网站数组
       */
      getWebsites: async () => {
        return await db.getAllWebsites()
      },

      /**
       * 更新网站
       * @param {number} id - 网站 ID
       * @param {Object} data - 更新的数据
       * @returns {Promise<void>}
       */
      updateWebsite: async (id, data) => {
        console.log('[StartPageAPI] 更新网站:', id, data)
        await db.updateWebsite(id, data)

        // 更新 store
        websiteStore.updateWebsite(id, data)
      },

      /**
       * 导出所有网站
       * @returns {Promise<Object>} - 返回导出数据
       */
      exportWebsites: async () => {
        console.log('[StartPageAPI] 导出所有网站')
        const websites = await db.getAllWebsites()
        return {
          websites,
          count: websites.length,
        }
      },

      // ========== 新增方法（重构方案 Phase 2） ==========

      /**
       * 批量补全网站元数据（供插件调用）
       * @param {Array} websites - 网站数组
       * @param {Function} progressCallback - 进度回调函数 (processed, total)
       * @returns {Promise<Array>} 补全后的网站数组
       */
      enrichWebsites: async (websites, progressCallback) => {
        console.log('[StartPageAPI] 补全网站元数据，数量:', websites.length)

        // 动态导入 service（避免循环依赖）
        const { batchEnrichMetadata } = await import('../services/websiteMetadataService')

        // 调用 service 进行批量补全
        return await batchEnrichMetadata(websites, progressCallback)
      },

      /**
       * 验证网站数据（供插件调用）
       * @param {Object} websiteData - 网站数据
       * @returns {Object} { valid: boolean, errors: string[] }
       */
      validateWebsite: async (websiteData) => {
        const { validateWebsite } = await import('../services/websiteMetadataService')
        return validateWebsite(websiteData)
      },

      /**
       * 标准化网站数据（供插件调用）
       * @param {Object} websiteData - 网站数据
       * @returns {Object} 标准化的网站对象
       */
      normalizeWebsite: async (websiteData) => {
        const { normalizeWebsiteData } = await import('../services/websiteMetadataService')
        return normalizeWebsiteData(websiteData)
      },

      /**
       * 生成默认 SVG 图标（供插件调用）
       * @param {string} name - 网站名称或 URL
       * @returns {Promise<string>} SVG 字符串
       */
      generateDefaultIcon: async (name) => {
        const { generateDefaultIcon } = await import('../utils/websiteUtils')
        return generateDefaultIcon(name)
      },

      /**
       * 检查 URL 是否已存在（供插件调用）
       * @param {Object} data - { url: string }
       * @returns {Promise<{exists: boolean, websiteId?: number, websiteName?: string}>}
       */
      checkUrlExists: async (data) => {
        const allWebsites = await db.getAllWebsites()
        const { checkUrlExists } = await import('../services/websiteMetadataService')
        return checkUrlExists(data.url, allWebsites)
      },
    }

    // ========== 监听来自 Content Script 的 CustomEvent ==========
    // 防止重复注册监听器
    if (!window.startPageAPIListenerRegistered) {
      window.startPageAPIListenerRegistered = true
      console.log('[App.vue] 注册 StartPageAPI-Call 监听器')

      document.addEventListener('StartPageAPI-Call', async (event) => {
        console.log('[App.vue] 收到 StartPageAPI-Call 事件:', event.detail)

        const { action, method, data, requestId } = event.detail

        try {
          let result

          // 处理 action 类型的调用（保持向后兼容）
          if (action === 'addWebsite') {
            result = await window.StartPageAPI.addWebsite(data)
          } else if (action === 'importWebsites') {
            result = await window.StartPageAPI.importWebsites(data)
          } else if (action === 'exportWebsites') {
            result = await window.StartPageAPI.exportWebsites()
          } else if (action === 'getWebsites') {
            result = await window.StartPageAPI.getWebsites()
          } else if (action === 'updateWebsite') {
            result = await window.StartPageAPI.updateWebsite(data.id, data)
          }
          // 新增：处理 method 类型的调用（通用 API）
          else if (method === 'normalizeWebsite') {
            result = await window.StartPageAPI.normalizeWebsite(data)
          } else if (method === 'generateDefaultIcon') {
            result = await window.StartPageAPI.generateDefaultIcon(data)
          } else if (method === 'validateWebsite') {
            result = await window.StartPageAPI.validateWebsite(data)
          } else if (method === 'checkUrlExists') {
            result = await window.StartPageAPI.checkUrlExists(data)
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
          console.log('[App.vue] 已发送响应事件')
        } catch (error) {
          console.error('[App.vue] 处理请求失败:', error)

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
