<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import iconManager from '../utils/iconManager'
import { useWebsiteStore } from '../stores/website'
import db from '../utils/indexedDB'

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
async function updateWebsiteIcon(id, iconData) {
  let website = null;

  // 检查id是否存在，如果不存在则通过URL查找网站
  if (!id || id === undefined || id === null) {
    // 从 store 中通过 URL 查找网站
    const websiteByUrl = websiteStore.websites.find(w => w.url === props.website.url);
    if (websiteByUrl) {
      // 如果网站对象已经有了数据库ID，则使用该ID
      if (websiteByUrl.id && websiteByUrl.id !== undefined && websiteByUrl.id !== null) {
        id = websiteByUrl.id;
        website = websiteStore.websites.find(w => w.id === id);
      } else {
        // 如果网站还没有数据库ID，暂不更新数据库，只更新store
        // 通过 URL 查找并更新网站
        const indexToUpdate = websiteStore.websites.findIndex(w => w.url === props.website.url);
        if (indexToUpdate !== -1) {
          // 更新 store 中的网站数据
          const updatedWebsite = {
            ...websiteStore.websites[indexToUpdate],
            ...iconData,
            updatedAt: new Date().toISOString()
          };

          // 使用 Vue 的响应式数组更新方式
          websiteStore.websites.splice(indexToUpdate, 1, updatedWebsite);
        }

        return;
      }
    } else {
      // 如果找不到网站，但仍然需要更新图标
      // 这种情况下我们不做任何操作，因为网站可能尚未保存到 store
      return;
    }
  } else {
    // 从 store 获取最新的网站数据
    website = websiteStore.websites.find(w => w.id === id);
  }

  if (!website) {
    return;
  }

  // 只更新图标相关的字段
  const updatedFields = {
    ...iconData,
    updatedAt: new Date().toISOString()  // 使用ISO字符串格式，便于IndexedDB存储
  }

  // 更新 store
  websiteStore.updateWebsite(id, updatedFields)

  // 构造一个纯净的网站对象，仅包含基本数据类型
  const cleanWebsiteData = {
    id: Number(id),
    name: String(website.name || ''),
    url: String(website.url || ''),
    description: String(website.description || ''),
    iconUrl: String(website.iconUrl || ''),
    tags: Array.isArray(website.tags) ? [...website.tags] : [],
    // 图标相关字段 - 使用updatedFields中的值
    iconData: updatedFields.iconData !== undefined ? updatedFields.iconData : (website.iconData || null),
    iconGenerateData: updatedFields.iconGenerateData !== undefined ? updatedFields.iconGenerateData : (website.iconGenerateData || null),
    iconCanFetch: updatedFields.iconCanFetch !== undefined ? Boolean(updatedFields.iconCanFetch) : Boolean(website.iconCanFetch !== undefined ? website.iconCanFetch : true),
    iconFetchAttempts: updatedFields.iconFetchAttempts !== undefined ? Number(updatedFields.iconFetchAttempts) : Number(website.iconFetchAttempts || 0),
    iconLastFetchTime: updatedFields.iconLastFetchTime !== undefined ? updatedFields.iconLastFetchTime : (website.iconLastFetchTime || null),
    iconError: updatedFields.iconError !== undefined ? updatedFields.iconError : (website.iconError || null),
    // 时间戳
    createdAt: String(website.createdAt || new Date().toISOString()),
    updatedAt: String(updatedFields.updatedAt),
    lastVisited: website.lastVisited || null,
    // 其他字段
    isMarked: Boolean(website.isMarked || false),
    markOrder: Number(website.markOrder || 999999),
    visitCount: Number(website.visitCount || 0),
    isActive: Boolean(website.isActive !== undefined ? website.isActive : true)
  }

  // 同步更新到 IndexedDB
  try {
    await db.updateWebsite(cleanWebsiteData)
  } catch  {  // 重命名未使用的错误变量
    // 更新失败，但不打印错误信息
  }
}

// 加载图标
async function loadIcon() {
  if (!props.website) {
    isLoading.value = false
    return
  }

  isLoading.value = true

  try {
    // 使用 iconManager 获取图标
    const iconUrl = await iconManager.getIcon(props.website, updateWebsiteIcon)

    if (!iconUrl) {
      // 生成一个基于网站名称的简单SVG图标作为后备
      const fallbackIcon = props.website.name ?
        `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%2342b549"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">${props.website.name.charAt(0)}</text></svg>`)}`
        : ''
      currentIcon.value = fallbackIcon
    } else {
      currentIcon.value = iconUrl
    }
  } catch  {
    // 生成一个通用的后备图标
    const fallbackIcon = props.website.name ?
      `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%2342b549"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">${props.website.name.charAt(0)}</text></svg>`)}`
      : ''
    currentIcon.value = fallbackIcon
  } finally {
    isLoading.value = false
  }
}

// 监听 website 变化
watch(() => props.website, (newWebsite, oldWebsite) => {
  // 只有当 website.id 或 website.iconData 发生变化时才重新加载
  if (!oldWebsite || newWebsite.id !== oldWebsite.id ||
      newWebsite.iconData !== oldWebsite.iconData ||
      newWebsite.iconGenerateData !== oldWebsite.iconGenerateData) {
    loadIcon()
  }
}, { deep: true })

// 图片加载失败时的处理
function onImageError() {
  // 生成一个基于网站名称的简单SVG图标作为后备
  const fallbackIcon = props.website.name ?
    `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%2342b549"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">${props.website.name.charAt(0)}</text></svg>`)}`
    : `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="%23999"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="24" fill="white">?</text></svg>`)}`

  currentIcon.value = fallbackIcon;
}

// 监听图标更新事件
function handleIconUpdate(event) {
  const { websiteId, iconData } = event.detail
  if (websiteId === props.website.id && iconData) {
    currentIcon.value = iconData
  }
}

onMounted(() => {
  loadIcon()
  // 添加事件监听
  window.addEventListener('icon-updated', handleIconUpdate)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('icon-updated', handleIconUpdate)
})
</script>

<template>
  <img
    :src="currentIcon"
    :alt="website?.name || 'icon'"
    class="website-icon"
    :class="{ loading: isLoading }"
    @error="onImageError"
  >
</template>

<style scoped>
.website-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  transition: opacity 0.2s ease;
  background-color: #f0f0f0; /* 为SVG图标提供背景色 */
  border-radius: 8px; /* 与SVG圆角保持一致 */
}

.website-icon.loading {
  opacity: 0.5;
}
</style>
