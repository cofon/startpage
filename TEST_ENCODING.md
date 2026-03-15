# 编码修复测试指南（更新版）

## ⚠️ 重要说明

**background.js 运行在 Service Worker 环境中，没有 `window` 对象**

因此无法通过 `testEncoding()` 函数直接测试，需要使用以下替代方法。

---

## 📋 测试方法

### 方法 1: 使用起始页导入功能测试（推荐）

#### 1️⃣ 创建测试数据文件

创建 `test-gb2312.json`：
```json
{
  "websites": [
    {
      "url": "https://www.4399.com/flash/210573_3.htm#index3-7"
    },
    {
      "url": "http://www.dzkbw.com/books/rjb/gaoyi-shuxue/"
    }
  ]
}
```

#### 2️⃣ 重新加载扩展

1. 打开浏览器扩展管理页面
   - Edge: `edge://extensions/`
   - Chrome: `chrome://extensions/`

2. 启用"开发者模式"

3. **完全卸载旧版本**：
   - 点击 StartPage 插件的"移除"按钮
   - 确认删除

4. **关闭所有相关页面**：
   - 关闭扩展管理页
   - 关闭所有起始页标签
   - 等待 5 秒让 Service Worker 完全停止

5. **重新加载扩展**：
   - 返回扩展管理页
   - 点击"加载已解压的扩展程序"
   - 选择 `d:\vue\startpage\extension` 目录

#### 3️⃣ 执行导入测试

1. 打开起始页（`dist/index.html`）

2. 进入管理界面（输入 `--settings`）

3. 选择"导入数据"

4. 上传 `test-gb2312.json` 文件

5. **打开 F12 Console 查看详细日志**

#### 4️⃣ 查看编码检测日志

成功的输出应该包含：

```
[Background] 从 URL 获取元数据：https://www.4399.com/flash/210573_3.htm#index3-7
[Background] 从 http-equiv 检测到编码：gb2312
[Background] 使用编码解码：gb2312
[Background] HTML 长度：45678
[Background] 从 <title> 标签获取 title: 火柴人水果大陆历险_火柴人水果大陆历险 html5 游戏在线玩_4399h5 游戏 -4399 在线玩
[ImportService] ✓ 已补全 title: 火柴人水果大陆历险...
[ImportService] ✓ 已补全 description
[ImportService] ✓ 已补全 iconData (长度：12345)
```

---

### 方法 2: 直接在 Console 调用底层函数

如果想在起始页 Console 中直接测试，可以调用导入服务：

#### 1️⃣ 打开起始页 Console

按 F12 打开开发者工具 → Console 标签页

#### 2️⃣ 执行测试代码

```javascript
// 导入测试函数（需要等待模块加载完成）
import('./src/utils/testEncoding.js').then(module => {
  module.test4399Website()
}).catch(err => {
  console.error('加载失败:', err)
})
```

或者直接测试单个 URL：

```javascript
// 简单测试
fetch('https://www.4399.com/flash/210573_3.htm#index3-7', {
  method: 'GET',
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'User-Agent': navigator.userAgent,
  },
})
.then(response => {
  const contentType = response.headers.get('content-type')
  console.log('Content-Type:', contentType)
  
  return response.arrayBuffer()
})
.then(buffer => {
  // 尝试 GB2312 解码
  const decoder = new TextDecoder('gb2312')
  const html = decoder.decode(buffer)
  
  // 提取 title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  
  console.log('Title:', title)
  console.log('✅ 如果 Title 显示正常中文，说明编码正确')
  
  // 检查是否包含乱码
  if (/[]/.test(title)) {
    console.log('❌ 检测到乱码')
  } else {
    console.log('✅ 无乱码')
  }
})
.catch(err => {
  console.error('测试失败:', err)
})
```

---

## ✅ 成功标志

### 编码检测成功

看到以下日志表示编码检测成功：

```
[Background] 从 http-equiv 检测到编码：gb2312
[Background] 使用编码解码：gb2312
```

### 内容提取成功

Title 和 Description 正常显示中文：

```
Title: 火柴人水果大陆历险_火柴人水果大陆历险 html5 游戏在线玩_4399h5 游戏 -4399 在线玩
Description: 火柴人水果大陆历险小游戏在线试玩，小游戏下载及攻略，更多好玩小游戏尽在 www.4399.com
```

### 无乱码字符

- ✅ 没有 `` 这样的替换字符
- ✅ 没有 `Ãç` 这样的编码错误
- ✅ 中文正常显示

---

## ❌ 常见问题排查

### 问题 1: Service Worker 注册失败（状态码 15）

**原因**: manifest.json 配置错误或文件路径问题

**解决方法**:
```bash
# 1. 检查 manifest.json 格式
# 确保 background.service_worker 指向正确的文件

# 2. 验证 background.js 语法
# 确保没有语法错误

# 3. 完全卸载并重新安装扩展
# 不要只刷新，要完全移除后重新加载
```

### 问题 2: window is not defined

**原因**: background.js 运行在 Service Worker 环境，没有 window 对象

**解决方法**:
- ✅ 已修复：移除了 `window.testEncoding` 代码
- ✅ 使用上述测试方法替代

### 问题 3: 仍然显示乱码

**可能原因**:
1. 扩展未完全重新加载
2. 浏览器缓存了旧版本
3. 网站实际编码与检测不符

**解决方法**:
```bash
# 1. 清除浏览器缓存
# 2. 重启浏览器
# 3. 完全卸载扩展
# 4. 重新安装扩展
```

---

## 🔧 调试技巧

### 查看 Service Worker 日志

1. 打开 `edge://extensions/` 或 `chrome://extensions/`
2. 找到 StartPage 插件
3. 点击"Service Worker"或"查看视图"
4. 查看 Console 输出

### 强制 Service Worker 重新启动

```javascript
// 在扩展管理页面的 Console 中执行
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    reg.unregister()
    console.log('Service Worker 已注销')
  }
})
```

然后刷新扩展管理页面，Service Worker 会重新注册。

---

## 📊 测试用例

### UTF-8 网站（对照测试）

```javascript
// 这些网站应该始终正常工作
const utf8Sites = [
  'https://github.com',
  'https://stackoverflow.com',
  'https://juejin.cn',
  'https://www.zhihu.com'
]
```

### GB2312/GBK 网站

```javascript
// 需要编码修复才能正常工作的网站
const gb2312Sites = [
  'https://www.4399.com/flash/210573_3.htm#index3-7',
  'http://www.dzkbw.com/books/rjb/gaoyi-shuxue/',
  'http://www.pep.com.cn/gzyw/jszx/bx3/'
]
```

### Big5 网站（繁体中文）

```javascript
// 测试繁体中文编码
const big5Sites = [
  'https://www.hkeaa.edu.hk',
  'https://www.ntu.edu.tw'
]
```

---

## 🎯 验证清单

在完成编码修复后，应验证以下项目：

- [ ] Service Worker 成功注册（无状态码 15 错误）
- [ ] background.js 无语法错误
- [ ] 无 `window is not defined` 错误
- [ ] GB2312 网站能正确检测编码
- [ ] GB2312 网站的 Title 正常显示中文
- [ ] GB2312 网站的 Description 正常显示中文
- [ ] 无乱码字符
- [ ] UTF-8 网站仍然正常工作
- [ ] 导入功能正常处理编码检测
- [ ] Console 日志清晰可读

---

## 📞 如需帮助

如果测试失败，请提供以下信息：

1. **完整错误信息**（包括状态码、错误堆栈）
2. Service Worker Console 输出
3. 起始页 F12 Console 输出
4. 实际返回的 Title 和 Description 内容
5. 截图（包含错误和乱码内容）
6. 浏览器版本和扩展版本号