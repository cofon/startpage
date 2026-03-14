/* global chrome */

// ========== 工具函数（全局可用） ==========
function showMessage(element, text, type) {
  element.textContent = text
  element.className = `message ${type}`

  // 3 秒后自动隐藏
  setTimeout(() => {
    element.className = 'message'
    element.textContent = ''
  }, 5000)
}

// ========== 等待 DOM 加载完成 ==========
document.addEventListener('DOMContentLoaded', function () {
  console.log('[Popup] DOM 加载完成')

  // 防止重复提交的状态标志
  let isSubmitting = false

  // 标签页切换
  const tabBtns = document.querySelectorAll('.tab-btn')
  const panels = document.querySelectorAll('.panel')

  if (tabBtns.length > 0 && panels.length > 0) {
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // 移除所有激活状态
        tabBtns.forEach((b) => b.classList.remove('active'))
        panels.forEach((p) => p.classList.remove('active'))

        // 添加当前激活状态
        btn.classList.add('active')
        const panelId = btn.dataset.tab + '-panel'
        document.getElementById(panelId).classList.add('active')
      })
    })
  }

  // 表单元素引用
  const addForm = document.getElementById('add-form')
  const messageEl = document.getElementById('message')
  const fetchMetadataBtn = document.getElementById('fetch-metadata-btn')
  const urlInput = document.getElementById('url')
  const urlExistsMessage = document.getElementById('url-exists-message')
  const tagsInput = document.getElementById('tags')
  const tagsDropdown = document.getElementById('tags-dropdown')

  // ========== Tags 相关功能 ==========
  let allTags = []

  // 获取所有标签
  async function fetchAllTags() {
    console.log('[Popup] fetchAllTags 开始执行')
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'CALL_STARTPAGE_API',
        method: 'getAllTags',
        data: {}
      })
      console.log('[Popup] fetchAllTags 收到响应:', response)

      if (response && response.success && response.result) {
        allTags = response.result
        console.log('[Popup] 获取到的所有标签:', allTags)
        renderTagsDropdown()
      } else {
        console.log('[Popup] 响应无效或没有结果:', response)
      }
    } catch (error) {
      console.error('[Popup] 获取所有标签失败:', error)
    }
  }

  // 渲染 tags 下拉列表
  function renderTagsDropdown() {
    console.log('[Popup] renderTagsDropdown 开始执行, allTags:', allTags)
    console.log('[Popup] tagsDropdown 元素:', tagsDropdown)
    
    tagsDropdown.innerHTML = ''
    allTags.forEach(tag => {
      const tagItem = document.createElement('div')
      tagItem.className = 'tag-item'
      tagItem.textContent = tag
      tagItem.addEventListener('click', () => toggleTag(tag))
      tagsDropdown.appendChild(tagItem)
    })
    console.log('[Popup] 渲染了', allTags.length, '个标签')
    console.log('[Popup] tagsDropdown.innerHTML:', tagsDropdown.innerHTML)
    updateTagStyles()
  }

  // 获取当前输入的标签列表
  function getCurrentTags() {
    return tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t)
  }

  // 检查标签是否已添加
  function isTagAdded(tag) {
    return getCurrentTags().includes(tag)
  }

  // 添加或移除标签
  function toggleTag(tag) {
    console.log('[Popup] toggleTag 被调用, tag:', tag)
    const tags = getCurrentTags()
    const index = tags.indexOf(tag)

    if (index > -1) {
      // 如果标签已存在，则移除
      console.log('[Popup] 移除标签:', tag)
      tags.splice(index, 1)
    } else {
      // 如果标签不存在，则添加
      console.log('[Popup] 添加标签:', tag)
      tags.push(tag)
    }

    tagsInput.value = tags.join(', ')
    console.log('[Popup] 更新后的 tagsInput.value:', tagsInput.value)
    updateTagStyles()
  }

  // 更新标签样式
  function updateTagStyles() {
    console.log('[Popup] updateTagStyles 被调用')
    const tagItems = tagsDropdown.querySelectorAll('.tag-item')
    console.log('[Popup] 找到', tagItems.length, '个标签项')
    tagItems.forEach(item => {
      const isAdded = isTagAdded(item.textContent)
      console.log('[Popup] 标签:', item.textContent, '是否已添加:', isAdded)
      if (isAdded) {
        item.classList.add('tag-added')
      } else {
        item.classList.remove('tag-added')
      }
    })
  }

  // 监听 tags 输入框变化
  tagsInput.addEventListener('input', () => {
    updateTagStyles()
  })

  // 监听 tags 输入框焦点
  tagsInput.addEventListener('focus', () => {
    console.log('[Popup] tagsInput 获得焦点')
  })

  // 点击外部关闭 tags 下拉列表（已禁用，始终显示）
  // document.addEventListener('click', (e) => {
  //   if (!e.target.closest('.tags-input-container')) {
  //     tagsDropdown.style.display = 'none'
  //   }
  // })

  // 初始化：获取所有标签
  fetchAllTags()

  // ========== URL 输入框实时检查 ==========
  let urlCheckTimeout = null
  let lastCheckedUrl = ''
  let svgDebounceTimer = null

  async function checkUrlExists(url) {
    console.log('[Popup] checkUrlExists 被调用，URL:', url)
    try {
      console.log('[Popup] 准备发送消息...')
      const checkResponse = await chrome.runtime.sendMessage({
        action: 'CALL_STARTPAGE_API',
        method: 'checkUrlExists',
        data: { url: url },
      })

      console.log('[Popup] ✅ 收到响应:', checkResponse)
      console.log('[Popup] checkResponse.result:', checkResponse.result)
      if (checkResponse.result && checkResponse.result.website) {
        console.log('[Popup] checkResponse.result.website:', checkResponse.result.website)
        console.log('[Popup] checkResponse.result.website.tags:', checkResponse.result.website.tags)
      }

      if (
        checkResponse &&
        checkResponse.success &&
        checkResponse.result &&
        checkResponse.result.exists
      ) {
        console.log('[Popup] 🔴 URL 已存在:', url, 'ID:', checkResponse.result.websiteId)
        urlExistsMessage.style.display = 'block'
        urlInput.classList.add('url-exists')
        
        // 获取完整的网站信息并填充表单
        if (checkResponse.result.website) {
          const website = checkResponse.result.website
          console.log('[Popup] 获取到网站信息:', website)
          
          // 填充 tags
          if (website.tags && Array.isArray(website.tags) && website.tags.length > 0) {
            tagsInput.value = website.tags.join(', ')
            console.log('[Popup] 填充 tags:', tagsInput.value)
            updateTagStyles()
          }
        }
      } else {
        console.log('[Popup] 🟢 URL 不存在:', url)
        urlExistsMessage.style.display = 'none'
        urlInput.classList.remove('url-exists')
      }
    } catch (error) {
      console.error('[Popup] ❌ 检查 URL 是否存在失败:', error)
      // 失败时隐藏提示，不影响用户操作
      urlExistsMessage.style.display = 'none'
      urlInput.classList.remove('url-exists')
    }
  }

  // ========== SVG 图标预览功能 ==========
  async function previewSVG(url) {
    const iconGenerateInput = document.getElementById('iconGenerateData')
    const placeholder = document.querySelector('#svg-preview .icon-preview-placeholder')
    const previewImg = document.getElementById('svg-preview-img')
    const previewBox = document.getElementById('svg-preview')

    console.log('[Popup] 🎨 previewSVG 被调用，URL:', url)

    if (!url || url.length < 10) {
      console.log('[Popup] URL 太短，清除预览')
      // URL 太短，清除预览
      clearSVGPReview()
      return
    }

    try {
      // 显示加载状态
      if (placeholder) {
        placeholder.style.display = 'block'
        placeholder.textContent = '正在生成预览...'
      }
      if (previewImg) {
        previewImg.style.display = 'none'
        previewImg.src = ''
      }
      if (previewBox) previewBox.classList.remove('has-icon')

      // 调用起始页 API 生成 SVG
      console.log('[Popup] 📡 准备发送 normalizeWebsite 请求...')
      const response = await chrome.runtime.sendMessage({
        action: 'CALL_STARTPAGE_API',
        method: 'normalizeWebsite',
        data: { url: url },
      })

      console.log('[Popup] ✅ 收到 CALL_STARTPAGE_API 响应:', response)

      // 解析响应：content.js 返回 { success: true, result }
      const normalizedData = response && response.success ? response.result : response

      console.log('[Popup] 🔍 解析后的数据:', JSON.stringify(normalizedData, null, 2))
      console.log('[Popup] - name:', normalizedData?.name)
      console.log('[Popup] - iconData:', normalizedData?.iconData?.substring(0, 50))
      console.log('[Popup] - iconGenerateData:', normalizedData?.iconGenerateData?.substring(0, 50))
      console.log('[Popup] - 是否有 iconGenerateData:', !!normalizedData?.iconGenerateData)

      if (normalizedData && normalizedData.iconGenerateData) {
        // 填充到输入框
        if (iconGenerateInput) {
          iconGenerateInput.value = normalizedData.iconGenerateData
          console.log(
            '[Popup] ✅ 已填充 iconGenerateData 到输入框，长度:',
            normalizedData.iconGenerateData.length,
          )
        }

        // 显示 SVG 预览（使用 img 标签）
        displaySVG(normalizedData.iconGenerateData)

        // 同时填充名称字段（如果为空）
        const nameInput = document.getElementById('name')
        if (nameInput && !nameInput.value.trim()) {
          nameInput.value = normalizedData.name || ''
          console.log('[Popup] 🏷️ 已自动填充 name:', normalizedData.name)
        }

        console.log('[Popup] ✓ SVG 预览已生成')
      } else {
        console.warn('[Popup] ⚠️ 没有 iconGenerateData:', normalizedData)
        if (placeholder) {
          placeholder.textContent = '⚠️ 无法生成 SVG 预览'
          placeholder.style.display = 'block'
        }
      }
    } catch (error) {
      console.error('[Popup] ❌ SVG 预览失败:', error)
      console.error('[Popup] 错误堆栈:', error.stack)
      if (placeholder) {
        placeholder.textContent = '✗ 预览失败：' + error.message
        placeholder.style.display = 'block'
      }

      // 如果是 "Cannot access member" 或 "Context invalidated" 错误，提示用户刷新起始页
      if (error.message.includes('Context') || error.message.includes('closed context')) {
        alert('⚠️ 插件与起始页的连接已断开，请刷新起始页后重试！')
      }
    }
  }

  if (urlInput && urlExistsMessage) {
    // 监听 input 事件 - 实时检测 URL 重复和生成 SVG
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim()
      console.log('[Popup] 📝 input 事件触发，当前 URL:', url)

      // 如果 URL 为空，隐藏提示
      if (!url) {
        console.log('[Popup] URL 为空，清除状态')
        urlExistsMessage.style.display = 'none'
        urlInput.classList.remove('url-exists')
        lastCheckedUrl = ''
        clearSVGPReview()
        return
      }

      // 验证 URL 格式
      try {
        new URL(url.startsWith('http') ? url : 'http://' + url)
      } catch {
        // URL 格式不正确，不进行检查
        console.log('[Popup] URL 格式不正确，跳过检测')
        urlExistsMessage.style.display = 'none'
        urlInput.classList.remove('url-exists')
        return
      }

      // 只有当 URL 发生变化时才重新检查
      if (url !== lastCheckedUrl) {
        lastCheckedUrl = url
        console.log('[Popup] URL 发生变化，准备检测...')

        // 清除之前的定时器
        if (urlCheckTimeout) {
          clearTimeout(urlCheckTimeout)
        }
        if (svgDebounceTimer) {
          clearTimeout(svgDebounceTimer)
        }

        console.log('[Popup] ⏰ 设置双定时器，200ms 后同时触发')

        // 同时触发 URL 检测和 SVG 生成（都使用 200ms 延迟）
        urlCheckTimeout = setTimeout(() => {
          console.log('[Popup] ⏰ URL 检测定时器触发，调用 checkUrlExists')
          checkUrlExists(url)
        }, 200)

        svgDebounceTimer = setTimeout(() => {
          console.log('[Popup] 🎨 SVG 生成定时器触发，调用 previewSVG')
          previewSVG(url)
        }, 200)
      } else {
        console.log('[Popup] URL 未变化，跳过检测')
      }
    })

    // 监听 blur 事件 - 失焦时立即检测（双重保障）
    urlInput.addEventListener('blur', () => {
      const url = urlInput.value.trim()
      console.log('[Popup] 👁️ blur 事件触发，当前 URL:', url)

      if (!url) {
        urlExistsMessage.style.display = 'none'
        urlInput.classList.remove('url-exists')
        return
      }

      // 验证 URL 格式
      try {
        new URL(url.startsWith('http') ? url : 'http://' + url)
        // 立即检查，不使用延迟
        console.log('[Popup] 🔍 Blur 时立即检查 URL 重复')
        checkUrlExists(url)
        console.log('[Popup] 🎨 Blur 时立即生成 SVG')
        previewSVG(url)
      } catch {
        urlExistsMessage.style.display = 'none'
        urlInput.classList.remove('url-exists')
      }
    })

    console.log('[Popup] ✅ URL 实时检测 + SVG 生成功能已初始化')
  }

  // ========== 自动获取元数据按钮 ==========
  if (fetchMetadataBtn) {
    fetchMetadataBtn.addEventListener('click', async () => {
      const url = document.getElementById('url').value.trim()
      if (!url) {
        showMessage(messageEl, '请先输入 URL', 'error')
        return
      }

      showMessage(messageEl, '正在获取信息...', 'loading')

      try {
        // 请求 background.js 获取元数据
        const metadata = await chrome.runtime.sendMessage({
          action: 'FETCH_METADATA',
          url: url,
          fromCurrentTab: false,
        })

        if (metadata) {
          // 填充表单字段（带空值检查）
          const titleEl = document.getElementById('title')
          const descEl = document.getElementById('description')
          const iconDataEl = document.getElementById('iconData')

          if (titleEl) titleEl.value = metadata.title || ''
          if (descEl) descEl.value = metadata.description || ''

          // 保存 iconData 到临时变量并填充到输入框
          if (metadata.iconData) {
            window.tempIconData = metadata.iconData
            // 填充到 iconData 输入框（完整显示）
            if (iconDataEl) {
              iconDataEl.value = metadata.iconData
              // 更新预览
              updateIconPreview(metadata.iconData)
              console.log('[Popup] 已填充 iconData 到输入框')
            } else {
              console.warn('[Popup] 未找到 iconData 输入框元素')
            }
          }

          showMessage(messageEl, '✓ 获取成功！', 'success')
        } else {
          showMessage(messageEl, '✗ 获取失败', 'error')
        }
      } catch (error) {
        showMessage(messageEl, '✗ 错误：' + error.message, 'error')
      }
    })
  }

  // ========== 表单提交处理 ==========
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const currentSubmitId = Date.now()
      console.log(`[Popup] ====== 表单提交 #${currentSubmitId} 开始 ======`)
      console.log('[Popup] 当前 isSubmitting:', isSubmitting)

      // 防止重复提交
      if (isSubmitting) {
        console.log('[Popup] ⚠️ 正在提交中，忽略本次请求')
        return
      }
      isSubmitting = true

      // 禁用保存按钮
      const submitBtn = addForm.querySelector('button[type="submit"]')
      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.textContent = '保存中...'
      }

      try {
        const websiteData = {
          name: document.getElementById('name').value.trim(),
          title: document.getElementById('title').value.trim(),
          url: document.getElementById('url').value.trim(),
          description: document.getElementById('description').value.trim(),
          tags: document
            .getElementById('tags')
            .value.split(/[,,]/)
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0),
          // 状态字段
          isMarked: document.getElementById('isMarked').checked,
          isActive: document.getElementById('isActive').checked,
          isHidden: document.getElementById('isHidden').checked,
          visitCount: 0,
          markOrder: 0,
        }

        // 添加 iconData 字段（从输入框或临时存储获取）
        const iconDataInput = document.getElementById('iconData').value.trim()

        // 使用完整输入框的数据或临时存储
        if (iconDataInput) {
          websiteData.iconData = iconDataInput
          console.log('[Popup] 使用输入框的 iconData')
        } else if (window.tempIconData) {
          websiteData.iconData = window.tempIconData
          console.log('[Popup] 使用临时存储的 iconData')
        }

        if (websiteData.iconData) {
          console.log('[Popup] 包含图标数据，长度:', websiteData.iconData.length)
        }

        console.log(`[Popup] #${currentSubmitId} 准备发送 ADD_WEBSITE 消息`)
        console.log('[Popup] 网站数据:', websiteData)

        // 发送前再次检查
        if (!websiteData.url) {
          console.error('[Popup] ❌ URL 为空，拒绝发送')
          throw new Error('URL 不能为空')
        }

        // 检查 URL 是否已存在
        console.log('[Popup] 检查 URL 是否已存在:', websiteData.url)
        const checkResponse = await chrome.runtime.sendMessage({
          action: 'CALL_STARTPAGE_API',
          method: 'checkUrlExists',
          data: { url: websiteData.url },
        })

        console.log('[Popup] URL 检查响应:', checkResponse)

        if (
          checkResponse &&
          checkResponse.success &&
          checkResponse.result &&
          checkResponse.result.exists
        ) {
          console.error('[Popup] ❌ URL 已存在:', checkResponse.result)
          // 设置 URL 输入框样式为错误状态
          urlInput.classList.add('url-exists')
          if (urlExistsMessage) {
            urlExistsMessage.style.display = 'block'
          }
          throw new Error('该网站已存在，请勿重复添加')
        }

        // 发送到起始页保存（通过 content.js 转发）
        console.log('[Popup] 调用 chrome.runtime.sendMessage...')
        const response = await chrome.runtime.sendMessage({
          action: 'ADD_WEBSITE',
          data: websiteData,
        })

        console.log(`[Popup] #${currentSubmitId} ✅ 收到响应:`, response)

        if (response.success) {
          showMessage(messageEl, '✓ 添加成功！', 'success')
          addForm.reset()
          window.tempIconData = null // 清除临时数据
          updateIconPreview(null) // 清除预览
          // 清除 URL 已存在状态
          urlInput.classList.remove('url-exists')
          if (urlExistsMessage) {
            urlExistsMessage.style.display = 'none'
          }
          console.log('[Popup] 表单已重置，临时数据已清理')
        } else {
          showMessage(messageEl, '✗ 添加失败：' + response.error, 'error')
          console.error('[Popup] ❌ 添加失败:', response.error)
        }
      } catch (error) {
        showMessage(messageEl, '✗ 错误：' + error.message, 'error')
        console.error('[Popup] ❌ 捕获异常:', error)
      } finally {
        // 恢复提交状态
        isSubmitting = false
        console.log('[Popup] 已释放提交锁，isSubmitting = false')

        // 恢复保存按钮
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = '保存'
          console.log('[Popup] 保存按钮已恢复')
        }

        console.log(`[Popup] ====== 表单提交 #${currentSubmitId} 结束 ======`)
      }
    })

    console.log('[Popup] ✅ 表单提交事件监听器已注册')
  }

  // ========== 页面加载时自动获取当前页面元数据 ==========
  ;(async function autoFillCurrentTabMetadata() {
    try {
      console.log('[Popup] 尝试获取当前页面元数据...')

      const metadata = await chrome.runtime.sendMessage({
        action: 'FETCH_METADATA',
        fromCurrentTab: true,
      })

      console.log('[Popup] 收到元数据响应:', metadata)

      if (metadata && metadata.url) {
        console.log('[Popup] 获取到元数据:', metadata)

        // 填充表单字段（带空值检查）
        const titleEl = document.getElementById('title')
        const urlEl = document.getElementById('url')
        const descEl = document.getElementById('description')
        const iconDataEl = document.getElementById('iconData')

        if (titleEl) titleEl.value = metadata.title || ''
        if (urlEl) urlEl.value = metadata.url || ''
        if (descEl) descEl.value = metadata.description || ''

        // 保存 iconData 到临时变量并填充到输入框
        if (metadata.iconData) {
          window.tempIconData = metadata.iconData
          // 填充到 iconData 输入框（完整显示）
          if (iconDataEl) {
            iconDataEl.value = metadata.iconData
            // 更新预览
            updateIconPreview(metadata.iconData)
            console.log('[Popup] 已填充 iconData 到输入框')
          } else {
            console.warn('[Popup] 未找到 iconData 输入框元素')
          }
        }

        // 立即检测 URL 是否存在并生成 SVG 预览
        if (metadata.url && urlEl) {
          console.log('[Popup] 自动填充后立即检测 URL 是否存在:', metadata.url)
          checkUrlExists(metadata.url)

          // 立即生成 SVG 预览
          console.log('[Popup] 自动填充后立即生成 SVG 预览:', metadata.url)
          previewSVG(metadata.url)
        }
      }
    } catch (error) {
      console.warn('[Popup] 获取元数据失败（可能不在网页上下文中）:', error)
    }
  })()

  // ========== 新增：iconData 输入框切换功能 ==========
  const toggleIconDataBtn = document.getElementById('toggle-iconData-btn')
  const iconDataWrapper = document.querySelector('.icon-input-wrapper')

  if (toggleIconDataBtn && iconDataWrapper) {
    toggleIconDataBtn.addEventListener('click', () => {
      const isExpanded = iconDataWrapper.classList.toggle('expanded')
      toggleIconDataBtn.textContent = isExpanded ? '⬆️' : '⬇️'
      toggleIconDataBtn.title = isExpanded ? '收起' : '展开'
      console.log('[Popup] iconData 输入框已', isExpanded ? '展开' : '收起')
    })
  }

  // ========== 新增：图标预览功能 ==========
  function updateIconPreview(iconData) {
    const previewContainer = document.getElementById('icon-preview')
    const previewPlaceholder = document.querySelector('.icon-preview-placeholder')
    const previewImg = document.getElementById('icon-preview-img')

    if (!previewContainer || !previewImg) return

    if (iconData && iconData.startsWith('data:image/')) {
      // 有有效的 iconData，显示图片
      previewImg.src = iconData
      previewImg.style.display = 'block'
      if (previewPlaceholder) previewPlaceholder.style.display = 'none'
      previewContainer.classList.add('has-icon')
      console.log('[Popup] 图标预览已更新')
    } else {
      // 无 iconData，显示占位符
      previewImg.src = ''
      previewImg.style.display = 'none'
      if (previewPlaceholder) previewPlaceholder.style.display = 'block'
      previewContainer.classList.remove('has-icon')
      console.log('[Popup] 清除图标预览')
    }
  }

  // 监听 iconData 输入框变化，实时更新预览
  const iconDataInput = document.getElementById('iconData')

  if (iconDataInput) {
    iconDataInput.addEventListener('input', (e) => {
      const value = e.target.value.trim()
      // 如果是有效的 base64 数据，更新预览
      if (value && value.startsWith('data:image/')) {
        updateIconPreview(value)
      } else if (value && value.length > 0) {
        // 用户正在输入，但还未完成
        console.log('[Popup] 正在输入 iconData...')
      } else {
        // 输入框为空
        updateIconPreview(null)
      }
    })

    // 失去焦点时，如果有值但不是完整 base64，尝试使用
    iconDataInput.addEventListener('blur', () => {
      const value = iconDataInput.value.trim()
      if (value && !value.startsWith('data:image/')) {
        console.warn('[Popup] iconData 格式不正确，应以 data:image/ 开头')
      }
    })
  }

  // ========== 新增：SVG 图标预览功能 ==========
  function displaySVG(svgString) {
    const placeholder = document.querySelector('#svg-preview .icon-preview-placeholder')
    const previewImg = document.getElementById('svg-preview-img')
    const previewBox = document.getElementById('svg-preview')

    if (!previewImg) return

    console.log('[Popup] 准备显示 SVG，原始 SVG 长度:', svgString?.length)
    console.log('[Popup] SVG 前 100 字符:', svgString?.substring(0, 100))

    try {
      // 将 SVG 字符串转换为 base64 Data URL
      // 方法 1: 直接使用 btoa（适用于 ASCII）
      let svgBase64

      // 检查是否已经是 data URL 格式
      if (svgString.startsWith('data:image/svg+xml;base64,')) {
        // 已经是完整格式，直接使用
        svgBase64 = svgString
        console.log('[Popup] 使用已有 data URL 格式')
      } else if (svgString.startsWith('<svg')) {
        // 纯 SVG 字符串，需要转换
        // 使用更可靠的方法：Blob + FileReader
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        const reader = new FileReader()

        reader.onloadend = () => {
          svgBase64 = reader.result
          console.log('[Popup] FileReader 转换成功:', svgBase64.substring(0, 100))

          if (placeholder) placeholder.style.display = 'none'
          previewImg.src = svgBase64
          previewImg.style.display = 'block'

          if (previewBox) {
            previewBox.classList.add('has-icon')
          }

          console.log('[Popup] SVG 预览已更新')
        }

        reader.onerror = () => {
          console.error('[Popup] FileReader 失败，尝试备用方案')
          // 备用方案：直接 URL 编码
          fallbackDisplay(svgString, placeholder, previewImg, previewBox)
        }

        reader.readAsDataURL(blob)
        return // 提前返回，等待异步完成
      } else {
        console.error('[Popup] 未知的 SVG 格式:', svgString.substring(0, 50))
        fallbackDisplay(svgString, placeholder, previewImg, previewBox)
        return
      }

      // 同步路径（当已经是 data URL 时）
      if (placeholder) placeholder.style.display = 'none'
      previewImg.src = svgBase64
      previewImg.style.display = 'block'

      if (previewBox) {
        previewBox.classList.add('has-icon')
      }

      console.log('[Popup] SVG 预览已更新')
    } catch (error) {
      console.error('[Popup] displaySVG 错误:', error)
      fallbackDisplay(svgString, placeholder, previewImg, previewBox)
    }
  }

  // 备用显示方案
  function fallbackDisplay(svgString, placeholder, previewImg, previewBox) {
    try {
      // 尝试简单的 URL 编码
      const encoded = encodeURIComponent(svgString)
      const svgBase64 = 'data:image/svg+xml;charset=utf-8,' + encoded

      if (placeholder) placeholder.style.display = 'none'
      previewImg.src = svgBase64
      previewImg.style.display = 'block'

      if (previewBox) {
        previewBox.classList.add('has-icon')
      }

      console.log('[Popup] 使用备用方案显示 SVG')
    } catch (error) {
      console.error('[Popup] 备用方案也失败:', error)
      if (placeholder) {
        placeholder.textContent = '✗ 图片加载失败'
        placeholder.style.display = 'block'
      }
    }
  }

  function clearSVGPReview() {
    const iconGenerateInput = document.getElementById('iconGenerateData')
    const placeholder = document.querySelector('#svg-preview .icon-preview-placeholder')
    const previewImg = document.getElementById('svg-preview-img')
    const previewBox = document.getElementById('svg-preview')

    if (iconGenerateInput) iconGenerateInput.value = ''
    if (placeholder) {
      placeholder.style.display = 'block'
      placeholder.textContent = '输入 URL 后自动生成 SVG 预览'
    }
    if (previewImg) {
      previewImg.src = ''
      previewImg.style.display = 'none'
    }
    if (previewBox) previewBox.classList.remove('has-icon')
  }

  // 监听 URL 输入变化，实时预览 SVG
  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim()

      // 防抖：500ms 后才触发
      clearTimeout(svgDebounceTimer)
      svgDebounceTimer = setTimeout(() => {
        previewSVG(url)
      }, 500)
    })

    // 监听 blur 事件（失去焦点时立即触发）
    urlInput.addEventListener('blur', (e) => {
      const url = e.target.value.trim()
      if (url && url.length >= 10) {
        // 清除定时器，立即执行
        clearTimeout(svgDebounceTimer)
        previewSVG(url)
      }
    })

    console.log('[Popup] ✅ SVG 预览功能已初始化')
  }

  // ========== 新增：监听 SVG 输入框手动输入 ==========
  const svgInput = document.getElementById('iconGenerateData')
  if (svgInput) {
    // 监听 input 事件，实时预览手动输入的 SVG
    svgInput.addEventListener('input', (e) => {
      const value = e.target.value.trim()

      // 如果是有效的 SVG 数据，更新预览
      if (value && (value.startsWith('<svg') || value.startsWith('data:image/svg'))) {
        displaySVG(value)
      } else if (value && value.length > 0) {
        // 用户正在输入，但还未完成
        console.log('[Popup] 正在输入 SVG 数据...')
      } else {
        // 输入框为空，清除预览
        clearSVGPReview()
      }
    })

    // 失去焦点时，如果有值但格式不正确，提示
    svgInput.addEventListener('blur', () => {
      const value = svgInput.value.trim()
      if (value && !value.startsWith('<svg') && !value.startsWith('data:image/svg')) {
        console.warn('[Popup] SVG 数据格式可能不正确，应以 <svg 或 data:image/svg 开头')
      }
    })

    console.log('[Popup] ✅ SVG 手动输入监听器已初始化')
  }

  console.log('[Popup] ✅ 所有功能初始化完成')
}) // 结束 DOMContentLoaded
