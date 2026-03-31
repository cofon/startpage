<script setup>
/**
 * 搜索结果列表组件
 * 用于显示搜索结果，包含网站信息和操作按钮
 */
import { ref, watch, onMounted } from 'vue'
import SearchResult from './SearchResult.vue'
import { useSearchStore } from '../stores/search'

const props = defineProps({
  websites: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['click', 'toggle-mark', 'edit', 'delete', 'restore'])
const searchStore = useSearchStore()

// 保存上一次的搜索词和结果长度
const previousQuery = ref('')
const previousResultsLength = ref(0)

// 滚动到顶部
function scrollToTop() {
  // 找到最近的可滚动容器
  let container = document.getElementById('app')
  if (container) {
    container.scrollTop = 0
  }
  // 同时也滚动整个页面
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听 websites 变化，当搜索结果更新时滚动到顶部
watch(
  () => props.websites,
  (newWebsites) => {
    const currentQuery = searchStore.query
    const currentLength = newWebsites.length

    // 只有当搜索词发生变化且搜索结果长度也发生变化时才滚动到顶部
    if (currentQuery !== previousQuery.value && currentLength !== previousResultsLength.value) {
      scrollToTop()
    }

    // 更新记录
    previousQuery.value = currentQuery
    previousResultsLength.value = currentLength
  },
  { deep: true },
)

// 组件挂载时滚动到顶部
onMounted(() => {
  previousQuery.value = searchStore.query
  previousResultsLength.value = props.websites.length
  scrollToTop()
})

// 文字选择相关状态
let mouseDownTime = 0
let mouseDownPosition = { x: 0, y: 0 }
let hadSelectionOnMouseDown = false

/**
 * 检测是否在选择文字
 */
function checkTextSelection(event) {
  const timeDiff = Date.now() - mouseDownTime
  const distanceDiff = Math.sqrt(
    Math.pow(event.clientX - mouseDownPosition.x, 2) +
      Math.pow(event.clientY - mouseDownPosition.y, 2),
  )

  return !hadSelectionOnMouseDown && (distanceDiff > 5 || timeDiff > 200)
}

/**
 * 记录鼠标按下事件
 */
function handleMouseDown(event) {
  mouseDownTime = Date.now()
  mouseDownPosition = { x: event.clientX, y: event.clientY }

  const selection = window.getSelection()
  hadSelectionOnMouseDown = selection.toString().trim().length > 0
}

/**
 * 处理网站点击
 */
function handleWebsiteClick(website, event) {
  if (checkTextSelection(event)) {
    return
  }

  emit('click', website, event)
}

/**
 * 处理标记切换
 */
function handleToggleMark(website) {
  emit('toggle-mark', website)
}

/**
 * 处理编辑
 */
function handleEdit(website) {
  emit('edit', website)
}

/**
 * 处理删除
 */
function handleDelete(website) {
  emit('delete', website)
}

/**
 * 处理恢复
 */
function handleRestore(website) {
  emit('restore', website)
}
</script>

<template>
  <div class="search-results-list">
    <SearchResult
      v-for="website in websites"
      :key="website.id"
      :website="website"
      @click="(website, event) => handleWebsiteClick(website, event)"
      @toggle-mark="handleToggleMark"
      @edit="handleEdit"
      @delete="handleDelete"
      @restore="handleRestore"
    />
  </div>
</template>

<style scoped>
.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 100%;
}
</style>
