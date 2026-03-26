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

// 加载图标 - 支持懒加载
async function loadIcon() {
  if (!props.website) {
    currentIcon.value = ''
    return
  }

  // 如果 website 对象已经包含图标数据，直接使用
  if (props.website.iconData || props.website.iconGenerateData) {
    const { iconData, iconGenerateData } = props.website
    if (iconData) {
      currentIcon.value = iconData
    } else if (iconGenerateData) {
      currentIcon.value = iconGenerateData
    }
    return
  }

  // 需要从缓存或数据库加载图标
  if (props.lazy && props.website.id) {
    isLoading.value = true
    try {
      const iconData = await websiteStore.loadWebsiteIcon(props.website.id)
      if (iconData) {
        if (iconData.iconData) {
          currentIcon.value = iconData.iconData
        } else if (iconData.iconGenerateData) {
          currentIcon.value = iconData.iconGenerateData
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

// 图片加载失败时的处理
async function onImageError() {
  // 尝试从缓存或数据库获取完整的图标数据
  if (props.website.id) {
    try {
      const iconData = await websiteStore.loadWebsiteIcon(props.website.id);
      if (iconData) {
        // 如果当前失败的是 iconData，尝试使用 iconGenerateData
        if (iconData.iconGenerateData && currentIcon.value === iconData.iconData) {
          currentIcon.value = iconData.iconGenerateData;
          return;
        }
      }
    } catch (error) {
      console.error('[WebsiteIcon] 获取图标数据失败:', error);
    }
  }

  // 生成一个基于网站名称的简单 SVG 图标作为后备
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
    :src="currentIcon"
    :alt="website?.name || 'icon'"
    class="website-icon"
    @error="onImageError"
  >
</template>

<style scoped>
.website-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background-color: var(--color-bg-page);
  border-radius: 8px;
}
</style>
