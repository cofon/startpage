

数据库：StartPageDB

表：
websites 网站数据
searchEngines 搜索引擎数据
themes 主题数据
setings 设置数据，一些状态

导入导出数据格式：JSON

导出：所有表的数据全部导出，只导出表的数据即可，不要添加额外的内容

导入：
1. 不需要检测版本号, 不会有版本号的
2. 导入文件可能只有一个表，比如：{"websites": [一些网站数据]}
3. 导入文件也可能两个表 三个表 四个表
4. 因为我不确定什么时候要修改什么数据，所以不确定导入文件中包含几个表，包含哪些表
5. 如果导入文件内包含多个表，settings表最后导入
6. 导入失败自动回滚所有更改

websites
1. 批量导入网站，即可覆盖，也可以添加
2. 如果导入文件中的website有ID，查看数据库有没有相同ID
    有则查看URL是否相同
        同则更新
        不同则生成ID添加
    没有则添加
3. 如果没有ID，搜索数据库有没有相同的URL，没有则添加，若有不要重复添加
4. 一般情况下导入的网站数据不会有ID，添加时自动生成ID
5. website 字段 url 必须有值，否则不添加，打印日志
6. 导入的数据如果缺少字段，需要有默认值填充
    - iconCanFetch: boolean,   默认值： true
    - isMarked: boolean,       默认值： false
    - isActive: boolean,       默认值： true
    - isHidden: boolean        默认值： false
7. 没有值也没有默认值的字段让数据库自行处理

searchEngines
1. 批量导入搜索引擎，即可覆盖，也可以添加
2. id neme icon iconColor template这几个字段必须要有值，否则不添加，打印日志
3. order，查询数据库其他搜索引擎的顺序，排在最后
4. 如果ID存在，则更新，不存在则添加

themes
1. 批量导入主题，即可覆盖，也可以添加
2. id name colors 这几个字段必须要有值，否则不添加，打印日志
3. colors 字段内部的字段必须都有值，否则不添加，打印日志
4. 如果ID存在，则更新，不存在则添加

settings
1. 导入文件中数据会覆盖原来数据库中的数据
2. id 字段必须为 'settings'，否则不添加，打印日志
3. selectedThemeId 默认值为 'auto'
4. selectedSearchEngineId 默认值为 'local'
5. searchResultLayout 默认值为 'list'
6. selectedThemeId 的导入逻辑：
    1. 拿到导入文件中的selectedThemeId的值，比如：selectedThemeId的值是"example-theme"
    2. 查询数据库 themes表中有没有id为"example-theme"的主题，
    3. 如果有，则修改settings表中selectedThemeId的值为"example-theme"
    4. 如果没有，查寻数据库settings表中selectedThemeId是否有值
        1. 如果有值，则不修改，
        2. 如果没有值，则修改settings表中selectedThemeId的值为'auto'
7. selectedSearchEngineId 的导入逻辑：
    1. 拿到导入文件中的selectedSearchEngineId的值，比如：selectedSearchEngineId的值是"example-search-engine"
    2. 查询数据库 searchEngines表中有没有id为"example-search-engine"的搜索引擎，
    3. 如果有，则修改settings表中selectedSearchEngineId的值为"example-search-engine"
    4. 如果没有，查寻数据库settings表中selectedSearchEngineId是否有值
        1. 如果有值，则不修改，
        2. 如果没有值，则修改settings表中selectedSearchEngineId的值为'local'
8. 因为要查询其他表，所以如果导入文件中包含多个表的数据，settings表最后导入


