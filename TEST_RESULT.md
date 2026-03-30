知乎 -marked， 这两个是 and 关系，应该显示同时满足这两个条件的网站，但是显示的是 关键字知乎 的搜索结果，-marked好像没有生效；
我测试了：-marked 知乎，搜索结果只有一个，
而命令：知乎 -marked 的搜索结果跟关键字 知乎 的搜索结果是一样的，证明，-marked 根本就没有生效；

我进行了更多的测试：
关键字 + 状态搜索，状态搜索不生效；
知乎 -marked；
知乎 -unmarked；
知乎 -active；
知乎 -unactive；
知乎 -hidden；
知乎 -unhidden；
以上这些都无效；
就是说，关键字 + 状态搜索命令，都无效；

关键字 + 搜索命令 是有效的，没有问题就，不用修改；
知乎 -title keyword；
知乎 -name keyword；
知乎 -url keyword；
知乎 -desc keyword；
知乎 -tag tag；
这几个搜索命令都有效；

这是命令 ： 知乎 -marked 的控制台打印：
searchService.js:101 普通搜索: 知乎 关键字: ['知乎']
searchService.js:101 普通搜索: 知乎 关键字: ['知乎']
searchService.js:85 包含命令的普通搜索: 知乎 -
searchService.js:120 解析命令: 知乎 -
searchService.js:124 OR 组: ['知乎 -']
searchService.js:128 第一部分: 知乎
searchService.js:172 AND 子组: ['知乎 -']
searchService.js:177 AND 子组部分: (2) ['知乎', '-']
searchService.js:189 处理部分: 知乎 索引: 0
searchService.js:236 普通关键字: 知乎
searchService.js:241 添加关键字: 知乎
searchService.js:189 处理部分: - 索引: 1
searchService.js:230 不完整命令: -
searchService.js:249 AND 子组解析结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:275 OR 组合并结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:279 过滤器组: [{…}]
searchService.js:280 是否有不完整命令: true
searchService.js:281 是否有有效命令: true
searchService.js:320 有不完整命令，返回结果
searchService.js:323 是否有普通关键字: true
searchService.js:87 包含命令的普通搜索解析结果: {type: 'command', keywords: Array(0), filters: {…}, pageCommand: null, hasIncompleteCommand: true}
searchService.js:85 包含命令的普通搜索: 知乎 -mark
searchService.js:120 解析命令: 知乎 -mark
searchService.js:124 OR 组: ['知乎 -mark']
searchService.js:128 第一部分: 知乎
searchService.js:172 AND 子组: ['知乎 -mark']
searchService.js:177 AND 子组部分: (2) ['知乎', '-mark']
searchService.js:189 处理部分: 知乎 索引: 0
searchService.js:236 普通关键字: 知乎
searchService.js:241 添加关键字: 知乎
searchService.js:189 处理部分: -mark 索引: 1
searchService.js:230 不完整命令: -mark
searchService.js:249 AND 子组解析结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:275 OR 组合并结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:279 过滤器组: [{…}]
searchService.js:280 是否有不完整命令: true
searchService.js:281 是否有有效命令: true
searchService.js:320 有不完整命令，返回结果
searchService.js:323 是否有普通关键字: true
searchService.js:87 包含命令的普通搜索解析结果: {type: 'command', keywords: Array(0), filters: {…}, pageCommand: null, hasIncompleteCommand: true}
searchService.js:85 包含命令的普通搜索: 知乎 -marke
searchService.js:120 解析命令: 知乎 -marke
searchService.js:124 OR 组: ['知乎 -marke']
searchService.js:128 第一部分: 知乎
searchService.js:172 AND 子组: ['知乎 -marke']
searchService.js:177 AND 子组部分: (2) ['知乎', '-marke']
searchService.js:189 处理部分: 知乎 索引: 0
searchService.js:236 普通关键字: 知乎
searchService.js:241 添加关键字: 知乎
searchService.js:189 处理部分: -marke 索引: 1
searchService.js:230 不完整命令: -marke
searchService.js:249 AND 子组解析结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:275 OR 组合并结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:279 过滤器组: [{…}]
searchService.js:280 是否有不完整命令: true
searchService.js:281 是否有有效命令: true
searchService.js:320 有不完整命令，返回结果
searchService.js:323 是否有普通关键字: true
searchService.js:87 包含命令的普通搜索解析结果: {type: 'command', keywords: Array(0), filters: {…}, pageCommand: null, hasIncompleteCommand: true}
searchService.js:85 包含命令的普通搜索: 知乎 -marked
searchService.js:120 解析命令: 知乎 -marked
searchService.js:124 OR 组: ['知乎 -marked']
searchService.js:128 第一部分: 知乎
searchService.js:172 AND 子组: ['知乎 -marked']
searchService.js:177 AND 子组部分: (2) ['知乎', '-marked']
searchService.js:189 处理部分: 知乎 索引: 0
searchService.js:236 普通关键字: 知乎
searchService.js:241 添加关键字: 知乎
searchService.js:189 处理部分: -marked 索引: 1
searchService.js:230 不完整命令: -marked
searchService.js:249 AND 子组解析结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:275 OR 组合并结果: {isActive: true, isMarked: undefined, isHidden: false, searchFields: {…}, keywords: Array(1)}
searchService.js:279 过滤器组: [{…}]
searchService.js:280 是否有不完整命令: true
searchService.js:281 是否有有效命令: true
searchService.js:320 有不完整命令，返回结果
searchService.js:323 是否有普通关键字: true
searchService.js:87 包含命令的普通搜索解析结果: {type: 'command', keywords: Array(0), filters: {…}, pageCommand: null, hasIncompleteCommand: true}
