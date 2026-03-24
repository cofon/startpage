测试

打开起始页，打开另一个网页，按下快捷键打开扩展面板，点击添加网站，
提示添加成功，此时网站被添加到起始页indexeddb，
再次打开扩展面板，点击添加网站，因为之前已经添加过，起始页不会重复添加网站，添加失败，
扩展把网站数据保存到了扩展本地存储

刷新起始页，控制台信息：
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:155 [Content Script] 注册消息监听器
App.vue:312 [App] 尝试从扩展获取未同步的元数据
App.vue:207 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:64 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774325395406-0.47461356786471365'}
content.js:63 [Content Script] 扩展响应: {success: true, data: Array(1)}
App.vue:315 [App] 从扩展获取到未同步的元数据: 1 条

因为扩展本地存储有数据，刷新起始页可以从扩展获取到数据，但是这个数据是起始页数据库已经存在的数据，所以，添加网站失败，因为添加失败，扩展不会删除本地存储的数据

刷新起始页后，扩展控制台信息：
background.js:568 收到消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}} 来自: http://localhost:5173/

查看扩展本地存储，保存的网站数据还在，

要添加一个逻辑，从扩展获取到数据之后，如果添加失败的原因是数据已经存在，则删除扩展本地存储的数据

