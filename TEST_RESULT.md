测试

输入 -tag，没有显示 tags-list，OK
输入 -tag+空格，没有显示 tags-list，不对，应该显示tags-list了
输入 -tags t，显示以 t 开头的tags-list，OK
输入 -tags tool，tags-list隐藏，OK
输入 -tags tool+空格，显示tags-list，数组中没有已经输入的tag，OK
输入 -tags tool f, 显示以 f 开头的tags-list，OK
输入 -tags tool flutter, tags-list隐藏，OK

现在的问题只有一个，就是 -tag+空格 没有显示 tags-list

以下是控制台打印信息：
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: 
search.js:66 SearchStore - currentTags: query is empty, returning all tags
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: 
search.js:139 SearchStore - shouldShowTagsList: query.value: 
search.js:143 SearchStore - shouldShowTagsList: query is empty, showing tags
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: 
search.js:267 SearchStore - currentCommands: query does not contain command
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: 
search.js:306 SearchStore - shouldShowCommandList: query does not contain command
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:209 [Content Script] 注册消息监听器
App.vue:421 [App] ========== 开始同步扩展数据 ==========
App.vue:216 [App] 收到扩展消息: PING {}
websiteMetadataService.js:157 [Content Script] 收到起始页消息: PING {type: 'PING', payload: {…}, requestId: '1774965211064-0.07029386652018343'}
websiteMetadataService.js:157 [Content Script] 收到 PING 消息，直接返回成功
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: 
search.js:66 SearchStore - currentTags: query is empty, returning all tags
App.vue:216 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:97 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774965211070-0.36064355771406176'}
content.js:103 [Content Script] 扩展响应: {success: true, data: Array(0)}
App.vue:351 [App] ✓ 同步扩展数据成功！获取到数据: 0 条
SearchModule.vue:36 SearchModule - handleInputFocus
SearchModule.vue:17 SearchModule - isLocalSearchEngine: true
SearchModule.vue:147 [TagsList] Before Mount - showTagsList: true , currentTags.length: 17
SearchModule.vue:158 [TagItem] Mounted: 搜
SearchModule.vue:158 [TagItem] Mounted: jing
SearchModule.vue:158 [TagItem] Mounted: 文娱
SearchModule.vue:158 [TagItem] Mounted: tool
SearchModule.vue:158 [TagItem] Mounted: code
SearchModule.vue:158 [TagItem] Mounted: flutter
SearchModule.vue:158 [TagItem] Mounted: 翻译
SearchModule.vue:158 [TagItem] Mounted: 学习
SearchModule.vue:158 [TagItem] Mounted: 学生
SearchModule.vue:158 [TagItem] Mounted: js
SearchModule.vue:158 [TagItem] Mounted: go
SearchModule.vue:158 [TagItem] Mounted: 易
SearchModule.vue:158 [TagItem] Mounted: python
SearchModule.vue:158 [TagItem] Mounted: 日常
SearchModule.vue:158 [TagItem] Mounted: ai
SearchModule.vue:158 [TagItem] Mounted: new
SearchModule.vue:158 [TagItem] Mounted: 404
SearchModule.vue:146 [TagsList] Mounted - showTagsList: true , currentTags.length: 17
search.js:383 SearchStore - query changed: -
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: -
search.js:329 SearchStore - shouldShowCommandList: commandPrefix: 
search.js:335 SearchStore - shouldShowCommandList: isCommandComplete: 
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -
search.js:274 SearchStore - currentCommands: lastPart: -
search.js:282 SearchStore - currentCommands: commandPrefix: 
search.js:288 SearchStore - currentCommands: matchedCommands: (17) ['active', 'marked', 'unmarked', 'all', 'name', 'title', 'desc', 'url', 'tag', 'theme', 'search', 'add', 'import', 'export', 'batch', 'help', 'layout']
search.js:345 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 17
search.js:385 SearchStore - shouldShowCommandList: true
search.js:395 SearchStore - showCommandList after update: true
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -
search.js:139 SearchStore - shouldShowTagsList: query.value: -
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:155 SearchStore - shouldShowTagsList: no -tag command found
search.js:396 SearchStore - shouldShowTagsList: false
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: false to: true
SearchModule.vue:25 SearchModule - currentCommands length: 17
SearchModule.vue:26 SearchModule - shouldShowCommandList: true
SearchModule.vue:28 SearchModule - query: -
SearchModule.vue:29 SearchModule - showCommandList watch END
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:125 SearchStore - currentTags: no -tag command found, returning empty array
SearchModule.vue:148 [TagsList] Before Unmount
SearchModule.vue:176 [CommandList] Before Mount - showCommandList: true , currentCommands.length: 17
SearchModule.vue:186 [CommandItem] Mounted: active
SearchModule.vue:186 [CommandItem] Mounted: marked
SearchModule.vue:186 [CommandItem] Mounted: unmarked
SearchModule.vue:186 [CommandItem] Mounted: all
SearchModule.vue:186 [CommandItem] Mounted: name
SearchModule.vue:186 [CommandItem] Mounted: title
SearchModule.vue:186 [CommandItem] Mounted: desc
SearchModule.vue:186 [CommandItem] Mounted: url
SearchModule.vue:186 [CommandItem] Mounted: tag
SearchModule.vue:186 [CommandItem] Mounted: theme
SearchModule.vue:186 [CommandItem] Mounted: search
SearchModule.vue:186 [CommandItem] Mounted: add
SearchModule.vue:186 [CommandItem] Mounted: import
SearchModule.vue:186 [CommandItem] Mounted: export
SearchModule.vue:186 [CommandItem] Mounted: batch
SearchModule.vue:186 [CommandItem] Mounted: help
SearchModule.vue:186 [CommandItem] Mounted: layout
SearchModule.vue:175 [CommandList] Mounted - showCommandList: true , currentCommands.length: 17
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: true
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: true
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 17
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 0
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: true
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: true
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 0
search.js:383 SearchStore - query changed: -t
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -t
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: -t
search.js:329 SearchStore - shouldShowCommandList: commandPrefix: t
search.js:335 SearchStore - shouldShowCommandList: isCommandComplete: false
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -t
search.js:274 SearchStore - currentCommands: lastPart: -t
search.js:282 SearchStore - currentCommands: commandPrefix: t
search.js:288 SearchStore - currentCommands: matchedCommands: (3) ['title', 'tag', 'theme']
search.js:345 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 3
search.js:385 SearchStore - shouldShowCommandList: true
search.js:395 SearchStore - showCommandList after update: true
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -t
search.js:139 SearchStore - shouldShowTagsList: query.value: -t
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:155 SearchStore - shouldShowTagsList: no -tag command found
search.js:396 SearchStore - shouldShowTagsList: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -t
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:125 SearchStore - currentTags: no -tag command found, returning empty array
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -t
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: true
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: true
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 3
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 0
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: true
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: true
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 0
search.js:383 SearchStore - query changed: -ta
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -ta
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: -ta
search.js:329 SearchStore - shouldShowCommandList: commandPrefix: ta
search.js:335 SearchStore - shouldShowCommandList: isCommandComplete: false
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -ta
search.js:274 SearchStore - currentCommands: lastPart: -ta
search.js:282 SearchStore - currentCommands: commandPrefix: ta
search.js:288 SearchStore - currentCommands: matchedCommands: ['tag']
search.js:345 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 1
search.js:385 SearchStore - shouldShowCommandList: true
search.js:395 SearchStore - showCommandList after update: true
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -ta
search.js:139 SearchStore - shouldShowTagsList: query.value: -ta
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:155 SearchStore - shouldShowTagsList: no -tag command found
search.js:396 SearchStore - shouldShowTagsList: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -ta
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:125 SearchStore - currentTags: no -tag command found, returning empty array
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -ta
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: true
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: true
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 1
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 0
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: true
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: true
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 0
search.js:383 SearchStore - query changed: -tag
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: -tag
search.js:329 SearchStore - shouldShowCommandList: commandPrefix: tag
search.js:335 SearchStore - shouldShowCommandList: isCommandComplete: true
search.js:339 SearchStore - shouldShowCommandList: command is complete, closing command list
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:155 SearchStore - shouldShowTagsList: no -tag command found
search.js:396 SearchStore - shouldShowTagsList: false
search.js:404 SearchStore - showTagsList after update: false
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: true to: false
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag
search.js:274 SearchStore - currentCommands: lastPart: -tag
search.js:282 SearchStore - currentCommands: commandPrefix: tag
search.js:288 SearchStore - currentCommands: matchedCommands: ['tag']
SearchModule.vue:25 SearchModule - currentCommands length: 1
SearchModule.vue:26 SearchModule - shouldShowCommandList: false
SearchModule.vue:28 SearchModule - query: -tag
SearchModule.vue:29 SearchModule - showCommandList watch END
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:125 SearchStore - currentTags: no -tag command found, returning empty array
SearchModule.vue:177 [CommandList] Before Unmount
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 1
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 0
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 0
search.js:383 SearchStore - query changed: -tag 
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: true
search.js:314 SearchStore - shouldShowCommandList: query ends with space, closing command list
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag 
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:155 SearchStore - shouldShowTagsList: no -tag command found
search.js:396 SearchStore - shouldShowTagsList: false
search.js:404 SearchStore - showTagsList after update: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:125 SearchStore - currentTags: no -tag command found, returning empty array
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag
search.js:274 SearchStore - currentCommands: lastPart: -tag
search.js:282 SearchStore - currentCommands: commandPrefix: tag
search.js:288 SearchStore - currentCommands: matchedCommands: ['tag']
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag 
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 1
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 0
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 0
search.js:383 SearchStore - query changed: -tag t
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag t
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: t
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag t
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag t
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag t', 't', index: 0, input: '-tag t', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: t
search.js:165 SearchStore - shouldShowTagsList: tags: ['t']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: t
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag t
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag t', 't', index: 0, input: '-tag t', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: t
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: ['t']
search.js:96 SearchStore - currentTags: lastTag: t
search.js:121 SearchStore - currentTags: filteredTags: ['tool']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag t
search.js:274 SearchStore - currentCommands: lastPart: t
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:147 [TagsList] Before Mount - showTagsList: true , currentTags.length: 1
SearchModule.vue:158 [TagItem] Mounted: tool
SearchModule.vue:146 [TagsList] Mounted - showTagsList: true , currentTags.length: 1
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag t
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag to
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag to
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: to
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag to
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag to
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag to', 'to', index: 0, input: '-tag to', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: to
search.js:165 SearchStore - shouldShowTagsList: tags: ['to']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: to
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag to
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag to', 'to', index: 0, input: '-tag to', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: to
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: ['to']
search.js:96 SearchStore - currentTags: lastTag: to
search.js:121 SearchStore - currentTags: filteredTags: ['tool']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag to
search.js:274 SearchStore - currentCommands: lastPart: to
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag to
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag too
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag too
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: too
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag too
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag too
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag too', 'too', index: 0, input: '-tag too', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: too
search.js:165 SearchStore - shouldShowTagsList: tags: ['too']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: too
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag too
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag too', 'too', index: 0, input: '-tag too', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: too
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: ['too']
search.js:96 SearchStore - currentTags: lastTag: too
search.js:121 SearchStore - currentTags: filteredTags: ['tool']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag too
search.js:274 SearchStore - currentCommands: lastPart: too
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag too
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: tool
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool
search.js:165 SearchStore - shouldShowTagsList: tags: ['tool']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: tool
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: ['tool']
search.js:96 SearchStore - currentTags: lastTag: tool
search.js:121 SearchStore - currentTags: filteredTags: ['tool']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: true
search.js:220 SearchStore - shouldShowTagsList: tag is complete, not showing tags
search.js:396 SearchStore - shouldShowTagsList: false
search.js:404 SearchStore - showTagsList after update: false
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool
search.js:274 SearchStore - currentCommands: lastPart: tool
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:148 [TagsList] Before Unmount
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool 
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: true
search.js:314 SearchStore - shouldShowCommandList: query ends with space, closing command list
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool 
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool
search.js:165 SearchStore - shouldShowTagsList: tags: ['tool']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: tool
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: true
search.js:187 SearchStore - shouldShowTagsList: isTagComplete: true
search.js:190 SearchStore - shouldShowTagsList: tag is complete, showing tags for next tag
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool
search.js:82 SearchStore - currentTags: endsWithSpace: true
search.js:92 SearchStore - currentTags: tags: ['tool']
search.js:96 SearchStore - currentTags: lastTag: tool
search.js:104 SearchStore - currentTags: isTagComplete: true
search.js:112 SearchStore - currentTags: filteredTags (excluding completed tags): (16) ['搜', 'jing', '文娱', 'code', 'flutter', '翻译', '学习', '学生', 'js', 'go', '易', 'python', '日常', 'ai', 'new', '404']
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool
search.js:274 SearchStore - currentCommands: lastPart: tool
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:147 [TagsList] Before Mount - showTagsList: true , currentTags.length: 16
SearchModule.vue:158 [TagItem] Mounted: 搜
SearchModule.vue:158 [TagItem] Mounted: jing
SearchModule.vue:158 [TagItem] Mounted: 文娱
SearchModule.vue:158 [TagItem] Mounted: code
SearchModule.vue:158 [TagItem] Mounted: flutter
SearchModule.vue:158 [TagItem] Mounted: 翻译
SearchModule.vue:158 [TagItem] Mounted: 学习
SearchModule.vue:158 [TagItem] Mounted: 学生
SearchModule.vue:158 [TagItem] Mounted: js
SearchModule.vue:158 [TagItem] Mounted: go
SearchModule.vue:158 [TagItem] Mounted: 易
SearchModule.vue:158 [TagItem] Mounted: python
SearchModule.vue:158 [TagItem] Mounted: 日常
SearchModule.vue:158 [TagItem] Mounted: ai
SearchModule.vue:158 [TagItem] Mounted: new
SearchModule.vue:158 [TagItem] Mounted: 404
SearchModule.vue:146 [TagsList] Mounted - showTagsList: true , currentTags.length: 16
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool 
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 16
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 16
search.js:383 SearchStore - query changed: -tag tool f
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool f
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: f
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool f
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool f
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool f', 'tool f', index: 0, input: '-tag tool f', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool f
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'f']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: f
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool f
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool f', 'tool f', index: 0, input: '-tag tool f', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool f
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'f']
search.js:96 SearchStore - currentTags: lastTag: f
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool f
search.js:274 SearchStore - currentCommands: lastPart: f
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool f
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool fl
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool fl
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: fl
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool fl
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool fl
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool fl', 'tool fl', index: 0, input: '-tag tool fl', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool fl
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'fl']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: fl
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool fl
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool fl', 'tool fl', index: 0, input: '-tag tool fl', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool fl
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'fl']
search.js:96 SearchStore - currentTags: lastTag: fl
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool fl
search.js:274 SearchStore - currentCommands: lastPart: fl
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool fl
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool flu
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool flu
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: flu
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool flu
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool flu
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool flu', 'tool flu', index: 0, input: '-tag tool flu', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool flu
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'flu']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: flu
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool flu
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool flu', 'tool flu', index: 0, input: '-tag tool flu', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool flu
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'flu']
search.js:96 SearchStore - currentTags: lastTag: flu
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool flu
search.js:274 SearchStore - currentCommands: lastPart: flu
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool flu
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool flut
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool flut
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: flut
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool flut
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool flut
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool flut', 'tool flut', index: 0, input: '-tag tool flut', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool flut
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'flut']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: flut
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool flut
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool flut', 'tool flut', index: 0, input: '-tag tool flut', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool flut
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'flut']
search.js:96 SearchStore - currentTags: lastTag: flut
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool flut
search.js:274 SearchStore - currentCommands: lastPart: flut
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool flut
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool flutt
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool flutt
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: flutt
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool flutt
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool flutt
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool flutt', 'tool flutt', index: 0, input: '-tag tool flutt', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool flutt
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'flutt']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: flutt
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool flutt
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool flutt', 'tool flutt', index: 0, input: '-tag tool flutt', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool flutt
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'flutt']
search.js:96 SearchStore - currentTags: lastTag: flutt
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool flutt
search.js:274 SearchStore - currentCommands: lastPart: flutt
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool flutt
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool flutte
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool flutte
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: flutte
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool flutte
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool flutte
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool flutte', 'tool flutte', index: 0, input: '-tag tool flutte', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool flutte
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'flutte']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: flutte
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool flutte
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool flutte', 'tool flutte', index: 0, input: '-tag tool flutte', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool flutte
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'flutte']
search.js:96 SearchStore - currentTags: lastTag: flutte
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:225 SearchStore - shouldShowTagsList: showing tags
search.js:396 SearchStore - shouldShowTagsList: true
search.js:404 SearchStore - showTagsList after update: true
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool flutte
search.js:274 SearchStore - currentCommands: lastPart: flutte
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool flutte
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
search.js:383 SearchStore - query changed: -tag tool flutter
search.js:384 SearchStore - isLocalSearch: true
search.js:294 SearchStore - shouldShowCommandList computed
search.js:301 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool flutter
search.js:312 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:321 SearchStore - shouldShowCommandList: lastPart: flutter
search.js:324 SearchStore - shouldShowCommandList: last part does not start with -
search.js:385 SearchStore - shouldShowCommandList: false
search.js:395 SearchStore - showCommandList after update: false
search.js:131 SearchStore - shouldShowTagsList computed
search.js:138 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool flutter
search.js:139 SearchStore - shouldShowTagsList: query.value: -tag tool flutter
search.js:151 SearchStore - shouldShowTagsList: tagCommandPattern match: (2) ['-tag tool flutter', 'tool flutter', index: 0, input: '-tag tool flutter', groups: undefined]
search.js:161 SearchStore - shouldShowTagsList: tagsInput: tool flutter
search.js:165 SearchStore - shouldShowTagsList: tags: (2) ['tool', 'flutter']
search.js:169 SearchStore - shouldShowTagsList: currentTagInput: flutter
search.js:173 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool flutter
search.js:73 SearchStore - currentTags: tagCommandPattern match: (2) ['-tag tool flutter', 'tool flutter', index: 0, input: '-tag tool flutter', groups: undefined]
search.js:78 SearchStore - currentTags: tagsInput: tool flutter
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:92 SearchStore - currentTags: tags: (2) ['tool', 'flutter']
search.js:96 SearchStore - currentTags: lastTag: flutter
search.js:121 SearchStore - currentTags: filteredTags: ['flutter']
search.js:205 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:217 SearchStore - shouldShowTagsList: isTagComplete: true
search.js:220 SearchStore - shouldShowTagsList: tag is complete, not showing tags
search.js:396 SearchStore - shouldShowTagsList: false
search.js:404 SearchStore - showTagsList after update: false
search.js:255 SearchStore - currentCommands computed
search.js:262 SearchStore - currentCommands: trimmedQuery: -tag tool flutter
search.js:274 SearchStore - currentCommands: lastPart: flutter
search.js:277 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:148 [TagsList] Before Unmount
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool flutter
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: false
SearchModule.vue:75 SearchModule - handleInput - showTagsList: false
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 1
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: false
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: false
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: false
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 1
SearchModule.vue:51 SearchModule - handleInputBlur START
SearchModule.vue:52 SearchModule - handleInputBlur - showCommandList before: false
SearchModule.vue:54 SearchModule - handleInputBlur - query: -tag tool flutter
SearchModule.vue:57 SearchModule - handleInputBlur - showCommandList after: false
SearchModule.vue:58 SearchModule - handleInputBlur END
