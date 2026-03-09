这是一个浏览器起始页项目，当前是三个模块：搜索模块，显示模块，设置模块
搜索模块可以切换搜索引擎，其中本地搜索可以搜索本地存储的网站
显示模块显示常用网站列表(marked网站列表)和本地搜索结果
设置模块，点击settings按钮显示设置面板

重构方案如下：
取消settings按钮，把settings的功能集成到本地搜索中，selected search engine 是 local 的时候，根据输入框内容显示不同的设置，
约定以 -- 开头的为功能模式，或者命令模式，或者别的模式，总之就是 -- 开头的关键字执行一些特殊的功能，
比如：
--theme 在显示模块显示 主题设置面板
--search 在显示模块显示
--inactive 显示非活动网站
--active false 显示非活动网站
--help 显示所有的 -- 模式操作
把settings里面的所有设置项全部移植到 本地搜索中


修改 常用网站列表，也就是 marked 网站列表的显示方式，
现在显示的是icon 网站名 ，鼠标悬浮显示actions，
修改为 只显示icon和网站名，不显示actions，
修改网站item的显示大小，现在太大了，把它变小，
修改的目的：这是最常用的网站，也是最多显示的内容，尽可能的简化，
现在item太大了，视觉效果不好，让它变小，为以后放置更多的marked网站留出足够空间，
如果需要修改marked网站，可以搜索marked，或者搜索网站，在搜索结果中修改，
注意：鼠标拖拽排序的功能不要动，这个必须保留


点击actions中的 五角星 切换marked unmarked可以立刻看到效果，点击actions中的 X按钮 删除网站可以立刻看到效果，但是点击恢复按钮不能立刻看到效果，点击actions中的 编辑按钮，修改之后不能立刻看到效果，而且重新搜索也看不到效果了，要刷新网页重新搜索才可以看到修改后的效果；跟之前是一样的


关于添加网站我需要你的建议：
方案1. 现在的方案，输入框输入 --add，打开添加网站面板，如果需要添加多个网站，每次一个多添加几次；
方案2. 添加一个添加网站的面板，一个输入框，输入框URL或者空格换行符等分割的多个URL，写代码让程序自己添加，打印日志；
方案3. --import 打开导入面板，把数据写在导入文件中，但是如果是新的网站，数据来源是个问题；
方案4. 单独写一个程序专门用来获取网站数据，然后把数据导入到起始页；
因为是本地的纯静态页面，获取icon和title时有跨域问题，虽然有代理暂时可以解决，但是代理服务不稳定，
你帮我想一下还有没有更好的方案



  id: number,              // 自增ID (主键)
  name: string,            // 网站名称
  url: string,             // 网站链接
  description: string,     // 网站描述
  icon: string,            // 图标URL(不再使用，暂时保留)
  iconUrl: string,         // 原始 URL (用不到，暂时保留)
  iconData: string,        // 从网络获取的 icon 的 base64(PNG/ICO/JPG等)
  iconGenerateData: string, // 本地生成的 SVG 图标
  iconCanFetch: boolean,   // 是否可以从网络获取 icon(布尔值)
  iconFetchAttempts: number, // 尝试从网络获取的次数(数字)
  iconLastFetchTime: Date, // 最后一次尝试从网络获取的时间戳
  tags: Array,             // 标签数组 [tag1, tag2, ...]
  isMarked: boolean,       // 是否为已标记网站
  markOrder: number,       // marked网站排序(仅当isMarked为true时有效)
  visitCount: number,      // 访问次数统计
  lastVisited: Date,       // 最近访问时间
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
  isActive: boolean,       // 是否激活状态(正常搜索不显示非激活的网站)
  isHidden: boolean        // 是否隐藏状态(正常搜索不显示隐藏的网站)