import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取test_websites.txt的内容
const websitesTxtPath = join(__dirname, 'docs', 'test_websites.txt');
const websitesTxtContent = readFileSync(websitesTxtPath, 'utf8');

// 解析每行数据
const lines = websitesTxtContent.trim().split('\n');

// 生成网站数据对象
const websiteObjects = [];

for (const line of lines) {
  if (!line.trim()) continue;

  // 分割URL和标题
  const separatorIndex = line.indexOf(' | ');
  if (separatorIndex === -1) continue;

  const url = line.substring(0, separatorIndex).trim();
  let title = line.substring(separatorIndex + 3).trim();

  // 提取域名作为网站名称的一部分
  let name = title;
  let description = '';

  // 尝试解析特定格式的名称，如 "domain.com - title" 或 "domain.com - title - subtitle"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      const domainPart = parts[0];
      const titlePart = parts[1];

      // 检查是否有第三个部分作为额外信息
      let extraPart = '';
      if (parts.length >= 3) {
        extraPart = parts.slice(2).join(' - '); // 处理可能还有更多部分的情况
      }

      // 尝试从域名部分提取更简洁的名称
      try {
        const parsedDomain = new URL(`http://${domainPart.replace('www.', '')}`).hostname;
        name = extraPart ? `${parsedDomain} - ${extraPart}` : parsedDomain;
        description = titlePart;
      } catch (e) {
        // 如果域名解析失败，使用第一部分作为域名部分，第二部分作为标题
        name = extraPart ? `${domainPart} - ${extraPart}` : domainPart;
        description = titlePart;
      }
    }
  } else if (title.includes(' | ')) {
    // 处理 "domain.com - title | subtitle" 格式
    const parts = title.split(' | ');
    if (parts.length >= 2) {
      const domainAndTitle = parts[0];
      const subtitle = parts[1];

      if (domainAndTitle.includes(' - ')) {
        const subParts = domainAndTitle.split(' - ');
        if (subParts.length >= 2) {
          try {
            const parsedDomain = new URL(`http://${subParts[0].replace('www.', '')}`).hostname;
            name = `${parsedDomain} - ${subtitle}`;
            description = subParts[1];
          } catch (e) {
            name = `${subParts[0]} - ${subtitle}`;
            description = subParts[1];
          }
        }
      } else {
        // 如果没有破折号，可能是 "domain.com | title" 格式
        try {
          const parsedDomain = new URL(`http://${domainAndTitle.replace('www.', '')}`).hostname;
          name = parsedDomain;
          description = subtitle;
        } catch (e) {
          name = domainAndTitle;
          description = subtitle;
        }
      }
    }
  } else {
    // 如果不是特定格式，尝试从URL提取域名作为名称
    try {
      const hostname = new URL(url).hostname.replace('www.', '');
      name = hostname;
      description = title;
    } catch (e) {
      // 如果URL无效，保持原标题作为名称
      name = title;
      description = '';
    }
  }

  // 确保name长度不超过一定长度
  if (name.length > 60) {
    name = name.substring(0, 60) + '...';
  }

  // 根据标题生成标签
  let tags = [];
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('教程') || lowerTitle.includes('教学') || lowerTitle.includes('guide')) {
    tags.push('教程');
  }
  if (lowerTitle.includes('开发') || lowerTitle.includes('编程') || lowerTitle.includes('program')) {
    tags.push('开发');
  }
  if (lowerTitle.includes('工具') || lowerTitle.includes('tool')) {
    tags.push('工具');
  }
  if (lowerTitle.includes('视频') || lowerTitle.includes('movie') || lowerTitle.includes('film')) {
    tags.push('视频');
  }
  if (lowerTitle.includes('游戏') || lowerTitle.includes('game')) {
    tags.push('游戏');
  }
  if (lowerTitle.includes('文档') || lowerTitle.includes('doc')) {
    tags.push('文档');
  }
  if (lowerTitle.includes('知识') || lowerTitle.includes('问答') || lowerTitle.includes('知乎')) {
    tags.push('知识');
  }
  if (lowerTitle.includes('系统') || lowerTitle.includes('linux') || lowerTitle.includes('ubuntu')) {
    tags.push('系统');
  }
  if (lowerTitle.includes('小说') || lowerTitle.includes('book')) {
    tags.push('小说');
  }
  if (lowerTitle.includes('音乐') || lowerTitle.includes('music')) {
    tags.push('音乐');
  }
  if (lowerTitle.includes('社交') || lowerTitle.includes('twitter') || lowerTitle.includes('reddit')) {
    tags.push('社交');
  }
  if (lowerTitle.includes('搜索') || lowerTitle.includes('search')) {
    tags.push('搜索');
  }

  // 如果没有标签，则添加一个通用标签
  if (tags.length === 0) {
    tags.push('其他');
  }

  websiteObjects.push({
    name,
    url,
    description,
    iconUrl: '',
    iconData: null,
    iconGenerateData: null,
    iconCanFetch: true,
    iconFetchAttempts: 0,
    iconLastFetchTime: null,
    tags,
    isMarked: false,  // 先设置为false，稍后随机选择一些标记
    markOrder: 0,
    isActive: true,
    isHidden: false,
    visitCount: 0
  });
}

// 随机标记大约20%的网站
const markedCount = Math.max(10, Math.floor(websiteObjects.length * 0.2)); // 至少标记10个，或者总数的20%
const shuffled = [...websiteObjects].sort(() => 0.5 - Math.random());
for (let i = 0; i < markedCount; i++) {
  shuffled[i].isMarked = true;
  shuffled[i].markOrder = i + 1;
}

// 生成defaultWebsites.js内容
let content = `/**
 * 默认网站数据
 * 从Edge浏览器收藏夹导入
 */
export const defaultWebsites = [\n`;

for (let i = 0; i < websiteObjects.length; i++) {
  const site = websiteObjects[i];

  content += `  {\n`;
  content += `    name: '${site.name.replace(/'/g, "\\'")}',\n`;
  content += `    url: '${site.url.replace(/'/g, "\\'")}',\n`;
  content += `    description: '${site.description.replace(/'/g, "\\'")}',\n`;
  content += `    iconUrl: '',\n`;
  content += `    iconData: null,\n`;
  content += `    iconGenerateData: null,\n`;
  content += `    iconCanFetch: true,\n`;
  content += `    iconFetchAttempts: 0,\n`;
  content += `    iconLastFetchTime: null,\n`;
  content += `    tags: [${site.tags.map(tag => `'${tag}'`).join(', ')}],\n`;
  content += `    isMarked: ${site.isMarked},\n`;
  content += `    markOrder: ${site.markOrder},\n`;
  content += `    isActive: true,\n`;
  content += `    isHidden: false,\n`;
  content += `    visitCount: 0\n`;
  content += `  }`;

  if (i < websiteObjects.length - 1) {
    content += ',\n';
  } else {
    content += '\n';  // 最后一个元素后面不需要逗号
  }
}

content += `];\n`;

// 写入文件
const outputFilePath = join(__dirname, 'src', 'data', 'defaultWebsites.js');
writeFileSync(outputFilePath, content);

console.log(`成功生成了 ${websiteObjects.length} 个网站数据，已保存到 ${outputFilePath}`);
console.log(`其中 ${markedCount} 个网站被标记为已收藏`);
