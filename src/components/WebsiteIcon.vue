<script setup>
import { ref, onMounted, watch } from 'vue'
import iconManager from '../utils/iconManager'
import { useWebsiteStore } from '../stores/website'

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
})

const websiteStore = useWebsiteStore()
const currentIcon = ref('')
const isLoading = ref(true)

// 更新网站图标数据
function updateWebsiteIcon(id, iconData) {
  websiteStore.updateWebsite(id, iconData)
}

// 加载图标
async function loadIcon() {
  if (!props.website) return

  isLoading.value = true

  try {
    // 使用 iconManager 获取图标
    const iconUrl = await iconManager.getIcon(props.website, updateWebsiteIcon)
    currentIcon.value = iconUrl
  } catch (error) {
    // iconManager 内部会处理错误并生成后备图标，所以这里不需要额外处理
  } finally {
    isLoading.value = false
  }
}

// 监听 website 变化
watch(() => props.website, () => {
  loadIcon()
}, { deep: true })

onMounted(() => {
  loadIcon()
})
</script>

<template>
  <img
    :src="currentIcon"
    :alt="website?.name || 'icon'"
    class="website-icon"
    :class="{ loading: isLoading }"
  >
</template>

<style scoped>
.website-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  transition: opacity 0.2s ease;
}

.website-icon.loading {
  opacity: 0.5;
}
</style>
