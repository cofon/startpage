我看了现在的store，发现所有的数据都存储在state中，现在数据比较少，如果以后数据多了，state会变得很大，有没有什么办法可以优化一下？
其他数据可以忽略不计，最要是websites表，这是现在的数据：
246条数据，导出的JSON文件占用磁盘空间 4.06M
我去掉了 iconData 字段的数据，是 243K
再去掉 iconGenerateData 字段，是 142K
但是如果把 iconData 单独保存的话，增加状态管理和数据库操作的复杂度
如果全部存储在一个位置，数据多了之后有会占用太多的资源；

我能想到的两个办法
1. iconData和iconGenerateData不放在websies表中，单独建表，缓存只放websites
2. 还是放在websites表不变，但是store不保存iconData和iconGenerateData

如果你能有更好的方案，请告诉我，谢谢！

不要写代码