
添加一个 .vue 文件，用来选择搜索结果布局
布局模式有三个：
1. 极简模式，simple，
    只显示一个icon和一行文本，
    文本显示title，
    如果没有title显示desc，
    如果没有desc显示name，
    优先级为title > desc > name
2. 现在使用的模式，default，
    现在的搜索结果布局是：
    左边 icon 
    中间 title/desc/name url tags，三者上下结构
    右边 actions
3. 完整模式，full，
    显示所有信息，
    包括id、icon、title、desc、name、url、tags、actions等
4. 我不确定以后会不会添加新的模式，写代码的时候要考虑到未来可能的扩展

添加一个命令，在搜索框输入命令，显示模块显示这个搜索结果布局的vue页面；

