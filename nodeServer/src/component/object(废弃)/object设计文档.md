# 描述

object和realive的内容是比较复杂的，每次模型开始一个event时，会初始化一个objectWeb对象

该对象结构如下

```objectNetwork
{
	objects:[
		{
			name:string;//这里写的是对象的名字
			index:number;//一个数字，使用全局共享生成器,main_virtual不可见，给tool看的
			current:[
				{
					index:number;//一个数字，使用全局共享生成器,main_virtual不可见，给tool看的
					summary:string;//这里是对象特质的类型，如"性格"，"想法"，"main"//如果为main,那么text就是一句话简要描述该对象(如：一个朋友/讨厌的人/一种网站框架)
					text:string;//这里是该对象特质的详细
				}
			]
		}
	],
	relationShip:[
		{
			start:string;//这是发出对象的name
			end:string;//这是接受对象的name
			index:number;//一个数字，使用全局共享生成器,main_virtual不可见，给tool看的
			current:[
				{
					index:number;//一个数字，使用全局共享生成器,main_virtual不可见，给tool看的
					summary:string;//这里是关系的简介
					text:string;//这里是具体的关系
				}
			]
		}
	]
}
```

 objectWeb必须从空开始，不能使用一个现成的载入

# 对象载入

对象的普通载入操作如下（非ai）:

```
1.先载入对象的name,此时current为空
2.再载入summary为main的current
3.选取R值大于0.65的current添加到上下文，最多50条，如果R>0.65的current小于10条，强制载入R值最大的10条
4.选取R值大于0.65的而且start是当前对象的relationShip,最多50条，如果R>0.65的current小于10条，强制载入R值最大的10条。
```

如果有一个载入的情景，比如

```
为了明白googleAI的Api格式与deepseek的Api格式区别，我需要载入对象"googleAIapi"和"deepseekApi"
```

设其为初始需求

然后tool接受到消息，提取出以下因素

```
obj_need:["googleAIapi","deepseekApi"]
```

然后Ranker搜索疑似为”googleAIapi“和"deepseekApi"的对象，就像问“deepseekApi格式的官方文档和标准是什么？”

这里给tool的提示词是:"写一个问句，问你想知道的东西，该函数会搜索出返回疑似的结果"

Ranker搜索出来的权重设为w,那么最终决定的权重就设为
$$
w*(ln(5*R)+1)
$$
![1772046187056](C:\Users\jbbj\AppData\Roaming\Typora\typora-user-images\1772046187056.png)

每个对象搜索出前25个疑似的结果

这前25*obj_need.length()个对象的name被喂给tool进程

tool进程可以选择用functionCall查看需要详细查看的对象的名字，然后这个对象的所有object数据都会通过functionCall重新给tool线程

然后tool进程确定好以后就可以输出什么object是需要获取的了

这些被确定好的object会展开其全部信息发送给tool,由tool决定保留这些object的哪些current(current会被加上索引)

这里object的部分就被提交了，被真的提交的对象和其current进行一次复习，增强其D值



然后进行relationShip部分的处理

tool保留上下文，此时先获取start是提交的object的所有relationShip

将这些所有的relationShip进行Rerank，给tool的提示词如上:"写一个问句，问你想知道的东西，该函数会搜索出返回疑似的结果"

Rerank出的结果也过一遍
$$
w*(ln(5*R)+1)
$$
把前50个结果给tool,让tool通过function来选出对解决初始需求有帮助的信息

对象是可以被重复载入的，如果已经对象已经存在，那么再次载入会更具输入的需求更深的载入信息

tool获取object的current时,如果已经在main_virtual的对象区存在,那么重复载入的部分不会影响到main_virtual
在获取relationShip时，同理，重复载入的部分也不会影响

如果最终实际上，tool啥也没载入，那么就会提醒返回"tool没有发现任何符合要求的记忆"

如果实际上载入了对象，就会提醒"载入了xxx对象"

如果实际上载入了对象的条目，就会提醒"载入了xxx对象的新条目"

如果载入了某两个对象的关系，就会提醒“载入了新关系”

如果载入了任何东西就会提醒“你的对象区已经更新了新的信息”

# 删除信息

对象删除由main_virtual决定，这会把main_virtual的status内的所有的对象以及关系加上索引喂给tool进程，tool进程列出需要删除的东西的索引，将其删除

需要向tool线程说明，删除对象的main条目会导致整个对象的所有信息被删除

# 记载对象

记载对象传入的也是一段自然语言

tool进程将其转换为操作

其可能是为已有的对象添加条目，也可能是创建一个新对象

如果是创建一个新对象，那么tool负责编写main

tool首先会使用reranker先搜一遍，看看有没有雷同的对象，如果有就基于其操作，如果没有就准备新建一个

这里给大模型的提示词是“写一个问句，问你想知道的东西，该函数会搜索出返回疑似的结果”

老样子，还是过一遍
$$
w*(ln(5*R)+1)
$$
返回25个疑似的结果，将结果的完整对象输给tool进程

tool进程决定是新建一个对象还是给原有的对象增加条目

如果是新建对象，则需要编写main条目

添加其他条目需要一条一条添加

# 更改对象

传入自然语言

tool可以使用reranker来搜对象名字，取得需要操作的对象再删除该对象的某条目或者更改

也可以选择删除main条目，这意味着删除整个对象

# 给工具的function