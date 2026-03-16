<script setup>
import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from '../stores/website'
import { useNotificationStore } from '../stores/notification'
import websiteMetadataService, {
  fetchMetadataFromLocalApi,
} from '../services/websiteMetadataService'
import { isValidUrl } from '../utils/website/websiteUtils'

// ========== 所有工具函数都通过 websiteMetadataService 访问 ==========

const emit = defineEmits(['close'])

const websiteStore = useWebsiteStore()
const notificationStore = useNotificationStore()

// 表单数据
const formData = ref({
  name: '',
  title: '',
  url: '',
  description: '',
  tags: '',
  isMarked: false,
  isActive: true,
  isHidden: false,
  iconData: '',
  iconGenerateData: '',
})

// 跟踪用户是否手动编辑过 name
let userHasEditedName = false

// 跟踪 name 的第一个字符，用于触发 SVG 重新生成
let lastNameFirstChar = ''

// 加载状态
// const isLoading = ref(false)

// URL 存在性检查
const urlExists = ref(false)

// URL 验证状态：'invalid' | 'exists' | 'valid'
const urlValidationState = ref('invalid')

// 监听 name 输入框获得焦点，标记用户开始手动编辑
function handleNameFocus() {
  userHasEditedName = true
  console.log('[AddWebsitePanel] 用户在 name 输入框获得焦点，标记为已手动编辑')
}

// 监听 name 输入，检测第一个字符变化以重新生成 SVG
watch(
  () => formData.value.name,
  (newVal) => {
    // 如果用户已手动编辑过，则保留其输入的值
    if (userHasEditedName && newVal) {
      console.log('[AddWebsitePanel] 用户已手动编辑 name，保留值:', newVal)
    }
    
    // 检测 name 第一个字符是否变化，如果变化则重新生成 SVG
    const newFirstChar = newVal && newVal.trim() ? newVal.trim()[0] : ''
    if (newFirstChar !== lastNameFirstChar) {
      console.log('[AddWebsitePanel] name 首字符变化:', lastNameFirstChar, '->', newFirstChar)
      lastNameFirstChar = newFirstChar
      
      // 只有当 URL 有效时才重新生成 SVG
      if (formData.value.url && urlValidationState.value === 'valid') {
        regenerateSvgFromName(newVal)
      }
    }
  },
)

// 获取所有标签
const allTags = ref([])

/**
 * 更新 URL 验证状态
 * @param {string} url - 待验证的 URL
 */

// 加载所有标签
async function loadAllTags() {
  try {
    if (window.StartPageAPI && window.StartPageAPI.getAllTags) {
      allTags.value = await window.StartPageAPI.getAllTags()
    }
  } catch (error) {
    console.error('[AddWebsitePanel] 获取所有标签失败:', error)
  }
}

// 初始化时加载标签
loadAllTags()

// 获取当前输入的标签列表
const currentTags = computed(() => {
  return formData.value.tags
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t)
})

// 检查标签是否已添加
function isTagAdded(tag) {
  return currentTags.value.includes(tag)
}

// 添加或移除标签
function toggleTag(tag) {
  const tags = [...currentTags.value]
  const index = tags.indexOf(tag)

  if (index > -1) {
    // 如果标签已存在，则移除
    tags.splice(index, 1)
  } else {
    // 如果标签不存在，则添加
    tags.push(tag)
  }

  formData.value.tags = tags.join(', ')
}

// ========== 实时监听 URL 输入框的输入，自动填充 name 和生成 SVG ==========
watch(
  () => formData.value.url,
  (newUrl) => {
    // 只在用户正在输入时实时处理，不需要等待失去焦点
    processUrlChange(newUrl)
  },
)

// URL 变化时自动填充网站名称和图标（不再进行验证）
async function processUrlChange(url) {
  console.log('[processUrlChange] ========== URL 变化处理 ==========')
  console.log('[processUrlChange] 输入 URL:', url)

  if (!url || url.trim() === '') {
    console.log('[processUrlChange] URL 为空，清空表单')
    formData.value.iconData = ''
    formData.value.iconGenerateData = ''
    urlValidationState.value = 'invalid'
    urlExists.value = false
    return
  }

  // ========== 严格的 URL 格式验证 ==========
  const validation = isValidUrl(url)
  if (!validation.valid) {
    console.log('[processUrlChange] URL 格式验证失败:', validation.error)
    urlValidationState.value = 'invalid'
    urlExists.value = false
    return
  }

  // URL 格式有效，继续处理
  console.log('[processUrlChange] ✓ URL 格式有效')

  // 提取主机名
  let hostname = ''
  try {
    const urlObj = new URL(url)
    hostname = urlObj.hostname.toLowerCase()
    console.log('[processUrlChange] 解析的主机名:', hostname)
  } catch {
    console.log('[processUrlChange] URL 解析失败，跳过处理')
    urlValidationState.value = 'invalid'
    return
  }

  // 检查是否是本地主机或内网 IP
  const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
  const isPrivateIP =
    /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(
      hostname,
    )

  // 如果是 localhost 或内网 IP，直接通过检查
  if (isLocalHost || isPrivateIP) {
    console.log('[processUrlChange] ✓ 检测到本地地址，继续处理')
  } else {
    // 对于普通域名，检查是否完整
    const hasValidDomain =
      hostname.includes('.') &&
      !hostname.startsWith('.') &&
      !hostname.endsWith('.') &&
      hostname.length > 4

    if (!hasValidDomain) {
      console.log('[processUrlChange] 域名不完整，跳过处理')
      urlValidationState.value = 'invalid'
      return
    }
  }

  console.log('[processUrlChange] ✓ 域名完整，开始智能填充...')

  // ========== 检查 URL 是否已存在（使用规范化后的 URL 比较） ==========
  const urlCheckResult = websiteMetadataService.checkUrlExists(url, websiteStore.websites)
  
  if (urlCheckResult.exists) {
    console.warn(
      '[processUrlChange] ⚠️ URL 已存在，现有网站:',
      urlCheckResult.websiteName,
      'ID:',
      urlCheckResult.websiteId,
    )
    urlValidationState.value = 'exists'
    urlExists.value = true
  } else {
    urlValidationState.value = 'valid'
    urlExists.value = false
  }

  // ========== 智能填充策略：只填充空值，不覆盖已有数据 ==========

  // 1. 网站名称：只有当用户没有手动编辑过时才自动填充
  // 判断条件：用户获取焦点输入过，则不需要填充（无论当前值是否为空），否则就填充
  if (!userHasEditedName) {
    // 需要填充 name：用户未手动编辑过
    const siteName = websiteMetadataService.extractSiteNameFromUrl(url)
    formData.value.name = siteName
    console.log('[processUrlChange] ✓ name 需要填充（用户未编辑），已自动填充:', siteName)
  } else {
    // 不需要填充：用户已手动编辑过（即使删除了内容也不填充）
    console.log('[processUrlChange] - name 不需要填充（用户已手动编辑过）:', formData.value.name)
  }

  // 2. SVG 图标：优先复用已有网站的 SVG，没有才生成新的
  const rootDomain = websiteMetadataService.extractRootDomain(hostname)
  console.log('[processUrlChange] 提取的根域名:', rootDomain)

  if (rootDomain) {
    const existingWebsiteWithSameRoot = websiteStore.websites.find((website) => {
      try {
        const websiteHostname = new URL(website.url).hostname
        const websiteRootDomain = websiteMetadataService.extractRootDomain(websiteHostname)
        return websiteRootDomain === rootDomain && website.iconGenerateData
      } catch {
        return false
      }
    })

    if (existingWebsiteWithSameRoot && existingWebsiteWithSameRoot.iconGenerateData) {
      formData.value.iconGenerateData = existingWebsiteWithSameRoot.iconGenerateData
      console.log(
        '[processUrlChange] ✓ 找到相同根域名的网站，已复用 SVG:',
        existingWebsiteWithSameRoot.name,
      )
    } else {
      const normalizedData = websiteMetadataService.normalizeWebsiteData({
        url: url,
        name: formData.value.name || websiteMetadataService.extractSiteNameFromUrl(url),
      })

      formData.value.iconGenerateData = normalizedData.iconGenerateData
      formData.value.tags = Array.isArray(normalizedData.tags) ? normalizedData.tags.join(', ') : ''

      console.log('[processUrlChange] - 未找到相同根域名的网站，已生成新 SVG')
    }
  } else {
    const normalizedData = websiteMetadataService.normalizeWebsiteData({
      url: url,
      name: formData.value.name || websiteMetadataService.extractSiteNameFromUrl(url),
    })

    formData.value.iconGenerateData = normalizedData.iconGenerateData
    formData.value.tags = Array.isArray(normalizedData.tags) ? normalizedData.tags.join(', ') : ''

    console.log('[processUrlChange] - 无法提取根域名，已生成新 SVG')
  }

  // 3. 图标输入框保持为空
  formData.value.iconData = ''

  console.log('[processUrlChange] ========== URL 变化处理完成 ==========')
}

// 处理 URL 输入事件（包括浏览器自动填充）
function handleUrlInput(event) {
  console.log('[handleUrlInput] 检测到输入事件:', event.target.value)
  // 使用 nextTick 确保 v-model 已更新
  setTimeout(() => {
    processUrlChange(formData.value.url)
  }, 0)
}

/**
 * 根据 name 重新生成 SVG 图标
 * @param {string} name - 网站名称
 */
async function regenerateSvgFromName(name) {
  console.log('[regenerateSvgFromName] 开始根据 name 重新生成 SVG，name:', name)
  
  if (!name || !name.trim()) {
    console.log('[regenerateSvgFromName] name 为空，跳过 SVG 生成')
    return
  }
  
  try {
    // 使用当前的 URL 和新的 name 重新生成 SVG
    const url = formData.value.url
    if (!url) {
      console.log('[regenerateSvgFromName] URL 为空，跳过 SVG 生成')
      return
    }
    
    // 调用 normalizeWebsiteData 重新生成 SVG
    const normalizedData = websiteMetadataService.normalizeWebsiteData({
      url: url,
      name: name.trim(),
    })
    
    // 更新 iconGenerateData 和 tags
    formData.value.iconGenerateData = normalizedData.iconGenerateData
    if (normalizedData.tags && Array.isArray(normalizedData.tags)) {
      // 只在当前 tags 为空时才填充，避免覆盖用户手动输入的 tags
      if (!formData.value.tags || formData.value.tags.trim() === '') {
        formData.value.tags = normalizedData.tags.join(', ')
      }
    }
    
    console.log('[regenerateSvgFromName] ✓ SVG 重新生成成功')
  } catch (error) {
    console.error('[regenerateSvgFromName] ❌ SVG 重新生成失败:', error)
  }
}

// 处理 URL 失去焦点事件（只验证，不获取 meta）
function handleUrlBlur() {
  console.log('[handleUrlBlur] URL 输入框失去焦点')
  // 可以在这里添加失去焦点时的特殊处理
}

// 手动获取 Meta 数据
async function handleFetchMetadata() {
  const url = formData.value.url

  if (!url || url.trim() === '') {
    notificationStore.warning('请先输入 URL')
    return
  }

  // 验证 URL 格式（使用导入的工具函数）
  const validation = isValidUrl(url)
  if (!validation.valid) {
    notificationStore.warning(validation.error || 'URL 格式不正确')
    return
  }

  try {
    notificationStore.info('正在获取网站信息...')

    const metadata = await fetchMetadataFromLocalApi(url)

    if (metadata) {
      // 覆盖填充 title、description、iconData（无论原来是否有值）
      formData.value.title = metadata.title || ''
      formData.value.description = metadata.description || ''

      if (metadata.iconData) {
        formData.value.iconData = metadata.iconData
        console.log('[handleFetchMetadata] ✓ 已填充 iconData，长度:', metadata.iconData.length)
      }

      notificationStore.success('✓ 获取成功！')
      console.log('[handleFetchMetadata] ✓ Meta 数据获取成功')
    } else {
      // 获取失败：添加 "meta_failed" tag
      const currentTags = formData.value.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t)

      if (!currentTags.includes('meta_failed')) {
        currentTags.push('meta_failed')
        formData.value.tags = currentTags.join(', ')
      }

      notificationStore.error('✗ 获取失败，已添加 "meta_failed" 标签')
      console.log('[handleFetchMetadata] ✗ Meta 数据获取失败')
    }
  } catch (error) {
    console.error('[handleFetchMetadata] ❌ 获取元数据失败:', error)

    // 获取失败：添加 "meta_failed" tag
    const currentTags = formData.value.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t)

    if (!currentTags.includes('meta_failed')) {
      currentTags.push('meta_failed')
      formData.value.tags = currentTags.join(', ')
    }

    notificationStore.error('Failed to fetch: ' + (error.message || 'Unknown error'))
  }
}

// 提交表单
async function handleSubmit() {
  try {
    console.log('[handleSubmit] ========== 开始提交验证 ==========')

    // 1. 验证 URL 格式
    const urlValidation = isValidUrl(formData.value.url)
    if (!urlValidation.valid) {
      notificationStore.warning(urlValidation.error || 'URL 格式不正确')
      urlValidationState.value = 'invalid'
      return
    }

    // 2. 检查 URL 是否已存在
    const existingWebsite = websiteStore.websites.find(
      (w) => w.url === formData.value.url && w.isActive,
    )

    if (existingWebsite) {
      notificationStore.error('该网站已存在，请勿重复添加')
      urlValidationState.value = 'exists'
      urlExists.value = true
      return
    }

    // 3. 检查 name 是否为空
    if (!formData.value.name || formData.value.name.trim() === '') {
      notificationStore.warning('请输入网站名称')
      return
    }

    // 4. 检查 iconGenerateData 是否为空
    if (!formData.value.iconGenerateData || formData.value.iconGenerateData.trim() === '') {
      notificationStore.warning('SVG 图标数据不能为空，请等待生成或手动输入')
      return
    }

    // 5. 检查状态字段是否有值（理论上不会为空，但以防万一）
    if (typeof formData.value.isMarked !== 'boolean') {
      notificationStore.warning('isMarked 状态异常')
      return
    }
    if (typeof formData.value.isActive !== 'boolean') {
      notificationStore.warning('isActive 状态异常')
      return
    }
    if (typeof formData.value.isHidden !== 'boolean') {
      notificationStore.warning('isHidden 状态异常')
      return
    }

    // 准备数据
    const websiteData = {
      name: formData.value.name,
      title: formData.value.title,
      url: formData.value.url,
      description: formData.value.description,
      tags: formData.value.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      isMarked: formData.value.isMarked,
      isActive: formData.value.isActive,
      isHidden: formData.value.isHidden,
      iconData: formData.value.iconData,
      iconGenerateData: formData.value.iconGenerateData,
    }

    // 6. 如果 tags 为空，自动添加 'new'
    if (websiteData.tags.length === 0) {
      websiteData.tags = ['new']
      console.log('[handleSubmit] ✓ tags 为空，已自动添加 "new"')
    }

    // 验证数据
    const validation = websiteMetadataService.validateWebsite(websiteData)
    if (!validation.valid) {
      notificationStore.warning(validation.errors.join(', '))
      return
    }

    // 标准化数据
    const normalizedData = websiteMetadataService.normalizeWebsiteData(websiteData)

    // 添加到 store（store 内部会保存到数据库）
    await websiteStore.addWebsite(normalizedData)

    // 等待一小段时间，确保数据库保存完成
    await new Promise((resolve) => setTimeout(resolve, 100))

    notificationStore.success('网站添加成功！')

    // 重置用户编辑标记
    userHasEditedName = false

    emit('close')
  } catch (error) {
    console.error('[handleSubmit] ❌ 添加网站失败:', error)
    notificationStore.error('添加网站失败：' + (error.message || '未知错误'))
  }
}

// 取消
function handleCancel() {
  emit('close')
}
</script>

<template>
  <div class="add-website-panel">
    <!-- URL 输入行 -->
    <div class="form-row url-input-row">
      <span class="form-label">网站链接</span>
      <div class="input-button-group">
        <input
          id="website-url"
          v-model="formData.url"
          type="url"
          class="form-input"
          :class="{
            'url-invalid': urlValidationState === 'invalid',
            'url-exists': urlValidationState === 'exists',
            'url-valid': urlValidationState === 'valid',
          }"
          placeholder="https://example.com"
          maxlength="500"
          @input="handleUrlInput"
          @blur="handleUrlBlur"
        />
        <button
          type="button"
          class="btn-fetch-metadata"
          @click="handleFetchMetadata"
          :disabled="urlValidationState !== 'valid'"
          title="从网络获取网站标题、描述和图标"
        >
          🌐 获取信息
        </button>
        <!-- 提示信息：输入框下方紧贴 -->
        <div v-if="urlValidationState === 'invalid'" class="error-message url-error-message">
          ⚠️ URL 格式不正确，请输入有效的网址
        </div>
        <div v-if="urlValidationState === 'exists'" class="warning-message url-exists-message">
          ⚠️ 该网站已存在，请勿重复添加
        </div>
      </div>
    </div>

    <!-- Name 输入行 -->
    <div class="form-row">
      <span class="form-label">网站名称</span>
      <input
        id="website-name"
        v-model="formData.name"
        type="text"
        class="form-input"
        placeholder="输入网站名称（用于 Marked List 显示）"
        maxlength="100"
        @focus="handleNameFocus"
      />
    </div>

    <!-- Title 输入行 -->
    <div class="form-row">
      <span class="form-label">网站标题</span>
      <input
        id="website-title"
        v-model="formData.title"
        type="text"
        class="form-input"
        placeholder="输入网站标题（用于搜索结果）"
        maxlength="200"
      />
    </div>

    <!-- Description 输入行 -->
    <div class="form-row">
      <span class="form-label">网站描述</span>
      <input
        id="website-description"
        v-model="formData.description"
        type="text"
        class="form-input"
        placeholder="输入网站描述（可选）"
        maxlength="500"
      />
    </div>

    <!-- 网站图标 -->
    <div class="icon-row">
      <div class="icon-preview-col">
        <div class="icon-image-container">
          <img v-if="formData.iconData" :src="formData.iconData" alt="网站图标" />
          <div v-else class="icon-placeholder">
            <span class="placeholder-text">?</span>
          </div>
        </div>
      </div>
      <div class="icon-textarea-col">
        <textarea
          id="icon-data-input"
          v-model="formData.iconData"
          class="form-textarea"
          placeholder="输入图标的 base64 编码"
          rows="2"
        ></textarea>
      </div>
    </div>

    <!-- SVG 图标 -->
    <div class="icon-row">
      <div class="icon-preview-col">
        <div class="icon-image-container">
          <img v-if="formData.iconGenerateData" :src="formData.iconGenerateData" alt="SVG 图标" />
          <div v-else class="icon-placeholder">
            <span class="placeholder-text">?</span>
          </div>
        </div>
      </div>
      <div class="icon-textarea-col">
        <textarea
          id="icon-generate-data-input"
          v-model="formData.iconGenerateData"
          class="form-textarea"
          placeholder="输入 SVG 代码"
          rows="2"
        ></textarea>
      </div>
    </div>

    <!-- Tags 输入行 -->
    <div class="form-row">
      <span class="form-label">标签</span>
      <div class="tags-input-group">
        <input
          id="website-tags"
          v-model="formData.tags"
          type="text"
          class="form-input"
          placeholder="输入标签，用逗号分隔"
        />
      </div>
    </div>
    
    <!-- 标签列表行（与 input 左对齐） -->
    <div v-if="allTags.length > 0" class="form-row tags-list-row">
      <span class="form-label form-label-placeholder">标签</span>
      <div class="tags-list-container">
        <div class="tags-dropdown">
          <div
            v-for="tag in allTags"
            :key="tag"
            class="tag-item"
            :class="{ 'tag-added': isTagAdded(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </div>

    <!-- 网站设置行 -->
    <div class="form-row checkbox-row">
      <span class="form-label">网站设置</span>
      <div class="checkbox-group-inline">
        <label class="checkbox-label">
          <input type="checkbox" id="is-marked" name="isMarked" v-model="formData.isMarked" />
          <span>标记</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="is-active" name="isActive" v-model="formData.isActive" />
          <span>启用</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="is-hidden" name="isHidden" v-model="formData.isHidden" />
          <span>隐藏</span>
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button class="button button-secondary" @click="handleCancel">取消</button>
      <button class="button button-primary" @click="handleSubmit">添加网站</button>
    </div>
  </div>
</template>

<style scoped>
.add-website-panel {
  padding: 20px;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

/* ========== 行内表单布局（标签 + 输入框 + 按钮） ========== */
.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

/* URL 输入行特殊处理：为错误提示预留空间 */
.form-row.url-input-row {
  margin-bottom: 40px; /* 为错误提示预留空间（提示高度约 20px + 间距） */
}

/* 标签输入容器 */
.tags-input-group {
  display: flex;
  align-items: stretch;
  flex: 1;
  height: 40px;
}


.form-label {
  flex: 0 0 auto;
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* 输入框 + 按钮容器：保证同行并为提示定位提供基准 */
.input-button-group {
  display: flex;
  align-items: stretch;
  flex: 1;
  height: 40px;
  position: relative; /* 关键：为下方提示预留定位基准 */
}

.form-row .form-input {
  flex: 1;
  min-width: 0;
  height: 40px; /* 统一高度 */
  padding: 0 12px;
  border-radius: 6px 0 0 6px;
  font-size: 14px;
  outline: none;
  line-height: 1; /* 紧凑行高 */
}

.form-row .form-textarea-inline {
  flex: 1;
  min-width: 0;
}

/* 复选框行特殊处理 */
.checkbox-row .checkbox-group-inline {
  flex: 1;
  display: flex;
  gap: 16px;
}

.checkbox-row .checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--color-text-main);
  font-size: 14px;
  white-space: nowrap;
}

.checkbox-row .checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}

/* ========== 基础输入框样式 ========== */
.form-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  transition: border-color 0.3s ease;
  height: 40px; /* 统一高度 */
  line-height: 1;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

/* URL 验证状态样式 */
.form-input.url-invalid {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-input.url-exists {
  border-color: #f59e0b;
  background-color: #fffbeb;
}

.form-input.url-valid {
  border-color: #10b981;
  background-color: #ecfdf5;
}

/* 核心：提示信息（紧贴输入框下方） */
.error-message.url-error-message {
  /* 1. 绝对定位：对齐输入框左侧，紧贴下方 */
  position: absolute;
  left: 0; /* 和输入框左边缘对齐 */
  top: calc(100% + 2px); /* 输入框底部 + 2px（极近间距） */
  /* 2. 消除提示文本自身的间距 */
  font-size: 12px;
  color: #ef4444;
  line-height: 1.2; /* 紧凑行高，减少文本自身高度 */
  padding: 0; /* 去掉默认内边距 */
  margin: 0; /* 去掉默认外边距 */
  /* 3. 限制宽度和输入框一致 */
  width: calc(100% - 88px); /* 减去按钮宽度，和输入框等宽 */
  /* 4. 消除点击交互遮挡 */
  pointer-events: none;
  z-index: 10;
}

.warning-message.url-exists-message {
  /* 1. 绝对定位：对齐输入框左侧，紧贴下方 */
  position: absolute;
  left: 0; /* 和输入框左边缘对齐 */
  top: calc(100% + 2px); /* 输入框底部 + 2px（极近间距） */
  /* 2. 消除提示文本自身的间距 */
  font-size: 12px;
  color: #f59e0b;
  line-height: 1.2; /* 紧凑行高，减少文本自身高度 */
  padding: 0; /* 去掉默认内边距 */
  margin: 0; /* 去掉默认外边距 */
  /* 3. 限制宽度和输入框一致 */
  width: calc(100% - 88px); /* 减去按钮宽度，和输入框等宽 */
  /* 4. 消除点击交互遮挡 */
  pointer-events: none;
  z-index: 10;
}

/* ========== 获取 Meta 数据按钮样式 ========== */
.btn-fetch-metadata {
  padding: 4px 12px;
  font-size: 12px;
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
}

.btn-fetch-metadata:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-fetch-metadata:active:not(:disabled) {
  transform: translateY(0);
}

.btn-fetch-metadata:disabled {
  background-color: var(--color-bg-disabled);
  color: var(--color-text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

/* ========== Textarea 样式 ========== */
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border-base);
  border-radius: 4px;
  font-size: 14px;
  background-color: var(--color-bg-page);
  color: var(--color-text-main);
  transition: border-color 0.3s ease;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

/* ========== 图标预览区域（左右布局） ========== */
.icon-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.icon-preview-col {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.icon-image-container {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--color-bg-page);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--color-border-base);
}

.icon-image-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-hover);
}

.placeholder-text {
  font-size: 28px;
  font-weight: bold;
  color: var(--color-text-disabled);
}

.icon-textarea-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.icon-textarea-col .form-textarea {
  flex: 1;
  resize: vertical;
  height: 64px; /* 与图片高度统一 */
}

/* ========== 标签选择器 ========== */
.tags-list-row {
  margin-top: -8px; /* 向上偏移，紧贴输入框下方 */
  padding-top: 0;
}

.form-label-placeholder {
  visibility: hidden; /* 隐藏但保留空间 */
  pointer-events: none; /* 禁止交互 */
}

.tags-list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  padding-left: 0;
}

.tags-dropdown {
  position: static; /* 改为静态定位，融入文档流 */
  left: 0;
  top: auto;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  background-color: transparent;
  border: none;
  z-index: 5;
}

.tag-item {
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-text-main);
  background-color: var(--color-bg-active);
  font-size: 13px;
  white-space: nowrap;
}

.tag-item:hover {
  background-color: var(--color-bg-hover);
  transform: translateY(-1px);
}

.tag-item.tag-added {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.tag-item.tag-added:hover {
  background-color: var(--color-primary-hover);
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-disabled);
}

/* ========== 提交/取消按钮 ========== */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.button-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button-secondary {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-base);
}

.button-secondary:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-border-focus);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.button-secondary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
