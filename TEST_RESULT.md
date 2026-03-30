
# 重构搜索框命令

## 搜索分类

* 普通搜索，比如：abc，显示包含关键字 abc 的网站
* 普通搜索的搜索范围：name title desc url tag
* 命令搜索，比如：-title abc，显示标题包含参数 abc 的网站
* 命令搜索的搜索范围, 由命令决定

## 状态命令

### 状态命令是指针对websites表中以下这三个字段的搜索命令

* isActive: true | false;
* isHidden: true | false;
* isMarked: true | false;

### 现在的状态命令要修改，修改之后的状态命令列表

* -active;
* -unactive;
* -marked;
* -unmarked;
* -hidden;
* -unhidden;
* -all;

<!-- ### 修改前后对比 -->

<!-- * 修改前: -active; 修改后: -active;
* 修改前: -inactive; 修改后: -unactive;
* 修改前: -marked; 修改后: -marked;
* 修改前: -unmarked; 修改后: -unmarked;
* 修改前: -hidden; 修改后: -hidden;
* 修改前: -visible; 修改后: -unhidden;
* 修改前: -active true; 修改后: -active;
* 修改前: -active false; 修改后: -unactive;
* 修改前: -marked true; 修改后: -marked;
* 修改前: -marked false; 修改后: -unmarked;
* 修改前: -hidden true; 修改后: -hidden;
* 修改前: -hidden false; 修改后: -unhidden;
* 修改前: -inactive true; 修改后: -unactive;
* 修改前: -inactive false; 修改后: -active;
* 修改前: -unmarked true; 修改后: -unmarked;
* 修改前: -unmarked false; 修改后: -marked;
* 修改前: -visible true; 修改后: -unhidden;
* 修改前: -visible false; 修改后: -hidden; -->

### 格式说明

* 状态命令没有参数
* 状态命令 + bool 的格式不再使用，bool 不再作为布尔值，而是作为普通关键字处理
* 状态命令后如果有其他命令或关键字，状态命令和其他命令是and关系
* 以 -active 为例：
  * 修改前: -active true，显示 isActive === true 的网站;
  * 修改后: -active true，true 不再作为布尔值，而是作为普通关键字处理;
  * -active abc，显示 isActive === true 且 包含 abc 的网站;
  * -active 123，显示 isActive === true 且 包含 123 的网站;
  * -active true，显示 isActive === true 且 包含 true 的网站;

### 搜索范围说明

* isActive === false 的网站不参搜索
* isActive === false 的网站只有在 -unactive 命令下显示
* isHidden === true 的网站不参搜索
* isHidden === true 的网站只有在 -hidden 命令下显示

### all命令的说明

* -all 命令不显示 isActive === false 的网站
* -all 命令不显示 isHidden === true 的网站
* -all 命令显示除了 isActive === false 和 isHidden === true 之外的所有网站
* -all 命令因为也是根据 isActive isHidden 确定的搜索结果，所以暂时把-all也分类为状态命令

## 页面命令

* -theme    打开主题设置面板
* -search   打开搜索引擎设置面板
* -add      打开添加网站面板
* -import   打开导入数据面板
* -export   打开导出数据面板
* -batch    打开批量修改数据面板
* -help     显示此帮助信息

### 页面命令说明

* 页面命令没有参数，比如：-theme
* 如果页面命令后跟有参数，忽略，比如：-theme key，key忽略
* 页面命令不与搜索命令一起使用
* 如果页面命令后有搜索命令，忽略，比如：-theme -active，-active忽略
* 如果页面命令跟在搜搜命令后面，忽略，比如：-active -theme，-theme忽略

## 搜索命令

### 搜索命令列表

* -name [参数]   只搜索网站名称
* -title [参数]  只搜索网站标题
* -desc [参数]   只搜索网站描述
* -url [参数]    只搜索网站 URL
* -tag [tag]       只搜索网站标签

### 搜索命令说明

* 搜索命令有参数，例：-title abc，abc是参数，搜索title中包含abc的网站;
* 搜索命令可以有多个参数，例：-title key1 key2 key3
* 搜索命令title desc name url的参数默认是 and 关系
* 例：-title a b c, 显示标题包含 a 且 包含 b 且 包含 c 的网站;
* 搜索命令tag的参数默认是 or 关系
* 例：-tag 1 2 3, 显示标签包含 1 或 2 或 3 的网站;
* 搜索命令的参数可以有多个，判断参数列表结束的判断标准是：
  * 遇到 & 符号
  * 遇到 | 符号
  * 遇到 -
  * 例：-title a b & c, 显示标题包含 a 且 标题包含 b 且 普通搜索包含 c 的网站;
  * 此例中，& 把整个命令分为两个部分
  * 第一个部分是命令搜索 -title a b，title命令，两个参数
  * 第二部分是 c，普通搜索，关键字是 c

## 搜搜范围

* isActive === false 的网站不参与搜索
* 搜索命令不显示 isActive === false 的网站
* isHidden === true 的网站不参与搜索
* 搜索命令不显示 isHidden === true 的网站
* 普通搜索也不显示 isActive === false 的网站
* 搜索命令不显示 isHidden === true 的网站

## 命令关系和命令边界

* 多个and关系的命令/关键字使用 & 符号分割
* 多个or关系命令/关键字使用 | 符号分割
* 多个搜索命令/关键字 之间默认是 and 关系
* 如果命令之间没有 & | 符号，则默认是 and 关系
* and关系举例说明
  * 例：-title key1 -desc key2, 显示标题包含 key1 且 描述包含 key2 的网站;
* or关系举例说明
  * 例：-title key1 | -desc key2, 显示标题包含 key1 或 描述包含 key2 的网站;
* 搜索时支持输入多个命令和关键字，搜索命令有多个参数
* 命令 关键字 参数的边界分割有以下几个：
  * & 符号
  * | 符号
  ***

## 组合搜索

* 状态命令 搜索命令 普通搜索 可以组合使用
* 状态命令 搜索命令 普通搜索 之间使用 & 符号分割
* 状态命令 搜索命令 普通搜索 如果没有使用 & | 符号分割，默认是 and 关系
* 比如：-active -title key1, 显示 isActive === true 且 显示标题包含 key1 的网站;
* 比如：-title key1 -desc key2, 显示标题包含 key1 且 描述包含 key2 的网站;
* 比如：-title key1 & key2, 显示标题包含 key1 且 普通搜索包含 key2 的网站;
* 比如：-title key1 | key2, 显示标题包含 key1 或 普通搜索包含 key2 的网站;
* 比如：-active -title key1 & key2, 显示 isActive === true 且 标题包含 key1 且 普通搜索包含 key2 的网站;

## 一些场景的显示说明

* 搜索框中只有 * 这两个字符时，显示模块不显示任何网站
* 搜索框中的命令输入不完整的时候不显示任何网站
* 比如：-activ, 此时命令avtive没有完全输入，不显示任何网站
* 比如：-titl, 此时命令title没有完全输入，不显示任何网站
* 搜索框中的命令没有参数，命令输入完整的时候才显示对应的搜索结果
* 比如：-active, 此时命令active输入完整，显示命令active对应的网站
* 搜索框中的命令有参数，但是没有输入任何参数时，显示模块不显示任何网站
* 搜索框中只有 -name 时，显示模块显示所有网站
* 搜索框中只有 -title 时，显示模块显示所有网站
* 搜索框中只有 -desc 时，显示模块不显示任何网站
* 搜索框中只有 -url 时，显示模块显示所有网站
* 搜索框中只有 -tag 时，显示模块不显示任何网站
* 搜索框中的命令有参数 且 参数至少有一个时，显示模块显示对应的搜索结果
* 比如：-title key1, 显示标题包含 key1 的网站；
* -tag命令的特殊说明
  * -tag 的 tag 分为有效tag 和 无效tag
  * tag是否有效的判断标准是 是否在 tags 列表中
  * -tag 后面的 tag 不是有效tag时，忽略无效tag，如果所有tag都无效，不显示任何网站
  * 例：-tag 无效tag，不显示任何网站
  * 例：-tag 无效tag 有效tag，显示有效tag对应的网站，无效tag忽略
  ```
  命令有两种, 一种是没有参数的, 一种是有参数的, 
  没有参数的, 比如：-active , 输入 -active 就算是完整命令
  有参数的, 比如：-title a, 输入 -title 虽然名字写完整了, 但是不算完整命令, 输入 -title a 才算是完整命令

  输入 - , 不显示任何内容
  输入 -a , 保持搜索结果为空
  输入 -active , 显示 active 的搜索结果
  输入 -active - , 保持显示 active 的搜索结果
  输入 -active -marke , 保持显示 active 的搜索结果
  输入 -active -marked , 显示 active && marked 的搜索结果
  输入 -active -marked -title , 保持显示 active && marked 的搜索结果
  输入 -active -marked -title a , 显示 active && marked && title a 的搜索结果
  ```