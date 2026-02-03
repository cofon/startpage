<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: 'icon'
  },
  fallbackIcon: {
    type: String,
    default: '/icons/default-website.svg'
  }
})

const currentIcon = ref(props.src)
const loadError = ref(false)

function handleImageError() {
  if (!loadError.value) {
    loadError.value = true
    currentIcon.value = props.fallbackIcon
  }
}

// 监听 src 变化
watch(() => props.src, (newSrc) => {
  currentIcon.value = newSrc
  loadError.value = false
})

onMounted(() => {
  currentIcon.value = props.src
})
</script>

<template>
  <img
    :src="currentIcon"
    :alt="alt"
    class="website-icon"
    @error="handleImageError"
  >
</template>

<style scoped>
.website-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  transition: opacity 0.2s ease;
}
</style>
