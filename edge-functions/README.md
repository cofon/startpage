import { getWebsiteMetadata } from '../local-metadata-service.js';

export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');
  
  // 参数验证
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: '缺少 url 参数' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  try {
    // 验证 URL 格式
    new URL(targetUrl);
    
    // 使用共享的核心逻辑
    const metadata = await getWebsiteMetadata(targetUrl);
    
    return new Response(JSON.stringify(metadata), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('[EdgeFunction] 错误:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
import express from 'express';
import { getWebsiteMetadata, batchGetWebsiteMetadata } from './local-metadata-service.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'max-age=3600'); // 缓存1小时
  next();
});

// 处理预检请求
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Local Metadata Service is running'
  });
});

// 获取单个网站元数据
app.get('/api/get-metadata', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: '缺少 url 参数'
    });
  }

  try {
    const metadata = await getWebsiteMetadata(url);
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('[LocalService] 获取元数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 批量获取网站元数据
app.post('/api/batch-get-metadata', async (req, res) => {
  const { urls, batchSize = 50 } = req.body;
  
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: '缺少 urls 数组参数'
    });
  }

  try {
    const result = await batchGetWebsiteMetadata(urls, batchSize);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[LocalService] 批量获取元数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   Local Metadata Service - 已启动                        ║
╠══════════════════════════════════════════════════════════╣
║   端口：${PORT}
║   健康检查：http://localhost:${PORT}/health
║   获取元数据：http://localhost:${PORT}/api/get-metadata?url=<url>
║   批量获取：POST http://localhost:${PORT}/api/batch-get-metadata
╚══════════════════════════════════════════════════════════╝
`);
});
import * as cheerio from 'cheerio';

/**
 * 提取字符编码
 */
function extractCharset(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;]+)/i);
  return match ? match[1].trim() : null;
}

/**
 * 提取网页标题
 */
function extractTitle($) {
  let title = $('title').text().trim();
  if (title) return title;
  
  title = $('meta[property="og:title"]').attr('content');
  if (title) return title;
  
  title = $('meta[name="twitter:title"]').attr('content');
  if (title) return title;
  
  const jsonLdMatch = $('script[type="application/ld+json"]').html();
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch);
      if (jsonData.name || jsonData.headline) {
        return jsonData.name || jsonData.headline;
      }
    } catch {}
  }
  
  title = $('h1').first().text().trim();
  if (title) return title;
  
  return new URL(this.url).hostname;
}

/**
 * 提取描述信息
 */
function extractDescription($) {
  let desc = $('meta[name="description"]').attr('content');
  if (desc && desc.trim()) return desc.trim();
  
  desc = $('meta[property="og:description"]').attr('content');
  if (desc) return desc.trim();
  
  desc = $('meta[name="twitter:description"]').attr('content');
  if (desc) return desc.trim();
  
  const jsonLdMatch = $('script[type="application/ld+json"]').html();
  if (jsonLdMatch) {
    try {
      const jsonData = JSON.parse(jsonLdMatch);
      if (jsonData.description) return jsonData.description.trim();
    } catch {}
  }
  
  desc = $('p').first().text().trim();
  if (desc.length >= 50 && desc.length <= 300) return desc;
  
  desc = $('meta[name="keywords"]').attr('content');
  if (desc) return desc.trim();
  
  return '';
}

/**
 * 提取图标URL
 */
function extractIcon($, baseUrl) {
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="mask-icon"]'
  ];
  
  for (const selector of selectors) {
    const href = $(selector).attr('href');
    if (href) {
      return new URL(href, baseUrl).href;
    }
  }
  
  return new URL('/favicon.ico', baseUrl).href;
}

/**
 * 获取网站元数据的核心函数
 * @param {string} targetUrl - 目标网站URL
 * @returns {Promise<Object>} 包含网站元数据的对象
 */
export async function getWebsiteMetadata(targetUrl) {
  // 验证URL格式
  new URL(targetUrl);
  
  // 获取网页内容
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(10000)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // 解码HTML
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type');
  const charset = extractCharset(contentType);
  const decoder = new TextDecoder(charset || 'utf-8');
  const html = decoder.decode(arrayBuffer);
  
  // 解析元数据
  const $ = cheerio.load(html);
  return {
    url: targetUrl,
    title: extractTitle($),
    description: extractDescription($),
    iconUrl: extractIcon($, targetUrl)
  };
}

/**
 * 批量获取网站元数据
 * @param {string[]} urls - 网站URL数组
 * @param {number} batchSize - 批处理大小，默认50
 * @returns {Promise<Array>} 结果数组
 */
export async function batchGetWebsiteMetadata(urls, batchSize = 50) {
  const results = [];
  const stats = {
    total: urls.length,
    success: 0,
    failed: 0
  };

  // 分批处理
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(url => getWebsiteMetadata(url))
    );
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        stats.success++;
      } else {
        results.push({
          url: batch[results.length],
          error: result.reason.message,
          meta_failed: true
        });
        stats.failed++;
      }
    });
  }

  return {
    data: results,
    stats
  };
}
{
  "name": "edge-functions",
  "version": "1.0.0",
  "description": "Local development environment for EdgeOne edge functions",
  "main": "server.js",
  "scripts": {
    "serve:local": "node server.js",
    "test": "node test-metadata.js"
  },
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "express": "^4.18.2"
  },
  "devDependencies": {},
  "keywords": [],
  "author": "",
  "license": "ISC"
}
# EdgeOne 边缘函数 - 本地开发环境

本目录包含 EdgeOne 边缘函数的实现代码和本地开发环境配置。

## 📁 目录结构

```
edge-functions/
├── api/                          # EdgeOne 边缘函数代码
│   └── get-metadata.js          # 获取网站元数据的边缘函数
├── server.js                    # 本地开发服务器（模拟 EdgeOne 环境）
├── local-metadata-service.js    # 核心元数据获取逻辑（与边缘函数共享）
├── package.json                 # 依赖配置
└── README.md                    # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd edge-functions
npm install
```

### 2. 启动本地服务

```bash
npm run serve:local
```

服务启动后会显示：
```
╔══════════════════════════════════════════════════════════╗
║   Local Metadata Service - 已启动                        ║
╠══════════════════════════════════════════════════════════╣
║   端口：3000
║   健康检查：http://localhost:3000/health
║   获取元数据：http://localhost:3000/api/get-metadata?url=<url>
║   批量获取：POST http://localhost:3000/api/batch-get-metadata
╚══════════════════════════════════════════════════════════╝
```

### 3. 测试 API

**单个网站元数据获取：**
```bash
curl "http://localhost:3000/api/get-metadata?url=https://www.baidu.com"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "url": "https://www.baidu.com",
    "title": "百度一下，你就知道",
    "description": "百度是全球最大的中文搜索引擎...",
    "iconUrl": "https://www.baidu.com/favicon.ico"
  }
}
```

**批量获取（POST）：**
```bash
curl -X POST "http://localhost:3000/api/batch-get-metadata" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.baidu.com",
      "https://www.bilibili.com"
    ],
    "batchSize": 50
  }'
```
```

---

## ⚠️ 注意事项

### 1. Fetch 次数限制
- 单次运行最多 **64 次 fetch** 请求
- 批量处理时需分批（建议每批 50 个）

示例：
```javascript
// 批量获取 200 个网站的元数据
const websites = [...]; // 200 个网站
const batchSize = 50;
const results = [];

for (let i = 0; i < websites.length; i += batchSize) {
  const batch = websites.slice(i, i + batchSize);
  const batchResults = await Promise.all(
    batch.map(site => fetchMetadata(site.url))
  );
  results.push(...batchResults);
}
```

### 2. 并发控制
- 最大 **8 个并发** 请求
- 使用 `Promise.allSettled` 处理部分失败

### 3. 超时设置
- 默认 **15 秒** 超时
- 可通过配置调整至 **300 秒**

### 4. CORS 配置
- 必须显式设置 `Access-Control-Allow-Origin` 头
- 生产环境建议指定具体域名，不使用通配符 `*`

---

## 🧪 测试

### 本地测试脚本

创建 `test-metadata.js`:
```javascript
const fetch = require('node-fetch');

async function testMetadata() {
  const testUrls = [
    'https://www.baidu.com',
    'https://www.google.com',
    'https://github.com'
  ];
  
  for (const url of testUrls) {
    console.log(`\n测试：${url}`);
    const response = await fetch(`http://localhost:8088/api/metadata?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    console.log('结果:', data);
  }
}

testMetadata();
```

运行测试：
```bash
node test-metadata.js
```

---

## 📊 环境变量配置

### 本地开发 (.env)
```env
API_KEY=your_local_api_key
DEBUG=true
```

### 生产环境 (控制台配置)
通过 EdgeOne 控制台添加环境变量，代码中通过 `context.env.API_KEY` 访问。

---

## 📈 日志与监控

### 日志查看
- **本地开发**: 终端实时显示 `console.log` 输出
- **生产环境**: EdgeOne 控制台 → 日志分析（最多 24 小时）

### 调试技巧
```javascript
console.log('[Debug] 请求 URL:', targetUrl);
console.log('[Debug] 响应状态:', response.status);
console.log('[Debug] 提取的 title:', title);
```

---

## 🔄 版本历史

- **v1.0.0**: 初始版本，支持基本元数据获取
- 待补充...

---

## 📚 参考资料

- [EdgeOne Pages 官方文档](https://cloud.tencent.com/product/edgeone)
- [Cheerio 文档](https://cheerio.js.org/)
- [Node.js Fetch API](https://nodejs.org/api/globals.html#fetch)
