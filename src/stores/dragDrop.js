/**
 * 拖拽 Store
 * 管理拖拽状态和拖拽排序逻辑
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDragDropStore = defineStore('dragDrop', () => {
  // 状态
  const draggedItem = ref(null)
  const draggedIndex = ref(-1)

  // Actions
  function setDraggedItem(item) {
    draggedItem.value = item
  }

  function setDraggedIndex(index) {
    draggedIndex.value = index
  }

  function resetDragState() {
    draggedItem.value = null
    draggedIndex.value = -1
  }

  return {
    draggedItem,
    draggedIndex,
    setDraggedItem,
    setDraggedIndex,
    resetDragState
  }
})
