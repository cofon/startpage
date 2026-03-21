起始页控制台：
content.js:3 [Content Script] StartPage Content Script 已加载
content.js:4 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:5 [Content Script] document.readyState: interactive
content.js:114 [Content Script] 注册消息监听器
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085683313-0.5273250909682485'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
website.js:44 [websiteStore.addWebsite] 准备添加网站: {name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', tags: Array(1), …}
website.js:45 [websiteStore.addWebsite] 当前 websites 数量: 0
website.js:59 [websiteStore.addWebsite] 准备保存到数据库...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085683313-0.5273250909682485'}
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1123
website.js:61 [websiteStore.addWebsite] 数据库返回 ID: 1123
website.js:71 [websiteStore.addWebsite] 准备添加到 store: {id: 1123, name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', …}
website.js:73 [websiteStore.addWebsite] 完成，当前 websites 数量: 1
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1124
App.vue:255 [App] 已添加从扩展提交的网站: baidu
App.vue:266 [Content Script] 收到起始页响应: {success: true, message: '网站添加成功', requestId: '1774085683313-0.5273250909682485'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085683321-0.6431543250757868'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085683321-0.6431543250757868'}
content.js:30 [Content Script] 忽略重复消息: EXTENSION_SUBMIT_WEBSITE_META
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}

扩展控制台:
background.js:559 扩展后台脚本初始化完成
background.js:544 收到命令: open-panel
background.js:289 收到消息: GET_CURRENT_PAGE_METADATA {type: 'GET_CURRENT_PAGE_METADATA'}
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:466 找到起始页实例，尝试发送数据
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:466 找到起始页实例，尝试发送数据
background.js:474 起始页添加网站成功
background.js:480 起始页添加网站失败，保存到扩展仓库
