测试

关闭所有起始页，打开百度首页，按快捷键 alt+shift+d，打开扩展面板，点击添加按钮，添加成功
查看扩展仓库，数据添加成功
扩展控制台信息：
background.js:874 扩展后台脚本初始化完成
background.js:859 收到命令: open-panel
background.js:601 收到消息: GET_CURRENT_PAGE_METADATA {type: 'GET_CURRENT_PAGE_METADATA'} 来自: chrome-extension://dnkfpjilidlfmhgkkehenkkfccoegfnp/popup.html
background.js:601 收到消息: EXTENSION_SUBMIT_WEBSITE_META {type: 'EXTENSION_SUBMIT_WEBSITE_META', payload: {…}} 来自: chrome-extension://dnkfpjilidlfmhgkkehenkkfccoegfnp/popup.html
background.js:822 未找到起始页实例，保存到扩展仓库


打开起始页，控制台信息：
content.js:3 [Content Script] StartPage Content Script 已加载
content.js:4 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:5 [Content Script] document.readyState: interactive
content.js:153 [Content Script] 注册消息监听器

没有发送消息到扩展获取未同步的数据
