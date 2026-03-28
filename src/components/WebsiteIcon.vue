<script setup>
import { ref, watch, onMounted } from 'vue'
import { useWebsiteStore } from '../stores/website'

const props = defineProps({
  website: {
    type: Object,
    required: true
  },
  lazy: {
    type: Boolean,
    default: true // 默认启用懒加载
  }
})

const websiteStore = useWebsiteStore()
const currentIcon = ref('')
const isLoading = ref(false)
const triedIconGenerateData = ref(false) // 标记是否已经尝试过 iconGenerateData

// 加载图标 - 支持懒加载
async function loadIcon() {
  if (!props.website) {
    currentIcon.value = ''
    return
  }

  // 重置标记
  triedIconGenerateData.value = false
  
  // 在加载数据前，先设置为 loading 状态，避免 img 标签尝试加载空值或旧值
  isLoading.value = true
  currentIcon.value = '' // 清空当前图标，防止显示旧数据

  // 无论 website 对象是否包含图标数据，都从缓存或数据库加载完整的图标数据
  // 这样可以确保使用最新的图标数据，而不是依赖于传递的 website 对象
  if (props.website.id) {
    try {
      const iconDataResult = await websiteStore.loadWebsiteIcon(props.website.id)
      if (iconDataResult) {
        // 优先使用 iconData，只有当它不是空字符串时才使用
        if (iconDataResult.iconData && iconDataResult.iconData.trim() !== '') {
          currentIcon.value = iconDataResult.iconData
        } else if (iconDataResult.iconGenerateData) {
          currentIcon.value = iconDataResult.iconGenerateData
          triedIconGenerateData.value = true
        }
      }
    } catch (error) {
      console.error('[WebsiteIcon] 加载图标失败:', error)
    } finally {
      isLoading.value = false
    }
  }
}

// 监听 website 变化
watch(() => props.website, () => {
  loadIcon()
}, { immediate: true })

// 组件挂载时加载图标
onMounted(() => {
  loadIcon()
})

// 图片加载成功时的处理
function onImageLoad() {
  // 图片加载成功，无需处理
}

// 图片加载失败时的处理
async function onImageError() {
  // 如果还没有尝试过 iconGenerateData，先尝试使用它
  if (!triedIconGenerateData.value) {
    triedIconGenerateData.value = true
    
    // 尝试从缓存或数据库获取 iconGenerateData
    if (props.website.id) {
      try {
        const iconDataResult = await websiteStore.loadWebsiteIcon(props.website.id)
        if (iconDataResult && iconDataResult.iconGenerateData) {
          currentIcon.value = iconDataResult.iconGenerateData
          return
        }
      } catch (error) {
        console.error('[WebsiteIcon] 获取 iconGenerateData 失败:', error)
      }
    }
  }
  
  // 如果 iconGenerateData 也失败了，生成一个基于网站名称的简单 SVG 图标作为后备
  function btoaUTF8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  
  const fallbackIcon = props.website.name ?
    `data:image/svg+xml;base64,${btoaUTF8(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%2342b549"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">${props.website.name.charAt(0)}</text></svg>`)}`
    : `data:image/svg+xml;base64,${btoaUTF8(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23999"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">?</text></svg>`)}`

  currentIcon.value = fallbackIcon;
}
</script>

<template>
  <img
    v-if="!isLoading && currentIcon"
    :src="currentIcon"
    :alt="website?.name || 'icon'"
    class="website-icon"
    @load="onImageLoad"
    @error="onImageError"
  >
  <div v-else class="website-icon-placeholder">
    {{ website?.name?.charAt(0) || '?' }}
  </div>
</template>

<style scoped>
.website-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background-color: var(--color-bg-page);
  border-radius: 8px;
}

.website-icon-placeholder {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 24px;
  font-weight: bold;
  color: white;
  background-color: var(--color-text-disabled);
}
</style>
