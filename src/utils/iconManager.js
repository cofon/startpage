/**
 * 网站图标管理器
 * 负责生成和管理网站图标
 */

// 颜色生成函数
function stringToColor(str) {
  // 确保 str 是字符串
  const strToProcess = str && typeof str === 'string' ? str : String(str || '');
  
  let hash = 0
  for (let i = 0; i < strToProcess.length; i++) {
    hash = strToProcess.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 70%, 50%)`
}

// 生成首字母 SVG 图标
function generateInitialIcon(name, size = 48) {
  // 确保 name 是字符串
  const nameStr = name && typeof name === 'string' ? name : String(name || '');
  const initial = nameStr ? nameStr.charAt(0).toUpperCase() : '?'
  const backgroundColor = stringToColor(nameStr)

  // 确保颜色值是安全的（替换可能导致问题的字符）
  const safeBgColor = backgroundColor.replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${safeBgColor}" rx="8" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central"
            font-family="Arial, sans-serif" font-size="${size * 0.5}"
            font-weight="bold" fill="white">${initial}</text>
    </svg>
  `

  try {
    // 转换为 base64 字符串
    const base64 = btoa(unescape(encodeURIComponent(svg)))
    return `data:image/svg+xml;base64,${base64}`
  } catch (e) {
    console.error('生成图标时发生错误:', e)
    // 如果编码失败，返回一个简单的默认图标
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="%23ccc"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Arial" font-size="${size * 0.5}" fill="white">?</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`
  }
}

// 生成域名 SVG 图标
function generateDomainIcon(url, size = 48) {
  try {
    // 确保 url 是字符串
    const urlStr = url && typeof url === 'string' ? url : String(url || '');
    if (!urlStr) return generateInitialIcon('?')

    const domain = new URL(urlStr).hostname
    const parts = domain.split('.')
    // 获取倒数第二部分（通常是域名的主要部分）
    const domainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0]
    const initial = domainPart ? domainPart.charAt(0).toUpperCase() : '?'
    return generateInitialIcon(initial, size)
  } catch (e) {
    console.error('从URL生成域名图标时出错:', e, 'URL:', url)
    return generateInitialIcon('?')
  }
}

class IconManager {
  /**
   * 获取图标
   * @param {Object} website - 网站对象
   * @param {Function} updateWebsite - 更新网站的回调函数
   * @returns {Promise<string>} 图标的 URL 或 data URL
   */
  async getIcon(website, updateWebsite) {
    const {
      id,
      iconData,
      iconGenerateData,
      _iconCanFetch,      // 加上下划线前缀，表示有意未使用
      _iconFetchAttempts  // 加上下划线前缀，表示有意未使用
    } = website

    // 1. 优先使用缓存的 iconData（如果存在则使用）
    if (iconData) {
      return iconData
    }

    // 2. 检查 iconGenerateData（生成的图标）
    if (iconGenerateData) {
      return iconGenerateData
    }

    // 3. 生成 SVG 图标，优先使用网站名称，如果没有则使用域名
    let generatedIcon;
    if (website.name && website.name.trim() !== '') {
      generatedIcon = generateInitialIcon(website.name)
    } else {
      generatedIcon = generateDomainIcon(website.url)
    }

    // 保存到数据库，但如果网站没有ID，则不更新数据库
    if (id) {
      updateWebsite(id, {
        iconGenerateData: generatedIcon
      })
    }

    // 直接返回生成的图标
    return generatedIcon;
  }
}

export default new IconManager()