项目名：startpage
描述：浏览器起始页项目，用来替代浏览器默认的收藏夹，用于网址收藏展示检索
技术：vue3(使用vue3组合式API)，单页面应用，但是每个功能模块尽量尽量独立，方便扩展
数据存储：indexedDB，为防清理浏览器造成数据丢失，添加数据导入/导出功能
使用场景：
    - 替代浏览器起始页和收藏夹
    - 管理常用网站和书签
    - 快速检索常用网站
    - 快速访问常用网站
部署：build成静态页面放在静态服务器，或者使用github pages进行部署




数据存储描述：
两个表：website存储网站，setting保存一些设置项

website
{
    id: number,              // 自增ID (主键)
    name: string,            // 网站名称
    url: string,             // 网站链接
    description: string,     // 网站描述
    icon: string,            // 图标URL（自动获取，失败则使用程序生成）
    tags: Array,             // 标签数组 [tag1, tag2, ...]
    isMarked: boolean,     // 是否为已标记网站
    markOrder: number,   // 常用网站排序（仅当isMarked为true时有效）
    visitCount: number,      // 访问次数统计
    lastVisited: Date,       // 最近访问时间
    createdAt: Date,         // 创建时间
    updatedAt: Date,         // 更新时间
    isActive: boolean        // 是否激活状态（用于软删除）
    isHidden: boolean        // 是否隐藏状态（用于软删除）
}
主键：id (自增)
索引：
isMarked: 用于快速查询已标记网站
markOrder: 用于按顺序获取已标记网站
tags: 用于快速查询指定标签的网站(tags数组中的所有tag都索引)

setting
{
    selected-theme: string,
    themes: Array,
    selected-search-engine: string,
    search-engine-list: Object{
        name: 搜索引擎名称, 
        url: 搜索引擎URL(例如百度: https://www.baidu.com/s?wd={query}), 
        icon: 本地图标路径},
    search-result-layout: string,
    lastBackupTime: Date,
}


数据库操作：



网页描述：
网页分为3个模块：搜索模块, 显示模块, 设置模块
1. 搜索模块描述：
    - 布局：参考SEARCH_COMPONENT_GUIDE.md
    - 点击selected search engine icon 显示 search engine icon list，点击list item切换 selected search engine and selected search engine icon的图标
    - 默认搜索引擎列表：baidu bing yandex local(local用于本地搜索)
    - 搜索引擎分为两类：
        - local-search 此分类只有一个local本地搜索
        - net-search locale之外的所有其他搜索引擎都是网络搜索，包括百度 必应 yandex等，以后会添加更多搜索引擎
    - 如果 selected-search-engine 是 net-search，输入框内输入内容后按下enter键执行网络搜索
    - 如果 selected-search-engine 是 local-search，输入框输入内容，自动执行本地搜索，并在显示模块中显示搜索结果
    - 如果 selected-search-engine 是 local-search，输入框内的内容为空时，显示模块显示常用网站列表
    - 如果 selected-search-engine 是 local-search，切换为 net-search 时清空输入框内容
    - 如果 selected-search-engine 是 net-search，切换为 local-search 时清空输入框内容
    - 如果 selected-search-engine 是 net-search，切换为 net-search 时不清空输入框内容
    - 如果 selected-search-engine 是 local-search，输入框获取到焦点时在搜索模块下方显示 tags list，失去焦点隐藏tags list
    - 点击tags list item，输入框内容自动填充为该tag，自动执行本地搜索，并在显示模块中显示搜索结果
    - 如果 selected-search-engine 是 local-search，输入框内容以 -- 开头时，执行一些特殊功能，后续慢慢添加，预留
2. 显示模块描述(可显示内容有三：已标记网站列表、本地搜索结果、--开头的关键字的搜索结果)
    - 显示模块在搜索模块下方
    - 默认显示 已标记网站列表
    - 如果 selected-search-engine 是 local-search，输入框输入内容，显示模块显示搜索结果
    - 如果 selected-search-engine 是 local-search，输入框内容以 -- 开头时，显示模块显示--开头的关键字的搜索结果(预留)
    - 如果 selected-search-engine 是 local-search，输入框内容为空时，显示模块显示 已标记网站列表
    - 如果 selected-search-engine 是 local-search，切换为 net-search 时会清空输入框，显示模块显示 已标记网站列表
    - 如果 selected-search-engine 是 net-search，显示模块显示 已标记网站列表
    - 已标记网站列表的显示方式和操作
        - 网格模式，上方图标下方网站名，已标记网站列表只有这一种显示方式
        - 鼠标拖拽改变网站排序
        - 鼠标右键显示菜单，菜单包括：编辑、删除、取消标记、复制url等
    - 本地搜索结果列表的显示方式和操作
        - 网格模式，上方图标下方网站名
        - 列表模式， 每行显示一个网站，包括网站图标、网站名、网站描述、网站url，如果某个字段文字太多做截断处理
        - 搜索结果的右键菜单：编辑、删除、添加标记(如果未标记)、取消标记(如果已标记)、复制url等
3. 设置模块描述:
    - 右上角显示一个 settings图标
    - 点击图标显示 settings面板
    - 点击settings面板之外的地方隐藏
    - settings面板集中所有的设置/控制选项
        - 主题切换
        - 搜索结果显示方式切换(网格模式、列表模式)
        - 数据导入/导出
        - 网站增删改查(暂时先不写具体代码，因为在显示模块有入口，后续有需要再添加)
        - 搜索引擎增删改查
        - 后续添加



状态管理：使用pinia
