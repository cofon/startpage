<script setup>
/**
 * 网站操作按钮组件
 * 用于显示网站的操作按钮组（标记、编辑、删除、恢复）
 */
import { useNotificationStore } from '../stores/notification'
import { onMounted } from 'vue'

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
})

// 添加调试信息
onMounted(() => {
  console.log('[WebsiteActions] Component mounted')
  console.log('[WebsiteActions] Website:', props.website)
  console.log('[WebsiteActions] isMarked:', props.website?.isMarked)
  console.log('[WebsiteActions] isActive:', props.website?.isActive)
})

const emit = defineEmits(['toggle-mark', 'edit', 'delete', 'restore'])

const notificationStore = useNotificationStore()

function handleToggleMark(event) {
  event.stopPropagation()
  emit('toggle-mark', props.website)
}

function handleEdit(event) {
  event.stopPropagation()
  emit('edit', props.website)
}

function handleDelete(event) {
  event.stopPropagation()
  emit('delete', props.website)
}

function handleRestore(event) {
  event.stopPropagation()
  emit('restore', props.website)
}
</script>

<template>
  <div class="website-actions">
    <!-- 调试信息 -->
    <div style="display: none;">
      Actions for: {{ website?.name }}
    </div>
    <button
      class="action-icon-button"
      @click.stop="(event) => handleToggleMark(event)"
      :title="website.isMarked ? '取消标记' : '标记'"
    >
      {{ website.isMarked ? '★' : '☆' }}
    </button>
    <button
      class="action-icon-button"
      @click.stop="(event) => handleEdit(event)"
      title="编辑"
    >
      ✎
    </button>
    <button
      v-if="website.isActive"
      class="action-icon-button delete"
      @click.stop="(event) => handleDelete(event)"
      title="删除"
    >
      ✕
    </button>
    <button
      v-else
      class="action-icon-button restore"
      @click.stop="(event) => handleRestore(event)"
      title="恢复"
    >
      ↺
    </button>
  </div>
</template>

<style scoped>
/* 调试样式 */
.website-actions {
  display: flex !important;
  gap: 8px;
  align-items: center;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid red;
  flex-shrink: 0;
  min-width: 100px;
}

.action-icon-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background-color: var(--color-bg-hover);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.action-icon-button:hover {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
  transform: scale(1.1);
}

.action-icon-button.delete:hover {
  background-color: #ff4d4f;
  color: white;
}

.action-icon-button.restore:hover {
  background-color: #52c41a;
  color: white;
}
</style>
