/**
 * 调试日志工具
 * 用于在导入过程中收集和显示调试信息
 */

class DebugLogger {
  constructor() {
    this.logs = []
    this.listeners = []
    this.enabled = true
  }

  /**
   * 添加日志
   * @param {string} tag - 日志标签
   * @param {any} message - 日志消息
   * @param {string} type - 日志类型 (info|warn|error|success)
   */
  log(tag, message, type = 'info') {
    if (!this.enabled) return

    const log = {
      tag,
      message,
      type,
      time: new Date().toLocaleTimeString()
    }

    this.logs.push(log)
    this.notifyListeners(log)

    // 同时输出到控制台
    const consoleMethod = type === 'error' ? console.error : 
                         type === 'warn' ? console.warn :
                         type === 'success' ? console.log : console.log
    consoleMethod(`[${tag}]`, message)
  }

  /**
   * 添加信息日志
   */
  info(tag, message) {
    this.log(tag, message, 'info')
  }

  /**
   * 添加警告日志
   */
  warn(tag, message) {
    this.log(tag, message, 'warn')
  }

  /**
   * 添加错误日志
   */
  error(tag, message) {
    this.log(tag, message, 'error')
  }

  /**
   * 添加成功日志
   */
  success(tag, message) {
    this.log(tag, message, 'success')
  }

  /**
   * 添加分隔线
   */
  separator(title = '') {
    const message = title ? `========== ${title} ==========` : '========================================'
    this.log('DEBUG', message, 'info')
  }

  /**
   * 清空日志
   */
  clear() {
    this.logs = []
  }

  /**
   * 获取所有日志
   */
  getLogs() {
    return this.logs
  }

  /**
   * 添加监听器
   */
  addListener(listener) {
    this.listeners.push(listener)
  }

  /**
   * 移除监听器
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(log) {
    this.listeners.forEach(listener => listener(log))
  }

  /**
   * 启用日志
   */
  enable() {
    this.enabled = true
  }

  /**
   * 禁用日志
   */
  disable() {
    this.enabled = false
  }

  /**
   * 格式化消息
   */
  formatMessage(message) {
    if (typeof message === 'object') {
      return JSON.stringify(message, null, 2)
    }
    return String(message)
  }
}

// 创建全局实例
const debugLogger = new DebugLogger()

// 导出实例和类
export default debugLogger
export { DebugLogger }
