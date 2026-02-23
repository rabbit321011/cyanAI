entries，条目，简称ent

是本项目中常用的通用格式，用于承载 agent 的记忆与状态日志。
为了保证数据的健壮性以及读写的高效性，底层采用 **JSON Lines (JSONL)** 规范。
即：文件中的每一行都是一个独立的、经过压缩的合法 JSON 对象，不能包含多行换行（文本内部的换行使用 `\n` 转义）。

其原始文本结构如下（每行一条）：

```
{"memory_state":{"R":1,"S":2,"last_T_distance":"10s","D":3,"a":4},"current":"Hello CyanAI, 这是一个测试文本。","extraCurrent":{"source":"user"},"TIMESET":"20260223_143045"} {"memory_state":{"R":2,"S":3,"last_T_distance":"1min","D":0,"a":1},"current":"第二条转义后的内容\\n带有换行","extraCurrent":{},"TIMESET":"20260223_143500"} 
```

字段详细说明：

- **memory_state**: (Object) 存储的记忆状态。
  - `R`, `S`, `D`, `a`: (Number) 状态相关的数值变量。
  - `last_T_distance`: (String) 时间距离描述文本，严格遵循 `cyan_time.ts` 中定义的时间格式（如 "10s", "1min", "timestamp" 等）。
- **current**: (String) agent 看到的实际内容。这是一个被完全转义的字符串（包含换行符、引号等特殊字符的正确转义）。
- **extraCurrent**: (Object) 承载额外信息的灵活对象。
- **TIMESET**: (String) 附带的绝对时间戳，格式严格为 `YYYYMMDD_HHMMSS`