/**
 * 网站导入工具函数
 * 用于处理导入数据时对网站的预处理逻辑
 */

import { validateWebsite, fillDefaultFields } from './websiteUtils'

/**
 * 批量处理导入的网站数据
 * @param {Array} websites - 网站数据数组
 * @returns {Object} - 包含有效网站数组和无效网站数组的对象
 */
export function processImportWebsites(websites) {
  if (!Array.isArray(websites)) {
    return { validWebsites: [], invalidWebsites: [] }
  }

  const validWebsites = []
  const invalidWebsites = []

  for (const website of websites) {
    if (validateWebsite(website)) {
      validWebsites.push(fillDefaultFields(website))
    } else {
      invalidWebsites.push(website)
    }
  }

  return { validWebsites, invalidWebsites }
}

/**
 * 处理单个网站的导入
 * @param {Object} website - 网站数据对象
 * @param {Object} websitesStore - IndexedDB 的 websites 存储对象
 * @param {Function} onComplete - 完成回调函数
 * @returns {void}
 */
export function importSingleWebsite(website, websitesStore, onComplete) {
  // 第一步：验证网站数据
  if (!validateWebsite(website)) {
    console.warn('跳过无效网站：缺少url字段', website)
    onComplete()
    return
  }

  // 填充默认字段
  const websiteToImport = fillDefaultFields(website)

  // 第二步：检查 URL 是否已存在于数据库（优先级最高）
  const urlIndexReq = websitesStore.index('url').get(websiteToImport.url)
  urlIndexReq.onsuccess = () => {
    if (urlIndexReq.result) {
      // URL 已存在，更新网站数据
      const existingWebsite = urlIndexReq.result
      // 保留原有ID，更新其他字段
      const updatedWebsite = {
        ...existingWebsite,
        ...websiteToImport,
        id: existingWebsite.id,  // 确保使用原有ID
        updatedAt: new Date()  // 更新时间戳
      }
      // 更新网站
      updateWebsiteInStore(updatedWebsite, websitesStore, onComplete)
      return
    }

    // URL 不存在，继续处理
    if (websiteToImport.id) {
      // 有 ID，检查 ID 是否冲突
      const idReq = websitesStore.get(websiteToImport.id)
      idReq.onsuccess = () => {
        if (idReq.result) {
          // ID 已存在，删除 ID 让数据库自动生成新的
          delete websiteToImport.id
        }
        // 添加网站
        addWebsiteToStore(websiteToImport, websitesStore, onComplete)
      }
      idReq.onerror = () => {
        console.error('检查网站ID失败:', websiteToImport.id)
        onComplete()
      }
    } else {
      // 没有 ID，直接添加
      addWebsiteToStore(websiteToImport, websitesStore, onComplete)
    }
  }

  urlIndexReq.onerror = () => {
    console.error('检查URL失败:', websiteToImport.url)
    onComplete()
  }
}

/**
 * 将网站添加到存储
 * @param {Object} website - 网站数据对象
 * @param {Object} websitesStore - IndexedDB 的 websites 存储对象
 * @param {Function} onComplete - 完成回调函数
 * @returns {void}
 */
function addWebsiteToStore(website, websitesStore, onComplete) {
  const addReq = websitesStore.add(website)
  addReq.onsuccess = () => {
    onComplete()
  }
  addReq.onerror = () => {
    console.error('添加网站失败:', website)
    onComplete()
  }
}

/**
 * 更新存储中的网站数据
 * @param {Object} website - 网站数据对象
 * @param {Object} websitesStore - IndexedDB 的 websites 存储对象
 * @param {Function} onComplete - 完成回调函数
 * @returns {void}
 */
function updateWebsiteInStore(website, websitesStore, onComplete) {
  const updateReq = websitesStore.put(website)
  updateReq.onsuccess = () => {
    onComplete()
  }
  updateReq.onerror = () => {
    console.error('更新网站失败:', website)
    onComplete()
  }
}
