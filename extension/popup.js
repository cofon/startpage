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
          // 填充表单
          document.getElementById('title').value = metadata.title || ''
          document.getElementById('description').value = metadata.description || ''
          
          // 保存 iconData 到临时变量
         if (metadata.iconData) {
            window.tempIconData = metadata.iconData
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

  // ========== 表单提交逻辑 ==========
  let submitCounter = 0
  let isSubmitting = false // 防止重复提交
  
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
   const currentSubmitId = ++submitCounter
     e.preventDefault()
     
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
          isMarked: document.getElementById('isMarked').checked,
          isActive: true,
          isHidden: false,
          visitCount: 0,
          markOrder: 0
        }
        
        // 如果有临时存储的 iconData，添加到数据中
     if (window.tempIconData) {
          websiteData.iconData = window.tempIconData
       console.log('[Popup] 包含图标数据')
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
          action: 'exportWebsites'
        })
        
       if (response.success) {
         const now = new Date()
         const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
         const filename = `startpage-backup-${timestamp}.json`
          
         const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
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
        
        // 填充表单字段
        document.getElementById('title').value = metadata.title || ''
        document.getElementById('url').value = metadata.url || ''
        document.getElementById('description').value = metadata.description || ''
        
        // 保存 iconData 到临时变量
     if (metadata.iconData) {
          window.tempIconData = metadata.iconData
        console.log('[Popup] 已保存图标数据')
        }
        
      console.log('[Popup] 表单已自动填充')
      } else {
      console.log('[Popup] 未获取到元数据（返回 null 或没有 URL）')
      }
    } catch (error) {
    console.error('[Popup] 获取元数据失败:', error)
      // 失败时不显示错误提示，避免干扰用户
    }
  })()
})
