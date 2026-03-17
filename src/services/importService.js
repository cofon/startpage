/**
 * 导入服务
 * 统一处理起始页的数据导入逻辑
 *
 * 功能：
 * - 支持两种导入模式：websites（完整网站数据）和 urls（URL 列表）
 * - 数据验证和格式判断
 * - 数据完整性检查
 * - 批量补全元数据（通过插件）
 * - 进度管理和错误处理
 *
 * @module services/importService
 */

// 导入依赖（按需引入）
import { normalizeImportUrl, isWebsiteComplete, getMissingFields, normalizeWebsiteData } from '../utils/website/websiteUtils'
import { fetchMetadataFromLocalApi } from '../services/websiteMetadataService'
import db from '../utils/database'
import { PerformanceMonitor, BatchProcessor, MemoryOptimizer } from '../utils/performanceMonitor'

/**
 * 导入数据的主入口
 * @param {Object} jsonData - 解析后的 JSON 数据
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 导入模式：'websites' | 'urls' | 'auto'
 * @param {string} options.onDuplicate - 重复数据处理：'skip' | 'update' | 'ask'
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
    onDuplicate: options.onDuplicate || 'skip',
    onIncomplete: options.onIncomplete || 'enrich',
    batchSize: options.batchSize || 20,
    timeout: options.timeout || 10000,
    onProgress: options.onProgress || (() => {}),
    onComplete: options.onComplete || (() => {})
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

  // 根据类型执行不同的导入逻辑
  // 这个逻辑之后要改，把URLs 转换成 websites，然后统一处理
  let result
  if (importType === 'websites') {
    result = await importWebsites(jsonData.websites, config, monitor)
  } else if (importType === 'urls') {
    result = await importUrls(jsonData.urls, config, monitor)
  } else {
    monitor.end()
    throw new Error('无法识别的导入类型')
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

  // 检查是否包含必填字段
  const hasWebsites = data.websites && Array.isArray(data.websites)
  const hasUrls = data.urls && Array.isArray(data.urls)

  if (!hasWebsites && !hasUrls) {
    errors.push('数据格式错误：必须包含 websites 或 urls 字段')
    return { valid: false, type: 'unknown', errors }
  }

  // 确定导入类型
  let type = 'unknown'
  if (hasWebsites) {
    type = 'websites'
  } else if (hasUrls) {
    type = 'urls'
  }

  return { valid: true, type, errors }
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
    const isComplete = isWebsiteComplete(website)

    if (isComplete) {
      complete.push(website)
    } else {
      incomplete.push(website)
    }
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
  const batchSize = config.batchSize

  // 分批处理
  for (let i = 0; i < websites.length; i += batchSize) {
    const batch = websites.slice(i, i + batchSize)

    // 批量获取元数据
    await Promise.all(
      batch.map(async (website) => {
        try {
          console.log(`[ImportService] 🔍 尝试获取元数据：${website.url}`)
          const metadata = await fetchMetadataFromLocalApi(website.url)

          if (metadata) {
            // ✅ 成功：只补全插件负责的 3 个字段（title、description、iconData）
            if (!website.title && metadata.title) {
              website.title = metadata.title
              console.log(`[ImportService] ✓ 已补全 title: ${metadata.title}`)
            }
            if (!website.description && metadata.description) {
              website.description = metadata.description
              console.log(`[ImportService] ✓ 已补全 description`)
            }
            if (!website.iconData && metadata.iconData) {
              website.iconData = metadata.iconData
              console.log(`[ImportService] ✓ 已补全 iconData (长度：${metadata.iconData.length})`)
            }
          } else {
            // ❌ 失败：添加 meta_failed 标签
            console.warn(`[ImportService] ⚠️ 无法获取元数据：${website.url}`)

            // 初始化 tags 数组
            if (!website.tags) {
              website.tags = []
            } else if (typeof website.tags === 'string') {
              website.tags = website.tags.split(',').map(t => t.trim()).filter(t => t)
            }

            // 添加标签（避免重复）
            if (!website.tags.includes('meta_failed')) {
              website.tags.push('meta_failed')
              console.log(`[ImportService] ✗ 已添加 "meta_failed" 标签到：${website.url}`)
            }
          }

          return website
        } catch (error) {
          console.error(`[ImportService] ❌ 补全失败：${website.url}`, error)
          // 返回原始数据，后续会使用默认值
          return website
        }
      })
    )

    // 更新进度
    const processed = Math.min(i + batchSize, total)
    if (progressCallback) {
      progressCallback({
        phase: 'enriching',
        processed,
        total,
        message: `正在补全网站元数据... (${processed}/${total})`
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
  return websites.map(website => normalizeWebsiteData(website))
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
    errors: []
  }

  // 如果没有传入 existingUrlsMap，则获取所有现有网站
  const existingUrls = existingUrlsMap
    ? new Set(existingUrlsMap.keys())
    : new Set()

  if (!existingUrlsMap) {
    const existingWebsites = await db.getAllWebsites()
    existingUrls.add(...existingWebsites.map(w => w.url))
  }

  // 检查内存使用
  MemoryOptimizer.checkMemoryUsage(500)

  // 使用批量处理器
  const batchProcessor = new BatchProcessor({
    batchSize: config.batchSize,
    delay: 100,
    onProgress: (progress) => {
      if (config.onProgress) {
        config.onProgress({
          phase: 'importing',
          processed: progress.processed,
          total: progress.total,
          message: `正在导入网站到数据库... (${progress.processed}/${progress.total})`
        })
      }
    }
  })

  // 处理导入
  await batchProcessor.process(websites, async (website) => {
    try {
      // 检查 URL 是否已存在
      if (existingUrls.has(website.url)) {
        if (config.onDuplicate === 'skip') {
          result.skipped++
          monitor.recordSuccess()
        } else if (config.onDuplicate === 'update') {
          await db.updateWebsite(website)
          result.updated++
          monitor.recordSuccess()
        }
        return
      }

      // 导入网站
      await db.addWebsite(website)
      result.success++
      monitor.recordSuccess()
    } catch (error) {
      console.error('[ImportService] ❌ 导入失败:', website.url, error)
      console.error('[ImportService] 错误堆栈:', error.stack)
      result.failed++
      result.errors.push({
        url: website.url,
        error: error.message || '未知错误'
      })
      monitor.recordFailure()
    }
  })

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
      message: `正在检查数据库中已存在的网站...`
    })
  }

  // 获取数据库中所有现有网站
  const existingWebsitesInDB = await db.getAllWebsites()
  const existingUrlsMap = new Map(existingWebsitesInDB.map(w => [w.url, w]))

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
      create: []
    }
  }

  for (const website of websites) {
    // ========== 新增：URL 规范化处理 ==========
    // 对导入的 URL 进行规范化，确保 https://www.bilibili.com 和 https://www.bilibili.com/ 被视为相同
    const normalizedImportUrl = normalizeImportUrl(website.url)

    // 在 existingUrlsMap 中查找时，需要遍历所有键并进行规范化比较
    let existingWebsite = null
    for (const [dbUrl, dbWebsite] of existingUrlsMap.entries()) {
      const normalizedDbUrl = normalizeImportUrl(dbUrl)
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
          reason: '数据库已存在且完整'
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
          missingFields: getMissingFields(existingWebsite)
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
        hasIconData: !!website.iconData
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
      message: `数据库检查完成：${skipWebsites.length} 个已存在且完整，${needImportWebsites.length} 个需要处理`
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
    if (needIncomplete.length > 0 && config.onIncomplete !== 'skip') {
      // 开始补全阶段
      monitor.startPhase('enrichment')

      if (config.onProgress) {
        config.onProgress({
          phase: 'enriching',
          processed: 0,
          total: needIncomplete.length,
          message: `准备补全 ${needIncomplete.length} 个不完整的网站...`
        })
      }

      enrichedWebsites = await enrichWebsites(needIncomplete, config, config.onProgress)

      // 结束补全阶段
      monitor.endPhase()
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
      onDuplicate: 'update' // 强制更新已存在的网站
    }
    const result = await importWebsitesToDB(normalizedWebsites, dbConfig, monitor, existingUrlsMap)

    // 合并跳过的网站到结果中
    return {
      ...result,
      skipped: result.skipped + skipWebsites.length
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
      errors: []
    }
  }
}

/**
 * 导入 urls 数据
 * @param {Array} urls - URL 数组
 * @param {Object} config - 配置选项
 * @returns {Promise<Object>} 导入结果
 */
async function importUrls(urls, config, monitor) {
  // ========== 新增：数据库完整性检查（与 importWebsites 保持一致） ==========
  monitor.startPhase('db_check')

  if (config.onProgress) {
    config.onProgress({
      phase: 'db_check',
      processed: 0,
      total: urls.length,
      message: `正在检查数据库中已存在的网站...`
    })
  }

  // 获取数据库中所有现有网站
  const existingWebsitesInDB = await db.getAllWebsites()
  const existingUrlsMap = new Map(existingWebsitesInDB.map(w => [w.url, w]))

  // 分类处理
  const skipWebsites = [] // 数据库中已存在且完整，直接跳过
  const needImportUrls = [] // 需要导入或补全的 URL

  // ========== 详细日志记录 ==========
  const logDetails = {
    total: urls.length,
    existedComplete: 0,
    existedIncomplete: 0,
    newImport: 0,
    urls: {
      skip: [],
      update: [],
      create: []
    }
  }

  for (const url of urls) {
    // ========== 新增：URL 规范化处理 ==========
    // 对导入的 URL 进行规范化，确保 https://www.bilibili.com 和 https://www.bilibili.com/ 被视为相同
    const normalizedImportUrl = normalizeImportUrl(url)

    // 在 existingUrlsMap 中查找时，需要遍历所有键并进行规范化比较
    let existingWebsite = null
    for (const [dbUrl, dbWebsite] of existingUrlsMap.entries()) {
      const normalizedDbUrl = normalizeImportUrl(dbUrl)
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
        console.log(`[ImportService] ✅ ${url} 在数据库中已存在且数据完整，跳过`)
        skipWebsites.push(existingWebsite)
        logDetails.existedComplete++
        logDetails.urls.skip.push({
          url: url,
          title: existingWebsite.title,
          reason: '数据库已存在且完整'
        })
      } else {
        // 数据库中数据不完整，需要更新
        console.log(`[ImportService] ⚠️ ${url} 在数据库中已存在但数据不完整，将更新`)
        needImportUrls.push(existingWebsite)
        logDetails.existedIncomplete++
        logDetails.urls.update.push({
          url: url,
          missingFields: getMissingFields(existingWebsite)
        })
      }
    } else {
      // URL 不存在，需要导入
      needImportUrls.push({ url })
      logDetails.newImport++
      logDetails.urls.create.push({
        url: url,
        hasTitle: false,
        hasDescription: false,
        hasIconData: false
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
      processed: urls.length,
      total: urls.length,
      message: `数据库检查完成：${skipWebsites.length} 个已存在且完整，${needImportUrls.length} 个需要处理`
    })
  }
  // ========== 数据库完整性检查结束 ==========

  // 对需要导入的网站进行分离和补全
  let enrichedWebsites = []
  if (needImportUrls.length > 0) {
    // 分离完整和不完整的网站
    const { complete: needComplete, incomplete: needIncomplete } = separateWebsites(needImportUrls)

    console.log(`\n========== 🔍 需要处理的网站分析 ==========`)
    console.log(`完整（无需插件补全）：${needComplete.length} 个`)
    console.log(`不完整（需要插件补全）：${needIncomplete.length} 个`)
    console.log('=========================================\n')

    // 补全不完整的网站
    if (needIncomplete.length > 0 && config.onIncomplete !== 'skip') {
      // 开始补全阶段
      monitor.startPhase('enrichment')

      if (config.onProgress) {
        config.onProgress({
          phase: 'enriching',
          processed: 0,
          total: needIncomplete.length,
          message: `准备补全 ${needIncomplete.length} 个不完整的网站...`
        })
      }

      enrichedWebsites = await enrichWebsites(needIncomplete, config, config.onProgress)

      // 结束补全阶段
      monitor.endPhase()
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
      onDuplicate: 'update' // 强制更新已存在的网站
    }
    const result = await importWebsitesToDB(normalizedWebsites, dbConfig, monitor, existingUrlsMap)

    // 合并跳过的网站到结果中
    return {
      ...result,
      skipped: result.skipped + skipWebsites.length
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
      errors: []
    }
  }
}
