/**
 * 测试脚本：验证编码修复是否生效
 * 使用方法：在浏览器 Console 中运行 await test4399Website()
 */
export async function test4399Website() {
  console.log('========== 🧪 开始测试 4399 网站编码 ==========')
  
  const testUrl = 'https://www.4399.com/flash/210573_3.htm#index3-7'
  console.log('测试 URL:', testUrl)
  
  try {
    // 模拟 background.js 的 fetchMetadataFromURL 逻辑
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'User-Agent': navigator.userAgent,
      },
    })
    
    console.log('HTTP 状态码:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    
    // 检测编码
    const contentType = response.headers.get('content-type') || ''
    const charsetMatch = contentType.match(/charset=(['"]?)([^'"\s]*)\1/i)
    let charset = charsetMatch ? charsetMatch[2] : null
    
    if (!charset) {
      const buffer = await response.arrayBuffer()
      const textChunk = new TextDecoder('utf-8').decode(buffer.slice(0, 1024))
      
      const metaCharsetMatch = textChunk.match(/<meta\s+charset=["']?([^"'\s>]+)/i)
      if (metaCharsetMatch) {
        charset = metaCharsetMatch[1]
        console.log('✅ 从 meta charset 检测到编码:', charset)
      } else {
        const httpEquivMatch = textChunk.match(/<meta\s+http-equiv=["']?content-type["']?\s+content=["']?text\/html;\s*charset=([^"'\s>]+)/i)
        if (httpEquivMatch) {
          charset = httpEquivMatch[1]
          console.log('✅ 从 http-equiv 检测到编码:', charset)
        }
      }
      
      if (!charset) {
        charset = 'utf-8'
        console.log('⚠️ 未检测到明确编码，使用默认 UTF-8')
      }
    } else {
      console.log('✅ 从 Content-Type 获取编码:', charset)
    }
    
    // 解码 HTML
    const buffer = await response.arrayBuffer()
    const html = new TextDecoder(charset).decode(buffer)
    
    console.log('\n========== 提取结果 ==========')
    
    // 提取 title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    console.log('📝 Title:', title)
    
    // 提取 description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)
    const description = descMatch ? descMatch[1].trim() : ''
    console.log('📄 Description:', description)
    
    // 验证预期值
    console.log('\n========== 验证结果 ==========')
    const expectedTitle = '火柴人水果大陆历险_火柴人水果大陆历险 html5 游戏在线玩_4399h5 游戏 -4399 在线玩'
    const expectedDesc = '火柴人水果大陆历险小游戏在线试玩，小游戏下载及攻略，更多好玩小游戏尽在 www.4399.com'
    
    const titleCorrect = title.includes('火柴人水果大陆历险') && title.includes('4399')
    const descCorrect = description.includes('火柴人水果大陆历险') && description.includes('4399')
    
    console.log('✅ Title 正确性:', titleCorrect ? '✓ 通过' : '✗ 失败')
    console.log('✅ Description 正确性:', descCorrect ? '✓ 通过' : '✗ 失败')
    
    if (titleCorrect && descCorrect) {
      console.log('\n🎉 编码修复成功！中文显示正常！')
    } else {
      console.log('\n❌ 编码可能仍有问题，请检查输出')
      console.log('实际 Title:', title.substring(0, 100))
      console.log('实际 Description:', description.substring(0, 100))
    }
    
    return {
      success: true,
      charset,
      title,
      description,
      isCorrect: titleCorrect && descCorrect
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}