<script setup>
/**
 * 搜索结果布局容器组件
 * 根据当前布局模式动态渲染不同的布局组件
 */
import { computed } from 'vue'
import SearchResultSimple from './SearchResultSimple.vue'
import SearchResultDefault from './SearchResultDefault.vue'
import SearchResultFull from './SearchResultFull.vue'
import { useSearchStore } from '../stores/search'

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click', 'toggle-mark', 'edit', 'delete', 'restore'])

const searchStore = useSearchStore()

// 获取当前布局模式
const currentLayoutMode = computed(() => {
  return searchStore.currentLayoutMode || 'default'
})

// 处理网站点击
function handleWebsiteClick(website, event) {
  console.log('[SearchResult] 处理网站点击:', website.name, website.id)
  emit('click', website, event)
}

// 处理标记切换
function handleToggleMark(website) {
  emit('toggle-mark', website)
}

// 处理编辑
function handleEdit(website) {
  emit('edit', website)
}

// 处理删除
function handleDelete(website) {
  emit('delete', website)
}

// 处理恢复
function handleRestore(website) {
  emit('restore', website)
}
</script>

<template>
  <div class="search-result-container">
    <!-- 极简模式 -->
    <SearchResultSimple
      v-if="currentLayoutMode === 'simple'"
      :website="website"
      @click="handleWebsiteClick"
      @toggle-mark="handleToggleMark"
      @edit="handleEdit"
      @delete="handleDelete"
      @restore="handleRestore"
    />
    
    <!-- 默认模式 -->
    <SearchResultDefault
      v-else-if="currentLayoutMode === 'default'"
      :website="website"
      @click="handleWebsiteClick"
      @toggle-mark="handleToggleMark"
      @edit="handleEdit"
      @delete="handleDelete"
      @restore="handleRestore"
    />
    
    <!-- 完整模式 -->
    <SearchResultFull
      v-else-if="currentLayoutMode === 'full'"
      :website="website"
      @click="handleWebsiteClick"
      @toggle-mark="handleToggleMark"
      @edit="handleEdit"
      @delete="handleDelete"
      @restore="handleRestore"
    />
    
    <!-- 默认为默认模式 -->
    <SearchResultDefault
      v-else
      :website="website"
      @click="handleWebsiteClick"
      @toggle-mark="handleToggleMark"
      @edit="handleEdit"
      @delete="handleDelete"
      @restore="handleRestore"
    />
  </div>
</template>

<style scoped>
.search-result-container {
  width: 100%;
}
</style>