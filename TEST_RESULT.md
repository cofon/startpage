扩展控制台获取知乎内容页之前是可以的，现在获取不到了，这是打印：
background.js:568 收到消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}} 来自: http://localhost:5173/
background.js:137 [Background] 优先使用fetch获取元数据
background.js:568 收到消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}} 来自: http://localhost:5173/
background.js:137 [Background] 优先使用fetch获取元数据
background.js:197 [Background] 从 Content-Type 获取编码: GB2312
background.js:200 [Background] 使用 Content-Type 编码解码: GB2312
background.js:218 [Background] HTML 长度: 42563
background.js:227 [Background] ✅ 从 <title> 标签获取 title: 人教版一年级上册(2024秋版)语文(部编版)电子课本
background.js:318 [Background] ✅ 从 description meta 标签（无引号）获取 description
background.js:445 [Background] ✅ 使用默认 /favicon.ico: http://www.dzkbw.com/favicon.ico
background.js:451 [Background] 📊 最终结果: {title: '人教版一年级上册(2024秋版)语文(部编版)电子课本...', description: '"电子课本网提供人教版一年级上册(2024秋版)语文(部编版)电子课本导航，义务教育教科书,目录：我...', iconUrl: 'http://www.dzkbw.com/favicon.ico', hasIconData: true}
background.js:204 使用fetch获取元数据失败: Error: HTTP 403
    at getMetadataFromUrl (background.js:151:13)
    at async handleStartPageRequestWebsiteMeta (background.js:621:22)
getMetadataFromUrl @ background.js:204
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:621
handleMessage @ background.js:582
background.js:206 [Background] fetch失败，尝试使用标签页方式获取元数据
background.js:489 [getMetadataFromNewTab] 开始执行，URL: https://www.zhihu.com/question/398758985/answer/2018127512044058422
background.js:493 [getMetadataFromNewTab] 清理后的URL: https://www.zhihu.com/question/398758985/answer/2018127512044058422
background.js:496 [getMetadataFromNewTab] 确保离屏文档存在...
background.js:498 [getMetadataFromNewTab] 离屏文档准备就绪
background.js:501 [getMetadataFromNewTab] 向离屏文档发送获取元数据请求...
background.js:506 [getMetadataFromNewTab] 收到离屏文档响应: {error: 'HTTP 403'}error: "HTTP 403"[[Prototype]]: Object
background.js:509 [getMetadataFromNewTab] 离屏文档返回错误: HTTP 403
getMetadataFromNewTab @ background.js:509
await in getMetadataFromNewTab
getMetadataFromUrl @ background.js:207
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:621
handleMessage @ background.js:582
background.js:535 [getMetadataFromNewTab] 从离屏文档获取元数据失败: Error: HTTP 403
    at getMetadataFromNewTab (background.js:510:13)
    at async getMetadataFromUrl (background.js:207:12)
    at async handleStartPageRequestWebsiteMeta (background.js:621:22)
getMetadataFromNewTab @ background.js:535
await in getMetadataFromNewTab
getMetadataFromUrl @ background.js:207
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:621
handleMessage @ background.js:582
