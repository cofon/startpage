/**
 * EdgeOne 边缘函数 - 获取网站元数据
 *
 * 功能说明：
 * 1. 接收前端传来的 URL 参数
 * 2. 通过 fetch 请求目标网站
 * 3. 解析 HTML 提取标题、描述、图标等元数据
 * 4. 返回 JSON 格式的元数据给前端
 *
 * API: GET /api/get-metadata?url=<website_url>
 *
 * @param {Object} context - EdgeOne 运行时的上下文对象，包含请求信息
 * @returns {Response} JSON 响应对象
 */
export default async function onRequest(context) {
  // 从请求中解析 URL 参数
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url'); // 获取目标网站 URL 参数


  // ============================================
  // CORS 预检请求处理
  // ============================================
  // 浏览器跨域请求时会先发送 OPTIONS 预检请求
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // 允许所有来源访问
        'Access-Control-Allow-Methods': 'GET, OPTIONS', // 允许的 HTTP 方法
        'Access-Control-Allow-Headers': 'Content-Type' // 允许的请求头
      }
    });
  }

  // ============================================
  // 参数验证 - 检查是否提供了 url 参数
  // ============================================
  if (!targetUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        error: '缺少 url 参数'
      }),
      {
        status: 400, // HTTP 400 Bad Request
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    // 验证 URL 格式是否正确
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
    // 调用核心函数获取网站元数据
    const metadata = await getWebsiteMetadata(targetUrl);

    // 返回成功的 JSON 响应
    return new Response(
      JSON.stringify({
        success: true,
        data: metadata // 包含 title、description、iconUrl 等
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600' // 设置 1 小时缓存，减少重复请求
        }
      }
    );
  } catch (error) {
    // 错误处理：记录日志并返回错误响应
    console.error(`[EdgeFunction] ❌ 获取失败：${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500, // HTTP 500 Internal Server Error
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// ============================================
// 导入依赖库
// ============================================
import * as cheerio from 'cheerio'; // jQuery 风格的 HTML 解析库

// Buffer 是 Node.js 全局对象，EdgeOne 边缘函数运行在 Node.js 环境

/**
 * User-Agent 池 - 用于模拟不同浏览器
 *
 * 作用：
 * 1. 避免被目标网站识别为爬虫
 * 2. 定期轮换不同的浏览器标识
 * 3. 涵盖主流浏览器（Chrome、Edge、Firefox、Safari）
 */
const USER_AGENTS = [
  // Chrome 浏览器
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',

  // Edge 浏览器
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',

  // Firefox 浏览器
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0',

  // Safari 浏览器
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
];

/**
 * 获取随机的 User-Agent
 *
 * @returns {string} 随机选择的 User-Agent 字符串
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 延迟函数 - 用于重试前的等待
 *
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} 在指定毫秒后 resolve 的 Promise
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取网站元数据的核心函数
 *
 * 执行流程：
 * 1. 使用 fetch 请求目标网站
 * 2. 处理响应和编码
 * 3. 使用 cheerio 解析 HTML
 * 4. 提取 title、description、icon 等信息
 * 5. 支持重试机制（最多 3 次）
 *
 * @param {string} targetUrl - 目标网站 URL
 * @returns {Promise<Object>} 包含元数据的对象
 */
async function getWebsiteMetadata(targetUrl) {
  console.log(`[Metadata] 开始获取：${targetUrl}`);

  const maxRetries = 3; // 最大重试次数
  let lastError = null; // 保存最后一次错误

  // 重试循环：最多尝试 3 次
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 添加随机延迟（1-3 秒），避免请求过于频繁
      // 第一次请求不延迟，重试时才延迟
      if (attempt > 1) {
        const randomDelay = 1000 + Math.random() * 2000;
        console.log(`[Retry #${attempt}] 等待 ${Math.round(randomDelay)}ms 后重试...`);
        await delay(randomDelay);
      }

      // ============================================
      // 创建超时控制机制
      // ============================================
      // 使用 AbortController 实现 15 秒超时（兼容 EdgeOne 环境）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[Timeout] ⏰ 请求超时 (15 秒)，中止请求`);
        controller.abort(); // 中止 fetch 请求
      }, 15000); // 15 秒超时

      // ============================================
      // 发送 HTTP 请求获取网页内容
      // ============================================
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          // 随机 User-Agent，模拟真实浏览器
          'User-Agent': getRandomUserAgent(),

          // 声明可接受的内容类型（包括 gzip 压缩）
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',

          // 语言偏好：优先中文
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',

          // 压缩方式
          'Accept-Encoding': 'gzip, deflate, br',

          // 保持长连接
          'Connection': 'keep-alive',

          // 要求使用 HTTPS
          'Upgrade-Insecure-Requests': '1',

          // Fetch 规范相关头，模拟浏览器行为
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',

          // 缓存控制
          'Cache-Control': 'max-age=0',

          // 添加 Referer 模拟真实访问（来自同源）
          'Referer': new URL(targetUrl).origin
        },
        signal: controller.signal, // 绑定超时控制信号
        redirect: 'follow' // 自动跟随重定向
      });

      // 清除超时定时器（请求成功后）
      clearTimeout(timeoutId);

      // ============================================
      // 处理 HTTP 错误状态
      // ============================================
      if (!response.ok) {
        // 对于特定错误码，可能是反爬机制，尝试重试
        if ([403, 429, 503].includes(response.status)) {
          console.warn(`[HTTP] ⚠️ 可能触发反爬 (${response.status})，准备重试...`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // 进入下一次重试循环
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[HTTP] ✅ 响应状态：${response.status}`);

      // ============================================
      // 解码 HTML 内容（处理不同字符编码）
      // ============================================
      const html = await decodeHtml(response);
      console.log(`[Decode] ✅ HTML 长度：${html.length} 字符`);

      // ============================================
      // 使用 Cheerio 加载并解析 HTML
      // ============================================
      const $ = cheerio.load(html);

      // ============================================
      // 提取各项元数据
      // ============================================
      const metadata = {
        url: targetUrl, // 原始 URL
        title: extractTitle($, targetUrl), // 网页标题
        description: extractDescription($), // 网页描述
        iconUrl: extractIcon($, targetUrl), // 网站图标 URL（用于调试和降级）
        iconData: null // 网站图标的 base64 字符串（新增）
      };

      console.log(`[Icon] 开始下载并转换图标为 base64...`);
      console.log(`[Icon] iconUrl: ${metadata.iconUrl}`);
      
      try {
        // 下载图标并转换为 base64
        metadata.iconData = await downloadAndConvertToBase64(metadata.iconUrl);
        console.log(`[Icon] ✅ 转换成功，base64 长度：${metadata.iconData?.length || 0}`);
      } catch (iconError) {
        console.error(`[Icon] ❌ 图标转换失败：`, iconError);
        console.error(`[Icon] 错误堆栈：`, iconError.stack);
        console.warn(`[Icon] ⚠️ 将返回 null 作为 iconData`);
        metadata.iconData = null;
      }

      // 输出提取结果日志
      console.log(`[Result] ✅ 提取成功:`);
      console.log(`  - Title: ${metadata.title?.substring(0, 50)}${metadata.title?.length > 50 ? '...' : ''}`);
      console.log(`  - Description: ${metadata.description?.substring(0, 50)}${metadata.description?.length > 50 ? '...' : ''}`);
      console.log(`  - Icon URL: ${metadata.iconUrl}`);
      console.log(`  - Icon Base64: ${metadata.iconData ? `${metadata.iconData.substring(0, 50)}...` : 'null'}`);

      return metadata; // 返回提取的元数据

    } catch (error) {
      // 捕获异常并记录日志
      console.error(`[Error] ❌ 第 ${attempt} 次尝试失败：${error.message}`);
      lastError = error;

      // 如果是最后一次尝试仍然失败，跳出重试循环
      if (attempt === maxRetries) {
        console.error(`[Error] ❌ 所有重试均失败，放弃获取`);
        break;
      }
    }
  }

  // 所有重试都失败后抛出最后的错误
  throw lastError || new Error('获取元数据失败');
}

// ============================================
// 辅助函数：HTML 解码
// ============================================
/**
 * 根据响应的字符编码正确解码 HTML 内容
 *
 * 检测优先级：
 * 1. HTTP 响应头的 Content-Type 中的 charset
 * 2. HTML <meta>标签中的 charset 声明
 * 3. 默认 UTF-8
 *
 * @param {Response} response - fetch 响应对象
 * @returns {Promise<string>} 解码后的 HTML 文本
 */
async function decodeHtml(response) {
  // 从响应头获取 Content-Type
  const contentType = response.headers.get('content-type');
  const charset = extractCharset(contentType); // 提取 charset

  if (charset) {
    console.log(`[Charset] 从响应头检测到：${charset}`);
  }

  // 获取原始字节流
  const arrayBuffer = await response.arrayBuffer();

  // 如果从响应头检测到 charset，直接解码
  if (charset) {
    const decoder = new TextDecoder(charset);
    return decoder.decode(arrayBuffer);
  }

  // 否则检测 HTML meta 标签中的 charset
  // 先读取前 1KB 内容进行检测
  const textChunk = new TextDecoder('utf-8').decode(arrayBuffer.slice(0, 1024));
  const metaCharset = detectCharsetFromMeta(textChunk);

  if (metaCharset) {
    console.log(`[Charset] 从<meta>标签检测到：${metaCharset}`);
    const decoder = new TextDecoder(metaCharset);
    return decoder.decode(arrayBuffer);
  }

  // 都没有则使用默认 UTF-8
  console.log(`[Charset] 使用默认：UTF-8`);
  return new TextDecoder('utf-8').decode(arrayBuffer);
}

/**
 * 从 Content-Type 响应头中提取 charset
 *
 * 示例：
 * - "text/html; charset=utf-8" → "utf-8"
 * - "text/html" → null
 *
 * @param {string} contentType - Content-Type 头
 * @returns {string|null} 字符集名称或 null
 */
function extractCharset(contentType) {
  if (!contentType) return null;
  // 正则匹配 charset=xxx
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : null;
}

/**
 * 从 HTML 的<meta>标签中检测字符集
 *
 * 支持两种格式：
 * 1. <meta charset="utf-8">
 * 2. <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
 *
 * @param {string} html - HTML 片段（通常是前 1KB）
 * @returns {string|null} 检测到的字符集或 null
 */
function detectCharsetFromMeta(html) {
  // 匹配 <meta charset="xxx">
  const charsetMatch = html.match(/<meta[^>]*charset=["']?([^"'>\s]+)/i);
  if (charsetMatch) {
    return charsetMatch[1];
  }

  // 匹配 <meta http-equiv="Content-Type" content="...charset=xxx">
  const httpEquivMatch = html.match(/<meta[^>]*http-equiv=["']content-type["'][^>]*content=["'][^"']*charset=([^"'>]+)/i);
  if (httpEquivMatch) {
    return httpEquivMatch[1];
  }

  return null; // 未找到 charset 声明
}

// ============================================
// 辅助函数：提取 Title（网页标题）
// ============================================
/**
 * 多层渐进式提取网页标题
 *
 * 优先级顺序：
 * 1. <title>标签
 * 2. og:title (Open Graph)
 * 3. twitter:title
 * 4. JSON-LD 结构化数据
 * 5. <h1>标签
 * 6. URL hostname（兜底）
 *
 * @param {CheerioAPI} $ - Cheerio 实例
 * @param {string} baseUrl - 基础 URL
 * @returns {string} 提取的标题
 */
function extractTitle($, baseUrl) {
  // 1. 优先从<title>标签获取
  let title = $('title').text().trim();
  if (title) {
    console.log(`[Title] ✅ 从<title>标签获取`);
    return title;
  }

  // 2. 尝试 Open Graph 协议的 title
  const ogTitleMatch = $('meta[property="og:title"]').attr('content');
  if (ogTitleMatch) {
    console.log(`[Title] ✅ 从 og:title 获取`);
    return ogTitleMatch;
  }

  // 3. 尝试 Twitter Card 的 title
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  if (twitterTitle) {
    console.log(`[Title] ✅ 从 twitter:title 获取`);
    return twitterTitle;
  }

  // 4. 尝试 JSON-LD 结构化数据
  const jsonLd = extractJsonLd($);
  if (jsonLd && (jsonLd.name || jsonLd.headline)) {
    const jsonTitle = jsonLd.name || jsonLd.headline;
    console.log(`[Title] ✅ 从 JSON-LD 获取`);
    return jsonTitle;
  }

  // 5. 尝试第一个<h1>标签
  const h1Title = $('h1').first().text().trim();
  if (h1Title) {
    console.log(`[Title] ✅ 从<h1>标签获取`);
    return h1Title;
  }

  // 6. 降级方案：使用 URL 的 hostname
  console.log(`[Title] ⚠️ 未找到，使用 hostname`);
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return 'Unknown';
  }
}

// ============================================
// 辅助函数：提取 Description（网页描述）
// ============================================
/**
 * 多层渐进式提取网页描述
 *
 * 优先级顺序：
 * 1. meta name="description"
 * 2. og:description
 * 3. twitter:description
 * 4. JSON-LD description
 * 5. 第一个<p>标签（50-300 字符限制）
 * 6. keywords（兜底）
 *
 * @param {CheerioAPI} $ - Cheerio 实例
 * @returns {string} 提取的描述信息
 */
function extractDescription($) {
  // 1. 优先从标准 meta description 获取
  let desc = $('meta[name="description"]').attr('content');
  if (desc && desc.trim().length > 0) {
    console.log(`[Desc] ✅ 从 meta description 获取`);
    return desc.trim();
  }

  // 2. 尝试 Open Graph description
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc) {
    console.log(`[Desc] ✅ 从 og:description 获取`);
    return ogDesc.trim();
  }

  // 3. 尝试 Twitter Card description
  const twitterDesc = $('meta[name="twitter:description"]').attr('content');
  if (twitterDesc) {
    console.log(`[Desc] ✅ 从 twitter:description 获取`);
    return twitterDesc.trim();
  }

  // 4. 尝试 JSON-LD description
  const jsonLd = extractJsonLd($);
  if (jsonLd && jsonLd.description) {
    console.log(`[Desc] ✅ 从 JSON-LD 获取`);
    return jsonLd.description.trim();
  }

  // 5. 尝试第一个<p>段落（限制长度在 50-300 字符）
  const firstP = $('p').first().text().trim();
  if (firstP.length >= 50 && firstP.length <= 300) {
    console.log(`[Desc] ✅ 从<p>标签获取`);
    return firstP;
  }

  // 6. 降级方案：使用 keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) {
    console.log(`[Desc] ✅ 从 keywords 获取`);
    return keywords.trim();
  }

  // 所有方案都失败，返回空字符串
  console.log(`[Desc] ⚠️ 未找到 description`);
  return '';
}

// ============================================
// 辅助函数：提取 Icon（网站图标）
// ============================================
/**
 * 按优先级提取网站图标 URL
 *
 * 优先级顺序：
 * 1. rel="icon"
 * 2. rel="shortcut icon"
 * 3. rel="apple-touch-icon"
 * 4. rel="mask-icon"
 * 5. /favicon.ico（默认兜底）
 *
 * @param {CheerioAPI} $ - Cheerio 实例
 * @param {string} baseUrl - 基础 URL，用于转换相对路径
 * @returns {string} 图标的绝对 URL
 */
function extractIcon($, baseUrl) {
  // 定义图标选择器及其优先级
  const iconSelectors = [
    { rel: 'icon', label: 'rel="icon"' },
    { rel: 'shortcut icon', label: 'rel="shortcut icon"' },
    { rel: 'apple-touch-icon', label: 'rel="apple-touch-icon"' },
    { rel: 'mask-icon', label: 'rel="mask-icon"' }
  ];

  // 按优先级依次尝试
  for (const { rel, label } of iconSelectors) {
    const href = $(`link[rel="${rel}"]`).attr('href');
    if (href) {
      // 将相对路径转换为绝对路径
      const absoluteUrl = new URL(href, baseUrl).href;
      console.log(`[Icon] ✅ 从${label}获取：${absoluteUrl}`);
      return absoluteUrl;
    }
  }

  // 默认方案：使用根目录下的 favicon.ico
  const defaultFavicon = new URL('/favicon.ico', baseUrl).href;
  console.log(`[Icon] ℹ️ 使用默认 favicon: ${defaultFavicon}`);
  return defaultFavicon;
}

// ============================================
// 辅助函数：解析 JSON-LD 结构化数据
// ============================================
/**
 * 提取并解析 JSON-LD 结构化数据
 *
 * JSON-LD 是一种语义网技术，用于在网页中嵌入结构化数据
 * 常见于搜索引擎优化（SEO）和社交媒体卡片
 *
 * @param {CheerioAPI} $ - Cheerio 实例
 * @returns {Object|null} 解析后的 JSON 对象或 null
 */
function extractJsonLd($) {
  const script = $('script[type="application/ld+json"]').html();
  if (!script) return null; // 没有找到 JSON-LD 脚本

  try {
    // 尝试解析 JSON 字符串
    const jsonData = JSON.parse(script);
    console.log(`[JSON-LD] ✅ 解析成功`);
    return jsonData; // 返回解析后的对象
  } catch (e) {
    // JSON 解析失败，记录警告日志
    console.warn(`[JSON-LD] ⚠️ 解析失败：${e.message}`);
    return null;
  }
}

// ============================================
// 辅助函数：下载图标并转换为 Base64
// ============================================
/**
 * 下载网站图标并转换为 base64 编码字符串
 *
 * 执行流程：
 * 1. 使用 fetch 请求图标资源
 * 2. 获取图标的原始字节流（ArrayBuffer）
 * 3. 将 ArrayBuffer 转换为 base64 字符串
 * 4. 添加 MIME 类型前缀（data:image/x-icon;base64,）
 *
 * @param {string} iconUrl - 图标的 URL
 * @returns {Promise<string|null>} base64 编码的图标字符串，失败时返回 null
 */
async function downloadAndConvertToBase64(iconUrl) {
  if (!iconUrl) {
    console.log(`[Icon] ⚠️ iconUrl 为空，跳过转换`);
    return null;
  }

  try {
    console.log(`[Icon] 开始下载图标：${iconUrl}`);
    
    // 创建超时控制的 AbortController（5 秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[Icon] ⏰ 下载超时 (5 秒)，中止请求`);
      controller.abort();
    }, 5000);

    // 检测图标文件类型（根据 URL 扩展名）
    const mimeType = detectIconMimeType(iconUrl);
    console.log(`[Icon] 检测到 MIME 类型：${mimeType}`);

    // 发送请求下载图标
    const response = await fetch(iconUrl, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'image/*,*/*;q=0.9',
        'Cache-Control': 'max-age=86400'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    console.log(`[Icon] HTTP 响应状态：${response.status}`);

    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      console.error(`[Icon] ❌ HTTP 错误：${errorMsg}`);
      throw new Error(errorMsg);
    }

    // 获取响应的 Content-Type
    const contentType = response.headers.get('content-type') || mimeType;
    console.log(`[Icon] 响应 Content-Type: ${contentType}`);

    // 获取原始字节流
    const arrayBuffer = await response.arrayBuffer();
    console.log(`[Icon] 获取到 ${arrayBuffer.byteLength} 字节的图标数据`);

    // 限制图标大小（最大 1MB），避免过大
    if (arrayBuffer.byteLength > 1024 * 1024) {
      console.warn(`[Icon] ⚠️ 图标文件过大 (${arrayBuffer.byteLength} bytes)，可能不适合 base64 编码`);
    }

    // 将 ArrayBuffer 转换为 base64
    console.log(`[Icon] 开始转换为 base64...`);
    const base64 = arrayBufferToBase64(arrayBuffer);
    console.log(`[Icon] base64 长度：${base64.length}`);

    // 添加 data URI scheme 前缀
    const base64Data = `data:${contentType};base64,${base64}`;
    console.log(`[Icon] ✅ 成功转换为 base64，总长度：${base64Data.length}`);

    return base64Data;

  } catch (error) {
    console.error(`[Icon] ❌ 下载转换失败：${error.message}`);
    console.error(`[Icon] 错误堆栈：${error.stack}`);
    throw error;
  }
}

/**
 * 根据图标 URL 检测 MIME 类型
 *
 * @param {string} url - 图标 URL
 * @returns {string} MIME 类型
 */
function detectIconMimeType(url) {
  try {
    const urlObj = new URL(url.toLowerCase());
    const pathname = urlObj.pathname.toLowerCase();

    // 根据文件扩展名判断
    if (pathname.endsWith('.png')) return 'image/png';
    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
    if (pathname.endsWith('.gif')) return 'image/gif';
    if (pathname.endsWith('.svg') || pathname.endsWith('.svg+xml')) return 'image/svg+xml';
    if (pathname.endsWith('.webp')) return 'image/webp';

    // 默认返回 x-icon（适用于 .ico 和未知格式）
    return 'image/x-icon';
  } catch {
    return 'image/x-icon';
  }
}

/**
 * 将 ArrayBuffer 转换为 base64 字符串
 *
 * EdgeOne 边缘函数运行在 Node.js 环境，需使用 Buffer API
 * 而不是浏览器的 btoa() 方法
 *
 * @param {ArrayBuffer} buffer - 原始字节流
 * @returns {string} base64 编码字符串
 */
function arrayBufferToBase64(buffer) {
  // Node.js 环境使用 Buffer 进行 base64 编码
  // eslint-disable-next-line no-undef
  const buf = Buffer.from(buffer);
  return buf.toString('base64');
}
