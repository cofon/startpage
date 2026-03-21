测试

清空扩展和起始页的所有控制台和数据库

浏览器打开起始页，打开百度首页，按下 alt+shift+d 打开扩展的添加网站面板，OK
title desc iconData 数据已经填充，图标预览正确，OK
添加按钮点击，添加成功，OK
点击添加按钮，弹窗提示成功，OK

起始页控制台打印：
content.js:3 [Content Script] StartPage Content Script 已加载
content.js:4 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:5 [Content Script] document.readyState: interactive
content.js:114 [Content Script] 注册消息监听器
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150275-0.01500099267544941'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
website.js:44 [websiteStore.addWebsite] 准备添加网站: {name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', tags: Array(1), …}
website.js:45 [websiteStore.addWebsite] 当前 websites 数量: 0
website.js:59 [websiteStore.addWebsite] 准备保存到数据库...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.baidu.com/ baidu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150275-0.01500099267544941'}
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1121
website.js:61 [websiteStore.addWebsite] 数据库返回 ID: 1121
website.js:71 [websiteStore.addWebsite] 准备添加到 store: {id: 1121, name: 'baidu', title: '百度一下，你就知道', url: 'https://www.baidu.com/', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', …}
website.js:73 [websiteStore.addWebsite] 完成，当前 websites 数量: 1
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1122
App.vue:255 [App] 已添加从扩展提交的网站: baidu
App.vue:266 [Content Script] 收到起始页响应: {success: true, message: '网站添加成功', requestId: '1774085150275-0.01500099267544941'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150283-0.18702928452078982'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085150283-0.18702928452078982'}
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150283-0.18702928452078982'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150286-0.5720886412733044'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085150286-0.5720886412733044'}
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150286-0.5720886412733044'}
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150290-0.2347052406958784'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085150290-0.2347052406958784'}
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150290-0.2347052406958784'}
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150295-0.22122592525433182'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085150295-0.22122592525433182'}
content.js:37 [Content Script] 收到起始页消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150295-0.22122592525433182'}
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}
content.js:59 [Content Script] 收到扩展后台消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
content.js:89 [Content Script] 发送消息给起始页: {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}, requestId: '1774085150299-0.02510881837061174'}
App.vue:215 [App] 收到扩展消息: EXTENSION_SUBMIT_WEBSITE_META {url: 'https://www.baidu.com/', title: '百度一下，你就知道', description: '全球领先的中文搜索引擎、致力于让网民更便捷地获取信息，找到所求。百度超过千亿的中文网页数据库，可以瞬间找到相关的搜索结果。', iconData: 'data:image/x-icon;base64,AAABAAEAQEAAAAEAIAAoQgAAF…AAAABgAAAAAAAAAHAAAAAAAAAA+AAAAAAAAAH+AAAAAAAAB8='}
App.vue:268 [App] 网站已存在: https://www.baidu.com/
App.vue:278 [Content Script] 收到起始页响应: {success: false, error: '网站已存在', requestId: '1774085150299-0.02510881837061174'}
content.js:30 [Content Script] 忽略重复消息: EXTENSION_SUBMIT_WEBSITE_META
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}
content.js:43 [Content Script] 扩展响应: {success: true, message: '元数据保存到扩展仓库'}

扩展控制台打印：
background.js:575 扩展后台脚本初始化完成
background.js:560 收到命令: open-panel
background.js:289 收到消息: GET_CURRENT_PAGE_METADATA {type: 'GET_CURRENT_PAGE_METADATA'}
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:490 起始页添加网站成功
background.js:496 起始页添加网站失败，保存到扩展仓库
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:496 起始页添加网站失败，保存到扩展仓库
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:496 起始页添加网站失败，保存到扩展仓库
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:496 起始页添加网站失败，保存到扩展仓库
background.js:289 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}}
background.js:482 找到起始页实例，尝试发送数据
background.js:496 起始页添加网站失败，保存到扩展仓库
