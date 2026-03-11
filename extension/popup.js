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
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Popup] DOM 加载完成')

  // 防止重复提交的状态标志
  let isSubmitting = false

  // 标签页切换
  const tabBtns = document.querySelectorAll('.tab-btn')
  const panels = document.querySelectorAll('.panel')

  if (tabBtns.length > 0 && panels.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 移除所有激活状态
        tabBtns.forEach(b => b.classList.remove('active'))
        panels.forEach(p => p.classList.remove('active'))

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
          fromCurrentTab: false
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
          tags: document.getElementById('tags').value
            .split(/[,,]/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0),
          // 状态字段
          isMarked: document.getElementById('isMarked').checked,
          isActive: document.getElementById('isActive').checked,
          isHidden: document.getElementById('isHidden').checked,
          visitCount: 0,
          markOrder: 0
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

        // 发送到起始页保存（通过 content.js 转发）
        console.log('[Popup] 调用 chrome.runtime.sendMessage...')
        const response = await chrome.runtime.sendMessage({
          action: 'ADD_WEBSITE',
          data: websiteData
        })

        console.log(`[Popup] #${currentSubmitId} ✅ 收到响应:`, response)

        if (response.success) {
          showMessage(messageEl, '✓ 添加成功！', 'success')
          addForm.reset()
          window.tempIconData = null // 清除临时数据
          updateIconPreview(null) // 清除预览
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

  // ========== 导入功能 ==========
  const importFileInput = document.getElementById('import-file')
  const fileNameEl = document.getElementById('file-name')
  const importBtn = document.getElementById('import-btn')
  let selectedFile = null

  // ========== 新增：补全网站元数据函数 ==========
  async function enrichWebsiteMetadata(website) {
    const needsEnrichment = !website.title || !website.description || !website.iconData

    if (!needsEnrichment) {
      return website
    }

    console.log('[Popup] 检测到大失字段，尝试补全:', website.url)

    try {
      // 使用插件的 background.js 获取元数据（无跨域限制）
      const metadata = await chrome.runtime.sendMessage({
        action: 'FETCH_METADATA',
        url: website.url,
        fromCurrentTab: false
      })

      if (metadata) {
        // 只补全缺失的字段
        if (!website.title && metadata.title) {
          website.title = metadata.title
          console.log(`[Popup] ✓ 已补全 title: ${metadata.title}`)
        }

        if (!website.description && metadata.description) {
          website.description = metadata.description
          console.log(`[Popup] ✓ 已补全 description`)
        }

        if (!website.iconData && metadata.iconData) {
          website.iconData = metadata.iconData
          console.log(`[Popup] ✓ 已补全 iconData (长度：${metadata.iconData.length})`)
        }
      } else {
        console.warn(`[Popup] ⚠ 无法获取元数据：${website.url}`)
      }
    } catch (error) {
      // 网络错误、SSL 问题等不处理，只记录日志
      console.warn(`[Popup] ⚠ 获取元数据失败 (${website.url}): ${error.message}`)
    }

    return website
  }

  // ========== 批量补全元数据 ==========
  async function batchEnrichMetadata(websites, progressCallback) {
    const total = websites.length
    let processed = 0

    for (let i = 0; i < websites.length; i++) {
      const website = websites[i]

      // 检查是否需要补全
      if (!website.title || !website.description || !website.iconData) {
        await enrichWebsiteMetadata(website)
      }

      processed++
      if (progressCallback) {
        progressCallback(processed, total)
      }
    }

    return websites
  }

  if (importFileInput) {
    importFileInput.addEventListener('change', (e) => {
     const file = e.target.files[0]
     if (file) {
        selectedFile = file
        fileNameEl.textContent = `已选择：${file.name}`
        importBtn.disabled = false
      } else {
        selectedFile = null
        fileNameEl.textContent = ''
        importBtn.disabled = true
      }
    })
  }

  if (importBtn) {
    importBtn.addEventListener('click', async () => {
     if (!selectedFile) return

     try {
        importBtn.disabled = true
       const importProgress = document.getElementById('import-progress')
       const progressBar = importProgress.querySelector('.progress-bar')
       const progressText = importProgress.querySelector('.progress-text')

        importProgress.style.display = 'block'
        progressBar.classList.add('loading')
        progressText.textContent = '正在读取文件...'

       const reader = new FileReader()

        reader.onload = async (event) => {
         try {
           const data = JSON.parse(event.target.result)

           if (!data.websites || !Array.isArray(data.websites)) {
              throw new Error('无效的数据格式：缺少 websites 数组')
            }

            progressText.textContent = `准备处理 ${data.websites.length} 个网站...`

            // ========== 新增：批量补全缺失的元数据 ==========
            console.log('[Popup] 📋 开始检测并补全缺失的字段...')

            const enrichedWebsites = await batchEnrichMetadata(
              data.websites,
              (processed, total) => {
                const percent = Math.round((processed / total) * 100)
                progressText.textContent = `正在补全数据... ${processed}/${total} (${percent}%)`
                progressBar.style.width = `${percent}%`
              }
            )

            console.log('[Popup] ✅ 数据补全完成，开始导入...')
            progressText.textContent = `正在导入 ${enrichedWebsites.length} 个网站...`
            progressBar.classList.add('loading')

            // 发送补全后的数据到起始页
           const response = await chrome.runtime.sendMessage({
              action: 'IMPORT_WEBSITES',
              data: enrichedWebsites
            })

            progressBar.classList.remove('loading')
            progressBar.style.width = '100%'

           if (response.success) {
              progressText.textContent = `✓ 成功导入 ${response.total} 个网站，成功 ${response.success} 个！`
              showMessage(document.getElementById('import-message'), `✓ 成功导入 ${response.success}/${response.total} 个网站！`, 'success')
            } else {
              throw new Error(response.error || '导入失败')
            }
          } catch (error) {
            progressBar.classList.remove('loading')
            progressText.textContent = '导入失败'
            showMessage(document.getElementById('import-message'), '✗ 导入失败：' + error.message, 'error')
          } finally {
            setTimeout(() => {
              importProgress.style.display = 'none'
              importBtn.disabled = false
            }, 3000)
          }
        }

        reader.onerror = () => {
          progressBar.classList.remove('loading')
          progressText.textContent = '读取失败'
          showMessage(document.getElementById('import-message'), '✗ 文件读取失败', 'error')
          importBtn.disabled = false
        }

        reader.readAsText(selectedFile)
      } catch (error) {
        showMessage(document.getElementById('import-message'), '✗ 错误：' + error.message, 'error')
        importBtn.disabled = false
      }
    })
  }

  // ========== 导出功能 ==========
  const exportBtn = document.getElementById('export-btn')
  const exportMessageEl = document.getElementById('export-message')

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
     try {
        exportBtn.disabled = true

       const response = await chrome.runtime.sendMessage({
          action: 'EXPORT_WEBSITES'
        })

       if (response.success) {
         const now = new Date()
         const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
         const filename = `startpage-backup-${timestamp}.json`

         const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
         const url = URL.createObjectURL(blob)
         const a = document.createElement('a')
          a.href = url
          a.download = filename

          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          showMessage(exportMessageEl, `✓ 成功导出 ${response.count} 个网站到 ${filename}`, 'success')
        } else {
          showMessage(exportMessageEl, '✗ 导出失败：' + response.error, 'error')
        }
      } catch (error) {
        showMessage(exportMessageEl, '✗ 错误：' + error.message, 'error')
      } finally {
        exportBtn.disabled = false
      }
    })
  }

  // ========== 页面加载时自动获取当前页面元数据 ==========
  (async function autoFillCurrentTabMetadata() {
    try {
      console.log('[Popup] 尝试获取当前页面元数据...')

      const metadata = await chrome.runtime.sendMessage({
        action: 'FETCH_METADATA',
        fromCurrentTab: true
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
  let svgDebounceTimer = null

  async function previewSVG(url) {
    const iconGenerateInput = document.getElementById('iconGenerateData')
    const placeholder = document.querySelector('#svg-preview .icon-preview-placeholder')
    const previewImg = document.getElementById('svg-preview-img')
    const previewBox = document.getElementById('svg-preview')
    
    if (!url || url.length < 10) {
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
      const response = await chrome.runtime.sendMessage({
        action: 'CALL_STARTPAGE_API',
        method: 'normalizeWebsite',
        data: { url: url }
      })
      
      console.log('[Popup] 收到 CALL_STARTPAGE_API 响应:', response)
      
      // 解析响应：content.js 返回 { success: true, result }
      const normalizedData = response && response.success ? response.result : response
      
      console.log('[Popup] 解析后的数据:', normalizedData)
      
      if (normalizedData && normalizedData.iconGenerateData) {
        // 填充到输入框
        if (iconGenerateInput) {
          iconGenerateInput.value = normalizedData.iconGenerateData
          console.log('[Popup] 已填充 iconGenerateData 到输入框')
        }
        
        // 显示 SVG 预览（使用 img 标签）
        displaySVG(normalizedData.iconGenerateData)
        
        // 同时填充名称字段（如果为空）
        const nameInput = document.getElementById('name')
        if (nameInput && !nameInput.value.trim()) {
          nameInput.value = normalizedData.name || ''
          console.log('[Popup] 已自动填充 name:', normalizedData.name)
        }
        
        console.log('[Popup] ✓ 预览已生成')
      } else {
        console.warn('[Popup] 没有 iconGenerateData:', normalizedData)
      }
    } catch (error) {
      console.error('[Popup] SVG 预览失败:', error)
    }
  }

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
  const urlInput = document.getElementById('url')
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

  // 初始化 SVG 输入框切换功能
  const toggleSvgBtn = document.getElementById('toggle-svg-btn')
  const svgIconWrapper = document.querySelector('#iconGenerateData').parentElement
  
  if (toggleSvgBtn && svgIconWrapper) {
    toggleSvgBtn.addEventListener('click', () => {
      const isExpanded = svgIconWrapper.classList.toggle('expanded')
      toggleSvgBtn.textContent = isExpanded ? '⬆️' : '⬇️'
      toggleSvgBtn.title = isExpanded ? '收起' : '展开'
      console.log('[Popup] SVG 输入框已', isExpanded ? '展开' : '收起')
    })
  }

}) // ← DOMContentLoaded 结束
