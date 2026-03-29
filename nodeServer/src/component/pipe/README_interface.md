# Pipe 系统接口说明

本文档说明 pipe 系统中各个接口的结构和作用。

---

## 接口类型列表

| 类型名称 | 用途 | 定义位置 |
|---------|------|---------|
| `string` | 简单字符串 | 基础类型 |
| `number` | 数字 | 基础类型 |
| `multi_contact_multimedia_message_array` | 多联系人多媒体消息数组 | process.type.ts |
| `standard_message_pack` | 标准消息包 | process.type.ts |

---

## 详细说明

### 1. string

简单字符串类型，用于传递纯文本信息。

```typescript
type string
```

**使用场景：**
- 最终输出文本消息
- 简单文本转换

---

### 2. number

数字类型。

```typescript
type number
```

**使用场景：**
- 数值计算
- 数值转换（如 numToString converter）

---

### 3. multi_contact_multimedia_message_array

多联系人多媒体消息数组，用于承载来自多个联系人的消息。

```typescript
interface multi_contact_multimedia_message_array {
    messages: multi_contact_multimedia_message[];
}

interface multi_contact_multimedia_message {
    id: string;              // 联系人标识（如QQ号）
    name: string;            // 联系人名字
    parts: multimedia_message[];  // 消息部分数组
}

interface multimedia_message {
    type: 'text' | 'image';  // 消息类型
    content: string;         // 内容（文本或图片描述）
    inline?: inlineData;     // 内联数据（图片时使用）
}

interface inlineData {
    mimeType: string;        // MIME类型，如 "image/jpeg"
    data: string;            // 纯base64字符串，不含前缀
}
```

**使用场景：**
- QQ消息接收（main_qq_messages）
- 消息过滤（id_filter）
- 消息处理（command_multi_contact_multimedia_message）
- QQ消息发送（auto_qq_send, send_message_specific_qq）

**示例：**
```json
{
    "messages": [
        {
            "id": "12345678",
            "name": "张三",
            "parts": [
                { "type": "text", "content": "你好" },
                { "type": "image", "content": "[图片]", "inline": { "mimeType": "image/jpeg", "data": "base64..." } }
            ]
        }
    ]
}
```

---

### 4. standard_message_pack

标准消息包，用于向 cyanAI 内核发送消息。

```typescript
interface standard_message_pack {
    items: QueueMessageInput[];
}

interface QueueMessageInput {
    send_curr: string;       // 文本内容
    user_name: string;       // 发送者名字
    files: string[];         // 文件路径数组（完整路径）
    inlines: inlineData[];   // 内联文件数组（base64）
}
```

**使用场景：**
- 向 cyanAI 内核发送消息（directly_call_cyanAI）
- 消息格式转换（mulcontect_gemini_messages）

**与 multi_contact_multimedia_message_array 的区别：**

| 特性 | multi_contact_multimedia_message_array | standard_message_pack |
|-----|---------------------------------------|----------------------|
| 联系人标识 | `id` + `name` | 只有 `user_name` |
| 消息结构 | `parts` 数组（一条消息多个部分） | 扁平结构 |
| 文件支持 | 只有 `inline` | `files` + `inlines` |
| 用途 | 外部消息接收/发送 | 内核消息处理 |

**示例：**
```json
{
    "items": [
        {
            "send_curr": "你好",
            "user_name": "张三(12345678)",
            "files": [],
            "inlines": [
                { "mimeType": "image/jpeg", "data": "base64..." }
            ]
        }
    ]
}
```

---

## Converter 接口转换关系

```
multi_contact_multimedia_message_array
    │
    ├── [id_filter] ──→ multi_contact_multimedia_message_array（过滤特定联系人）
    │
    ├── [command_multi_contact_multimedia_message] ──→ multi_contact_multimedia_message_array（处理命令）
    │
    └── [mulcontect_gemini_messages] ──→ standard_message_pack（转换为内核格式）

number
    │
    └── [numToString] ──→ string
```

---

## Output 接口对应关系

| Output | 输入类型 | 说明 |
|--------|---------|------|
| auto_qq_send | multi_contact_multimedia_message_array | 自动发送到消息中的id |
| send_message_specific_qq | multi_contact_multimedia_message_array | 发送到runtime_data指定的QQ |
| directly_call_cyanAI | standard_message_pack | 直接调用cyanAI内核 |
| error_out | any | 错误输出 |
| example | string | 示例输出 |
