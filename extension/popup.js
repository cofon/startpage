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
            
            progressText.textContent = `准备导入 ${data.websites.length} 个网站...`
            
           const response = await chrome.runtime.sendMessage({
              action: 'importWebsites',
              data: data.websites
            })
            
            progressBar.classList.remove('loading')
            progressBar.style.width = '100%'
            
           if (response.success) {
              progressText.textContent = `✓ 成功导入 ${response.count} 个网站！`
              showMessage(document.getElementById('import-message'), `✓ 成功导入 ${response.count} 个网站！`, 'success')
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

}) // ← DOMContentLoaded 结束
