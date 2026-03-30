# 策略组的设计

策略组是用来配置系统运行的模式的，一个策略组应该能控制：

###### 1.运行模式(mode),这是一个string,是直接控制了数据流向的模式

只能是以下的情况

memory_less:不保存记忆的问答

chat:空壳子模式，只能一问一答

tiny:最基础的运行模式，允许模型一问一答和基础的调用工具

lite:为了保证性能而作的运行模式，在tiny的基础上允许模型控制observer

multi_status:在此情况下会有多个status,比如每个用户的status不同什么的

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

###### 4.monologue_summary_turn

是一个数字，如果超出一个轮次外的消息就触发总结的独白

默认为6(即保留6轮原始对话)

如果为0表示不启用总结功能，保留所有原始对话

轮次单位是rethink

###### 5.monologue_summary_turn_precision

是一个数字，表示判断是否超出轮次外的回数，即多少轮对话触发一次summary_turn外的总结

默认为3，为0表示不启用

轮次单位是rethink

###### 6.summary_turn

是一个数字，如果超出一个轮次外的消息就触发总结

默认为30(即保留30轮原始对话)

如果为0表示不启用总结功能，保留所有原始对话

轮次单位是rethink

图片视频啥的也由这个触发总结

###### 7.summary_turn_time

是一个字符串，表示基于时间的总结触发阈值

格式为单位字符串，如"10min"、"1hour"等

单位支持：ms, s, min, h, day, week, month, year

如果为空或不启用则为空字符串

###### 8.summary_turn_precision

是一个数字，表示判断是否超出轮次外的回数，即多少轮对话触发一次summary_turn外的总结

默认为20，为0表示不启用

轮次单位是rethink

###### 9.tools_files

是一个字符串数组，记载启用的工具的索引JSON文件

默认包含main_virtual\main.json

应该是在library_source.ini:erogenous_zone_file=E:\MyProject\cyanAI\nodeServer\src\component\erogenous_zone下检索的

tools_file里面的内容是不可以被载入的，具体看talk_commands和direct_tools

###### 10.talk_commands

一个字符串数组，需要是在tools_files载入的JSON里的工具名

会被作为可用的talk_commands被使用

###### 11.talk_description_file

指向一个文件，会把该文件拼接到系统提示词，该文件需要解释怎么用talk_commands啥的

###### 12.direct_tools

一个字符串数组，需要是在tools_files载入的JSON里的工具名

会被直接载入tools_call的上下文

###### 13.auto_rag_topk

应该是一个整数，表示自动的rag检索返回的前n个值

这个值会被送往reranker(或者说送入理论列表再给reranker)

如果为-1则检索所有theory,**如果为0则不开启检索功能**

如果一个理论被成功采纳，那么其会进入保留区，这个区域不被再次rag检索

rag每次检索会检索保留区数量+auto_rag_topk的值，然后再检索结果中删去在保留区已有的，然后再提取前auto_rag_topk的提交

###### 14.auto_reranker_mode

是一个string,可能是"qwen"或者"bge"

###### 15.auto_emerge_rate

是一个小数，表示阈值倍率

###### 16.auto_emerge_frequency

表示自动检索的频率

单位是rethink

###### 17.workspace

布尔值，表示是否开启工作区相关功能，需要tools_files附上相关JSON来兼容

###### 18.pull_info

布尔值，表示是否开启拉取信息的功能，如果开启需要配套的tools支持

###### 19.step_progress

布尔值，表示是否开启步进计划功能，如果开启需要配套的tools支持

###### 20.change_policy_group

string数组，表示可以切换到的策略组模式

###### 21.system_prompt_generator

一个string,表示基于library_source.ini:system_prompt_generator_file下的参考文本生成文件

是一个.ts文件，生成系统提示词的时候，会把main_virtual内所有参数输入给这个文件的get_system_prompt(this)方法

返回一个string，表示系统提示词

这玩意不准改，只能读

###### 22.max_events

一个整数，表达检索事件的最大数

默认为100

###### 23.events_threshold

默认为0

小于这个值的事件不会被检索

###### 24.events_Tw_normalization_factor

默认为0，最大为1

为1表示Tw被完全平均掉，所有Tw被归一为0.5

Tw的原取值范围为:1~0

###### 25.dynamic_pipe_node声明

用输入输出双名来构造converter/output/source

在调用这个和24的时候会清空pipe相关的设置，重新初始化

因为converter声明需要构造runtime_datas，所以这玩意需要以代码运行

为了兼容性，其为一个文件路径，为在library_source.ini:dynamic_pipe_node_file下的文件

为一个.ts文件，其中有run_dynamic_pipe_node()方法

这玩意基本不可复用

###### 25.1.pipe连接

可以不管默认的source和默认output,只管pipe和converter以管流向

pipe连接也是双名式的

这玩意应该是写24的ts文件里面的，由其执行

###### 26.image_max

保留的图片最大数量

###### 27.video_max

保留的视频最大数量

###### 28.audio_max

保留的音频最大数量

###### 29.multimedia_max

保留的26~28这些多媒体信息的最大数量

###### 30.max_token

最大token数量

###### 31.model

模型名称

###### 32.model_type

模型种类

## 详细的策略组

### template

```
1.mode =
2.tempature =
3.monologue = false
4.monologue_summary_turn = 6
5.monologue_summary_turn_precision = 3
6.summary_turn = 30
7.summary_turn_time =
8.summary_turn_precision = 20
9.tools_files = ["main_virtual/main.json"]
10.talk_commands = []
11.talk_description_file =
12.direct_tools = []
13.auto_rag_topk = 0
14.auto_reranker_mode = "bge"
15.auto_emerge_rate =
16.auto_emerge_frequency =
17.workspace = false
18.pull_info = false
19.step_progress = false
20.change_policy_group = []
21.system_prompt_generator= "examples_hareru_simple.txt"
22.max_events = 100
23.events_threshold = 0
24.events_Tw_normalization_factor = 0
25.dynamic_pipe_node = //这个得写代码里
26.image_max=20
27.video_max=20
28.audio_max=20
29.multimedia_max=20
30.max_token=4096
31.model=gemini-3-pro-preview
32.model_type=gemini
```

### 具体的策略组

#### solo_qq_tiny

```
1.mode = "tiny"
2.tempature = 0.7
3.monologue = true
4.monologue_summary_turn = 0
5.monologue_summary_turn_precision = 0
6.summary_turn = 0
7.summary_turn_time = ""
8.summary_turn_precision = 0
9.tools_files = []
10.talk_commands = []
11.talk_description_file =
12.direct_tools = []
13.auto_rag_topk = 0
14.auto_reranker_mode = "bge"
15.auto_emerge_rate = 0
16.auto_emerge_frequency = 0
17.workspace = false
18.pull_info = false
19.step_progress = false
20.change_policy_group = []
21.system_prompt_generator = "default.ts"
22.max_events = 100
23.events_threshold = 0
24.events_Tw_normalization_factor = 0
25.dynamic_pipe_node = //这个得写代码里
26.pipes = //[{"",""}]
26.image_max=10
27.video_max=10
28.audio_max=10
29.multimedia_max=10
30.max_token=4096
31.model=gemini-3-pro-preview
32.model_type=gemini
```

dynamic_pipe_node为

```
let temp_qq_out_uid = await creat_output({ qq: "2926855205" }, "send_message_specific_qq");
reg_name("send_main_qq",temp_qq_out_uid);

await creat_converter({ id: "2926855205" },"id_filter","qq_filter_main_in","qq_filter_main_in_out");
await creat_converter(null,"mulcontect_gemini_messages","qq_converter_in","qq_converter_out");
creat_converter(null,"string_to_multi_contact_multimedia_message_array","string_converter_in","string_converter_out");
```

pipes为

```
main_qq_messages : qq_filter_main_in
qq_filter_main_in_out : qq_converter_in
qq_converter_out : main_virtual_input
main_virtual_final_output:string_converter_in
string_converter_out:send_main_qq
```

#### memory_less_qq

```
1.mode = "memory_less"
2.tempature = 0.7
3.monologue = true
4.monologue_summary_turn = 0
5.monologue_summary_turn_precision = 0
6.summary_turn = 0
7.summary_turn_time = ""
8.summary_turn_precision = 0
9.tools_files = []
10.talk_commands = []
11.talk_description_file =
12.direct_tools = []
13.auto_rag_topk = 0
14.auto_reranker_mode = "bge"
15.auto_emerge_rate = 0
16.auto_emerge_frequency = 0
17.workspace = false
18.pull_info = false
19.step_progress = false
20.change_policy_group = []
21.system_prompt_generator = "examples_hareru_simple.txt"
22.max_events = 100
23.events_threshold = 65536//压根不拉取event
24.events_Tw_normalization_factor = 0
25.dynamic_pipe_node = //这个得写代码里
26.pipes = //[{"",""}]
26.image_max=10
27.video_max=10
28.audio_max=10
29.multimedia_max=10
30.max_token=4096
31.model=gemini-3-pro-preview
32.model_type=gemini
```

