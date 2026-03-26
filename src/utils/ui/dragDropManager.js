/**
 * 拖拽管理工具
 * 用于统一处理拖拽排序逻辑
 */

import { ref } from 'vue'
import { useNotificationStore } from '../../stores/notification'
import db from '../database'

// 拖拽状态
const draggedItem = ref(null)
const draggedIndex = ref(-1)

/**
 * 初始化拖拽管理器
 * @returns {Object} 拖拽管理器实例
 */
export function initDragDrop() {
  return {
    draggedItem,
    draggedIndex,
    handleDragStart,
    handleDragEnd,
    handleDrop
  }
}

/**
 * 处理拖拽开始
 * @param {Object} website - 被拖拽的网站对象
 * @param {number} index - 网站索引
 */
export function handleDragStart(website, index) {
  draggedItem.value = website
  draggedIndex.value = index
}

/**
 * 处理拖拽结束
 */
export function handleDragEnd() {
  draggedItem.value = null
  draggedIndex.value = -1
}

/**
 * 处理拖拽放置
 * @param {number} targetIndex - 目标索引
 * @param {Object} websiteStore - 网站 store
 * @param {Object} searchStore - 搜索 store
 */
export async function handleDrop(targetIndex, websiteStore, searchStore) {
  if (draggedIndex.value === -1 || draggedIndex.value === targetIndex) {
    return
  }

  const notificationStore = useNotificationStore()

  // 获取当前标记网站列表
  const markedWebsites = [...websiteStore.markedWebsites]

  // 检查markedWebsites是否存在且为数组
  if (!markedWebsites || !Array.isArray(markedWebsites)) {
    console.error('markedWebsites is not an array', markedWebsites)
    return
  }

  // 获取当前标记网站的ID列表
  const currentOrder = markedWebsites.map(w => w.id)

  // 创建新的顺序
  const newOrder = [...currentOrder]
  const [movedItem] = newOrder.splice(draggedIndex.value, 1)
  newOrder.splice(targetIndex, 0, movedItem)

  // 更新store中的顺序
  websiteStore.reorderMarkedWebsites(newOrder)

  // 更新searchStore.results
  searchStore.results = websiteStore.markedWebsites

  // 更新数据库中的顺序
  for (let i = 0; i < newOrder.length; i++) {
    const website = websiteStore.websites.find(w => w.id === newOrder[i])
    if (website) {
      // 获取完整的网站数据（包含图标）
      const fullWebsite = await db.getWebsiteById(website.id)
      if (fullWebsite) {
        await db.updateWebsite({
          ...fullWebsite,
          markOrder: i + 1
        })
      }
    }
  }

  // 显示成功通知
  notificationStore.success('排序已更新')

  // 重置拖拽状态
  draggedIndex.value = -1
  draggedItem.value = null
}
