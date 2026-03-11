# 多 part 消息功能逻辑检查

## 1. QQ 消息接收流程

### handleEvent (qq.ts)
```
收到 QQ 消息事件
    ↓
解析 event.message 数组
    ↓
提取 text segments → textParts[]
提取 image segments → 下载图片 → base64 → inlines[]
    ↓
合并文本: combinedText = textParts.join('')
    ↓
如果 combinedText 或 inlines 不为空:
    调用 QQtrackTextExecute(qq_num, qq_name, combinedText, inlines)
```

**检查点:**
- ✅ 支持多 segment 消息（文本+图片混合）
- ✅ 图片下载使用 axios
- ✅ 转换为 base64
- ✅ 空消息过滤

## 2. QQ 消息处理流程

### QQtrackTextExecute (qq.ts)
```
检查 busy 状态
    ↓
如果 busy:
    加入 wait_queue
    返回 "消息已加入等待队列"
否则:
    构建消息文本:
        - 文本+图片: "QQ联系人:{name}({num})发来了消息:{text}"
        - 纯文本: "QQ联系人:{name}({num})发来了消息:{text}"
        - 纯图片: "QQ联系人:{name}({num})发来了图片"
    调用 addQueueMessage(message, 'system', [], inlines)
    调用 sendAll()
    返回 "消息已发送"
```

**检查点:**
- ✅ 支持 busy 状态检测
- ✅ 支持消息队列
- ✅ 消息文本根据内容类型变化
- ✅ 传递 inlines 给 addQueueMessage

### QQidleSignal (qq.ts)
```
检查 busy 状态（应该为 false）
    ↓
如果 wait_queue 为空:
    返回 "等待队列为空"
    ↓
遍历 wait_queue:
    构建消息文本（同上）
    调用 addQueueMessage(message, 'system', [], item.inlines)
    ↓
清空 wait_queue
    ↓
调用 sendAll()
    ↓
返回 "等待队列已处理"
```

**检查点:**
- ✅ 逐条处理队列消息
- ✅ 每条消息单独调用 addQueueMessage
- ✅ 最后统一调用 sendAll

## 3. 消息添加到队列

### addQueueMessage (main_virtual.ts)
```
检查 main_status 是否存在
    ↓
如果不存在，调用 getCoreStateForFile() 初始化
    ↓
调用 addMessageFromString(send_curr, "user", user_name, files, inlines)
    ↓
返回 "消息已加入队列"
```

**检查点:**
- ✅ 自动初始化状态
- ✅ role_type 为 "user"
- ✅ 传递 inlines

### addMessageFromString (main_virtual.ts)
```
创建 Message 对象:
    current: addition (消息文本)
    role_type: type ("user")
    role: name
    time: now()
    file: files
    inline: inlines
    toolsCalls: []
    toolsResponse: []
    ↓
添加到 main_status.context
    ↓
返回 "执行完成"
```

**检查点:**
- ✅ 正确设置所有字段
- ✅ inline 字段保存 inlines

## 4. 消息发送流程

### sendAll (main_virtual.ts)
```
设置 main_virtual_busy = true
    ↓
验证:
    - verify_context() - 检查上下文合法性
    - verify_chatable() - 检查最后一条是否是 user
    - main_status 是否存在
    ↓
构建系统提示词
    ↓
构建 content_temp (Google API 格式):
    遍历 main_status.context:
        如果和上一条 role_type 相同:
            合并到同一个 content_unit
        否则:
            创建新的 content_unit
        
        添加 parts:
            - text: 消息文本
            - inlineData: 图片数据
            - functionCall: model 类型的 toolsCalls
            - functionResponse: user 类型的 toolsResponse
    ↓
调用 Google API
    ↓
处理响应:
    如果有 functionCalls:
        创建 functionCallMessage (role_type: 'model')
        添加到 context
        执行工具
        创建 functionResponseMessage (role_type: 'user')
        添加到 context
        重新构建请求并发送
    否则:
        添加 model 回复到 context
        ↓
保存状态
设置 main_virtual_busy = false
调用 QQidleSignal()
```

**检查点:**
- ✅ 消息合并逻辑（相同 role_type）
- ✅ 正确处理 inlineData
- ✅ functionCall 由 model 发出
- ✅ functionResponse 由 user 发出
- ✅ 不混合 functionCall 和 functionResponse

## 5. 验证函数

### verify_context (main_virtual.ts)
```
检查:
    - main_status 是否存在
    - context 是否为空
    - context 长度是否 >= 2
    - 是否有连续的 model（不允许）
    - 最后一条必须是 user
```

**检查点:**
- ✅ 支持多 part（允许连续 user）
- ✅ 不允许连续 model
- ✅ 最后一条必须是 user

### verify_chatable (main_virtual.ts)
```
检查:
    - main_status 是否存在
    - context 是否为空
    - 最后一条 role_type 是否是 "user"
```

**检查点:**
- ✅ 只有最后一条是 user 时才可发送

### context_back (main_virtual.ts)
```
从尾部删除 Message，直到:
    - 最后一条是 user
    - 或 context 为空
```

**检查点:**
- ✅ 正确回退到 user 类型

## 6. 数据流总结

```
QQ 消息接收:
    QQ 用户发送消息（文本/图片）
        ↓
    handleEvent 解析
        ↓
    QQtrackTextExecute 处理
        ↓
    addQueueMessage 添加到队列
        ↓
    addMessageFromString 创建 Message
        ↓
    Message 保存到 main_status.context
        ↓
    sendAll 发送
        ↓
    合并相同 role_type 的消息
        ↓
    构建 Google API 请求（包含 inlineData）
        ↓
    发送到 Google API
```

## 7. 关键数据结构

### Message (process.type.ts)
```typescript
interface Message {
    current: string;           // 消息文本
    role_type: string;         // "user" 或 "model"
    role: string;              // 发送者名称
    time: string;              // 时间戳
    file: string[];            // 文件路径数组
    inline: inlineData[];      // 内联数据（图片等）
    toolsCalls: functionCall[];      // 工具调用（model 才有）
    toolsResponse: functionResponse[]; // 工具响应（user 才有）
}
```

### inlineData (process.type.ts)
```typescript
interface inlineData {
    mimeType: string;  // 如 "image/jpeg"
    data: string;      // base64 数据
}
```

### content_unit (main_virtual.ts)
```typescript
interface content_unit {
    role: string;      // "user" 或 "model"
    parts: Part[];     // Google API 的 Part 数组
}
```

### Part (Google API)
```typescript
interface Part {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
    functionCall?: {...};
    functionResponse?: {...};
}
```

## 8. 潜在问题检查

### 问题 1: 图片 MIME 类型
**现状**: 所有图片都使用 `image/jpeg`
**风险**: 如果 QQ 发送的是 PNG 或其他格式，可能导致 API 错误
**建议**: 根据图片实际格式设置 MIME 类型

### 问题 2: 图片下载失败
**现状**: 下载失败时只打印错误，不通知用户
**风险**: 用户发送图片但 AI 看不到，可能导致困惑
**建议**: 添加错误处理，通知用户图片下载失败

### 问题 3: 大图片处理
**现状**: 没有限制图片大小
**风险**: 大图片可能导致内存问题或 API 错误
**建议**: 添加图片大小限制或压缩

### 问题 4: 并发消息
**现状**: 快速发送多条消息时，busy 状态可能不准确
**风险**: 消息可能丢失或顺序错乱
**建议**: 测试并发场景

## 9. 测试覆盖

### 已测试
- ✅ 基础消息存储
- ✅ 多 part 消息（文本+图片）
- ✅ 消息队列
- ✅ 消息合并逻辑
- ✅ 验证函数

### 未测试（需要实际环境）
- ⬜ QQ WebSocket 连接
- ⬜ 真实图片下载
- ⬜ Google API 调用（真实 base64）
- ⬜ 工具调用流程
- ⬜ 并发消息处理

## 10. 结论

整体逻辑正确，主要功能已实现。需要注意：
1. 图片 MIME 类型可能需要根据实际格式调整
2. 错误处理可以进一步完善
3. 需要实际环境测试完整流程
