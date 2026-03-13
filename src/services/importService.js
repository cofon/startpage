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

// 导入依赖
import { validateWebsite } from '../utils/website/websiteImportUtils'
import { isValidUrl } from '../utils/website/websiteUtils'
import { normalizeWebsiteData } from '../services/websiteMetadataService'
import { fetchMetadataFromPlugin } from '../utils/plugin/websiteMetadataService'
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
 * 检查网站数据完整性
 * @param {Object} website - 网站数据
 * @returns {boolean} 是否完整
 */
export function isWebsiteComplete(website) {
  // 必须有 URL
  if (!website.url || !isValidUrl(website.url)) {
    return false
  }

  // 检查所有必需字段是否都有值
  const hasName = website.name && website.name.trim() !== ''
  const hasTitle = website.title && website.title.trim() !== ''
  const hasDescription = website.description && website.description.trim() !== ''
  const hasIconData = website.iconData && website.iconData.trim() !== ''
  const hasIconGenerateData = website.iconGenerateData && website.iconGenerateData.trim() !== ''

  // 数据完整的标准：name、title、description、iconData、iconGenerateData 都有值
  return hasName && hasTitle && hasDescription && hasIconData && hasIconGenerateData
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
 * 批量补全网站元数据
 * @param {Array} websites - 需要补全的网站数组
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
    const enrichedBatch = await Promise.all(
      batch.map(async (website) => {
        try {
          // 检查是否需要补全：name、title、description、iconData 中任何一个缺失
          const needsEnrichment = !website.name || !website.title || !website.description || !website.iconData

          if (needsEnrichment) {
            const metadata = await fetchMetadataFromPlugin(website.url)

            if (metadata) {
              // 补全所有缺失的字段
              if (!website.name && metadata.name) {
                website.name = metadata.name
              }
              if (!website.title && metadata.title) {
                website.title = metadata.title
              }
              if (!website.description && metadata.description) {
                website.description = metadata.description
              }
              if (!website.iconData && metadata.iconData) {
                website.iconData = metadata.iconData
              }
            }
          }

          return website
        } catch (error) {
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
 * @returns {Promise<Object>} 导入结果
 */
export async function importWebsitesToDB(websites, config, monitor) {
  // 开始数据库导入阶段
  monitor.startPhase('database')

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    updated: 0,
    errors: []
  }

  // 获取所有现有网站（用于检查重复）
  const existingWebsites = await db.getAllWebsites()
  const existingUrls = new Set(existingWebsites.map(w => w.url))

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
      result.failed++
      result.errors.push({
        url: website.url,
        error: error.message
      })
      monitor.recordFailure()
    }
  })

  // 结束数据库导入阶段
  monitor.endPhase()

  // 清理大对象
  MemoryOptimizer.cleanupLargeObject(existingWebsites)
  existingUrls.clear()

  return result
}

/**
 * 导入 websites 数据
 * @param {Array} websites - 网站数组
 * @param {Object} config - 配置选项
 * @returns {Promise<Object>} 导入结果
 */
async function importWebsites(websites, config, monitor) {
  // 开始分离阶段
  monitor.startPhase('separation')

  // 分离完整和不完整的网站
  const { complete, incomplete } = separateWebsites(websites)

  // 结束分离阶段
  monitor.endPhase()

  // 补全不完整的网站
  let enrichedWebsites = incomplete
  if (incomplete.length > 0 && config.onIncomplete !== 'skip') {
    // 开始补全阶段
    monitor.startPhase('enrichment')

    if (config.onProgress) {
      config.onProgress({
        phase: 'enriching',
        processed: 0,
        total: incomplete.length,
        message: `准备补全 ${incomplete.length} 个不完整的网站...`
      })
    }

    enrichedWebsites = await enrichWebsites(incomplete, config, config.onProgress)

    // 结束补全阶段
    monitor.endPhase()
  }

  // 开始标准化阶段
  monitor.startPhase('normalization')

  // 合并完整和补全后的网站
  const allWebsites = [...complete, ...enrichedWebsites]

  // 标准化数据
  const normalizedWebsites = normalizeWebsites(allWebsites)

  // 结束标准化阶段
  monitor.endPhase()

  // 导入数据库
  const result = await importWebsitesToDB(normalizedWebsites, config, monitor)

  return result
}

/**
 * 导入 urls 数据
 * @param {Array} urls - URL 数组
 * @param {Object} config - 配置选项
 * @returns {Promise<Object>} 导入结果
 */
async function importUrls(urls, config, monitor) {
  // 开始转换阶段
  monitor.startPhase('conversion')

  // 将 URL 转换为网站对象
  const websites = urls.map(url => ({ url }))

  // 结束转换阶段
  monitor.endPhase()

  // 开始补全阶段
  monitor.startPhase('enrichment')

  // 补全元数据
  if (config.onProgress) {
    config.onProgress({
      phase: 'enriching',
      processed: 0,
      total: websites.length,
      message: `准备获取 ${websites.length} 个网站的元数据...`
    })
  }

  const enrichedWebsites = await enrichWebsites(websites, config, config.onProgress)

  // 结束补全阶段
  monitor.endPhase()

  // 开始标准化阶段
  monitor.startPhase('normalization')

  // 标准化数据
  const normalizedWebsites = normalizeWebsites(enrichedWebsites)

  // 结束标准化阶段
  monitor.endPhase()

  // 导入数据库
  const result = await importWebsitesToDB(normalizedWebsites, config, monitor)

  return result
}
