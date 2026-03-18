/**
 * 本地测试版 - 网站元数据获取服务
 *
 * 用途：在本地 Node.js 环境测试元数据获取逻辑，验证后再迁移到 EdgeOne 边缘函数
 *
 * 使用方法：
 * 1. 安装依赖：npm install cheerio
 * 2. 运行测试：node local-metadata-service.js https://www.example.com
 * 3. 批量测试：修改底部的测试 URL 列表后直接运行
 */

import * as cheerio from 'cheerio';

// ============================================
// 配置：User-Agent 池
// ============================================
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

// ============================================
// 主函数：获取单个网站的元数据
// ============================================
export async function getWebsiteMetadata(targetUrl) {
  console.log(`[Metadata] 开始获取：${targetUrl}`);

  // 1. 验证 URL 格式
  new URL(targetUrl);

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
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 15000);
          return controller.signal;
        })(),
        redirect: 'follow' // 自动跟随重定向
      });
    
      if (!response.ok) {
        // 对于 403、429、503 等错误，尝试重试
        if ([403, 429, 503].includes(response.status)) {
          const errorText = await response.text();
          console.warn(`[HTTP] ⚠️ 可能触发反爬 (${response.status})，准备重试...`);
          console.warn(`[HTTP] 响应内容：${errorText.substring(0, 200)}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // 重试
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      console.log(`[HTTP] ✅ 响应状态：${response.status}`);

      // 3. 解码 HTML（关键：正确处理编码）
      const html = await decodeHtml(response);
      console.log(`[Decode] ✅ HTML 长度：${html.length} 字符`);

      // 4. 使用 Cheerio 解析 HTML
      const $ = cheerio.load(html);

      // 5. 提取元数据
      const metadata = {
        url: targetUrl,
        title: extractTitle($, targetUrl),
        description: extractDescription($),
        iconUrl: extractIcon($, targetUrl)
      };

      console.log(`[Result] ✅ 提取成功:`);
      console.log(`  - Title: ${metadata.title?.substring(0, 50)}${metadata.title?.length > 50 ? '...' : ''}`);
      console.log(`  - Description: ${metadata.description?.substring(0, 50)}${metadata.description?.length > 50 ? '...' : ''}`);
      console.log(`  - Icon URL: ${metadata.iconUrl}`);

      // 6. 下载图标并转换为 base64
      if (metadata.iconUrl) {
        try {
          metadata.iconData = await fetchIconAsBase64(metadata.iconUrl);
          console.log(`[Icon] ✅ 图标已转换为 base64 (长度：${metadata.iconData?.length || 0})`);
        } catch (iconError) {
          console.warn(`[Icon] ⚠️ 图标下载失败：${iconError.message}`);
          metadata.iconData = null;
        }
      }

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

/**
 * 下载图标并转换为 base64
 * @param {string} iconUrl - 图标 URL
 * @returns {Promise<string|null>} base64 编码的图标数据
 */
async function fetchIconAsBase64(iconUrl) {
  try {
    console.log(`[Icon Fetch] 开始下载图标：${iconUrl}`);
    
    const response = await fetch(iconUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        return controller.signal;
      })(),
      redirect: 'follow'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // 获取图片的二进制数据
    const arrayBuffer = await response.arrayBuffer();
    // eslint-disable-next-line no-undef
    const buffer = Buffer.from(arrayBuffer);
    
    // 检测图片类型
    const contentType = response.headers.get('content-type') || 'image/x-icon';
    // eslint-disable-next-line no-unused-vars
    const imageType = contentType.split('/')[1] || 'x-icon';
    
    // 转换为 base64
    const base64 = buffer.toString('base64');
    
    // 生成 data URI
    const dataUri = `data:${contentType};base64,${base64}`;
    
    console.log(`[Icon Fetch] ✅ 图标下载成功，类型：${contentType}, 大小：${buffer.length} bytes`);
    
    return dataUri;
  } catch (error) {
    console.error(`[Icon Fetch] ❌ 下载失败：${error.message}`);
    return null;
  }
}

// ============================================
// 辅助函数：HTML 解码
// ============================================
async function decodeHtml(response) {
  // 1. 从 Content-Type 响应头提取 charset
  const contentType = response.headers.get('content-type');
  const charset = extractCharset(contentType);

  if (charset) {
    console.log(`[Charset] 从响应头检测到：${charset}`);
  }

  // 2. 获取原始字节流
  const arrayBuffer = await response.arrayBuffer();

  // 3. 根据 charset 解码
  if (charset) {
    const decoder = new TextDecoder(charset);
    return decoder.decode(arrayBuffer);
  }

  // 4. 检测 HTML meta 标签中的 charset
  const textChunk = new TextDecoder('utf-8').decode(arrayBuffer.slice(0, 1024));
  const metaCharset = detectCharsetFromMeta(textChunk);

  if (metaCharset) {
    console.log(`[Charset] 从<meta>标签检测到：${metaCharset}`);
    const decoder = new TextDecoder(metaCharset);
    return decoder.decode(arrayBuffer);
  }

  // 5. Fallback 到 UTF-8
  console.log(`[Charset] 使用默认：UTF-8`);
  return new TextDecoder('utf-8').decode(arrayBuffer);
}

function extractCharset(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : null;
}

function detectCharsetFromMeta(html) {
  // 匹配 <meta charset="utf-8">
  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i);
  if (charsetMatch) {
    return charsetMatch[1];
  }

  // 匹配 <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
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
  // 1. <title> 标签
  let title = $('title').text().trim();
  if (title) {
    console.log(`[Title] ✅ 从<title>标签获取`);
    return title;
  }

  // 2. og:title（兼容两种属性顺序）
  const ogTitleMatch =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[content][property="og:title"]').attr('content');
  if (ogTitleMatch) {
    console.log(`[Title] ✅ 从 og:title 获取`);
    return ogTitleMatch;
  }

  // 3. twitter:title
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  if (twitterTitle) {
    console.log(`[Title] ✅ 从 twitter:title 获取`);
    return twitterTitle;
  }

  // 4. JSON-LD
  const jsonLd = extractJsonLd($);
  if (jsonLd && (jsonLd.name || jsonLd.headline)) {
    const jsonTitle = jsonLd.name || jsonLd.headline;
    console.log(`[Title] ✅ 从 JSON-LD 获取`);
    return jsonTitle;
  }

  // 5. h1 标签
  const h1Title = $('h1').first().text().trim();
  if (h1Title) {
    console.log(`[Title] ✅ 从<h1>标签获取`);
    return h1Title;
  }

  // 6. Fallback: hostname
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
  // 1. 标准 description
  let desc = $('meta[name="description"]').attr('content');
  if (desc && desc.trim().length > 0) {
    console.log(`[Desc] ✅ 从 meta description 获取`);
    return desc.trim();
  }

  // 2. og:description
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) {
    console.log(`[Desc] ✅ 从 og:description 获取`);
    return ogDesc.trim();
  }

  // 3. twitter:description
  const twitterDesc = $('meta[name="twitter:description"]').attr('content');
  if (twitterDesc) {
    console.log(`[Desc] ✅ 从 twitter:description 获取`);
    return twitterDesc.trim();
  }

  // 4. JSON-LD
  const jsonLd = extractJsonLd($);
  if (jsonLd && jsonLd.description) {
    console.log(`[Desc] ✅ 从 JSON-LD 获取`);
    return jsonLd.description.trim();
  }

  // 5. 第一个 p 标签（限制长度）
  const firstP = $('p').first().text().trim();
  if (firstP.length >= 50 && firstP.length <= 300) {
    console.log(`[Desc] ✅ 从<p>标签获取`);
    return firstP;
  }

  // 6. keywords（备用策略）
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

  // 默认 favicon
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

// ============================================
// 批量处理函数（受 64 次 fetch 限制）
// ============================================
export async function batchGetMetadata(urls, batchSize = 50) {
  console.log(`\n[Batch] 开始批量获取，总数：${urls.length}, 批次大小：${batchSize}`);

  const results = [];
  const batches = [];

  // 分批
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }

  console.log(`[Batch] 共分为 ${batches.length} 批`);

  // 逐批处理
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n[Batch] 处理第 ${i + 1}/${batches.length} 批 (${batch.length} 个)`);

    const batchResults = await Promise.allSettled(
      batch.map(url => getWebsiteMetadata(url))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`[Batch] 第 ${i * batchSize + index + 1} 个失败：${result.reason}`);
        results.push({
          url: batch[index],
          error: result.reason.message
        });
      }
    });

    // 避免触发频率限制
    if (i < batches.length - 1) {
      console.log(`[Batch] 等待 1 秒后处理下一批...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n[Batch] ✅ 全部完成，成功：${results.filter(r => !r.error).length}, 失败：${results.filter(r => r.error).length}`);
  return results;
}

// ============================================
// CLI 入口：支持命令行调用
// ============================================
/* global process */
if (process.argv[1]?.includes('local-metadata-service.js')) {
  const url = process.argv[2];

  if (!url) {
    console.error('用法：node local-metadata-service.js <url>');
    console.error('示例：node local-metadata-service.js https://www.baidu.com');
    process.exit(1);
  }

  getWebsiteMetadata(url)
    .then(data => {
      console.log('\n=== 最终结果 ===');
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('程序执行失败:', error);
      process.exit(1);
    });
}

