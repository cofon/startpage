/**
 * 本地开发服务器 - 模拟 EdgeOne 边缘函数环境
 * 
 * 用途：在本地 Node.js 环境提供 API 接口，模拟 EdgeOne 边缘函数的行为
 * 
 * 使用方法：
 * 1. 安装依赖：npm install express cors cheerio
 * 2. 启动服务：npm run serve:local
 * 3. 访问 API: http://localhost:3000/api/get-metadata?url=https://www.baidu.com
 */

/* global process */

import express from 'express';
import cors from 'cors';
import { getWebsiteMetadata, batchGetMetadata } from './local-metadata-service.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Local Metadata Service is running' });
});

// ============================================
// API 端点：获取单个网站元数据
// ============================================
app.get('/api/get-metadata', async (req, res) => {
  const targetUrl = req.query.url;

  console.log(`\n[API] ${new Date().toISOString()} - 请求 URL: ${targetUrl}`);

  // 验证参数
  if (!targetUrl) {
    console.log(`[API] ❌ 缺少 url 参数`);
    return res.status(400).json({
      success: false,
      error: '缺少 url 参数'
    });
  }

  // 验证 URL 格式
  try {
    new URL(targetUrl);
  } catch {
    console.log(`[API] ❌ URL 格式不正确：${targetUrl}`);
    return res.status(400).json({
      success: false,
      error: 'URL 格式不正确'
    });
  }

  try {
    // 获取元数据
    const metadata = await getWebsiteMetadata(targetUrl);

    console.log(`[API] ✅ 成功返回元数据`);
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error(`[API] ❌ 获取失败：${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// API 端点：批量获取网站元数据
// ============================================
app.post('/api/batch-get-metadata', async (req, res) => {
  const { urls, batchSize = 50 } = req.body;

  console.log(`\n[API] ${new Date().toISOString()} - 批量请求，数量：${urls?.length || 0}`);

  if (!urls || !Array.isArray(urls)) {
    console.log(`[API] ❌ 无效的 urls 参数`);
    return res.status(400).json({
      success: false,
      error: 'urls 参数必须是数组'
    });
  }

  try {
    const results = await batchGetMetadata(urls, batchSize);

    console.log(`[API] ✅ 批量处理完成，成功：${results.filter(r => !r.error).length}, 失败：${results.filter(r => r.error).length}`);
    res.json({
      success: true,
      data: results,
      stats: {
        total: results.length,
        success: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length
      }
    });
  } catch (error) {
    console.error(`[API] ❌ 批量处理失败：${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// 启动服务器
// ============================================
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Local Metadata Service - 已启动                        ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║   端口：${PORT}`);
  console.log('║   健康检查：http://localhost:' + PORT + '/health');
  console.log('║   获取元数据：http://localhost:' + PORT + '/api/get-metadata?url=<url>');
  console.log('║   批量获取：POST http://localhost:' + PORT + '/api/batch-get-metadata');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n示例:');
  console.log(`curl "http://localhost:${PORT}/api/get-metadata?url=https://www.baidu.com"`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n[Server] 正在关闭服务器...');
  process.exit(0);
});
