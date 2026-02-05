import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义要标记的网站域名
const markedDomains = [
  'doubao.com',
  'chat.baidu.com',
  'qianwen.com',
  'bilibili.com',
  'zhihu.com',
  'github.com',
  'fanyi.baidu.com',
  'baidu.com',
  'pub.dev',
  'localhost',
  'google.com'
];

function updateDefaultWebsites() {
  // 读取现有的defaultWebsites.js文件
  const filePath = path.join(__dirname, 'src', 'data', 'defaultWebsites.js');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // 使用正则表达式匹配整个网站数组
  const websiteBlock = fileContent.match(/export const defaultWebsites = \[((?:.|\n)*)\];/);
  
  if (!websiteBlock) {
    console.error('未能找到defaultWebsites数组');
    return;
  }
  
  const arrayContent = websiteBlock[1];
  
  // 分割每个网站对象
  const websiteObjects = [];
  let currentObj = '';
  let braceCount = 0;
  let inObject = false;
  
  // 遍历arrayContent的每个字符
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    
    if (char === '{') {
      if (!inObject) {
        inObject = true;
      }
      currentObj += char;
      braceCount++;
    } else if (char === '}') {
      currentObj += char;
      braceCount--;
      
      if (braceCount === 0 && inObject) {
        // 完整的网站对象
        websiteObjects.push(currentObj);
        currentObj = '';
        inObject = false;
      }
    } else {
      currentObj += char;
    }
  }
  
  // 处理每个网站对象
  const processedObjects = websiteObjects.map(obj => {
    // 提取URL
    const urlMatch = obj.match(/url:\s*['"](.+?)['"]/);
    if (!urlMatch) return obj;
    
    const url = urlMatch[1];
    
    // 提取域名
    let domain;
    try {
      domain = new URL(url).hostname.replace('www.', '');
    } catch (e) {
      // 如果URL格式无效，尝试从字符串中提取域名
      const match = url.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/\n]+)/);
      if (match) {
        domain = match[1];
      } else {
        return obj;
      }
    }
    
    // 检查是否是我们要标记的域名之一
    const shouldBeMarked = markedDomains.some(targetDomain => domain.includes(targetDomain) || targetDomain.includes(domain));
    
    // 替换isMarked值
    let updatedObj = obj.replace(/isMarked:\s*(true|false)/, `isMarked: ${shouldBeMarked}`);
    
    return updatedObj;
  });
  
  // 重新组装文件内容
  const newFileContent = fileContent.replace(
    websiteBlock[0],
    `export const defaultWebsites = [\n${processedObjects.join(',\n')}\n];`
  );
  
  // 写入新文件
  fs.writeFileSync(filePath, newFileContent);

  console.log(`成功更新了 ${processedObjects.length} 个网站的标记状态`);
  console.log(`${markedDomains.length} 个特定域名的网站isMarked设为true，其余设为false`);
}

// 执行函数
updateDefaultWebsites();