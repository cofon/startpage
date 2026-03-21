扩展报错：Uncaught Error: Extension context invalidated.
扩展控制台没有打印.

起始页控制台打印：
content.js:3 [Content Script] StartPage Content Script 已加载
content.js:4 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:5 [Content Script] document.readyState: interactive
content.js:115 [Content Script] 注册消息监听器
ImportDataPanel.vue:20 [ImportDataPanel] 解析导入数据: {urls: Array(2)}
ImportDataPanel.vue:25 [ImportDataPanel] 使用 importService 统一导入...
performanceMonitor.js:36 [性能监控] 开始监控
performanceMonitor.js:63 [性能监控] 开始阶段: validation
performanceMonitor.js:75 [性能监控] 完成阶段: validation (0.10ms)
performanceMonitor.js:63 [性能监控] 开始阶段: db_check
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'db_check', processed: 0, total: 2, message: '正在检查数据库中已存在的网站...'}
performanceMonitor.js:75 [性能监控] 完成阶段: db_check (0.60ms)
importService.js:465 
========== 📊 导入数据统计报告 ==========
importService.js:466 总数：2 个网站
importService.js:467 ✅ 数据库中已存在且完整：0 个（直接跳过）
importService.js:468 ⚠️  数据库中已存在但不完整：0 个（需要更新）
importService.js:469 🆕 新导入：2 个
importService.js:470 =========================================

ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'db_check', processed: 2, total: 2, message: '数据库检查完成：0 个已存在且完整，2 个需要处理'}
importService.js:505 
========== 🔍 需要处理的网站分析 ==========
importService.js:506 完整（无需插件补全）：0 个
importService.js:507 不完整（需要插件补全）：2 个
importService.js:508 =========================================

performanceMonitor.js:63 [性能监控] 开始阶段: enrichment
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'enriching', processed: 0, total: 2, message: '准备补全 2 个不完整的网站...'}
importService.js:211 [ImportService] 🔍 尝试获取元数据：http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/
websiteMetadataService.js:84 [fetchMetadata] ========== 开始获取元数据 ==========
websiteMetadataService.js:85 [fetchMetadata] 数据来源：扩展
websiteMetadataService.js:86 [fetchMetadata] URL: http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/
App.vue:215 [App] 收到扩展消息: START_PAGE_REQUEST_WEBSITE_META {url: 'http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/'}
websiteMetadataService.js:68 [Content Script] 收到起始页消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}, requestId: '1774094120227-0.5392867175465907'}
content.js:41 Uncaught Error: Extension context invalidated.
    at content.js:41:18
    at async importData (importService.js:86:14)
    at async reader.onload (ImportDataPanel.vue:27:24)
(匿名) @ content.js:41
await in (匿名)
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
importService.js:211 [ImportService] 🔍 尝试获取元数据：https://www.zhihu.com/question/398758985/answer/2018127512044058422
websiteMetadataService.js:84 [fetchMetadata] ========== 开始获取元数据 ==========
websiteMetadataService.js:85 [fetchMetadata] 数据来源：扩展
websiteMetadataService.js:86 [fetchMetadata] URL: https://www.zhihu.com/question/398758985/answer/2018127512044058422
App.vue:215 [App] 收到扩展消息: START_PAGE_REQUEST_WEBSITE_META {url: 'https://www.zhihu.com/question/398758985/answer/2018127512044058422'}
websiteMetadataService.js:68 [Content Script] 收到起始页消息: START_PAGE_REQUEST_WEBSITE_META {type: 'START_PAGE_REQUEST_WEBSITE_META', payload: {…}, requestId: '1774094120228-0.4882125115744349'}
content.js:41 Uncaught Error: Extension context invalidated.
    at content.js:41:18
    at async importData (importService.js:86:14)
    at async reader.onload (ImportDataPanel.vue:27:24)
(匿名) @ content.js:41
await in (匿名)
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
websiteMetadataService.js:110 [fetchMetadata] ❌ 获取元数据失败: Extension communication timeout
fetchMetadata @ websiteMetadataService.js:110
await in fetchMetadata
(匿名) @ importService.js:212
enrichWebsites @ importService.js:209
importWebsites @ importService.js:524
await in importWebsites
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
importService.js:230 [ImportService] ⚠️ 无法获取元数据：http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/
(匿名) @ importService.js:230
await in (匿名)
enrichWebsites @ importService.js:209
importWebsites @ importService.js:524
await in importWebsites
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
importService.js:245 [ImportService] ✗ 已添加 "meta_failed" 标签到：http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/
websiteMetadataService.js:110 [fetchMetadata] ❌ 获取元数据失败: Extension communication timeout
fetchMetadata @ websiteMetadataService.js:110
await in fetchMetadata
(匿名) @ importService.js:212
enrichWebsites @ importService.js:209
importWebsites @ importService.js:524
await in importWebsites
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
importService.js:230 [ImportService] ⚠️ 无法获取元数据：https://www.zhihu.com/question/398758985/answer/2018127512044058422
(匿名) @ importService.js:230
await in (匿名)
enrichWebsites @ importService.js:209
importWebsites @ importService.js:524
await in importWebsites
importData @ importService.js:86
reader.onload @ ImportDataPanel.vue:27
FileReader
handleImport @ ImportDataPanel.vue:61
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
importService.js:245 [ImportService] ✗ 已添加 "meta_failed" 标签到：https://www.zhihu.com/question/398758985/answer/2018127512044058422
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'enriching', processed: 2, total: 2, message: '正在补全网站元数据... (2/2)'}
performanceMonitor.js:75 [性能监控] 完成阶段: enrichment (30181.70ms)
performanceMonitor.js:63 [性能监控] 开始阶段: normalization
performanceMonitor.js:75 [性能监控] 完成阶段: normalization (0.50ms)
performanceMonitor.js:63 [性能监控] 开始阶段: database
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: http://www.dzkbw.com/books/rjb/yuwen/xs1s_2024/ dzkbw
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:135 [IndexedDB.addWebsite] 准备添加网站: https://www.zhihu.com/question/398758985/answer/2018127512044058422 zhihu
indexedDB.js:153 [IndexedDB.addWebsite] 执行 store.add...
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1148
indexedDB.js:159 [IndexedDB.addWebsite] 添加成功，ID: 1149
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'importing', processed: 2, total: 2, message: '正在导入网站到数据库... (2/2)'}
performanceMonitor.js:75 [性能监控] 完成阶段: database (2.00ms)
performanceMonitor.js:63 [性能监控] 开始阶段: other_data
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'other_data', processed: 0, total: 3, message: '开始处理其他数据类型...'}
ImportDataPanel.vue:31 [ImportDataPanel] 导入进度: {phase: 'other_data', processed: 3, total: 3, message: '其他数据类型处理完成'}
performanceMonitor.js:75 [性能监控] 完成阶段: other_data (0.40ms)
performanceMonitor.js:149 [性能监控] 性能报告
performanceMonitor.js:150 总耗时: 30.19秒
performanceMonitor.js:153 内存使用:
performanceMonitor.js:154   初始: 39.17 MB
performanceMonitor.js:155   峰值: 39.66604232788086 MB
performanceMonitor.js:156   最终: 39.67 MB
performanceMonitor.js:159 操作统计:
performanceMonitor.js:160   总数: 2
performanceMonitor.js:161   成功: 2
performanceMonitor.js:162   失败: 0
performanceMonitor.js:163   成功率: 100.00%
performanceMonitor.js:165 各阶段耗时:
performanceMonitor.js:167   validation: 0.10ms (0 个操作)
performanceMonitor.js:167   db_check: 0.60ms (0 个操作)
performanceMonitor.js:167   enrichment: 30181.70ms (0 个操作)
performanceMonitor.js:167   normalization: 0.50ms (0 个操作)
performanceMonitor.js:167   database: 2.00ms (2 个操作)
performanceMonitor.js:167   other_data: 0.40ms (0 个操作)
ImportDataPanel.vue:37 [ImportDataPanel] 导入完成: {success: 2, failed: 0, skipped: 0, updated: 0, errors: Array(0)}
