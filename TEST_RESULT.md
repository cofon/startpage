起始页控制台：
content.js:3 [Content Script] StartPage Content Script 已加载
content.js:4 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:5 [Content Script] document.readyState: interactive
content.js:153 [Content Script] 注册消息监听器
App.vue:320 [App] 尝试从扩展获取未同步的元数据
App.vue:215 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}[[Prototype]]: Object
websiteMetadataService.js:63 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774096953124-0.29361291200322326'}payload: {}requestId: "1774096953124-0.29361291200322326"type: "START_PAGE_REQUEST_UNSYNCED_METAS"[[Prototype]]: Object
content.js:61 [Content Script] 扩展响应: {success: true, data: Array(1)}data: Array(1)0: {description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8=', synced: false, title: '百度一下，你就知道', url: 'https://www.baidu.com/'}length: 1[[Prototype]]: Array(0)success: true[[Prototype]]: Object
App.vue:323 [App] 从扩展获取到未同步的元数据: 1 条
website.js:44 [websiteStore.addWebsite] 准备添加网站: {name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', tags: Array(1), …}
website.js:45 [websiteStore.addWebsite] 当前 websites 数量: 0
website.js:59 [websiteStore.addWebsite] 准备保存到数据库...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1158
website.js:61 [websiteStore.addWebsite] 数据库返回 ID: 1158
website.js:71 [websiteStore.addWebsite] 准备添加到 store: {id: 1158, name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', …}
website.js:73 [websiteStore.addWebsite] 完成，当前 websites 数量: 1
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1159
App.vue:353 [App] 已添加从扩展同步的网站: baidu


扩展控制台：
background.js:914 扩展后台脚本初始化完成
background.js:899 收到命令: open-panel
background.js:602 收到消息: GET_CURRENT_PAGE_METADATA {type: 'GET_CURRENT_PAGE_METADATA'} 来自: chrome-extension://dnkfpjilidlfmhgkkehenkkfccoegfnp/popup.html
background.js:602 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}} 来自: chrome-extension://dnkfpjilidlfmhgkkehenkkfccoegfnp/popup.html
background.js:862 未找到起始页实例，保存到扩展仓库
background.js:602 收到消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}}payload: {}type: "START_PAGE_REQUEST_UNSYNCED_METAS"[[Prototype]]: Object 来自: http://localhost:5173/
background.js:602 收到消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}}payload: {}type: "START_PAGE_REQUEST_UNSYNCED_METAS"[[Prototype]]: Object 来自: http://localhost:5173/


扩展仓库数据，synced没有更新为true：
[
    {
        "description": "全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。",
        "iconData": "data:image/x-icon;base64,省略",
        "synced": false,
        "title": "百度一下，你就知道",
        "url": "https://www.baidu.com/"
    }
]