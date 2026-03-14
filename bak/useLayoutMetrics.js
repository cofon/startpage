import { onBeforeUnmount, ref } from 'vue'

export function useLayoutMetrics(appRef) {
  // 响应式数据：容器宽度和每行 item 数量
  const containerWidth = ref(800) // 默认值（max-width）
  const itemsPerRow = ref(7) // 默认值

  // 更新容器宽度和每行 item 数量
  function updateLayoutMetrics() {
    if (appRef.value) {
      const width = appRef.value.offsetWidth
      containerWidth.value = width

      // 计算每行能容纳的 item 数量
      // 每个 item 最小宽度 100px + gap 10px = 110px
      const itemMinWidth = 100 + 10 // minmax(100px, 1fr) + gap
      itemsPerRow.value = Math.floor(width / itemMinWidth)
    }
  }

  // 监听窗口大小变化
  let resizeObserver = null

  function setupLayoutMetrics() {
    // 初始计算
    updateLayoutMetrics()

    // 使用 ResizeObserver 监听容器大小变化
    if (appRef.value) {
      resizeObserver = new ResizeObserver(updateLayoutMetrics)
      resizeObserver.observe(appRef.value)
    }

    // 备用方案：监听窗口 resize 事件
    window.addEventListener('resize', updateLayoutMetrics)
  }

  function cleanupLayoutMetrics() {
    if (resizeObserver && appRef.value) {
      resizeObserver.unobserve(appRef.value)
    }
    window.removeEventListener('resize', updateLayoutMetrics)
  }

  return {
    containerWidth,
    itemsPerRow,
    setupLayoutMetrics,
    cleanupLayoutMetrics
  }
}
