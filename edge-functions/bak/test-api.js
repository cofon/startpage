/**
 * 本地 API 服务测试脚本
 * 
 * 使用方法：
 * 1. 先启动服务：node server.js
 * 2. 运行测试：node test-api.js
 */

const API_BASE_URL = 'http://localhost:3000';

async function testHealth() {
  console.log('\n=== 测试健康检查 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('✓ 健康检查通过:', data);
  } catch (error) {
    console.error('✗ 健康检查失败:', error.message);
  }
}

async function testGetMetadata() {
  console.log('\n=== 测试获取元数据 ===');
  const testUrls = [
    'https://www.baidu.com',
    'https://www.bilibili.com'
  ];

  for (const url of testUrls) {
    console.log(`\n测试 URL: ${url}`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-metadata?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      if (result.success) {
        console.log('✓ 获取成功');
        console.log('  - Title:', result.data.title?.substring(0, 50));
        console.log('  - Description:', result.data.description?.substring(0, 50));
        console.log('  - Icon:', result.data.iconUrl);
      } else {
        console.error('✗ API 返回失败:', result.error);
      }
    } catch (error) {
      console.error('✗ 请求失败:', error.message);
    }
  }
}

async function testBatchMetadata() {
  console.log('\n=== 测试批量获取元数据 ===');
  try {
    const response = await fetch(`${API_BASE_URL}/api/batch-get-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        urls: [
          'https://www.baidu.com',
          'https://www.bilibili.com',
          'https://github.com'
        ],
        batchSize: 50
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✓ 批量获取成功');
      console.log('  - 总数:', result.stats.total);
      console.log('  - 成功:', result.stats.success);
      console.log('  - 失败:', result.stats.failed);
    } else {
      console.error('✗ API 返回失败:', result.error);
    }
  } catch (error) {
    console.error('✗ 请求失败:', error.message);
  }
}

// 主函数
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Local Metadata Service - 测试工具   ║');
  console.log('╚════════════════════════════════════════╝');
  
  await testHealth();
  await testGetMetadata();
  await testBatchMetadata();
  
  console.log('\n=== 测试完成 ===\n');
}

runTests().catch(console.error);
