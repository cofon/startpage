在扩展活动状态时刷新页面，控制台打印信息：
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:205 [Content Script] 注册消息监听器
App.vue:421 [App] ========== 开始同步扩展数据 ==========
App.vue:216 [App] 收到扩展消息: PING {}
websiteMetadataService.js:153 [Content Script] 收到起始页消息: PING {type: 'PING', payload: {…}, requestId: '1774869421996-0.9694236134562436'}
websiteMetadataService.js:153 [Content Script] 收到 PING 消息，直接返回成功
App.vue:216 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:94 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774869421997-0.0022399870790419385'}
content.js:101 [Content Script] 扩展响应: {success: true, data: Array(0)}
App.vue:351 [App] ✓ 同步扩展数据成功！获取到数据: 0 条


这是在扩展不活动状态时刷新页面，控制台打印信息：
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:205 [Content Script] 注册消息监听器
App.vue:421 [App] ========== 开始同步扩展数据 ==========
App.vue:216 [App] 收到扩展消息: PING {}
websiteMetadataService.js:153 [Content Script] 收到起始页消息: PING {type: 'PING', payload: {…}, requestId: '1774869476336-0.625771648653859'}
websiteMetadataService.js:153 [Content Script] 收到 PING 消息，直接返回成功
App.vue:216 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:94 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774869476337-0.24904536670749944'}
content.js:71 [Content Script] 发送消息到扩展失败: The message port closed before a response was received.
(匿名) @ content.js:71
websiteMetadataService.js:68 [sendMessageToExtension] 请求失败，正在重试 1/3...
App.vue:216 [App] 收到扩展消息: PING {}
websiteMetadataService.js:153 [Content Script] 收到起始页消息: PING {type: 'PING', payload: {…}, requestId: '1774869476858-0.46535553478471725'}
websiteMetadataService.js:153 [Content Script] 收到 PING 消息，直接返回成功
App.vue:216 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:94 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774869476858-0.7908653537270802'}
content.js:101 [Content Script] 扩展响应: {success: true, data: Array(0)}
App.vue:351 [App] ✓ 同步扩展数据成功！获取到数据: 0 条


等了一会儿之后，控制台继续打印信息，控制台信息变成了这样：



就是说，后面的信息都是不必要的