// 标签页切换
const tabBtns = document.querySelectorAll('.tab-btn')
const panels = document.querySelectorAll('.panel')

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

// 添加网站表单提交
const addForm = document.getElementById('add-form')
const messageEl = document.getElementById('message')

addForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const websiteData = {
    name: document.getElementById('name').value.trim(),
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
  
  try {
    // 发送到 background.js 保存
    const response = await chrome.runtime.sendMessage({
      action: 'addWebsite',
      data: websiteData
    })
    
    if (response.success) {
      showMessage(messageEl, '✓ 添加成功！', 'success')
      addForm.reset()
    } else {
      showMessage(messageEl, '✗ 添加失败：' + response.error, 'error')
    }
  } catch (error) {
    showMessage(messageEl, '✗ 错误：' + error.message, 'error')
  }
})

// 文件选择监听
const importFileInput = document.getElementById('import-file')
const fileNameEl = document.getElementById('file-name')
const importBtn = document.getElementById('import-btn')
let selectedFile = null

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) {
    selectedFile= file
    fileNameEl.textContent = `已选择：${file.name}`
    importBtn.disabled = false
  } else {
    selectedFile = null
    fileNameEl.textContent = ''
    importBtn.disabled = true
  }
})

// 导入数据
const importMessageEl = document.getElementById('import-message')
const importProgress = document.getElementById('import-progress')
const progressBar = importProgress.querySelector('.progress-bar')
const progressText = importProgress.querySelector('.progress-text')

importBtn.addEventListener('click', async () => {
  if (!selectedFile) return
  
  try {
    importBtn.disabled = true
    importProgress.style.display = 'block'
    progressBar.classList.add('loading')
    progressText.textContent= '正在读取文件...'
    
    // 读取文件内容
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result)
        
        // 验证数据格式
        if (!data.websites || !Array.isArray(data.websites)) {
          throw new Error('无效的数据格式：缺少 websites 数组')
        }
        
        progressText.textContent = `准备导入 ${data.websites.length} 个网站...`
        
        // 发送到 background.js 进行批量导入
        const response = await chrome.runtime.sendMessage({
          action: 'importWebsites',
          data: data.websites
        })
        
        progressBar.classList.remove('loading')
        progressBar.style.width = '100%'
        
        if (response.success) {
          progressText.textContent = `✓ 成功导入 ${response.count} 个网站！`
          showMessage(importMessageEl, `✓ 成功导入 ${response.count} 个网站！`, 'success')
        } else {
          throw new Error(response.error || '导入失败')
        }
      } catch (error) {
        progressBar.classList.remove('loading')
        progressText.textContent = '导入失败'
        showMessage(importMessageEl, '✗ 导入失败：' + error.message, 'error')
      } finally {
        setTimeout(() => {
          importProgress.style.display = 'none'
          importBtn.disabled = false
        }, 3000)
      }
    }
    
    reader.onerror = () => {
      progressBar.classList.remove('loading')
      progressText.textContent= '读取失败'
      showMessage(importMessageEl, '✗ 文件读取失败', 'error')
      importBtn.disabled = false
    }
    
    reader.readAsText(selectedFile)
  } catch (error) {
    progressBar.classList.remove('loading')
    progressText.textContent = '导入失败'
    showMessage(importMessageEl, '✗ 错误：' + error.message, 'error')
    importBtn.disabled = false
  }
})

// 导出数据
const exportBtn = document.getElementById('export-btn')
const exportMessageEl = document.getElementById('export-message')

exportBtn.addEventListener('click', async () => {
  try {
    exportBtn.disabled = true
    
    // 请求导出所有网站数据
    const response = await chrome.runtime.sendMessage({
      action: 'exportWebsites'
    })
    
    if (response.success) {
      // 生成文件名（带时间戳）
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `startpage-backup-${timestamp}.json`
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      
      // 触发下载
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

// 显示消息工具函数
function showMessage(element, text, type) {
  element.textContent = text
  element.className= `message ${type}`
  
  // 3 秒后自动隐藏
  setTimeout(() => {
    element.className= 'message'
    element.textContent= ''
  }, 5000)
}

// 初始化：获取当前页面信息（如果在网页上打开）
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
    const currentTab = tabs[0]
    document.getElementById('name').value = currentTab.title || ''
    document.getElementById('url').value = currentTab.url || ''
  }
})
