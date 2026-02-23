该agent的工作模式决定，不可避免的，某步操作之前一定要获取某些东西

在一个线程内，这样设计：

```
1.异步操作(比如多functionCall/toolCall)通过创建一个新的TASK(全大写表示该数据结构是完全写在硬件层而不暴露给agent层的)，然后把当前任务放进WAITING队列里面
2.TASK表示正在执行的东西，其等待执行的回调将其放进COMPLETED
3.WATTING表示等待结果才能执行的东西，其等待的东西会去COMPLETED里面找
4.WATTING队列中每个成员会维护一个NEEDS数组，其记载了其需要返回的，NEEDS数组中的成员都是字符串
5.TASK执行完成后会将其SIGN继承给COMPLETED,这个SIGN其实就是WATTING-NEEDS需求的字符串
6.因为计算规模不超过1000个堆积在队列里，所以WATTING的检测纯纯是暴力算法，每个WATTING里面的对象区COMPLETED里面暴力搜一遍，搜完检测一下自己被满足没有(估算总共<100ms)
```

