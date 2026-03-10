<script setup>
import { ref, watchEffect } from 'vue'

const props = defineProps({
  website: {
    type: Object,
    required: true
  }
})

const currentIcon = ref('')

// 加载图标 - 直接使用已有的图标数据，不再获取或生成
function loadIcon() {
  if (!props.website) {
    currentIcon.value = ''
    return
  }

  // 直接使用已有的图标数据
  const { iconData, iconGenerateData } = props.website
  
  if (iconData) {
    // 优先使用网络获取的 icon
    currentIcon.value = iconData
  } else if (iconGenerateData) {
    // 其次使用生成的 SVG
    currentIcon.value = iconGenerateData
  } else {
    // 如果都没有，显示空图标
    currentIcon.value = ''
  }
}

// 监听 website 变化
watchEffect(() => {
  loadIcon()
})

// 图片加载失败时的处理
function onImageError() {
  // 如果当前正在尝试加载的是 iconData，并且存在 iconGenerateData，则使用 iconGenerateData
  if (props.website.iconData && props.website.iconGenerateData && currentIcon.value === props.website.iconData) {
    currentIcon.value = props.website.iconGenerateData
    return
  }

  // 生成一个基于网站名称的简单 SVG 图标作为后备
  const fallbackIcon = props.website.name ?
    `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%2342b549"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">${props.website.name.charAt(0)}</text></svg>`)}`
    : `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23999"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">?</text></svg>`)}`

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
