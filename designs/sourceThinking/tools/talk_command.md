模型调用需要加问或其他情况下的时候，可以使用talk_command方式，具体为

cyanAI：

```
思考过程xxxx
^talk_command xxx 我调用xxx工具，执行xxx参数
```

再加入

```
^system 已经载入工具xxx,请按刚刚你刚刚用talk_command的意图，现在马上调用你想调用的工具
```

cyanAI:

```
toolsCalls:
xxxx
```

到这里删记忆(删^system和toolsCalls)，把toolsCalls的结果为result

```
^system 调用结果为:result
```

如果cyanAI没进行toolsCalls,重试两次（加上一开始的共三次机会）,还不行则放弃stackBreak,将其作为主状态继续