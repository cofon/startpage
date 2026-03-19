要修改的页面：--add打开的添加网站页面 AddWebsitePanel.vue

需要修改的：
- 验证URL这个函数 isValidUrl，现在只是我自己写的一些简单的规则，你查找一下有没有比较简单轻量的url检测库，
- extractRootDomain 提取根域名的函数也不太严谨，要修改一下
- 现在取消按钮没有用，修改为点击取消按钮回到主页(为了方便描述，我把显示模块显示marked-list的时候称为主页)

修改逻辑如下：
- 打开添加网站页面时，URL输入框是可输入状态
- name title description iconData iconGenerateData 都是不可以输入状态
- URL右侧“获取信息”按钮是不可点击状态
- 最下方的添加网站按钮是不可点击状态
- URL输入框获取焦点，监听URL的输入内容，使用isValidUrl判断是否有效的URL
- 如果URL是无效的，name title description iconData iconGenerateData保持不可输入状态，值为空
- 如果URL是无效的，URL下方文字提示：无效的URL
- 如果URL是无效的，URL输入框样式改变为红色
- 如果URL是有效的，checkUrlExists判断URL是否已经保存在数据库
- 如果URL有效 且 已经保存在数据库，URL下方输入框文字提示：URL已存在，输入框样式改变为橙色
- 如果URL有效 且 没有保存在数据库，URL右侧按钮变成可点击状态，
- 如果URL有效 且 没有保存在数据库，调用extractSiteNameFromUrl生成name填充到name输入框
- 监听name输入框，如果name有值，自动生成SVG，SVG的base64填充到iconGenerateData
- iconGenerateData文本框的数据根据name变化而变化
- name的值跟随url的值而变化，URL有效且不存在于数据库生成name，URL无效或者已经在数据库，清空
- 如果用户点击了URL输入框右侧的获取信息按钮，name title description iconData iconGenerateData变成可输入状态，获取数据填充 title description iconData 的输入框
- 如果获取网站数据失败，tags添加一个标签 "meta_failed"
- 如果获取网站数据失败，tags添加一个标签 "new" 
- 如果 URL有效 && name && iconGenerateData && tags, 提交按钮变成可点击状态