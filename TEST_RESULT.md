扩展控制台报错：
background.js:855 扩展后台脚本初始化完成
background.js:544 收到消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}} 来自: http://localhost:5173/
background.js:544 收到消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}} 来自: http://localhost:5173/
background.js:133 [Background] 优先使用fetch获取元数据
background.js:200 使用fetch获取元数据失败: TypeError: Failed to fetch
    at getMetadataFromUrl (background.js:134:28)
    at handleStartPageRequestWebsiteMeta (background.js:597:28)
    at handleMessage (background.js:558:7)
getMetadataFromUrl @ background.js:200
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:597
handleMessage @ background.js:558
background.js:202 [Background] fetch失败，尝试使用标签页方式获取元数据
background.js:511 从离屏文档获取元数据失败: TypeError: Error in invocation of offscreen.createDocument(offscreen.CreateParameters parameters, optional function callback): Error at parameter 'parameters': Error at property 'reasons': Error at index 0: Value must be one of AUDIO_PLAYBACK, BATTERY_STATUS, BLOBS, CLIPBOARD, DISPLAY_MEDIA, DOM_PARSER, DOM_SCRAPING, GEOLOCATION, IFRAME_SCRIPTING, LOCAL_STORAGE, MATCH_MEDIA, TESTING, USER_MEDIA, WEB_RTC, WORKERS.
    at ensureOffscreenDocument (background.js:476:26)
    at async getMetadataFromNewTab (background.js:490:5)
    at async getMetadataFromUrl (background.js:203:12)
    at async handleStartPageRequestWebsiteMeta (background.js:597:22)
getMetadataFromNewTab @ background.js:511
await in getMetadataFromNewTab
getMetadataFromUrl @ background.js:203
await in getMetadataFromUrl
handleStartPageRequestWebsiteMeta @ background.js:597
handleMessage @ background.js:558

这是网络原因还是代码错误，如果是网络报错，是正常的，因为我没有VPN，打不开google是对的，如果是代码错误，请检查代码；
获取数据的逻辑在哪里，我想看一下；