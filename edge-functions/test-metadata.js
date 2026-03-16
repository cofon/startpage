/**
 * 本地测试脚本 - 测试元数据获取服务
 * 
 * 使用方法：
 * node test-metadata.js
 */

import { getWebsiteMetadata, batchGetMetadata } from './local-metadata-service.js';

// ============================================
// 测试用例 1: 单个网站测试
// ============================================
async function testSingleWebsite() {
  console.log('='.repeat(60));
  console.log('测试用例 1: 单个网站');
  console.log('='.repeat(60));
  
  const testUrls = [
    'https://www.baidu.com',
    'https://www.google.com',
    'https://github.com',
    'https://www.zhihu.com'
  ];
  
  for (const url of testUrls) {
    try {
      const metadata = await getWebsiteMetadata(url);
      console.log('\n✅ 测试结果:', JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// ============================================
// 测试用例 2: 批量测试（模拟真实场景）
// ============================================
async function testBatchWebsites() {
  console.log('\n' + '='.repeat(60));
  console.log('测试用例 2: 批量获取（20 个网站）');
  console.log('='.repeat(60));
  
  const websites = [
    'https://www.baidu.com',
    'https://www.google.com',
    'https://github.com',
    'https://www.zhihu.com',
    'https://www.bilibili.com',
    'https://weibo.com',
    'https://www.taobao.com',
    'https://www.jd.com',
    'https://www.qq.com',
    'https://www.163.com',
    'https://www.sina.com.cn',
    'https://www.sohu.com',
    'https://www.toutiao.com',
    'https://www.douban.com',
    'https://www.csdn.net',
    'https://www.cnblogs.com',
    'https://juejin.cn',
    'https://segmentfault.com',
    'https://www.oschina.net',
    'https://gitee.com'
  ];
  
  const results = await batchGetMetadata(websites, 10); // 每批 10 个
  
  // 统计结果
  const successCount = results.filter(r => !r.error).length;
  const failedCount = results.filter(r => r.error).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('测试报告');
  console.log('='.repeat(60));
  console.log(`总数：${results.length}`);
  console.log(`成功：${successCount}`);
  console.log(`失败：${failedCount}`);
  console.log(`成功率：${(successCount / results.length * 100).toFixed(2)}%`);
  
  // 显示失败的
  if (failedCount > 0) {
    console.log('\n失败的网站:');
    results.filter(r => r.error).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.url}: ${r.error}`);
    });
  }
}

// ============================================
// 主函数
// ============================================
async function main() {
  console.log('🚀 开始测试元数据获取服务...\n');
  
  // 运行测试用例
  await testSingleWebsite();
  await testBatchWebsites();
  
  console.log('\n✅ 所有测试完成！');
}

// 执行测试
main().catch(console.error);
