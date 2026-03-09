/**
 * 网站图标管理器
 * 负责管理网站图标
 */

class IconManager {
  /**
   * 获取图标
   * @param {Object} website - 网站对象
   * @returns {Promise<string|null>} 图标的 URL 或 data URL，如果没有则返回 null
   */
  async getIcon(website) {
    const {
      iconData,
      iconGenerateData
    } = website

    // 1. 优先使用缓存的 iconData（从网络获取的 icon）
    if (iconData) {
      return iconData
    }

    // 2. 检查 iconGenerateData（生成的图标）
    if (iconGenerateData) {
      return iconGenerateData
    }

    // 3. 如果没有图标数据，返回 null
    // 注意：不再自动生成或从网络获取图标
    return null
  }

  /**
   * 清除页面级别的缓存（在页面卸载时调用）
   */
  clearPageCache() {
    // 保留方法但清空实现，因为不再需要缓存管理
  }
}

export default new IconManager()
