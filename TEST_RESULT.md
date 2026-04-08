ImportDataPanel.vue:61 [ImportDataPanel] 解析导入数据: {version: 1, exportDate: '2026-04-08T07:05:41.552Z', websites: Array(266), settings: {…}, themes: Array(8), …}
ImportDataPanel.vue:66 [ImportDataPanel] 使用 importService 统一导入...
performanceMonitor.js:36 [性能监控] 开始监控
performanceMonitor.js:63 [性能监控] 开始阶段: validation
performanceMonitor.js:75 [性能监控] 完成阶段: validation (0.10ms)
performanceMonitor.js:63 [性能监控] 开始阶段: database
ImportDataPanel.vue:77 [ImportDataPanel] 导入进度: {phase: 'importing', processed: 100, total: 266, message: '正在导入网站到数据库... (100/266)'}
ImportDataPanel.vue:77 [ImportDataPanel] 导入进度: {phase: 'importing', processed: 200, total: 266, message: '正在导入网站到数据库... (200/266)'}
ImportDataPanel.vue:77 [ImportDataPanel] 导入进度: {phase: 'importing', processed: 266, total: 266, message: '正在导入网站到数据库... (266/266)'}
performanceMonitor.js:75 [性能监控] 完成阶段: database (88.00ms)
performanceMonitor.js:63 [性能监控] 开始阶段: other_data
ImportDataPanel.vue:77 [ImportDataPanel] 导入进度: {phase: 'other_data', processed: 0, total: 3, message: '开始处理其他数据类型...'}
importService.js:735 [ImportService] 🎨 处理 8 个主题
importService.js:744 [ImportService] ⚠️ 主题已存在，尝试更新: auto
importService.js:744 [ImportService] ⚠️ 主题已存在，尝试更新: dark
importService.js:744 [ImportService] ⚠️ 主题已存在，尝试更新: light
importService.js:751 [ImportService] ✅ 主题导入完成
importService.js:759 [ImportService] 🔍 处理 4 个搜索引擎
importService.js:768 [ImportService] ⚠️ 搜索引擎已存在，尝试更新: baidu
importService.js:768 [ImportService] ⚠️ 搜索引擎已存在，尝试更新: bing
importService.js:768 [ImportService] ⚠️ 搜索引擎已存在，尝试更新: local
importService.js:768 [ImportService] ⚠️ 搜索引擎已存在，尝试更新: yandex
importService.js:775 [ImportService] ✅ 搜索引擎导入完成
importService.js:783 [ImportService] ⚙️ 处理设置数据
importService.js:786 [ImportService] ✅ 设置导入完成
ImportDataPanel.vue:77 [ImportDataPanel] 导入进度: {phase: 'other_data', processed: 3, total: 3, message: '其他数据类型处理完成'}
performanceMonitor.js:75 [性能监控] 完成阶段: other_data (7.60ms)
performanceMonitor.js:149 [性能监控] 性能报告
performanceMonitor.js:150 总耗时: 0.10秒
performanceMonitor.js:153 内存使用:
performanceMonitor.js:154   初始: 62.24 MB
performanceMonitor.js:155   峰值: 62.23896312713623 MB
performanceMonitor.js:156   最终: 60.95 MB
performanceMonitor.js:159 操作统计:
performanceMonitor.js:160   总数: 266
performanceMonitor.js:161   成功: 266
performanceMonitor.js:162   失败: 0
performanceMonitor.js:163   成功率: 100.00%
performanceMonitor.js:165 各阶段耗时:
performanceMonitor.js:167   validation: 0.10ms (0 个操作)
performanceMonitor.js:167   database: 88.00ms (266 个操作)
performanceMonitor.js:167   other_data: 7.60ms (0 个操作)
ImportDataPanel.vue:87 [ImportDataPanel] 导入完成: {success: 266, failed: 0, skipped: 0, updated: 0, errors: Array(0)}
ImportDataPanel.vue:129 重新加载数据失败: TypeError: settingStore.initThemes is not a function
    at ImportDataPanel.vue:122:32
(匿名) @ ImportDataPanel.vue:129
setTimeout
reader.onload @ ImportDataPanel.vue:105
FileReader
handleImport @ ImportDataPanel.vue:140
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
invoker @ runtime-dom.esm-bundler.js:730
