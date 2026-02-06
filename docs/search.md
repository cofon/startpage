1. 创建了搜索解析器 (searchParser.js)
这个文件负责解析和处理所有搜索命令，包括普通搜索和高级搜索。

2. 支持的搜索命令
普通搜索（不包含特殊命令）：

直接输入关键词，搜索网站名称、URL、描述和标签
多个关键词用空格分隔，表示 AND 关系（必须同时包含所有关键词）
例如：baidu 工作 会搜索同时包含"baidu"和"工作"的网站
特殊命令（以 -- 开头）：

--all：显示所有网站（包括已删除和隐藏的）
--active：显示所有活跃的网站
--active false：显示所有非活跃的网站
--inactive：显示所有非活跃的网站（同 --active false）
--marked：显示所有已标记的网站
--marked false：显示所有未标记的网站
--unmarked：显示所有未标记的网站（同 --marked false）
--hidden：显示所有隐藏的网站
--visible：显示所有可见的网站
--tag <tagname>：显示包含指定标签的网站
--visit：按访问次数排序显示
--recent：按最近访问时间排序显示
组合搜索：

可以组合多个命令，用空格分隔
例如：--marked --tag 工作：显示已标记且包含"工作"标签的网站
例如：--active baidu：显示活跃的且包含"baidu"的网站
例如：--marked --tag 工作 --visit：显示已标记且包含"工作"标签的网站，并按访问次数排序
3. 修改的文件
src/utils/searchParser.js（新建）：搜索解析器
src/stores/website.js：更新了 searchWebsites 函数，使用新的搜索解析器
src/stores/search.js：移除了特殊命令的处理（现在由 searchWebsites 函数统一处理）
4. 使用示例
搜索包含"baidu"的网站：baidu
搜索同时包含"baidu"和"工作"的网站：baidu 工作
显示所有已标记的网站：--marked
显示所有未标记的网站：--unmarked 或 --marked false
显示所有非活跃的网站：--inactive 或 --active false
显示已标记且包含"工作"标签的网站：--marked --tag 工作
显示所有网站：--all
显示网站并按访问次数排序：--visit
显示网站并按最近访问时间排序：--recent
这个方案设计灵活且易于扩展，如果将来需要添加新的搜索命令，只需要在 searchParser.js 中添加相应的解析逻辑即可。