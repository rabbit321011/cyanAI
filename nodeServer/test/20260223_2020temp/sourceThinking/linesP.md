linesP是一个指向文件中成条目的数据的数据类型

linesP能指向的文件一般是一个{obj1},{obj2}...类型的文件

```linesP
path:""//这记载的是文件的路径
index:"order"//这记载的是用什么索引，如果其内容为"order"，则表示以顺序为索引。
reference:[
{
start:"12",
end:"12"//如果start和order相同表示只指向一条信息，如果不同则表示范围，范围表示需要index的索引为数字或者时间。
},
{...}...
]
```

