使用Qwen3-Reranker-0.6B + Qwen3-Embedding-0.6B + LanceDB

使用查询转换（Query Transformation）或查询重写/扩展（Query Rewriting / Expansion）

每种转换方式的最后占比大概是

```
55% 原问题检索
15% Step-back
15% Sub
15% ReWrite
```

最后获取到信息以后，再由reranker模型来检索

暂且估算reranker每秒能处理20对消息(如果是1500字的长文本里面检索，那么是6对/秒)

那么加载时间设为reranker_time

筛选下的消息数就应该是reranker_time*20（或者6

基于消息数再决定给各个方式留的详细消息数量

实际上，RAG相关的是通过python服务器来管理

python服务器应该能通过文件检索



也可以不启用查询转换，或者说，查询转换应该只是tool可选的一个预设

检索也会在多个库里检索，这些东西应该以预设为主，自定义为辅给tools



tools应该有两个接口，一个接口可以调用预设，一个接口使用自定义的参数来搜索