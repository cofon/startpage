/**
 * EdgeOne 边缘函数 - 获取网站元数据
 *
 * API: GET /api/get-metadata?url=<website_url>
 *
 * @param {Object} context - EdgeOne 上下文
 * @returns {Response} JSON 响应
 */
export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');


  // {"success":false,"error":"AbortSignal.timeout is not a function"}

  // CORS 预检请求处理
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // 验证参数
  if (!targetUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        error: '缺少 url 参数'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    // 验证 URL 格式
    new URL(targetUrl);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'URL 格式不正确'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    // 调用元数据获取函数
    const metadata = await getWebsiteMetadata(targetUrl);

    return new Response(
      JSON.stringify({
        success: true,
        data: metadata
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600' // 缓存 1 小时
        }
      }
    );
  } catch (error) {
    console.error(`[EdgeFunction] ❌ 获取失败：${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// ============================================
// 导入元数据获取逻辑（与本地服务共享代码）
// ============================================
import * as cheerio from 'cheerio';

/**
 * User-Agent 池 - 定期轮换以规避反爬
 */
const USER_AGENTS = [
  // Chrome
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

  // Edge
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',

  // Firefox
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',

  // Safari
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

/**
 * 获取随机的 User-Agent
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getWebsiteMetadata(targetUrl) {
  console.log(`[Metadata] 开始获取：${targetUrl}`);

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 添加随机延迟（1-3 秒），避免请求过于频繁
      if (attempt > 1) {
        const randomDelay = 1000 + Math.random() * 2000;
        console.log(`[Retry #${attempt}] 等待 ${Math.round(randomDelay)}ms 后重试...`);
        await delay(randomDelay);
      }

      // 创建超时控制的 AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Timeout] ⏰ 请求超时 (15 秒)，中止请求`);
        controller.abort();
      }, 15000);

      // 发送 HTTP 请求 - 增强版 headers
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          // 添加 Referer 模拟真实访问
          'Referer': new URL(targetUrl).origin
        },
        signal: controller.signal,
        redirect: 'follow'
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        // 对于 403、429 等错误，尝试重试
        if ([403, 429, 503].includes(response.status)) {
          console.warn(`[HTTP] ⚠️ 可能触发反爬 (${response.status})，准备重试...`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // 重试
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[HTTP] ✅ 响应状态：${response.status}`);

      // 解码 HTML
      const html = await decodeHtml(response);
      console.log(`[Decode] ✅ HTML 长度：${html.length} 字符`);

      // 使用 Cheerio 解析 HTML
      const $ = cheerio.load(html);

      // 提取元数据
      const metadata = {
        url: targetUrl,
        title: extractTitle($, targetUrl),
        description: extractDescription($),
        iconUrl: extractIcon($, targetUrl)
      };

      console.log(`[Result] ✅ 提取成功:`);
      console.log(`  - Title: ${metadata.title?.substring(0, 50)}${metadata.title?.length > 50 ? '...' : ''}`);
      console.log(`  - Description: ${metadata.description?.substring(0, 50)}${metadata.description?.length > 50 ? '...' : ''}`);
      console.log(`  - Icon: ${metadata.iconUrl}`);

      return metadata;

    } catch (error) {
      console.error(`[Error] ❌ 第 ${attempt} 次尝试失败：${error.message}`);
      lastError = error;

      // 如果是最后一次尝试仍然失败
      if (attempt === maxRetries) {
        console.error(`[Error] ❌ 所有重试均失败，放弃获取`);
        break;
      }
    }
  }

  // 所有重试都失败后抛出错误
  throw lastError || new Error('获取元数据失败');
}

// ============================================
// 辅助函数：HTML 解码
// ============================================
async function decodeHtml(response) {
  const contentType = response.headers.get('content-type');
  const charset = extractCharset(contentType);

  if (charset) {
    console.log(`[Charset] 从响应头检测到：${charset}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (charset) {
    const decoder = new TextDecoder(charset);
    return decoder.decode(arrayBuffer);
  }

  // 检测 HTML meta 标签中的 charset
  const textChunk = new TextDecoder('utf-8').decode(arrayBuffer.slice(0, 1024));
  const metaCharset = detectCharsetFromMeta(textChunk);

  if (metaCharset) {
    console.log(`[Charset] 从<meta>标签检测到：${metaCharset}`);
    const decoder = new TextDecoder(metaCharset);
    return decoder.decode(arrayBuffer);
  }

  console.log(`[Charset] 使用默认：UTF-8`);
  return new TextDecoder('utf-8').decode(arrayBuffer);
}

function extractCharset(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : null;
}

function detectCharsetFromMeta(html) {
  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i);
  if (charsetMatch) {
    return charsetMatch[1];
  }

  const httpEquivMatch = html.match(/<meta[^>]*http-equiv=["']content-type["'][^>]*content=["'][^"']*charset=([^"'>]+)/i);
  if (httpEquivMatch) {
    return httpEquivMatch[1];
  }

  return null;
}

// ============================================
// 辅助函数：提取 Title
// ============================================
function extractTitle($, baseUrl) {
  let title = $('title').text().trim();
  if (title) {
    console.log(`[Title] ✅ 从<title>标签获取`);
    return title;
  }

  const ogTitleMatch = $('meta[property="og:title"]').attr('content');
  if (ogTitleMatch) {
    console.log(`[Title] ✅ 从 og:title 获取`);
    return ogTitleMatch;
  }

  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  if (twitterTitle) {
    console.log(`[Title] ✅ 从 twitter:title 获取`);
    return twitterTitle;
  }

  const jsonLd = extractJsonLd($);
  if (jsonLd && (jsonLd.name || jsonLd.headline)) {
    const jsonTitle = jsonLd.name || jsonLd.headline;
    console.log(`[Title] ✅ 从 JSON-LD 获取`);
    return jsonTitle;
  }

  const h1Title = $('h1').first().text().trim();
  if (h1Title) {
    console.log(`[Title] ✅ 从<h1>标签获取`);
    return h1Title;
  }

  console.log(`[Title] ⚠️ 未找到，使用 hostname`);
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return 'Unknown';
  }
}

// ============================================
// 辅助函数：提取 Description
// ============================================
function extractDescription($) {
  let desc = $('meta[name="description"]').attr('content');
  if (desc && desc.trim().length > 0) {
    console.log(`[Desc] ✅ 从 meta description 获取`);
    return desc.trim();
  }

  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) {
    console.log(`[Desc] ✅ 从 og:description 获取`);
    return ogDesc.trim();
  }

  const twitterDesc = $('meta[name="twitter:description"]').attr('content');
  if (twitterDesc) {
    console.log(`[Desc] ✅ 从 twitter:description 获取`);
    return twitterDesc.trim();
  }

  const jsonLd = extractJsonLd($);
  if (jsonLd && jsonLd.description) {
    console.log(`[Desc] ✅ 从 JSON-LD 获取`);
    return jsonLd.description.trim();
  }

  const firstP = $('p').first().text().trim();
  if (firstP.length >= 50 && firstP.length <= 300) {
    console.log(`[Desc] ✅ 从<p>标签获取`);
    return firstP;
  }

  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    console.log(`[Desc] ✅ 从 keywords 获取`);
    return keywords.trim();
  }

  console.log(`[Desc] ⚠️ 未找到 description`);
  return '';
}

// ============================================
// 辅助函数：提取 Icon
// ============================================
function extractIcon($, baseUrl) {
  const iconSelectors = [
    { rel: 'icon', label: 'rel="icon"' },
    { rel: 'shortcut icon', label: 'rel="shortcut icon"' },
    { rel: 'apple-touch-icon', label: 'rel="apple-touch-icon"' },
    { rel: 'mask-icon', label: 'rel="mask-icon"' }
  ];

  for (const { rel, label } of iconSelectors) {
    const href = $(`link[rel="${rel}"]`).attr('href');
    if (href) {
      const absoluteUrl = new URL(href, baseUrl).href;
      console.log(`[Icon] ✅ 从${label}获取：${absoluteUrl}`);
      return absoluteUrl;
    }
  }

  const defaultFavicon = new URL('/favicon.ico', baseUrl).href;
  console.log(`[Icon] ℹ️ 使用默认 favicon: ${defaultFavicon}`);
  return defaultFavicon;
}

// ============================================
// 辅助函数：解析 JSON-LD
// ============================================
function extractJsonLd($) {
  const script = $('script[type="application/ld+json"]').html();
  if (!script) return null;

  try {
    const jsonData = JSON.parse(script);
    console.log(`[JSON-LD] ✅ 解析成功`);
    return jsonData;
  } catch (e) {
    console.warn(`[JSON-LD] ⚠️ 解析失败：${e.message}`);
    return null;
  }
}
