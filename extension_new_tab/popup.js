/* global chrome */

// 扩展弹出面板脚本

// 消息类型
const MESSAGE_TYPES = {
  EXTENSION_SUBMIT_WEBSITE_META: 'EXTENSION_SUBMIT_WEBSITE_META',
}

// DOM 元素
const elements = {
  loading: document.getElementById('loading'),
  form: document.getElementById('form'),
  error: document.getElementById('error'),
  name: document.getElementById('name'),
  title: document.getElementById('title'),
  description: document.getElementById('description'),
  tags: document.getElementById('tags'),
  isMarked: document.getElementById('isMarked'),
  isActive: document.getElementById('isActive'),
  isHidden: document.getElementById('isHidden'),
  iconImage: document.getElementById('iconImage'),
  iconData: document.getElementById('iconData'),
  addBtn: document.getElementById('addBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  // 通知元素
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
}

// 显示错误信息
function showError(message) {
  elements.error.textContent = message
  elements.error.style.display = 'block'
}

// 隐藏错误信息
function hideError() {
  elements.error.style.display = 'none'
}

// 显示加载状态
function showLoading() {
  elements.loading.style.display = 'block'
  elements.form.style.display = 'none'
  hideError()
}

// 显示表单
function showForm() {
  elements.loading.style.display = 'none'
  elements.form.style.display = 'block'
  hideError()
}

// 显示通知条幅
function showToast(message, type = 'success') {
  const { toast, toastMessage } = elements;
  
  // 隐藏主内容区域
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.display = 'none';
  }
  
  // 设置文字内容
  toastMessage.textContent = message;
  
  // 移除旧类名，添加新类名
  toast.className = `toast ${type}`;
  
  // 显示通知条幅
  toast.style.display = 'flex';
  
  // 2 秒后淡出并关闭
  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      window.close();
    }, 300);
  }, 2000);
}

// 提交网站元数据
async function submitWebsiteMeta(meta) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.EXTENSION_SUBMIT_WEBSITE_META,
      payload: meta,
    })
    return response
  } catch (error) {
    console.log('提交网站元数据失败:', error)
    return null
  }
}

// 初始化
async function init() {
  showLoading()

  try {
    // 向后台脚本请求获取当前页面的元数据
    const response = await chrome.runtime.sendMessage({
      type: 'GET_CURRENT_PAGE_METADATA',
    })

    if (response && response.success && response.data) {
      const metadata = response.data
      // 填充表单
      elements.title.value = metadata.title || ''
      elements.description.value = metadata.description || ''
      elements.iconData.value = metadata.iconData || ''
      
      // 填充 name 输入框：如果 title 不为空，使用 title；如果 title 为空，description 不为空，使用 description；如果两者都为空，不填充
      if (metadata.title) {
        elements.name.value = metadata.title
      } else if (metadata.description) {
        // 取 description 的前 30 个字符作为 name，避免过长
        elements.name.value = metadata.description.substring(0, 30)
      } else {
        elements.name.value = ''
      }

      // 显示图标预览
      if (metadata.iconData) {
        elements.iconImage.src = metadata.iconData
        elements.iconImage.style.display = 'block'
      } else {
        elements.iconImage.style.display = 'none'
      }

      showForm()
    } else {
      throw new Error(response?.error || '获取页面信息失败')
    }
  } catch (error) {
    showError('获取页面信息失败：' + error.message)
    showForm()
  }
}

// 绑定事件
function bindEvents() {
  // 取消按钮
  elements.cancelBtn.addEventListener('click', () => {
    window.close()
  })

  // 添加按钮
  elements.addBtn.addEventListener('click', async () => {
    const name = elements.name.value.trim()
    const title = elements.title.value.trim()
    const description = elements.description.value.trim()
    const tagsInput = elements.tags.value.trim()
    const isMarked = elements.isMarked.checked
    const isActive = elements.isActive.checked
    const isHidden = elements.isHidden.checked
    const iconData = elements.iconData.value.trim()

    // 简单验证
    if (!name) {
      showError('请输入网站名称')
      return
    }

    // 处理标签，转换为数组
    let tags = []
    if (tagsInput) {
      tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
    }

    showLoading()

    try {
      // 获取当前标签页的 URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs.length === 0) {
        throw new Error('未找到当前标签页')
      }

      const url = tabs[0].url

      // 提交元数据
      const response = await submitWebsiteMeta({
        url,
        name,
        title,
        description,
        tags,
        isMarked,
        isActive,
        isHidden,
        iconData,
      })

      if (response && response.success) {
        // 显示成功 Toast
        showToast('添加成功！', 'success');
      } else {
        // 显示错误 Toast
        const errorMessage = response?.error || '添加失败';
        if (errorMessage === '网站已存在') {
          showToast('网站已存在', 'error');
        } else {
          showToast(errorMessage, 'error');
        }
      }
    } catch (error) {
      showError('添加失败：' + error.message)
      showForm()
    }
  })
}

// 启动初始化
init()

// 绑定事件（只绑定一次）
bindEvents()