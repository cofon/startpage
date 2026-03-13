import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
  // 通知列表
  const notifications = ref([])

  // 添加通知 duration = 3000
  function addNotification(message, type = 'info', duration = 10000) {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type,
      duration
    }
    notifications.value.push(notification)

    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  // 移除通知
  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 清空所有通知
  function clearAll() {
    notifications.value = []
  }

  // 便捷方法：成功通知 duration = 3000
  function success(message, duration = 10000) {
    return addNotification(message, 'success', duration)
  }

  // 便捷方法：错误通知 duration = 5000
  function error(message, duration = 10000) {
    return addNotification(message, 'error', duration)
  }

  // 便捷方法：警告通知 duration = 3000
  function warning(message, duration = 10000) {
    return addNotification(message, 'warning', duration)
  }

  // 便捷方法：信息通知 duration = 2000
  function info(message, duration = 10000) {
    return addNotification(message, 'info', duration)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
})
