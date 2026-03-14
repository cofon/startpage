
websites表字段：
    - id: number,              // 自增 ID (主键)
    - name: string,            // 网站名称
    - title: string,           // 网站标题（新增）
    - url: string,             // 网站链接
    - description: string,     // 网站描述
    - iconData: string,        // 从网络获取的 icon 的 base64(PNG/ICO/JPG等)
    - iconGenerateData: string, // 本地生成的 SVG 图标
    - tags: Array,             // 标签数组 [tag1, tag2, ...]
    - isMarked: boolean,       // 是否为已标记网站
    - markOrder: number,       // marked 网站排序 (仅当 isMarked 为 true 时有效)
    - visitCount: number,      // 访问次数统计
    - lastVisited: Date,       // 最近访问时间
    - createdAt: Date,         // 创建时间
    - updatedAt: Date,         // 更新时间
    - isActive: boolean,       // 是否激活状态 (正常搜索不显示非激活的网站)
    - isHidden: boolean        // 是否隐藏状态 (正常搜索不显示隐藏的网站)

添加网站页面可以编辑的字段有：
    - url
    - name
    - title
    - description
    - iconData
    - iconGenerateData
    - tags
    - isMarked
    - isActive
    - isHidden

提交之前必须有值字段：
    - url

点击提交按钮时必须有值的字段：
    - url
    - name
    - iconGenerateData
    - tags
    - isMarked
    - isActive
    - isHidden

可以空值的字段(因为这几个是使用插件从网络获取的，可能获取不到数据，所以可以空值)：
    - title
    - description
    - iconData

程序自动填充字段的依赖关系：
    - 依赖URL的字段有：name、title、description、iconData、iconGenerateData(间接依赖)
    - 依赖name的字段有：iconGenerateData (使用name第一个字生成SVG)

- 页面UI布局
    - 【url】【input】【获取meta数据按钮】
    - 【如果url不合法，则显示提示信息，如果URL合法不显示】
    - 【name】【input】
    - 【title】【input】
    - 【description】【input】
    - 【img 网站图标的预览图】【textarea 网络图标的base64字符串】
    - 【img SVG图标的预览图】【textarea SVG图标的base64字符串】
    - 【复选框 默认false】isMarked 【复选框 默认ture】isActive 【复选框 默认false】isHidden
    - 【tags】【input】
    - 【tags-list】
    - 【取消按钮】【提交按钮】

- 修改后的逻辑
    - 打开页面 URL 样式跟其他input相同，但是获取到焦点之后检测是否输入了有效的URL
    - 如果URL不是有效的URL，修改样式，红色边框，下方红色提醒文字，提示用户输入有效的URL，获取meta数据按钮禁用
    - 如果URL是有效的URL 且 已存在，修改样式，橙色边框，下方橙色提醒文字
    - 如果URL是有效的URL 且 不存在，修改样式，绿色边框，下方提醒文字不显示，获取meta数据按钮启用，查看是否需要填充name，如果需要，就填充name
    - 点击 获取meta数据按钮，获取meta数据
    - 如果Meta数据获取成功，填充title、description、iconData
    - 无论title description iconData字段原来是否有值，都要填充
    - 如果Meta数据获取失败，不填充title、description、iconData，tags输入框内添加一个 meta获取失败 的tag
    - 添加 meta获取失败的tag 是为了可以使用 --tag tag-name 快速查找 meta获取失败的网站，因为无论是否获取到meta数据，都要把网站保存的数据库
    - meta数据必须手动点击获取meta数据按钮获取，不能自动获取(之前可能是URL输入框失去焦点获取，也可能检测到URL有效立刻获取，现在只能手动点击按钮获取)
    - 
    - name ，URL是有效的URL，会检测是否需要填充name，是否需要的判断条件：用户手动输入过name值 且 name不为空，则不需要填充，否则就填充
    - iconGenerateData 根据name第一个字符生成，name值第一个字符有变则iconGenerateData值也变
    - tags，如果Meta数据获取失败，自动添加一个 meta获取失败 的tag，如果Meta数据获取成功，不添加tag，
    - 但是提交的时候，如果tags是空值，添加一个名为 “new” 的tag
    - isActive isMarked isHidden 有默认值
    - 
    - 点击提交按钮，检测提交数据
    - 如果URL不是有效的URL，则不提交，提示用户输入有效的URL
    - 如果 name 是空值，则不提交，提示用户输入name
    - 如果 iconGenerateData 是空值，则不提交，提示用户输入iconGenerateData
    - 如果 isMarked isActive isHidden 是空值，则不提交，虽然可能性几乎为0, 还是检测一下，万一有个null值呢
    - 如果 tags 空值，则 添加一个名为 “new” 的tag(添加单个网站不输入tag的可能性很低，但还是检测一下，因为可能和批量添加使用同一个函数)

