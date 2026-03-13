/**
 * 性能监控工具
 * 监控和优化导入过程中的性能
 */

/**
 * 性能指标收集器
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: null,
      endTime: null,
      phases: {},
      memory: {
        initial: null,
        peak: null,
        final: null
      },
      operations: {
        total: 0,
        completed: 0,
        failed: 0
      }
    }
    this.currentPhase = null
    this.phaseStartTime = null
  }

  /**
   * 开始监控
   */
  start() {
    this.metrics.startTime = performance.now()
    this.metrics.memory.initial = this.getMemoryUsage()
    console.log('[性能监控] 开始监控')
  }

  /**
   * 结束监控
   */
  end() {
    this.metrics.endTime = performance.now()
    this.metrics.memory.final = this.getMemoryUsage()
    this.printReport()
  }

  /**
   * 开始一个阶段
   * @param {string} phase - 阶段名称
   */
  startPhase(phase) {
    if (this.currentPhase) {
      this.endPhase()
    }
    this.currentPhase = phase
    this.phaseStartTime = performance.now()
    this.metrics.phases[phase] = {
      startTime: this.phaseStartTime,
      duration: 0,
      operations: 0
    }
    console.log(`[性能监控] 开始阶段: ${phase}`)
  }

  /**
   * 结束当前阶段
   */
  endPhase() {
    if (!this.currentPhase || !this.phaseStartTime) {
      return
    }
    const duration = performance.now() - this.phaseStartTime
    this.metrics.phases[this.currentPhase].duration = duration
    console.log(`[性能监控] 完成阶段: ${this.currentPhase} (${duration.toFixed(2)}ms)`)
    this.currentPhase = null
    this.phaseStartTime = null
  }

  /**
   * 记录操作
   */
  recordOperation() {
    this.metrics.operations.total++
    if (this.currentPhase) {
      this.metrics.phases[this.currentPhase].operations++
    }
  }

  /**
   * 记录成功操作
   */
  recordSuccess() {
    this.metrics.operations.completed++
    this.recordOperation()
  }

  /**
   * 记录失败操作
   */
  recordFailure() {
    this.metrics.operations.failed++
    this.recordOperation()
  }

  /**
   * 获取内存使用情况
   * @returns {number} 内存使用量（MB）
   */
  getMemoryUsage() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize
      const peak = this.metrics.memory.peak || 0
      this.metrics.memory.peak = Math.max(peak, used)
      return (used / 1024 / 1024).toFixed(2)
    }
    return null
  }

  /**
   * 获取当前性能状态
   * @returns {Object} 性能状态
   */
  getStatus() {
    const memory = this.getMemoryUsage()
    const totalDuration = this.metrics.endTime 
      ? this.metrics.endTime - this.metrics.startTime 
      : performance.now() - this.metrics.startTime

    return {
      duration: totalDuration,
      memory: memory,
      operations: {
        ...this.metrics.operations,
        successRate: this.metrics.operations.total > 0
          ? (this.metrics.operations.completed / this.metrics.operations.total * 100).toFixed(2)
          : 0
      },
      currentPhase: this.currentPhase,
      phases: this.metrics.phases
    }
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const status = this.getStatus()
    console.group('[性能监控] 性能报告')
    console.log(`总耗时: ${(status.duration / 1000).toFixed(2)}秒`)

    if (status.memory) {
      console.log(`内存使用:`)
      console.log(`  初始: ${this.metrics.memory.initial} MB`)
      console.log(`  峰值: ${this.metrics.memory.peak / 1024 / 1024} MB`)
      console.log(`  最终: ${status.memory} MB`)
    }

    console.log(`操作统计:`)
    console.log(`  总数: ${status.operations.total}`)
    console.log(`  成功: ${status.operations.completed}`)
    console.log(`  失败: ${status.operations.failed}`)
    console.log(`  成功率: ${status.operations.successRate}%`)

    console.log(`各阶段耗时:`)
    Object.entries(status.phases).forEach(([phase, data]) => {
      console.log(`  ${phase}: ${data.duration.toFixed(2)}ms (${data.operations} 个操作)`)
    })

    console.groupEnd()
  }
}

/**
 * 批量处理器
 * 用于分批处理大量数据，避免阻塞主线程
 */
class BatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 20
    this.delay = options.delay || 100
    this.onProgress = options.onProgress || (() => {})
    this.onComplete = options.onComplete || (() => {})
    this.onError = options.onError || (() => {})
  }

  /**
   * 处理批量数据
   * @param {Array} items - 要处理的数据项
   * @param {Function} processor - 处理函数
   * @returns {Promise<Array>} 处理结果
   */
  async process(items, processor) {
    const results = []
    const total = items.length
    let processed = 0

    try {
      for (let i = 0; i < items.length; i += this.batchSize) {
        const batch = items.slice(i, i + this.batchSize)

        // 处理当前批次
        const batchResults = await Promise.all(
          batch.map(item => processor(item))
        )

        results.push(...batchResults)
        processed += batch.length

        // 报告进度
        this.onProgress({
          processed,
          total,
          percentage: (processed / total * 100).toFixed(2)
        })

        // 批次之间添加延迟，避免阻塞
        if (i + this.batchSize < items.length) {
          await this.delayExecution(this.delay)
        }
      }

      this.onComplete(results)
      return results
    } catch (error) {
      this.onError(error)
      throw error
    }
  }

  /**
   * 延迟执行
   * @param {number} ms - 延迟时间（毫秒）
   */
  delayExecution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 内存优化工具
 */
class MemoryOptimizer {
  /**
   * 清理大对象
   * @param {Object} obj - 要清理的对象
   */
  static cleanupLargeObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return
    }

    // 清理数组
    if (Array.isArray(obj)) {
      obj.length = 0
      return
    }

    // 清理对象属性
    Object.keys(obj).forEach(key => {
      delete obj[key]
    })
  }

  /**
   * 分块处理大数组
   * @param {Array} array - 大数组
   * @param {number} chunkSize - 每块大小
   * @returns {Array<Array>} 分块后的数组
   */
  static chunkArray(array, chunkSize = 100) {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * 检查内存使用并警告
   * @param {number} threshold - 阈值（MB）
   * @returns {boolean} 是否超过阈值
   */
  static checkMemoryUsage(threshold = 500) {
    if (!performance.memory) {
      return false
    }

    const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024
    const isOverThreshold = usedMB > threshold

    if (isOverThreshold) {
      console.warn(`[内存警告] 内存使用过高: ${usedMB.toFixed(2)}MB (阈值: ${threshold}MB)`)
    }

    return isOverThreshold
  }
}

export {
  PerformanceMonitor,
  BatchProcessor,
  MemoryOptimizer
}
