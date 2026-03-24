/* global chrome */

// 监听来自后台脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_METADATA') {
    fetchMetadata(message.url).then(data => {
      sendResponse(data);
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // 表示将异步发送响应
  }
});

// 获取网页元数据
async function fetchMetadata(url) {
  try {
    // 加载 URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'User-Agent': navigator.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // 修复编码问题
    const contentType = response.headers.get('content-type') || '';
    const charsetMatch = contentType.match(/charset=(['"]?)([^'"\s]*)\1/i);
    let charset = charsetMatch ? charsetMatch[2] : null;

    if (!charset) {
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const textChunk = decoder.decode(buffer.slice(0, 1024));

      const metaCharsetMatch = textChunk.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
      if (metaCharsetMatch) {
        charset = metaCharsetMatch[1];
      }

      if (!charset) {
        const httpEquivMatch = textChunk.match(
          /<meta\s+http-equiv=["']?content-type["']?\s+content=["']?text\/html;\s*charset=([^"'\s>]+)/i,
        );
        if (httpEquivMatch) {
          charset = httpEquivMatch[1];
        }
      }

      const finalCharset = charset || 'utf-8';
      try {
        const html = new TextDecoder(finalCharset).decode(buffer);
        return parseHtmlMetadata(html, url);
      } catch (e) {
        const html = new TextDecoder('utf-8').decode(buffer);
        return parseHtmlMetadata(html, url);
      }
    } else {
      const buffer = await response.arrayBuffer();
      const html = new TextDecoder(charset).decode(buffer);
      return parseHtmlMetadata(html, url);
    }
  } catch (error) {
    console.error('获取元数据失败:', error);
    return { error: error.message };
  }
}

// 解析 HTML 元数据
function parseHtmlMetadata(html, url) {
  // 提取标题
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  if (!title) {
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["'][^>]*>/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }
  }

  if (!title) {
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                            html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:title["'][^>]*>/i);
    if (twitterTitleMatch) {
      title = twitterTitleMatch[1].trim();
    }
  }

  if (!title) {
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.name || jsonData.headline) {
          title = (jsonData.name || jsonData.headline).trim();
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
  }

  if (!title) {
    try {
      const urlObj = new URL(url);
      title = urlObj.hostname.replace('www.', '');
    } catch (e) {
      // 忽略错误
    }
  }

  // 提取描述
  let description = '';
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  if (!description) {
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*property=["']og:description["'][^>]*>/i);
    if (ogDescMatch) {
      description = ogDescMatch[1].trim();
    }
  }

  if (!description) {
    const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i) ||
                            html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']twitter:description["'][^>]*>/i);
    if (twitterDescMatch) {
      description = twitterDescMatch[1].trim();
    }
  }

  if (!description) {
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.description) {
          description = jsonData.description.trim();
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  if (!description) {
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']keywords["'][^>]*>/i);
    if (keywordsMatch) {
      description = keywordsMatch[1].trim();
    }
  }

  if (!description) {
    const pMatch = html.match(/<p[^>]*>([\s\S]{50,300}?)<\/p>/i);
    if (pMatch) {
      description = pMatch[1].replace(/<[^>]+>/g, '').trim();
    }
  }

  // 提取图标
  let iconUrl = '';
  const iconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                   html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']icon["'][^>]*>/i);
  if (iconMatch) {
    iconUrl = new URL(iconMatch[1], url).href;
  }

  if (!iconUrl) {
    const shortcutIconMatch = html.match(/<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                             html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']shortcut icon["'][^>]*>/i);
    if (shortcutIconMatch) {
      iconUrl = new URL(shortcutIconMatch[1], url).href;
    }
  }

  if (!iconUrl) {
    const appleIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']*)["'][^>]*>/i) ||
                           html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']apple-touch-icon["'][^>]*>/i);
    if (appleIconMatch) {
      iconUrl = new URL(appleIconMatch[1], url).href;
    }
  }

  if (!iconUrl) {
    iconUrl = new URL('/favicon.ico', url).href;
  }

  return {
    url,
    title,
    description,
    iconUrl
  };
}