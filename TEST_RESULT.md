控制台打印：
AddWebsitePanel.vue:140 [processUrlChange] ========== URL 变化处理 ==========
AddWebsitePanel.vue:141 [processUrlChange] 输入 URL: https://www.zhihu.com/question/1924838186045145101/answer/2017025680806813774
AddWebsitePanel.vue:162 [processUrlChange] ✓ URL 格式有效
AddWebsitePanel.vue:169 [processUrlChange] 解析的主机名: www.zhihu.com
AddWebsitePanel.vue:201 [processUrlChange] ✓ 域名完整，开始智能填充...
AddWebsitePanel.vue:228 [processUrlChange] ✓ name 需要填充（用户未编辑），已自动填充: zhihu
AddWebsitePanel.vue:236 [processUrlChange] 提取的根域名: zhihu.com
AddWebsitePanel.vue:264 [processUrlChange] - 未找到相同根域名的网站，已生成新 SVG
AddWebsitePanel.vue:281 [processUrlChange] ========== URL 变化处理完成 ==========
AddWebsitePanel.vue:62 [AddWebsitePanel] name 首字符变化:  -> z
AddWebsitePanel.vue:298 [regenerateSvgFromName] 开始根据 name 重新生成 SVG，name: zhihu
AddWebsitePanel.vue:328 [regenerateSvgFromName] ✓ SVG 重新生成成功
AddWebsitePanel.vue:286 [handleUrlInput] 检测到输入事件: https://www.zhihu.com/question/1924838186045145101/answer/2017025680806813774
AddWebsitePanel.vue:140 [processUrlChange] ========== URL 变化处理 ==========
AddWebsitePanel.vue:141 [processUrlChange] 输入 URL: https://www.zhihu.com/question/1924838186045145101/answer/2017025680806813774
AddWebsitePanel.vue:162 [processUrlChange] ✓ URL 格式有效
AddWebsitePanel.vue:169 [processUrlChange] 解析的主机名: www.zhihu.com
AddWebsitePanel.vue:201 [processUrlChange] ✓ 域名完整，开始智能填充...
AddWebsitePanel.vue:228 [processUrlChange] ✓ name 需要填充（用户未编辑），已自动填充: zhihu
AddWebsitePanel.vue:236 [processUrlChange] 提取的根域名: zhihu.com
AddWebsitePanel.vue:264 [processUrlChange] - 未找到相同根域名的网站，已生成新 SVG
AddWebsitePanel.vue:281 [processUrlChange] ========== URL 变化处理完成 ==========
AddWebsitePanel.vue:336 [handleUrlBlur] URL 输入框失去焦点
websiteMetadataService.js:22 [fetchMetadata] ========== 开始获取元数据 ==========
websiteMetadataService.js:23 [fetchMetadata] 数据来源：Node Functions
websiteMetadataService.js:24 [fetchMetadata] URL: https://www.zhihu.com/question/1924838186045145101/answer/2017025680806813774
websiteMetadataService.js:25 [fetchMetadata] API 地址: /
websiteMetadataService.js:26 [fetchMetadata] 环境： 开发环境
websiteMetadataService.js:31 [fetchMetadata] 使用本地模拟数据
websiteMetadataService.js:35 [fetchMetadata] 知乎URL，使用智能模拟数据
websiteMetadataService.js:65 [fetchMetadata] ✓ 成功获取元数据（智能模拟）
websiteMetadataService.js:66 [fetchMetadata] - title: 知乎问题 - 问题ID: 1924838186045145101
websiteMetadataService.js:67 [fetchMetadata] - description: 这是一个知乎问题页面，包含用户的提问和回答。
websiteMetadataService.js:68 [fetchMetadata] - iconData: 无
AddWebsitePanel.vue:372 [handleFetchMetadata] ✓ Meta 数据获取成功



nodejs 有没有类似python Selenium库这样的工具，能不能在 edgeone 的 node-functions 中使用