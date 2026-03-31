测试
输入 -tag ，没有输入空格，tags-list 已经显示了，应该是输入空格之后才显示tags-list，
输入 -tag tool , tool 是有效的tag，tags-list隐藏，
输入 -tag tool+空格，tags-list显示，list没有已输入的tool，OK，
输入 -tag tool f, tags-list中有以 f 开头的tag，但是 tags-list 隐藏了；

控制台打印：
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: 
search.js:66 SearchStore - currentTags: query is empty, returning all tags
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: 
search.js:130 SearchStore - shouldShowTagsList: query.value: 
search.js:134 SearchStore - shouldShowTagsList: query is empty, showing tags
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: 
search.js:248 SearchStore - currentCommands: query does not contain command
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: 
search.js:287 SearchStore - shouldShowCommandList: query does not contain command
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:209 [Content Script] 注册消息监听器
App.vue:421 [App] ========== 开始同步扩展数据 ==========
App.vue:216 [App] 收到扩展消息: PING {}
websiteMetadataService.js:157 [Content Script] 收到起始页消息: PING {type: 'PING', payload: {…}, requestId: '1774964305938-0.40573965123853617'}
websiteMetadataService.js:157 [Content Script] 收到 PING 消息，直接返回成功
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: 
search.js:66 SearchStore - currentTags: query is empty, returning all tags
App.vue:216 [App] 收到扩展消息: START_PAGE_REQUEST_UNSYNCED_METAS {}
websiteMetadataService.js:97 [Content Script] 收到起始页消息: START_PAGE_REQUEST_UNSYNCED_METAS {type: 'START_PAGE_REQUEST_UNSYNCED_METAS', payload: {…}, requestId: '1774964305942-0.04282003612508101'}
content.js:73 [Content Script] 发送消息到扩展失败: Could not establish connection. Receiving end does not exist.
content.js:82 [Content Script] Service Worker 可能未启动，等待 100ms 后重试 (1/5)...
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
search.js:364 SearchStore - query changed: -
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: -
search.js:310 SearchStore - shouldShowCommandList: commandPrefix: 
search.js:316 SearchStore - shouldShowCommandList: isCommandComplete: 
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -
search.js:255 SearchStore - currentCommands: lastPart: -
search.js:263 SearchStore - currentCommands: commandPrefix: 
search.js:269 SearchStore - currentCommands: matchedCommands: (17) ['active', 'marked', 'unmarked', 'all', 'name', 'title', 'desc', 'url', 'tag', 'theme', 'search', 'add', 'import', 'export', 'batch', 'help', 'layout']
search.js:326 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 17
search.js:366 SearchStore - shouldShowCommandList: true
search.js:376 SearchStore - showCommandList after update: true
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -
search.js:130 SearchStore - shouldShowTagsList: query.value: -
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:146 SearchStore - shouldShowTagsList: no -tag command found
search.js:377 SearchStore - shouldShowTagsList: false
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: false to: true
SearchModule.vue:25 SearchModule - currentCommands length: 17
SearchModule.vue:26 SearchModule - shouldShowCommandList: true
SearchModule.vue:28 SearchModule - query: -
SearchModule.vue:29 SearchModule - showCommandList watch END
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:116 SearchStore - currentTags: no -tag command found, returning empty array
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
search.js:364 SearchStore - query changed: -t
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -t
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: -t
search.js:310 SearchStore - shouldShowCommandList: commandPrefix: t
search.js:316 SearchStore - shouldShowCommandList: isCommandComplete: false
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -t
search.js:255 SearchStore - currentCommands: lastPart: -t
search.js:263 SearchStore - currentCommands: commandPrefix: t
search.js:269 SearchStore - currentCommands: matchedCommands: (3) ['title', 'tag', 'theme']
search.js:326 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 3
search.js:366 SearchStore - shouldShowCommandList: true
search.js:376 SearchStore - showCommandList after update: true
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -t
search.js:130 SearchStore - shouldShowTagsList: query.value: -t
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:146 SearchStore - shouldShowTagsList: no -tag command found
search.js:377 SearchStore - shouldShowTagsList: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -t
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:116 SearchStore - currentTags: no -tag command found, returning empty array
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
search.js:364 SearchStore - query changed: -ta
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -ta
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: -ta
search.js:310 SearchStore - shouldShowCommandList: commandPrefix: ta
search.js:316 SearchStore - shouldShowCommandList: isCommandComplete: false
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -ta
search.js:255 SearchStore - currentCommands: lastPart: -ta
search.js:263 SearchStore - currentCommands: commandPrefix: ta
search.js:269 SearchStore - currentCommands: matchedCommands: ['tag']
search.js:326 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 1
search.js:366 SearchStore - shouldShowCommandList: true
search.js:376 SearchStore - showCommandList after update: true
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -ta
search.js:130 SearchStore - shouldShowTagsList: query.value: -ta
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:146 SearchStore - shouldShowTagsList: no -tag command found
search.js:377 SearchStore - shouldShowTagsList: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -ta
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:116 SearchStore - currentTags: no -tag command found, returning empty array
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
search.js:364 SearchStore - query changed: -tag
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: -tag
search.js:310 SearchStore - shouldShowCommandList: commandPrefix: tag
search.js:316 SearchStore - shouldShowCommandList: isCommandComplete: true
search.js:320 SearchStore - shouldShowCommandList: command is complete, closing command list
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag', undefined, undefined, index: 0, input: '-tag', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: 
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:160 SearchStore - shouldShowTagsList: no tag input, showing all tags
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: true to: false
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag
search.js:255 SearchStore - currentCommands: lastPart: -tag
search.js:263 SearchStore - currentCommands: commandPrefix: tag
search.js:269 SearchStore - currentCommands: matchedCommands: ['tag']
SearchModule.vue:25 SearchModule - currentCommands length: 1
SearchModule.vue:26 SearchModule - shouldShowCommandList: false
SearchModule.vue:28 SearchModule - query: -tag
SearchModule.vue:29 SearchModule - showCommandList watch END
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag', undefined, undefined, index: 0, input: '-tag', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: 
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:112 SearchStore - currentTags: no tag input, returning all tags
SearchModule.vue:147 [TagsList] Before Mount - showTagsList: true , currentTags.length: 17
SearchModule.vue:177 [CommandList] Before Unmount
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
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 1
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 17
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 17
search.js:364 SearchStore - query changed: -tag 
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: true
search.js:295 SearchStore - shouldShowCommandList: query ends with space, closing command list
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag 
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag', undefined, undefined, index: 0, input: '-tag', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: 
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: true
search.js:160 SearchStore - shouldShowTagsList: no tag input, showing all tags
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag', undefined, undefined, index: 0, input: '-tag', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: 
search.js:82 SearchStore - currentTags: endsWithSpace: true
search.js:112 SearchStore - currentTags: no tag input, returning all tags
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag
search.js:255 SearchStore - currentCommands: lastPart: -tag
search.js:263 SearchStore - currentCommands: commandPrefix: tag
search.js:269 SearchStore - currentCommands: matchedCommands: ['tag']
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag 
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 1
SearchModule.vue:74 SearchModule - handleInput - shouldShowTagsList: true
SearchModule.vue:75 SearchModule - handleInput - showTagsList: true
SearchModule.vue:76 SearchModule - handleInput - currentTags.length: 17
SearchModule.vue:90 SearchModule - handleInput END
SearchModule.vue:79 SearchModule - handleInput - nextTick callback
SearchModule.vue:80 SearchModule - handleInput - shouldShowCommandList in nextTick: false
SearchModule.vue:81 SearchModule - handleInput - shouldShowTagsList in nextTick: true
SearchModule.vue:82 SearchModule - handleInput - showTagsList before set: true
SearchModule.vue:84 SearchModule - handleInput - showCommandList after nextTick: false
SearchModule.vue:85 SearchModule - handleInput - showTagsList after set: true
SearchModule.vue:86 SearchModule - handleInput - currentTags.length in nextTick: 17
search.js:364 SearchStore - query changed: -tag t
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag t
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: t
search.js:305 SearchStore - shouldShowCommandList: last part does not start with -
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag t
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag t
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag t', ' t', 't', index: 0, input: '-tag t', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: t
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag t
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag t', ' t', 't', index: 0, input: '-tag t', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: t
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:107 SearchStore - currentTags: filteredTags: ['tool']
search.js:186 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:198 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:206 SearchStore - shouldShowTagsList: showing tags
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag t
search.js:255 SearchStore - currentCommands: lastPart: t
search.js:258 SearchStore - currentCommands: last part does not start with -
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
search.js:364 SearchStore - query changed: -tag to
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag to
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: to
search.js:305 SearchStore - shouldShowCommandList: last part does not start with -
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag to
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag to
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag to', ' to', 'to', index: 0, input: '-tag to', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: to
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag to
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag to', ' to', 'to', index: 0, input: '-tag to', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: to
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:107 SearchStore - currentTags: filteredTags: ['tool']
search.js:186 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:198 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:206 SearchStore - shouldShowTagsList: showing tags
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag to
search.js:255 SearchStore - currentCommands: lastPart: to
search.js:258 SearchStore - currentCommands: last part does not start with -
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
search.js:364 SearchStore - query changed: -tag too
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag too
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: too
search.js:305 SearchStore - shouldShowCommandList: last part does not start with -
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag too
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag too
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag too', ' too', 'too', index: 0, input: '-tag too', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: too
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag too
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag too', ' too', 'too', index: 0, input: '-tag too', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: too
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:107 SearchStore - currentTags: filteredTags: ['tool']
search.js:186 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:198 SearchStore - shouldShowTagsList: isTagComplete: false
search.js:206 SearchStore - shouldShowTagsList: showing tags
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag too
search.js:255 SearchStore - currentCommands: lastPart: too
search.js:258 SearchStore - currentCommands: last part does not start with -
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
search.js:364 SearchStore - query changed: -tag tool
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: tool
search.js:305 SearchStore - shouldShowCommandList: last part does not start with -
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag tool
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag tool', ' tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: tool
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag tool', ' tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: tool
search.js:82 SearchStore - currentTags: endsWithSpace: false
search.js:107 SearchStore - currentTags: filteredTags: ['tool']
search.js:186 SearchStore - shouldShowTagsList: hasMatchingTags: true currentTags.length: 1
search.js:198 SearchStore - shouldShowTagsList: isTagComplete: true
search.js:201 SearchStore - shouldShowTagsList: tag is complete, not showing tags
search.js:377 SearchStore - shouldShowTagsList: false
search.js:385 SearchStore - showTagsList after update: false
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag tool
search.js:255 SearchStore - currentCommands: lastPart: tool
search.js:258 SearchStore - currentCommands: last part does not start with -
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
search.js:364 SearchStore - query changed: -tag tool 
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: true
search.js:295 SearchStore - shouldShowCommandList: query ends with space, closing command list
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag tool 
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: (3) ['-tag tool', ' tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:152 SearchStore - shouldShowTagsList: currentTagInput: tool
search.js:156 SearchStore - shouldShowTagsList: endsWithSpace: true
search.js:171 SearchStore - shouldShowTagsList: tag is complete, showing tags for next tag
search.js:377 SearchStore - shouldShowTagsList: true
search.js:385 SearchStore - showTagsList after update: true
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool
search.js:73 SearchStore - currentTags: tagCommandPattern match: (3) ['-tag tool', ' tool', 'tool', index: 0, input: '-tag tool', groups: undefined]
search.js:78 SearchStore - currentTags: currentTagInput: tool
search.js:82 SearchStore - currentTags: endsWithSpace: true
search.js:90 SearchStore - currentTags: isTagComplete: true
search.js:97 SearchStore - currentTags: filteredTags (excluding completed tag): (16) ['搜', 'jing', '文娱', 'code', 'flutter', '翻译', '学习', '学生', 'js', 'go', '易', 'python', '日常', 'ai', 'new', '404']
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag tool
search.js:255 SearchStore - currentCommands: lastPart: tool
search.js:258 SearchStore - currentCommands: last part does not start with -
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
search.js:364 SearchStore - query changed: -tag tool f
search.js:365 SearchStore - isLocalSearch: true
search.js:275 SearchStore - shouldShowCommandList computed
search.js:282 SearchStore - shouldShowCommandList: trimmedQuery: -tag tool f
search.js:293 SearchStore - shouldShowCommandList: endsWithSpace: false
search.js:302 SearchStore - shouldShowCommandList: lastPart: f
search.js:305 SearchStore - shouldShowCommandList: last part does not start with -
search.js:366 SearchStore - shouldShowCommandList: false
search.js:376 SearchStore - showCommandList after update: false
search.js:122 SearchStore - shouldShowTagsList computed
search.js:129 SearchStore - shouldShowTagsList: trimmedQuery: -tag tool f
search.js:130 SearchStore - shouldShowTagsList: query.value: -tag tool f
search.js:142 SearchStore - shouldShowTagsList: tagCommandPattern match: null
search.js:146 SearchStore - shouldShowTagsList: no -tag command found
search.js:377 SearchStore - shouldShowTagsList: false
search.js:385 SearchStore - showTagsList after update: false
search.js:55 SearchStore - currentTags computed
search.js:62 SearchStore - currentTags: trimmedQuery: -tag tool f
search.js:73 SearchStore - currentTags: tagCommandPattern match: null
search.js:116 SearchStore - currentTags: no -tag command found, returning empty array
search.js:236 SearchStore - currentCommands computed
search.js:243 SearchStore - currentCommands: trimmedQuery: -tag tool f
search.js:255 SearchStore - currentCommands: lastPart: f
search.js:258 SearchStore - currentCommands: last part does not start with -
SearchModule.vue:148 [TagsList] Before Unmount
SearchModule.vue:65 SearchModule - handleInput START
SearchModule.vue:67 SearchModule - handleInput - query: -tag tool f
SearchModule.vue:68 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:69 SearchModule - handleInput - showCommandList before: false
SearchModule.vue:70 SearchModule - handleInput - shouldShowCommandList: false
SearchModule.vue:71 SearchModule - handleInput - currentCommands.length: 0
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
SearchModule.vue:51 SearchModule - handleInputBlur START
SearchModule.vue:52 SearchModule - handleInputBlur - showCommandList before: false
SearchModule.vue:54 SearchModule - handleInputBlur - query: -tag tool f
SearchModule.vue:57 SearchModule - handleInputBlur - showCommandList after: false
SearchModule.vue:58 SearchModule - handleInputBlur END
