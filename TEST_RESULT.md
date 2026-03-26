这是获取URL：https://m.runoob.com/cprogramming/ 的扩展控制台打印：
background.js:941 扩展后台脚本初始化完成
background.js:609 收到消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}} 来自: http://localhost:5173/
background.js:609 收到消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}}payload: {url: 'https://m.runoob.com/cprogramming/'}type: "START_PAGE_REQUEST_WEBSITE_META"[[Prototype]]: Object 来自: http://localhost:5173/
background.js:137 [Background] 优先使用fetch获取元数据
background.js:197 [Background] 从 Content-Type 获取编码: UTF-8
background.js:200 [Background] 使用 Content-Type 编码解码: UTF-8
background.js:218 [Background] HTML 长度: 66092
background.js:227 [Background] ✅ 从 <title> 标签获取 title: C 教程 | 菜鸟教程
background.js:299 [Background] ✅ 从 description meta 标签获取 description
background.js:416 [Background] ✅ 从 rel="apple-touch-icon" 获取 icon: https://static.runoob.com/images/icon/mobile-icon.png
background.js:602 获取图标失败: TypeError: Failed to fetch
    at tryFetchIcon (background.js:575:28)
    at fetchIconAsBase64 (background.js:547:26)
    at parseHtmlMetadata (background.js:449:26)
    at getMetadataFromUrl (background.js:201:14)
    at async handleStartPageRequestWebsiteMeta (background.js:666:22)
tryFetchIcon @ background.js:602
await in tryFetchIcon
fetchIconAsBase64 @ background.js:547
parseHtmlMetadata @ background.js:449
getMetadataFromUrl @ background.js:201
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:666
handleMessage @ background.js:623
background.js:559 尝试使用域名 favicon.ico: https://static.runoob.com/favicon.ico
background.js:602 获取图标失败: TypeError: Failed to fetch
    at tryFetchIcon (background.js:575:28)
    at fetchIconAsBase64 (background.js:560:36)
    at async parseHtmlMetadata (background.js:449:20)
    at async handleStartPageRequestWebsiteMeta (background.js:666:22)
tryFetchIcon @ background.js:602
await in tryFetchIcon
fetchIconAsBase64 @ background.js:560
await in fetchIconAsBase64
parseHtmlMetadata @ background.js:449
getMetadataFromUrl @ background.js:201
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:666
handleMessage @ background.js:623
background.js:451 [Background] 📊 最终结果: {title: 'C 教程 | 菜鸟教程...', description: '菜鸟教程...', iconUrl: 'https://static.runoob.com/images/icon/mobile-icon.png', hasIconData: false}description: "菜鸟教程..."hasIconData: falseiconUrl: "https://static.runoob.com/images/icon/mobile-icon.png"title: "C 教程 | 菜鸟教程..."[[Prototype]]: Object

根据打印信息可以看到，提取出 iconUrl 为 https://static.runoob.com/images/icon/mobile-icon.png，但是获取图标失败，
于是使用 url 域名 + favicon.ico 的方法获取，
这不是我想要的效果，我想要的是：
URL ： https://m.runoob.com/cprogramming/ ；
它的域名是 https://m.runoob.com/ ；
在获取icon失败的时候可以尝试的 iconUrl 为 https://m.runoob.com/favicon.ico
而不是 https://static.runoob.com/favicon.ico

我已经测试过了，https://m.runoob.com/favicon.ico 在浏览器打开是有图标的；