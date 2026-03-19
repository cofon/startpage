# 浏览器插件设计方案

## 1. 项目概述

本插件旨在为浏览器起始页提供网站元数据获取和管理功能，特别是解决知乎等反爬严格网站的数据获取问题。插件将与起始页紧密集成，提供便捷的网站添加和管理功能，使用与起始页添加网站页面相同的UI和功能。

## 2. 核心功能

### 2.1 基本功能
- **快捷键打开**：使用 `Alt+Shift+D` 快捷键打开插件面板
- **自动填充**：自动填充当前打开页面的 url、title、description、iconData
- **手动输入**：支持输入 URL 获取网站数据
- **表单管理**：包含字段: URL、name、title、description、iconData、iconGenerateData、tags、isActive、isMarked、isHidden
- **网站管理**：url、name、title、description、tags 使用input
- **标签管理**：iconData、iconGenerateData 使用textarea, 有一个预览图
- **标签管理**：isActive、isMarked、isHidden 使用checkbox, isActive 默认为 true, isMarked 默认为 false, isHidden 默认为 false
- **标签管理**：显示标签列表，支持点击添加/删除标签
- **数据处理**：与起始页添加网站页面使用相同的实现逻辑
- **数据存储**：插件独立存储 + 起始页存储
- **数据同步**：与起始页的数据同步机制

### 2.2 高级功能
- **元数据获取**：支持获取各种网站的元数据，包括反爬严格的网站
- **数据验证**：自动检测编码，如果不是UTF-8编码，则进行编码转换
- **URL 验证**：检查 URL 是否已存在于数据库中
- **根域名检测**：检测同根域名的网站，使用相同的SVG图标
- **数据合并**：智能合并插件存储和起始页存储的数据
- **错误处理**：完善的错误处理和用户提示

## 3. 插件架构

### 3.1 目录结构
```
plugin/
├── manifest.json          # 插件配置和权限声明
├── background.js          # 背景脚本，处理核心逻辑
├── content.js             # 内容脚本，注入目标页面获取数据
├── popup.html             # 插件面板 UI
├── popup.js               # 面板交互逻辑
├── options.html           # 插件设置页面
├── storage.js             # 存储管理模块
├── message.js             # 消息传递模块
├── utils/                 # 工具函数
│   ├── websiteUtils.js    # 网站相关工具函数（从起始页复制）
│   └── svgGenerator.js    # SVG生成工具
└── EXTENSION_DESIGN.md    # 插件设计文档
```

### 3.2 核心模块

#### 3.2.1 背景脚本 (background.js)
- 处理插件的核心逻辑
- 管理消息传递
- 处理网络请求
- 协调内容脚本和弹出面板
- 与起始页通信

#### 3.2.2 内容脚本 (content.js)
- 注入到目标页面
- 提取页面元数据
- 处理动态渲染的页面

#### 3.2.3 弹出面板 (popup.html/popup.js)
- 提供与起始页相同的UI界面
- 处理表单输入和提交
- 显示标签列表
- 与背景脚本通信
- 自动填充当前标签页数据

#### 3.2.4 存储模块 (storage.js)
- 管理插件存储
- 处理数据同步
- 实现缓存机制
- 与起始页数据库交互

#### 3.2.5 消息模块 (message.js)
- 定义消息类型和结构
- 处理消息传递
- 实现错误处理

#### 3.2.6 工具模块 (utils/)
- 从起始页复制必要的工具函数
- 实现SVG生成功能
- 提供URL验证和处理功能

## 4. 消息传递机制

### 4.1 消息类型
1. `GET_METADATA`：获取网站元数据
2. `SAVE_WEBSITE`：保存网站数据
3. `CHECK_EXISTING`：检查 URL 是否已存在
4. `SYNC_DATA`：数据同步
5. `OPEN_PANEL`：打开插件面板
6. `GET_SVG`：获取SVG图标
7. `ERROR`：错误消息

### 4.2 消息结构

#### 请求消息
```javascript
{
  type: "GET_METADATA",
  payload: {
    url: "https://www.zhihu.com/question/123456",
    options: {
      includeIcon: true
    }
  }
}
```

#### 响应消息
```javascript
{
  type: "GET_METADATA",
  success: true,
  data: {
    title: "知乎问题标题",
    description: "问题描述",
    iconData: "data:image/png;base64,..."
  },
  error: null
}
```

### 4.3 通信方式
- 起始页 → 插件：`chrome.runtime.sendMessage`
- 插件 → 起始页：`chrome.runtime.sendMessage`（需要起始页注册消息监听器）
- 内容脚本 → 背景脚本：`chrome.runtime.sendMessage`
- 插件面板 → 背景脚本：`chrome.runtime.sendMessage`

## 5. 数据存储策略

### 5.1 多层次存储

#### 插件存储 (`chrome.storage.local`)
- 存储结构：
  ```javascript
  {
    websites: [/* 网站数据数组 */],
    tags: [/* 标签数组 */],
    settings: {/* 插件设置 */},
    syncStatus: {/* 同步状态 */},
    svgCache: {/* 根域名对应的SVG缓存 */}
  }
  ```
- 优点：持久化，独立于起始页
- 适合：无起始页实例时存储数据

#### 起始页存储 (`IndexedDB`)
- 现有存储结构保持不变
- 优点：与起始页紧密集成
- 适合：正常使用时的主存储

### 5.2 数据同步策略
1. **起始页启动时**：
   - 发送 `SYNC_DATA` 消息给插件
   - 插件将存储的网站数据发送给起始页
   - 起始页合并数据（去重、更新）

2. **插件保存数据时**：
   - 检查起始页实例是否存在
   - 如果存在，直接发送给起始页保存
   - 如果不存在，保存到插件存储，等待起始页启动时同步

3. **数据冲突处理**：
   - 基于 URL 去重
   - 时间戳优先：较新的数据覆盖较旧的数据
   - 用户确认：重要冲突由用户决定

## 6. 权限管理

### 6.1 必要权限
- `tabs`：获取当前标签页信息
- `activeTab`：注入内容脚本到当前页面
- `storage`：存储数据
- `scripting`：注入脚本获取页面数据
- `alarms`：定期同步数据
- `https://*/*`：访问任意网站获取元数据

### 6.2 权限请求策略
- 最小权限原则：只请求必要的权限
- 运行时请求：需要时才请求权限
- 权限说明：明确告知用户权限用途

## 7. 错误处理

### 7.1 错误类型
1. **网络错误**：无法访问目标网站
2. **解析错误**：页面结构变化，无法提取数据
3. **权限错误**：插件权限不足
4. **存储错误**：数据保存失败
5. **同步错误**：与起始页通信失败
6. **起始页不存在**：无法访问起始页数据库

### 7.2 错误处理策略
- 详细的错误日志：记录错误类型、时间、URL
- 用户友好提示：简单明了的错误信息
- 重试机制：网络错误自动重试
- 降级方案：无法获取完整数据时返回部分数据
- 离线模式：起始页不存在时使用插件存储

## 8. 性能优化

### 8.1 应用场景
- 频繁获取网站元数据时
- 批量处理多个网站时
- 插件面板频繁打开关闭时

### 8.2 优化策略
1. **缓存机制**：
   - 内存缓存：最近访问的网站元数据
   - 磁盘缓存：持久化缓存，设置合理过期时间
   - SVG缓存：按根域名缓存SVG图标

2. **批量处理**：
   - 合并多个请求，减少消息传递次数
   - 批量存储操作，减少 I/O 开销

3. **延迟加载**：
   - 插件面板按需加载组件
   - 非关键数据延迟获取

4. **节流与防抖**：
   - 搜索输入防抖
   - 频繁操作节流

5. **背景任务**：
   - 数据同步放在后台执行
   - 定期清理过期缓存

## 9. 具体实现流程

### 9.1 快捷键打开插件面板
- 在 `manifest.json` 中注册快捷键 `Alt+Shift+D`
- 快捷键触发 `chrome.action.openPopup()`

### 9.2 自动填充当前页面数据
```javascript
// popup.js
async function autoFillCurrentPageData() {
  try {
    // 获取当前标签页信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url) {
      // 填充URL
      document.getElementById('url').value = tab.url;
      
      // 注入内容脚本获取页面数据
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // 提取页面元数据
          const title = document.title || '';
          const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
          
          // 提取favicon
          let iconData = '';
          const favicon = document.querySelector('link[rel*="icon"]');
          if (favicon) {
            iconData = favicon.getAttribute('href');
          }
          
          return { title, description, iconData };
        }
      });
      
      if (results && results[0] && results[0].result) {
        const { title, description, iconData } = results[0].result;
        
        // 填充表单
        document.getElementById('title').value = title;
        document.getElementById('description').value = description;
        
        // 处理图标
        if (iconData) {
          // 如果是相对路径，转换为绝对路径
          if (!iconData.startsWith('http')) {
            const baseUrl = new URL(tab.url);
            iconData = new URL(iconData, baseUrl).href;
          }
          
          // 获取iconData的base64
          try {
            const response = await fetch(iconData);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              document.getElementById('iconData').value = reader.result;
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            console.error('获取图标失败:', error);
          }
        }
        
        // 填充name（从URL提取）
        const name = extractSiteNameFromUrl(tab.url);
        document.getElementById('name').value = name;
        
        // 生成iconGenerateData
        const svgIcon = generateDefaultIcon(name);
        const iconGenerateData = encodeSvg(svgIcon);
        document.getElementById('iconGenerateData').value = iconGenerateData;
        
        // 设置默认值
        document.getElementById('isActive').checked = true;
        document.getElementById('isMarked').checked = false;
        document.getElementById('isHidden').checked = false;
        
        // 添加默认标签
        document.getElementById('tags').value = 'new';
        
        // 检查URL是否已存在
        checkUrlExists(tab.url);
      }
    }
  } catch (error) {
    console.error('自动填充失败:', error);
  }
}

// 页面加载时自动填充
document.addEventListener('DOMContentLoaded', autoFillCurrentPageData);
```

### 9.3 URL检测与SVG生成
```javascript
// utils/websiteUtils.js (从起始页复制并适配)

/**
 * 从URL提取网站名称
 */
export function extractSiteNameFromUrl(url) {
  const domain = extractDomain(url);
  return extractSiteName(domain);
}

/**
 * 从域名提取网站名称
 */
export function extractSiteName(domain) {
  if (!domain) return '';
  
  // 移除 www. 前缀
  let siteName = domain.replace(/^www\./, '');
  
  // 提取主域名（第一部分）
  const parts = siteName.split('.');
  if (parts.length > 0) {
    siteName = parts[0];
  }
  
  return siteName;
}

/**
 * 生成默认的网站图标 SVG
 */
export function generateDefaultIcon(name) {
  if (!name) return '';
  
  // 从 URL 提取域名（如果有协议前缀）
  let displayName = name;
  try {
    if (name.startsWith('http://') || name.startsWith('https://')) {
      const urlObj = new URL(name);
      displayName = urlObj.hostname.replace(/^www\./, '');
    }
  } catch {
    // 不是 URL 则直接使用 name
  }
  
  // 取首字母大写
  const firstLetter = displayName.charAt(0).toUpperCase();
  
  // 根据域名哈希选择背景色（避免相同首字母无法区分）
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  
  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = (hash << 5) - hash + displayName.charCodeAt(i);
    hash |= 0;
  }
  const backgroundColor = colorPalette[Math.abs(hash) % colorPalette.length];
  
  // 生成 SVG
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect width="48" height="48" fill="${backgroundColor}"/>
      <text x="50%" y="50%" dy=".35em"
            text-anchor="middle"
            font-size="28"
            font-weight="bold"
            fill="white">${firstLetter}</text>
    </svg>
  `;
}

/**
 * 编码 SVG 为 Base64
 */
export function encodeSvg(svg) {
  if (!svg) return '';
  if (svg.startsWith('data:image/svg+xml;base64,') || svg.startsWith('data:image/svg+xml;utf8,')) {
    return svg;
  }
  const encodedSvg = encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode('0x' + p1),
  );
  return `data:image/svg+xml;base64,${btoa(encodedSvg)}`;
}

/**
 * 检查 URL 是否已存在
 */
export async function checkUrlExists(url) {
  try {
    // 先检查起始页数据库
    const startpageResponse = await chrome.runtime.sendMessage({
      type: "CHECK_EXISTING",
      payload: { url }
    });
    
    if (startpageResponse && startpageResponse.success) {
      return startpageResponse.data;
    }
    
    // 如果起始页不存在，检查插件存储
    const pluginStorage = await chrome.storage.local.get('websites');
    if (pluginStorage.websites) {
      const existingWebsite = pluginStorage.websites.find(w => w.url === url);
      if (existingWebsite) {
        return {
          exists: true,
          websiteId: existingWebsite.id,
          websiteName: existingWebsite.name,
          website: existingWebsite
        };
      }
    }
    
    return { exists: false };
  } catch (error) {
    console.error('检查URL失败:', error);
    // 起始页不存在时，检查插件存储
    const pluginStorage = await chrome.storage.local.get('websites');
    if (pluginStorage.websites) {
      const existingWebsite = pluginStorage.websites.find(w => w.url === url);
      if (existingWebsite) {
        return {
          exists: true,
          websiteId: existingWebsite.id,
          websiteName: existingWebsite.name,
          website: existingWebsite
        };
      }
    }
    return { exists: false };
  }
}

/**
 * 检查根域名相同的网站
 */
export async function checkRootDomainSites(url) {
  try {
    const hostname = new URL(url).hostname;
    const rootDomain = extractRootDomain(hostname);
    
    // 先检查起始页数据库
    const startpageResponse = await chrome.runtime.sendMessage({
      type: "CHECK_ROOT_DOMAIN",
      payload: { rootDomain }
    });
    
    if (startpageResponse && startpageResponse.success && startpageResponse.data.sites.length > 0) {
      // 返回第一个网站的SVG
      return startpageResponse.data.sites[0].iconGenerateData;
    }
    
    // 如果起始页不存在，检查插件存储
    const pluginStorage = await chrome.storage.local.get('websites');
    if (pluginStorage.websites) {
      const sameRootDomainSites = pluginStorage.websites.filter(w => {
        try {
          const siteHostname = new URL(w.url).hostname;
          const siteRootDomain = extractRootDomain(siteHostname);
          return siteRootDomain === rootDomain;
        } catch {
          return false;
        }
      });
      
      if (sameRootDomainSites.length > 0) {
        return sameRootDomainSites[0].iconGenerateData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('检查根域名失败:', error);
    return null;
  }
}
```

### 9.4 保存网站
```javascript
// popup.js
async function saveWebsite() {
  try {
    // 收集表单数据
    const websiteData = {
      url: document.getElementById('url').value,
      name: document.getElementById('name').value,
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      iconData: document.getElementById('iconData').value,
      iconGenerateData: document.getElementById('iconGenerateData').value,
      tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
      isActive: document.getElementById('isActive').checked,
      isMarked: document.getElementById('isMarked').checked,
      isHidden: document.getElementById('isHidden').checked
    };
    
    // 验证数据
    if (!websiteData.url) {
      alert('URL不能为空');
      return;
    }
    
    // 检查根域名相同的网站，使用相同的SVG
    const existingSvg = await checkRootDomainSites(websiteData.url);
    if (existingSvg) {
      websiteData.iconGenerateData = existingSvg;
    }
    
    // 尝试保存到起始页
    try {
      const startpageResponse = await chrome.runtime.sendMessage({
        type: "SAVE_WEBSITE",
        payload: { website: websiteData }
      });
      
      if (startpageResponse && startpageResponse.success) {
        alert('保存成功！');
        return;
      }
    } catch (error) {
      console.error('保存到起始页失败:', error);
      // 起始页不存在，保存到插件存储
    }
    
    // 保存到插件存储
    const pluginStorage = await chrome.storage.local.get('websites');
    const websites = pluginStorage.websites || [];
    
    // 检查是否已存在
    const existingIndex = websites.findIndex(w => w.url === websiteData.url);
    if (existingIndex >= 0) {
      // 更新现有网站
      websites[existingIndex] = { ...websites[existingIndex], ...websiteData, updatedAt: new Date() };
    } else {
      // 添加新网站
      websites.push({ ...websiteData, id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() });
    }
    
    await chrome.storage.local.set({ websites });
    alert('保存成功（存储在插件中，起始页启动时会同步）！');
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，请查看控制台获取详细信息');
  }
}

// 绑定保存按钮
 document.getElementById('saveButton').addEventListener('click', saveWebsite);
```

### 9.5 数据同步
```javascript
// background.js
// 监听起始页的同步请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_DATA") {
    // 发送插件存储的网站数据
    chrome.storage.local.get('websites', (result) => {
      sendResponse({
        success: true,
        data: { websites: result.websites || [] }
      });
    });
    return true; // 异步响应
  }
  
  if (message.type === "CHECK_EXISTING") {
    // 检查URL是否存在于插件存储
    chrome.storage.local.get('websites', (result) => {
      const existingWebsite = result.websites?.find(w => w.url === message.payload.url);
      if (existingWebsite) {
        sendResponse({
          success: true,
          data: {
            exists: true,
            websiteId: existingWebsite.id,
            websiteName: existingWebsite.name,
            website: existingWebsite
          }
        });
      } else {
        sendResponse({
          success: true,
          data: { exists: false }
        });
      }
    });
    return true;
  }
  
  if (message.type === "SAVE_WEBSITE") {
    // 保存网站到插件存储
    const website = message.payload.website;
    chrome.storage.local.get('websites', (result) => {
      const websites = result.websites || [];
      const existingIndex = websites.findIndex(w => w.url === website.url);
      
      if (existingIndex >= 0) {
        websites[existingIndex] = { ...websites[existingIndex], ...website, updatedAt: new Date() };
      } else {
        websites.push({ ...website, id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() });
      }
      
      chrome.storage.local.set({ websites }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
```

## 10. 安全性考虑

- **消息验证**：验证消息来源，防止恶意网站发送消息
- **数据加密**：敏感数据加密存储
- **权限限制**：最小化权限请求
- **输入验证**：验证用户输入，防止 XSS 攻击
- **安全传输**：使用 HTTPS 进行网络请求
- **代码审计**：定期检查代码安全性

## 11. 扩展性

- **多浏览器支持**：考虑 Firefox 等其他浏览器
- **主题定制**：支持自定义插件面板主题
- **导入/导出**：支持数据导入导出
- **API 扩展**：预留未来功能扩展接口
- **国际化**：支持多语言

## 12. 开发计划

### 12.1 第一阶段：基础架构
- 创建插件目录结构
- 配置 `manifest.json`
- 实现基本的消息传递机制
- 开发存储管理模块
- 从起始页复制必要的工具函数

### 12.2 第二阶段：核心功能
- 实现快捷键打开面板
- 开发元数据获取功能
- 实现表单管理和标签功能
- 开发数据存储和同步机制
- 实现SVG生成和根域名检测

### 12.3 第三阶段：优化和测试
- 性能优化
- 错误处理完善
- 安全性测试
- 用户体验优化

### 12.4 第四阶段：部署和维护
- 打包插件
- 测试部署
- 收集用户反馈
- 持续更新和维护

## 13. 技术栈

- **前端**：HTML, CSS, JavaScript
- **浏览器 API**：Chrome Extension API
- **存储**：chrome.storage.local, IndexedDB
- **网络**：fetch API, XMLHttpRequest
- **构建工具**：无（简单项目）

## 14. 预期效果

- 解决知乎等反爬严格网站的数据获取问题
- 提供与起始页相同的UI和功能体验
- 自动填充当前标签页的网站数据
- 智能检测根域名，使用相同的SVG图标
- 与起始页无缝集成和数据同步
- 提供良好的用户体验
- 保证数据安全和性能

## 15. 风险评估

### 15.1 潜在风险
- **浏览器兼容性**：不同浏览器的 API 差异
- **反爬机制**：网站反爬策略变化
- **性能影响**：插件可能影响浏览器性能
- **数据同步**：数据冲突和同步失败
- **起始页依赖**：起始页不存在时的功能降级

### 15.2 风险应对
- **兼容性测试**：在主流浏览器中测试
- **自适应策略**：根据网站变化调整抓取策略
- **性能优化**：减少资源消耗
- **错误处理**：完善的错误处理和恢复机制
- **离线模式**：起始页不存在时使用插件存储

## 16. 解决方案总结

### 16.1 关键问题解决方案

1. **与起始页共享UI和功能**
   - 从起始页复制HTML结构和CSS样式
   - 复制必要的JavaScript逻辑和工具函数
   - 保持表单字段和验证逻辑一致

2. **自动填充当前标签页数据**
   - 使用 `chrome.tabs` API 获取当前标签页信息
   - 使用 `chrome.scripting` API 注入内容脚本提取页面元数据
   - 实现自动填充逻辑，包括URL、title、description、iconData

3. **URL检测和根域名SVG**
   - 实现 `checkUrlExists` 函数，优先检查起始页数据库
   - 实现 `checkRootDomainSites` 函数，检测同根域名网站
   - 使用插件存储作为起始页不存在时的备选方案

4. **工具函数共享**
   - 从起始页复制必要的工具函数到插件的 `utils` 目录
   - 适配函数以适应插件环境
   - 保持函数签名和行为一致

5. **数据存储和同步**
   - 使用 `chrome.storage.local` 作为插件存储
   - 实现与起始页的双向数据同步
   - 处理起始页不存在时的离线模式

### 16.2 伪代码实现

```javascript
// manifest.json 配置
{
  "manifest_version": 3,
  "name": "起始页网站管理插件",
  "version": "1.0.0",
  "description": "为起始页提供网站元数据获取和管理功能",
  "permissions": [
    "tabs",
    "activeTab",
    "storage",
    "scripting",
    "alarms"
  ],
  "host_permissions": [
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+D"
      }
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}

// popup.html 结构（与起始页添加网站页面相同）
<!DOCTYPE html>
<html>
<head>
  <title>添加网站</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="add-website-panel">
    <h3>添加网站</h3>
    
    <form id="websiteForm">
      <!-- URL 输入 -->
      <div class="form-group">
        <label for="url">URL</label>
        <input type="text" id="url" placeholder="https://www.example.com">
      </div>
      
      <!-- 其他字段 -->
      <div class="form-group">
        <label for="name">名称</label>
        <input type="text" id="name" placeholder="网站名称">
      </div>
      
      <div class="form-group">
        <label for="title">标题</label>
        <input type="text" id="title" placeholder="网站标题">
      </div>
      
      <div class="form-group">
        <label for="description">描述</label>
        <input type="text" id="description" placeholder="网站描述">
      </div>
      
      <div class="form-group">
        <label for="iconData">图标数据</label>
        <textarea id="iconData" placeholder="base64 编码的图标数据"></textarea>
      </div>
      
      <div class="form-group">
        <label for="iconGenerateData">图标生成数据</label>
        <textarea id="iconGenerateData" placeholder="SVG 图标数据"></textarea>
      </div>
      
      <div class="form-group">
        <label for="tags">标签</label>
        <input type="text" id="tags" placeholder="用逗号分隔多个标签">
      </div>
      
      <div class="form-group checkbox-group">
        <label><input type="checkbox" id="isActive" checked> 激活</label>
        <label><input type="checkbox" id="isMarked"> 标记</label>
        <label><input type="checkbox" id="isHidden"> 隐藏</label>
      </div>
      
      <div class="button-group">
        <button type="button" id="saveButton">保存</button>
        <button type="button" id="cancelButton">取消</button>
      </div>
    </form>
  </div>
  
  <script src="utils/websiteUtils.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

## 17. 结论

本插件设计方案旨在为浏览器起始页提供强大的网站元数据获取和管理功能，特别是解决知乎等反爬严格网站的数据获取问题。通过与起始页共享UI和功能，自动填充当前标签页数据，智能检测URL和根域名，以及实现与起始页的数据同步，该插件将为用户提供便捷、高效、安全的网站管理体验。

该方案考虑了起始页不存在时的离线模式，确保插件在各种情况下都能正常工作。同时，通过合理的架构设计、完善的错误处理和性能优化，该插件将为用户提供良好的使用体验。