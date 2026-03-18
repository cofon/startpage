/**
 * 快速测试边缘函数 API
 * 
 * 用法：node test-api-quick.js [url]
 * 示例：node test-api-quick.js https://www.baidu.com
 */

const http = require('http');

const testUrl = process.argv[2] || 'https://www.baidu.com';
const apiUrl = `http://localhost:3000/api/get-metadata?url=${encodeURIComponent(testUrl)}`;

console.log('🧪 开始测试边缘函数 API...\n');
console.log(`目标 URL: ${testUrl}`);
console.log(`API 地址：${apiUrl}\n`);

http.get(apiUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`状态码：${res.statusCode}`);
    console.log('\n响应内容：');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ 测试成功！');
        console.log(`  - Title: ${json.data.title?.substring(0, 50)}${json.data.title?.length > 50 ? '...' : ''}`);
        console.log(`  - Description: ${json.data.description?.substring(0, 50)}${json.data.description?.length > 50 ? '...' : ''}`);
        console.log(`  - Icon URL: ${json.data.iconUrl}`);
      } else {
        console.log('\n❌ API 返回错误：', json.error);
      }
    } catch (e) {
      console.log('原始响应:', data);
      console.log('\n❌ 解析 JSON 失败:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ 请求失败:', err.message);
  console.error('\n请确保本地服务已启动：npm run serve:local');
});
