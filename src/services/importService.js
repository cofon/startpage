/**
 * 导入服务
 * 统一处理起始页的数据导入逻辑
 *
 * 功能：
 * - 支持多种导入模式：full、edge收藏夹、websites、urls
 * - 数据验证和格式判断
 * - 数据完整性检查
 * - 批量补全元数据（通过插件）
 * - 进度管理和错误处理
 * - 原数据导入选项
 * - Edge收藏夹解析
 *
 * @module services/importService
 */

// 导入依赖（按需引入）
import {
  normalizeUrl,
  isWebsiteComplete,
  getMissingMeatFields,
  normalizeWebsiteData,
} from '../utils/website/websiteUtils'
import { fetchMetadata } from '../services/websiteMetadataService'
import db from '../utils/database'
import { PerformanceMonitor, BatchProcessor, MemoryOptimizer } from '../utils/performanceMonitor'

/**
 * 导入数据的主入口
 * @param {Object} jsonData - 解析后的 JSON 数据
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 导入模式：'auto' | 'full' | 'websites' | 'urls' | 'edge'
 * @param {boolean} options.originalImport - 原数据导入选项：true | false
 * @param {string} options.onDuplicate - 重复数据处理：'skip' | 'overwrite'
 * @param {boolean} options.addNewTag - 空标签处理：true | false（是否添加"new"标签）
 * @param {boolean} options.addMetaFailedTag - 是否添加meta_failed标签：true | false
 * @param {boolean} options.enrichData - 是否补全数据：true | false
 * @param {string} options.onIncomplete - 不完整数据处理：'enrich' | 'skip' | 'use-default'
 * @param {number} options.batchSize - 每批处理数量
 * @param {number} options.timeout - 插件响应超时时间（毫秒）
 * @param {Function} options.onProgress - 进度回调 (progress) => {}
 * @param {Function} options.onComplete - 完成回调 (result) => {}
 * @returns {Promise<Object>} 导入结果
 */
export async function importData(jsonData, options = {}) {
  // 创建性能监控器
  const monitor = new PerformanceMonitor()
  monitor.start()

  // 默认配置
  const config = {
    mode: options.mode || 'auto',
    originalImport: options.originalImport || false,
    onDuplicate: options.onDuplicate || 'skip',
    addNewTag: options.addNewTag || false,
    addMetaFailedTag: options.addMetaFailedTag || true,
    enrichData: options.enrichData || true,
    onIncomplete: options.onIncomplete || 'enrich',
    batchSize: options.batchSize || 20,
    timeout: options.timeout || 10000,
    onProgress: options.onProgress || (() => {}),
    onComplete: options.onComplete || (() => {}),
  }

  // 开始验证阶段
  monitor.startPhase('validation')

  // 验证数据格式
  const validation = validateImportData(jsonData)
  if (!validation.valid) {
    monitor.endPhase()
    monitor.end()
    throw new Error(validation.errors.join('\n'))
  }

  // 结束验证阶段
  monitor.endPhase()

  // 判断导入类型
  const importType = config.mode === 'auto' ? validation.type : config.mode

  // 导入结果
  let result = {
    success: 0,
    failed: 0,
    skipped: 0,
    updated: 0,
    errors: [],
  }

  // 原数据导入选项，优先级最高
  if (config.originalImport) {
    // 检查数据库websites表是否为空
    const existingWebsites = await db.getAllWebsites()
    if (existingWebsites && existingWebsites.length > 0) {
      throw new Error('数据库中已存在网站数据，原数据导入选项要求数据库为空')
    }
    
    // 直接导入所有数据，不做任何修改
    // 先导入websites数据
    if (jsonData.websites && Array.isArray(jsonData.websites)) {
      // 处理空标签
      if (config.addNewTag) {
        jsonData.websites = jsonData.websites.map(website => {
          if (!website.tags || website.tags.length === 0) {
            website.tags = ['new']
          }
          return website
        })
      }
      result = await importWebsitesToDB(jsonData.websites, {
        ...config,
        onDuplicate: 'overwrite'
      }, monitor)
    }
    
    // 处理其他数据类型
    await importOtherData(jsonData, config, monitor)
  } else {
    // 优先处理 websites 数据
    if (jsonData.websites && Array.isArray(jsonData.websites)) {
      // 处理空标签
      if (config.addNewTag) {
        jsonData.websites = jsonData.websites.map(website => {
          if (!website.tags || website.tags.length === 0) {
            website.tags = ['new']
          }
          return website
        })
      }
      result = await importWebsites(jsonData.websites, config, monitor)
    } else if (importType === 'urls' && jsonData.urls) {
      jsonData.websites = urlsToWebsites(jsonData.urls)
      // 处理空标签
      if (config.addNewTag) {
        jsonData.websites = jsonData.websites.map(website => {
          if (!website.tags || website.tags.length === 0) {
            website.tags = ['new']
          }
          return website
        })
      }
      result = await importWebsites(jsonData.websites, config, monitor)
    }
    
    // 处理其他数据类型
    await importOtherData(jsonData, config, monitor)
  }

  // 如果没有 websites 数据，设置一个默认结果
  if (importType === 'other' && !config.originalImport) {
    result = {
      success: 0,
      failed: 0,
      skipped: 0,
      updated: 0,
      errors: [],
    }
  }

  // 结束监控并打印报告
  monitor.end()

  // 调用完成回调
  config.onComplete(result)

  return result
}

/**
 * 验证导入数据格式
 * @param {Object} data - JSON 数据
 * @returns {Object} { valid: boolean, type: string, errors: string[] }
 */
export function validateImportData(data) {
  const errors = []

  // 检查数据是否为对象
  if (!data || typeof data !== 'object') {
    errors.push('数据格式错误：根节点必须是对象')
    return { valid: false, type: 'unknown', errors }
  }

  // 检查是否包含任何有效数据
  const hasWebsites = data.websites && Array.isArray(data.websites)
  const hasUrls = data.urls && Array.isArray(data.urls)
  const hasThemes = data.themes && Array.isArray(data.themes)
  const hasSearchEngines = data.searchEngines && Array.isArray(data.searchEngines)
  const hasSettings = data.settings && typeof data.settings === 'object'

  if (!hasWebsites && !hasUrls && !hasThemes && !hasSearchEngines && !hasSettings) {
    errors.push('数据格式错误：必须包含 websites、urls、themes、searchEngines 或 settings 字段')
    return { valid: false, type: 'unknown', errors }
  }

  // 确定导入类型（优先考虑 websites）
  let type = 'unknown'
  if (hasWebsites) {
    type = 'websites'
  } else if (hasUrls) {
    type = 'urls'
  } else if (hasThemes || hasSearchEngines || hasSettings) {
    type = 'other'
  }

  return { valid: true, type, errors }
}

/**
 * 将 URL 数组转换为网站对象数组
 * @param {Array} urls - URL 数组
 * @returns {Array} 网站对象数组
 */
function urlsToWebsites(urls) {
  return urls.map((url) => ({ url }))
}

/**
 * 解析Edge收藏夹HTML文件
 * @param {string} htmlContent - HTML文件内容
 * @returns {Array} 网站对象数组
 */
export function parseEdgeFavorites(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const websites = []

  // 查找所有A标签
  const links = doc.querySelectorAll('a')
  links.forEach(link => {
    const url = link.getAttribute('href')
    const title = link.textContent.trim()
    const addDate = link.getAttribute('ADD_DATE')
    const icon = link.getAttribute('ICON')
    
    if (url && title) {
      const website = {
        url,
        title
      }
      
      // 添加iconData（如果存在）
      if (icon) {
        website.iconData = icon
      }
      
      // 添加createdAt（如果存在）
      if (addDate) {
        // 将Unix时间戳转换为ISO日期字符串
        website.createdAt = new Date(parseInt(addDate) * 1000).toISOString()
      }
      
      websites.push(website)
    }
  })

  return websites
}

/**
 * 判断导入类型
 * @param {Object} data - JSON 数据
 * @returns {string} 'websites' | 'urls' | 'unknown'
 */
export function getImportType(data) {
  const validation = validateImportData(data)
  return validation.type
}

/**
 * 分离完整和不完整的网站
 * @param {Array} websites - 网站数组
 * @returns {Object} { complete: [], incomplete: [] }
 */
export function separateWebsites(websites) {
  const complete = []
  const incomplete = []

  for (const website of websites) {
    // 对于Edge收藏夹导入的网站，即使有title，也需要获取元数据以获取更好的icon和description
    // 因此所有网站都需要处理
    incomplete.push(website)
  }

  return { complete, incomplete }
}

/**
 * 批量补全网站元数据（只补全插件可提供的字段）
 * @param {Array} websites - 需要补全的网站数组（应该都是不完整的）
 * @param {Object} config - 配置选项
 * @param {Function} progressCallback - 进度回调
 * @returns {Promise<Array>} 补全后的网站数组
 */
export async function enrichWebsites(websites, config, progressCallback) {
  const total = websites.length
  // 并行处理，提高导入速度，固定批量大小为 8，避免浏览器卡顿
  const batchSize = 8;
  
  for (let i = 0; i < websites.length; i += batchSize) {
    const batch = websites.slice(i, i + batchSize);
    
    // 并行处理当前批次
    await Promise.all(
      batch.map(async (website) => {
        try {
          console.log(`[ImportService] 🔍 尝试获取元数据：${website.url}`)
          const metadata = await fetchMetadata(website.url)

          if (metadata) {
            // ✅ 成功：补全插件负责的字段
            // title：优先使用edge收藏夹提供的，只有在没有时才使用扩展获取的
            if (!website.title && metadata.title) {
              website.title = metadata.title
              console.log(`[ImportService] ✓ 已补全 title: ${metadata.title}`)
            }
            // description：edge收藏夹没有提供，使用扩展获取的
            if (metadata.description) {
              website.description = metadata.description
              console.log(`[ImportService] ✓ 已补全 description`)
            }
            // iconData：优先使用扩展获取的，覆盖edge收藏夹提供的（因为edge的icon太小）
            if (metadata.iconData) {
              website.iconData = metadata.iconData
              console.log(`[ImportService] ✓ 已补全 iconData (长度：${metadata.iconData.length})`)
            }
          } else {
            // ❌ 失败：添加 meta_failed 标签
            // 根据新逻辑：如果用户选择添加meta_failed标签，且网站没有title和desc，则添加
            if (config.addMetaFailedTag && !website.title && !website.description) {
              console.warn(`[ImportService] ⚠️ 无法获取元数据：${website.url}`)

              // 初始化 tags 数组
              if (!website.tags) {
                website.tags = []
              } else if (typeof website.tags === 'string') {
                website.tags = website.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter((t) => t)
              }

              // 添加标签（避免重复）
              if (!website.tags.includes('meta_failed')) {
                website.tags.push('meta_failed')
                console.log(`[ImportService] ✗ 已添加 "meta_failed" 标签到：${website.url}`)
              }
            }
          }
        } catch (error) {
          console.error(`[ImportService] ❌ 补全失败：${website.url}`, error)
          // 继续处理下一个网站
        }
      })
    );

    // 更新进度
    const processed = Math.min(i + batchSize, total);
    if (progressCallback) {
      progressCallback({
        phase: 'enriching',
        processed,
        total,
        message: `正在补全网站元数据... (${processed}/${total})`,
      })
    }
  }

  return websites
}

/**
 * 标准化网站数据
 * @param {Array} websites - 网站数组
 * @returns {Array} 标准化后的网站数组
 */
export function normalizeWebsites(websites) {
  return websites.map((website) => normalizeWebsiteData(website))
}

/**
 * 批量导入网站到数据库
 * @param {Array} websites - 网站数组
 * @param {Object} config - 配置选项
 * @param {Object} monitor - 性能监控器
 * @param {Map} existingUrlsMap - 数据库中已存在的 URL 映射（可选）
 * @returns {Promise<Object>} 导入结果
 */
export async function importWebsitesToDB(websites, config, monitor, existingUrlsMap = null) {
  // 开始数据库导入阶段
  monitor.startPhase('database')

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    updated: 0,
    errors: [],
  }

  // 如果没有传入 existingUrlsMap，则获取所有现有网站
  const existingUrls = existingUrlsMap ? new Set(existingUrlsMap.keys()) : new Set()

  if (!existingUrlsMap) {
    const existingWebsites = await db.getAllWebsites()
    existingWebsites.forEach((w) => existingUrls.add(w.url))
  }

  // 检查内存使用
  MemoryOptimizer.checkMemoryUsage(500)

  // 确保数据库已初始化
  if (!db.db) {
    await db.init()
  }
  
  // 分块处理，每块使用单独的事务
  const chunkSize = 100; // 每块处理 100 个网站
  for (let i = 0; i < websites.length; i += chunkSize) {
    const chunk = websites.slice(i, i + chunkSize);
    
    // 使用事务批量处理当前块
    await new Promise((resolve, reject) => {
      const transaction = db.db.transaction(['websites'], 'readwrite');
      const store = transaction.objectStore('websites');
      
      let completed = 0;
      const total = chunk.length;
      
      chunk.forEach(website => {
        try {
          // 检查 URL 是否已存在
          if (existingUrls.has(website.url)) {
            if (config.onDuplicate === 'skip') {
              result.skipped++
              monitor.recordSuccess()
              completed++
              if (completed === total) resolve();
            } else if (config.onDuplicate === 'update') {
              const request = store.put(website);
              request.onsuccess = () => {
                result.updated++
                monitor.recordSuccess()
                completed++
                if (completed === total) resolve();
              };
              request.onerror = (event) => {
                console.error('[ImportService] ❌ 更新失败:', website.url, event.target.error)
                result.failed++
                result.errors.push({
                  url: website.url,
                  error: event.target.error.message || '未知错误',
                })
                monitor.recordFailure()
                completed++
                if (completed === total) resolve();
              };
            }
          } else {
            // 导入网站，确保删除 id 字段，让 IndexedDB 自动生成
            const plainWebsite = JSON.parse(JSON.stringify(website));
            delete plainWebsite.id;
            const request = store.add(plainWebsite);
            request.onsuccess = () => {
              result.success++
              monitor.recordSuccess()
              completed++
              if (completed === total) resolve();
            };
            request.onerror = (event) => {
              console.error('[ImportService] ❌ 导入失败:', website.url, event.target.error)
              result.failed++
              result.errors.push({
                url: website.url,
                error: event.target.error.message || '未知错误',
              })
              monitor.recordFailure()
              completed++
              if (completed === total) resolve();
            };
          }
        } catch (error) {
          console.error('[ImportService] ❌ 处理失败:', website.url, error)
          result.failed++
          result.errors.push({
            url: website.url,
            error: error.message || '未知错误',
          })
          monitor.recordFailure()
          completed++
          if (completed === total) resolve();
        }
      });
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        reject(event.target.error);
      };
    });
    
    // 更新进度
    const processed = Math.min(i + chunkSize, websites.length);
    if (config.onProgress) {
      config.onProgress({
        phase: 'importing',
        processed,
        total: websites.length,
        message: `正在导入网站到数据库... (${processed}/${websites.length})`,
      })
    }
  }

  // 结束数据库导入阶段
  monitor.endPhase()

  return result
}

/**
 * 导入 websites 数据
 * @param {Array} websites - 网站数组
 * @param {Object} config - 配置选项
 * @returns {Promise<Object>} 导入结果
 */
async function importWebsites(websites, config, monitor) {
  // ========== 新增：数据库完整性检查 ==========
  monitor.startPhase('db_check')

  if (config.onProgress) {
    config.onProgress({
      phase: 'db_check',
      processed: 0,
      total: websites.length,
      message: `正在检查数据库中已存在的网站...`,
    })
  }

  // 获取数据库中所有现有网站
  const existingWebsitesInDB = await db.getAllWebsites()
  const existingUrlsMap = new Map(existingWebsitesInDB.map((w) => [w.url, w]))

  // 分类处理
  const skipWebsites = [] // 数据库中已存在且完整，直接跳过
  const needImportWebsites = [] // 需要导入或补全的网站

  // ========== 详细日志记录 ==========
  const logDetails = {
    total: websites.length,
    existedComplete: 0,
    existedIncomplete: 0,
    newImport: 0,
    urls: {
      skip: [],
      update: [],
      create: [],
    },
  }

  for (const website of websites) {
    // ========== 新增：URL 规范化处理 ==========
    // 对导入的 URL 进行规范化
    // https://www.bilibili.com/ --> https://www.bilibili.com
    const normalizedImportUrl = normalizeUrl(website.url)

    // 在 existingUrlsMap 中查找时，需要遍历所有键并进行规范化比较
    let existingWebsite = null
    for (const [dbUrl, dbWebsite] of existingUrlsMap.entries()) {
      const normalizedDbUrl = normalizeUrl(dbUrl)
      if (normalizedDbUrl === normalizedImportUrl) {
        existingWebsite = dbWebsite
        break
      }
    }

    if (existingWebsite) {
      // URL 已存在，检查数据库中数据的完整性
      const isCompleteInDB = isWebsiteComplete(existingWebsite)

      if (isCompleteInDB) {
        // 数据库中数据完整，直接跳过
        console.log(`[ImportService] ✅ ${website.url} 在数据库中已存在且数据完整，跳过`)
        skipWebsites.push(existingWebsite)
        logDetails.existedComplete++
        logDetails.urls.skip.push({
          url: website.url,
          title: existingWebsite.title,
          reason: '数据库已存在且完整',
        })
      } else {
        // 数据库中数据不完整，需要更新
        console.log(`[ImportService] ⚠️ ${website.url} 在数据库中已存在但数据不完整，将更新`)
        // ✅ 修复：使用数据库中的 existingWebsite 而不是导入的 website
        // 因为 existingWebsite 包含 id 字段，而导入的 website 可能只有 URL
        needImportWebsites.push(existingWebsite)
        logDetails.existedIncomplete++
        logDetails.urls.update.push({
          url: website.url,
          missingFields: getMissingMeatFields(existingWebsite),
        })
      }
    } else {
      // URL 不存在，需要导入
      needImportWebsites.push(website)
      logDetails.newImport++
      logDetails.urls.create.push({
        url: website.url,
        hasTitle: !!website.title,
        hasDescription: !!website.description,
        hasIconData: !!website.iconData,
      })
    }
  }

  monitor.endPhase()

  // ========== 打印详细统计报告 ==========
  console.log('\n========== 📊 导入数据统计报告 ==========')
  console.log(`总数：${logDetails.total} 个网站`)
  console.log(`✅ 数据库中已存在且完整：${logDetails.existedComplete} 个（直接跳过）`)
  console.log(`⚠️  数据库中已存在但不完整：${logDetails.existedIncomplete} 个（需要更新）`)
  console.log(`🆕 新导入：${logDetails.newImport} 个`)
  console.log('=========================================\n')

  if (logDetails.existedComplete > 0) {
    console.log('📋 跳过的网站列表（已存在且完整）:')
    logDetails.urls.skip.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.url} - ${item.title}`)
    })
    console.log('')
  }

  if (logDetails.existedIncomplete > 0) {
    console.log('📋 需要更新的网站列表（已存在但不完整）:')
    logDetails.urls.update.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.url} - 缺失字段：${item.missingFields.join(', ')}`)
    })
    console.log('')
  }

  if (config.onProgress) {
    config.onProgress({
      phase: 'db_check',
      processed: websites.length,
      total: websites.length,
      message: `数据库检查完成：${skipWebsites.length} 个已存在且完整，${needImportWebsites.length} 个需要处理`,
    })
  }
  // ========== 数据库完整性检查结束 ==========

  // 对需要导入的网站进行分离和补全
  let enrichedWebsites = []
  if (needImportWebsites.length > 0) {
    // 分离完整和不完整的网站
    const { complete: needComplete, incomplete: needIncomplete } = separateWebsites(needImportWebsites)

    console.log(`\n========== 🔍 需要处理的网站分析 ==========`)
    console.log(`完整（无需插件补全）：${needComplete.length} 个`)
    console.log(`不完整（需要插件补全）：${needIncomplete.length} 个`)
    console.log('=========================================\n')

    // 补全不完整的网站
    if (needIncomplete.length > 0 && config.onIncomplete !== 'skip' && config.enrichData) {
      // 开始补全阶段
      monitor.startPhase('enrichment')

      if (config.onProgress) {
        config.onProgress({
          phase: 'enriching',
          processed: 0,
          total: needIncomplete.length,
          message: `准备补全 ${needIncomplete.length} 个不完整的网站...`,
        })
      }

      enrichedWebsites = await enrichWebsites(needIncomplete, config, config.onProgress)

      // 结束补全阶段
      monitor.endPhase()
    } else if (needIncomplete.length > 0 && !config.enrichData) {
      // 如果用户选择不补全数据，直接使用不完整的网站数据
      console.log(`\n========== ⚠️  跳过数据补全 ==========`)
      console.log(`用户选择不补全数据，直接导入 ${needIncomplete.length} 个不完整的网站`)
      console.log('=========================================\n')
      enrichedWebsites = needIncomplete
    }

    // 合并需要导入的完整网站和补全后的网站
    const allNeedImportWebsites = [...needComplete, ...enrichedWebsites]

    // 标准化数据
    monitor.startPhase('normalization')
    const normalizedWebsites = normalizeWebsites(allNeedImportWebsites)
    monitor.endPhase()

    // 导入数据库
    // 对于需要更新的网站（已存在但不完整），使用 update 模式
    const dbConfig = {
      ...config,
      onDuplicate: 'update', // 强制更新已存在的网站
    }
    const result = await importWebsitesToDB(normalizedWebsites, dbConfig, monitor, existingUrlsMap)

    // 合并跳过的网站到结果中
    return {
      ...result,
      skipped: result.skipped + skipWebsites.length,
    }
  } else {
    // 所有网站都已存在于数据库且完整
    console.log('\n========== ✅ 导入完成 ==========')
    console.log(`所有 ${skipWebsites.length} 个网站都已存在于数据库且数据完整，无需任何操作`)
    console.log('================================\n')

    return {
      success: 0,
      failed: 0,
      skipped: skipWebsites.length,
      updated: 0,
      errors: [],
    }
  }
}

/**
 * 导入其他数据类型（themes、searchEngines、settings）
 * @param {Object} jsonData - 解析后的 JSON 数据
 * @param {Object} config - 配置选项
 * @param {Object} monitor - 性能监控器
 * @returns {Promise<void>}
 */
async function importOtherData(jsonData, config, monitor) {
  // 开始处理其他数据阶段
  monitor.startPhase('other_data')

  if (config.onProgress) {
    config.onProgress({
      phase: 'other_data',
      processed: 0,
      total: 3, // 最多三种其他数据类型
      message: `开始处理其他数据类型...`,
    })
  }

  // 处理 themes
  if (jsonData.themes && Array.isArray(jsonData.themes)) {
    console.log(`[ImportService] 🎨 处理 ${jsonData.themes.length} 个主题`)
    try {
      for (const theme of jsonData.themes) {
        try {
          // 尝试添加主题
          await db.addTheme(theme)
        } catch (error) {
          // 如果是键已存在错误，尝试更新
          if (error.name === 'ConstraintError') {
            console.log(`[ImportService] ⚠️ 主题已存在，尝试更新: ${theme.id}`)
            await db.updateTheme(theme)
          } else {
            throw error
          }
        }
      }
      console.log(`[ImportService] ✅ 主题导入完成`)
    } catch (error) {
      console.error(`[ImportService] ❌ 主题导入失败:`, error)
    }
  }

  // 处理 searchEngines
  if (jsonData.searchEngines && Array.isArray(jsonData.searchEngines)) {
    console.log(`[ImportService] 🔍 处理 ${jsonData.searchEngines.length} 个搜索引擎`)
    try {
      for (const engine of jsonData.searchEngines) {
        try {
          // 尝试添加搜索引擎
          await db.addSearchEngine(engine)
        } catch (error) {
          // 如果是键已存在错误，尝试更新
          if (error.name === 'ConstraintError') {
            console.log(`[ImportService] ⚠️ 搜索引擎已存在，尝试更新: ${engine.id}`)
            await db.updateSearchEngine(engine)
          } else {
            throw error
          }
        }
      }
      console.log(`[ImportService] ✅ 搜索引擎导入完成`)
    } catch (error) {
      console.error(`[ImportService] ❌ 搜索引擎导入失败:`, error)
    }
  }

  // 处理 settings
  if (jsonData.settings && typeof jsonData.settings === 'object') {
    console.log(`[ImportService] ⚙️ 处理设置数据`)
    try {
      await db.saveSettings(jsonData.settings)
      console.log(`[ImportService] ✅ 设置导入完成`)
    } catch (error) {
      console.error(`[ImportService] ❌ 设置导入失败:`, error)
    }
  }

  if (config.onProgress) {
    config.onProgress({
      phase: 'other_data',
      processed: 3,
      total: 3,
      message: `其他数据类型处理完成`,
    })
  }

  // 结束处理其他数据阶段
  monitor.endPhase()
}
