/**
 * 错误处理工具
 * 统一处理导入过程中的各种错误
 */

/**
 * 错误类型枚举
 */
export const ErrorType = {
  FATAL: 'fatal',           // 致命错误：必须停止导入
  RECOVERABLE: 'recoverable', // 可恢复错误：跳过当前项，继续处理
  WARNING: 'warning'          // 警告：不影响导入，但需要记录
}

/**
 * 错误分类
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 * @returns {Object} { type: string, message: string, details: any }
 */
export function classifyError(error, context = {}) {
  // JSON 解析错误
  if (error instanceof SyntaxError) {
    return {
      type: ErrorType.FATAL,
      message: 'JSON 格式错误：文件不是有效的 JSON 格式',
      details: {
        error: error.message,
        position: error.message.match(/position (\d+)/)?.[1]
      }
    }
  }

  // 数据库错误
  if (error.name === 'DatabaseError' || error.message?.includes('database')) {
    return {
      type: ErrorType.FATAL,
      message: '数据库错误：无法访问或写入数据',
      details: {
        error: error.message
      }
    }
  }

  // 网络错误
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return {
      type: ErrorType.RECOVERABLE,
      message: '网络错误：无法获取网站元数据',
      details: {
        url: context.url,
        error: error.message
      }
    }
  }

  // 超时错误
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return {
      type: ErrorType.RECOVERABLE,
      message: '请求超时：获取网站元数据超时',
      details: {
        url: context.url,
        timeout: context.timeout
      }
    }
  }

  // 插件错误
  if (error.message?.includes('chrome.runtime')) {
    return {
      type: ErrorType.FATAL,
      message: '插件错误：无法与插件通信',
      details: {
        error: error.message
      }
    }
  }

  // 文件大小错误
  if (context.fileSize && context.maxSize && context.fileSize > context.maxSize) {
    return {
      type: ErrorType.FATAL,
      message: '文件过大：文件大小超过限制',
      details: {
        fileSize: context.fileSize,
        maxSize: context.maxSize
      }
    }
  }

  // 文件类型错误
  if (context.fileName && !context.fileName.endsWith('.json')) {
    return {
      type: ErrorType.FATAL,
      message: '文件类型错误：请选择 JSON 格式的文件',
      details: {
        fileName: context.fileName
      }
    }
  }

  // URL 格式错误
  if (context.url && !isValidUrl(context.url)) {
    return {
      type: ErrorType.RECOVERABLE,
      message: 'URL 格式错误：无效的网站地址',
      details: {
        url: context.url
      }
    }
  }

  // 默认处理
  return {
    type: ErrorType.RECOVERABLE,
    message: error.message || '未知错误',
    details: {
      error: error.message,
      stack: error.stack
    }
  }
}

/**
 * 创建错误日志
 * @param {Object} errorInfo - 错误信息
 * @returns {Object} 错误日志对象
 */
export function createErrorLog(errorInfo) {
  return {
    timestamp: new Date().toISOString(),
    type: errorInfo.type || ErrorType.RECOVERABLE,
    message: errorInfo.message || '未知错误',
    data: errorInfo.details || {},
    context: errorInfo.context || {}
  }
}

/**
 * 批量记录错误
 * @param {Array} errors - 错误数组
 * @param {Function} logFn - 日志函数
 */
export function logErrors(errors, logFn = console.error) {
  errors.forEach(error => {
    const log = createErrorLog(error)
    logFn(`[${log.type.toUpperCase()}] ${log.message}`, log)
  })
}

/**
 * 获取用户友好的错误提示
 * @param {Object} errorInfo - 错误信息
 * @returns {string} 用户友好的错误消息
 */
export function getUserFriendlyMessage(errorInfo) {
  const messages = {
    [ErrorType.FATAL]: {
      title: '导入失败',
      message: errorInfo.message,
      action: '请检查错误信息并重试'
    },
    [ErrorType.RECOVERABLE]: {
      title: '部分数据导入失败',
      message: errorInfo.message,
      action: '已跳过错误数据，继续处理其他数据'
    },
    [ErrorType.WARNING]: {
      title: '警告',
      message: errorInfo.message,
      action: '不影响导入，但建议检查'
    }
  }

  const info = messages[errorInfo.type] || messages[ErrorType.RECOVERABLE]
  return `${info.title}：${info.message}
${info.action}`
}

/**
 * 判断是否应该停止导入
 * @param {Object} errorInfo - 错误信息
 * @returns {boolean} 是否应该停止
 */
export function shouldStopImport(errorInfo) {
  return errorInfo.type === ErrorType.FATAL
}

/**
 * 验证 URL 格式
 * @param {string} url - URL 字符串
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url.startsWith('http') ? url : 'http://' + url)
    return true
  } catch {
    return false
  }
}
