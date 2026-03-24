
// 从新标签页获取元数据
async function getMetadataFromNewTab(url) {
  let tab = null
  try {
    // 清理URL中的反引号
    url = url.replace(/[`]/g, '')

    // 在后台打开标签页，不激活，确保在后台运行
    tab = await chrome.tabs.create({
      url,
      active: false,
      pinned: false,
      // 确保在当前窗口的最后一个位置打开，避免干扰用户
      index: 9999,
    })

    // 等待标签页加载完成
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      }
      chrome.tabs.onUpdated.addListener(listener)
    })

    // 注入脚本获取数据
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // 获取标题
        const title = document.title || ''

        // 获取描述（支持多种格式）
        let description = ''

        // 方法 1: 从 name="description" meta 标签获取
        const metaDesc =
          document.querySelector('meta[name="description"]') ||
          document.querySelector('meta[name="Description"]')
        if (metaDesc) {
          description = metaDesc.content || ''
        }

        // 方法 2: 从 og:description meta 标签获取
        if (!description) {
          const ogDesc = document.querySelector('meta[property="og:description"]')
          if (ogDesc) {
            description = ogDesc.content || ''
          }
        }

        // 方法 3: 从 twitter:description meta 标签获取
        if (!description) {
          const twitterDesc = document.querySelector('meta[name="twitter:description"]')
          if (twitterDesc) {
            description = twitterDesc.content || ''
          }
        }

        // 方法 4: 从 JSON-LD structured data 获取
        if (!description) {
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
          for (const script of jsonLdScripts) {
            try {
              const jsonData = JSON.parse(script.textContent)
              if (jsonData.description) {
                description = jsonData.description || ''
                break
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        // 方法 5: 从 meta keywords 提取
        if (!description) {
          const metaKeywords = document.querySelector('meta[name="keywords"]')
          if (metaKeywords) {
            description = metaKeywords.content || ''
          }
        }

        // 方法 6: 从第一个段落提取
        if (!description) {
          const firstP = document.querySelector('p')
          if (firstP) {
            description = firstP.textContent || ''
            // 限制长度
            if (description.length > 300) {
              description = description.substring(0, 300) + '...'
            }
          }
        }

        // 获取图标
        let iconUrl = ''
        const iconElements = document.querySelectorAll('link[rel*="icon"]')
        if (iconElements.length > 0) {
          iconUrl = iconElements[0].href
        } else {
          // 尝试使用默认图标
          const domain = window.location.origin
          iconUrl = `${domain}/favicon.ico`
        }

        // 确保图标URL是完整的
        if (iconUrl && !iconUrl.startsWith('http')) {
          const baseUrl = window.location.origin
          iconUrl = new URL(iconUrl, baseUrl).href
        }

        return {
          url: window.location.href,
          title,
          description,
          iconUrl,
        }
      },
    })

    if (result && result[0] && result[0].result) {
      const data = result[0].result
      // 转换图标为base64
      const iconData = await fetchIconAsBase64(data.iconUrl)
      return {
        url: data.url,
        title: data.title,
        description: data.description,
        iconData,
      }
    }
  } catch (error) {
    console.error('从新标签页获取元数据失败:', error)
  } finally {
    // 不管是否成功，都关闭标签页
    if (tab) {
      try {
        await chrome.tabs.remove(tab.id)
      } catch (e) {
        console.error('关闭标签页失败:', e)
      }
    }
  }
  return null
}
