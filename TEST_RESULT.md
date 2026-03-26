测试，显示网站没有问题，但是有警告和报错；

以下是浏览器控制台打印信息：
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:172 [Content Script] 注册消息监听器
App.vue:311 [App] 尝试从扩展获取未同步的元数据
App.vue:207 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:64 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774529509833-0.2441585097188903'}
content.js:71 [Content Script] 扩展响应: {success: true, data: Array(0)}
runtime-core.esm-bundler.js:51 [Vue warn]: Unhandled error during execution of native event handler 
  at <WebsiteIcon website= {id: 82, name: '火柴人水果大陆历险', title: '火柴人水果大陆历险_火柴人水果大陆历险html5游戏在线玩_4399h5游戏-4399在线玩', url: 'https://www.4399.com/flash/210573_3.htm#index3-7', description: '火柴人水果大陆历险小游戏在线试玩,小游戏下载及攻略,更多好玩小游戏尽在www.4399.com', …} > 
  at <MarkedWebsiteList key=0 websites= (11) [Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object), Proxy(Object)] onClick=fn > 
  at <DisplayModule onWebsiteClick=fn<handleWebsiteClick> onToggleMark=fn<toggleWebsiteMark> onEdit=fn<openEditWebsite>  ... > 
  at <App>
warn$1 @ runtime-core.esm-bundler.js:51
logError @ runtime-core.esm-bundler.js:263
handleError @ runtime-core.esm-bundler.js:255
callWithErrorHandling @ runtime-core.esm-bundler.js:201
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
runtime-core.esm-bundler.js:268 Uncaught InvalidCharacterError: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.
    at onImageError (WebsiteIcon.vue:78:34)
    at callWithErrorHandling (runtime-core.esm-bundler.js:199:19)
    at callWithAsyncErrorHandling (runtime-core.esm-bundler.js:206:17)
    at HTMLImageElement.invoker (runtime-dom.esm-bundler.js:730:5)
onImageError @ WebsiteIcon.vue:78
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
