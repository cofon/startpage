刷新页面，搜索框下方显示了一个红色边框，黄色背景的方块，内容是：
[CommandList NOT Visible]
[CommandList Debug] showCommandList: false
[CommandList Debug] currentCommands.length: 0
[CommandList Debug] shouldShowCommandList: false
[CommandList Debug] query:
[CommandList Debug] Condition 1 (showCommandList): false (should be true)
[CommandList Debug] Condition 2 (currentCommands.length > 0): false (should be true)
[CommandList Debug] Final Condition (showCommandList && currentCommands.length > 0): false (should be true)


搜索框输入 -， 控制台打印：
SearchModule.vue:35 SearchModule - handleInputFocus
search.js:196 SearchStore - query changed: -
search.js:197 SearchStore - isLocalSearch: true
search.js:123 SearchStore - shouldShowCommandList computed
search.js:130 SearchStore - shouldShowCommandList: trimmedQuery: -
search.js:139 SearchStore - shouldShowCommandList: lastPart: -
search.js:147 SearchStore - shouldShowCommandList: commandPrefix: 
search.js:153 SearchStore - shouldShowCommandList: isCommandComplete: 
search.js:87 SearchStore - currentCommands computed
search.js:94 SearchStore - currentCommands: trimmedQuery: -
search.js:103 SearchStore - currentCommands: lastPart: -
search.js:111 SearchStore - currentCommands: commandPrefix: 
search.js:117 SearchStore - currentCommands: matchedCommands: (17) ['active', 'marked', 'unmarked', 'all', 'name', 'title', 'desc', 'url', 'tag', 'theme', 'search', 'add', 'import', 'export', 'batch', 'help', 'layout']
search.js:165 SearchStore - shouldShowCommandList: hasMatches: true currentCommands.length: 17
search.js:198 SearchStore - shouldShowCommandList: true
search.js:208 SearchStore - showCommandList after update: true
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: false to: true
SearchModule.vue:25 SearchModule - currentCommands length: 17
SearchModule.vue:26 SearchModule - shouldShowCommandList: true
SearchModule.vue:27 SearchModule - query: undefined
SearchModule.vue:28 SearchModule - showCommandList watch END
SearchModule.vue:155 [CommandList] Before Mount - showCommandList: true , currentCommands.length: 17
SearchModule.vue:165 [CommandItem] Mounted: active
SearchModule.vue:165 [CommandItem] Mounted: marked
SearchModule.vue:165 [CommandItem] Mounted: unmarked
SearchModule.vue:165 [CommandItem] Mounted: all
SearchModule.vue:165 [CommandItem] Mounted: name
SearchModule.vue:165 [CommandItem] Mounted: title
SearchModule.vue:165 [CommandItem] Mounted: desc
SearchModule.vue:165 [CommandItem] Mounted: url
SearchModule.vue:165 [CommandItem] Mounted: tag
SearchModule.vue:165 [CommandItem] Mounted: theme
SearchModule.vue:165 [CommandItem] Mounted: search
SearchModule.vue:165 [CommandItem] Mounted: add
SearchModule.vue:165 [CommandItem] Mounted: import
SearchModule.vue:165 [CommandItem] Mounted: export
SearchModule.vue:165 [CommandItem] Mounted: batch
SearchModule.vue:165 [CommandItem] Mounted: help
SearchModule.vue:165 [CommandItem] Mounted: layout
SearchModule.vue:154 [CommandList] Mounted - showCommandList: true , currentCommands.length: 17
SearchModule.vue:58 SearchModule - handleInput START
SearchModule.vue:59 SearchModule - handleInput - query: undefined
SearchModule.vue:60 SearchModule - handleInput - isLocalSearchEngine: true
SearchModule.vue:61 SearchModule - handleInput - showCommandList before: true
SearchModule.vue:62 SearchModule - handleInput - shouldShowCommandList: true
SearchModule.vue:63 SearchModule - handleInput - currentCommands.length: 17
SearchModule.vue:67 SearchModule - handleInput - query is empty, setting showCommandList to false
SearchModule.vue:83 SearchModule - handleInput END
SearchModule.vue:23 SearchModule - showCommandList watch START
SearchModule.vue:24 SearchModule - showCommandList changed from: true to: false
SearchModule.vue:25 SearchModule - currentCommands length: 17
SearchModule.vue:26 SearchModule - shouldShowCommandList: true
SearchModule.vue:27 SearchModule - query: undefined
SearchModule.vue:28 SearchModule - showCommandList watch END
SearchModule.vue:156 [CommandList] Before Unmount
SearchModule.vue:45 SearchModule - handleInputBlur START
SearchModule.vue:46 SearchModule - handleInputBlur - showCommandList before: false
SearchModule.vue:47 SearchModule - handleInputBlur - query: undefined
SearchModule.vue:50 SearchModule - handleInputBlur - showCommandList after: false
SearchModule.vue:51 SearchModule - handleInputBlur END
