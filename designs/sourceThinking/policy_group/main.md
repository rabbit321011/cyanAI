# 策略组的设计

策略组是用来配置系统运行的模式的，一个策略组应该能控制：

###### 1.运行模式(mode),这是一个string,是直接控制了数据流向的模式

只能是以下的情况

chat:空壳子模式，只能一问一答

tiny:最基础的运行模式，允许模型一问一答和基础的调用工具

lite:为了保证性能而作的运行模式，在tiny的基础上允许模型控制observer

normal:正常的模式，从这里开始，模型不应该有外部的限制，//所以这个模式和其上的模式可以自由切换。

//在该模式下，theory和struct在较高的阈值下触发，theory的评分系统是rag&fast reranker工作，触发以后正常走try流程。整体还是一问一答

thinking:思考模式，这个模式不是一问一答的模式，而是在输出终止符之前就不停的通过system消息回调，

//这个模式下theory直接通过rag&reranker实现，但是rag筛选出的值要比较多，reranker的阈值也比较大

//philosophy:哲思模式，

//这个模式下theory只被主动召回，但是也推荐主动召回，这个模式下的主动召回方法全部开放，包括用qwen reranker详细慢遍历，这个模式下上下文需要主动回收

###### 2.tempature

默认为0.7,可以自由设置

###### 3.monologue

是一个布尔值，为是否开启独白

开启独白时也必须引入相应的路由

###### 4.summary_turn

是一个数字，如果超出一个轮次外的消息就触发总结

默认为30(即保留30轮原始对话)

如果为0表示不启用总结功能，保留所有原始对话

###### 5.summary_turn_precision

是一个数字，表示判断是否超出轮次外的回数，即多少轮对话触发一次summary_turn外的总结

默认为20，为0表示不启用

###### 6.tools_files

是一个字符串数组，记载启用的工具的索引JSON文件

默认包含main_virtual\main.json

应该是在library_source.ini:erogenous_zone_file=E:\MyProject\cyanAI\nodeServer\src\component\erogenous_zone下检索的

###### 7.auto_rag_topk

应该是一个整数，表示自动的rag检索返回的前n个值

这个值会被送往reranker(或者说送入理论列表再给reranker)

如果为-1则检索所有theory,**如果为0则不开启检索功能**

如果一个理论被成功采纳，那么其会进入保留区，这个区域不被再次rag检索

rag每次检索会检索保留区数量+auto_rag_topk的值，然后再检索结果中删去在保留区已有的，然后再提取前auto_rag_topk的提交

###### 8.auto_reranker_mode

是一个string,可能是"qwen"或者“bge”

###### 9.auto_emerge_rate

是一个小数，表示阈值倍率

###### 10.auto_emerge_frequency

表示自动检索的频率

###### 12.workspace

布尔值，表示是否开启工作区相关功能，需要tools_files附上相关JSON来兼容

###### 13.pull_info

布尔值，表示是否开启拉取信息的功能，如果开启需要配套的tools支持

###### 14.step_progress

布尔值，表示是否开启步进计划功能，如果开启需要配套的tools支持

###### 15.change_policy_group

string数组，表示可以切换到的策略组模式

###### 16.character_reference

一个string,表示基于library_source.ini:character_reference_file下的参考文本

默认值应该是examples_hareru_simple.txt

###### 17.max_events

一个整数，表达检索事件的最大数

默认为100

###### 18.events_threshold

默认为0

小于这个值的事件不会被检索

###### 19.events_Tw_normalization_factor

默认为0，最大为1

为1表示Tw被完全平均掉，所有Tw被归一为0.5

Tw的原取值范围为:1~0

###### 20.subject_file

为一个文件夹，文件夹内必须包含一个main.ts

该main.ts必须包含一个main(context:any = this)函数

main函数会自动执行完相关操作，啥也不返回，包括sendAll,工具调用等等

但是执行main函数的前提是目前的东西已经加入Queue,是就等着sendAll的状态

其实这个函数就相当于目前的sendAll加上发送QQ消息啥的，可能要加上管道操作

###### 