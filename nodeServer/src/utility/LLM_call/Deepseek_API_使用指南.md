# DeepSeek API 使用指南

## 1. 基础模型
- **deepseek-chat**: DeepSeek-V3.2 (非思考模式)
- **deepseek-reasoner**: DeepSeek-V3.2 (思考模式)

## 2. 消息类型 (Messages)

### system (系统提示)
- **格式**: `Object { role: 'system', content: string }`
- **说明**: 设置助手的行为、语气、回答风格等系统级提示词。
- **content**: 系统提示内容，字符串类型。

**JSON 示例**:
```json
{ "role": "system", "content": "你是一个资深的程序员，请用幽默的语气回答" }
```

---

## 3. 用户消息 (user)
- **格式**: `Object { role: 'user', content: string }`
- **说明**: 用户的输入内容。
- **content**: 用户的文本内容。

**JSON 示例**:
```json
{ "role": "user", "content": "TypeScript中的 Interface 和 Type 有什么区别？" }
```

---

## 4. 助手消息 (assistant)
- **格式**: `Object { role: 'assistant', content: string | null, tool_calls?: ToolCall[] }`
- **说明**: 模型的回复内容，可能包含工具调用。
- **content**: 助手的回复，字符串或 null。
- **tool_calls**: 工具调用数组，当模型决定调用工具时出现。

**JSON 示例 (纯文本回复):
```json
{
  "role": "assistant",
  "content": "哈哈，这简直是 TypeScript 界的"可口可乐 vs 百事可乐"之争！"
}
```

**JSON 示例 (工具调用):
```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "getWeather",
        "arguments": "{\"city\":\"Beijing\"}"
      }
    }
  ]
}
```

---

## 5. 工具回复 (tool)
- **格式**: `Object { role: 'tool', content: string, tool_call_id: string }`
- **说明**: 您执行完工具后返回给模型的结果。
- **content**: 工具执行的结果，字符串类型。
- **tool_call_id**: 对应的工具调用的 id，用于匹配。

**JSON 示例**:
```json
{
  "role": "tool",
  "content": "{\"temperature\": \"25℃\", \"condition\": \"Sunny\"}",
  "tool_call_id": "call_abc123"
}
```

---

## 6. 工具声明 (Tools / Function Declarations)

### Tool (工具)
- **格式**: `Object { type: 'function', function: FunctionDeclaration }`
- **说明**: 声明模型可以调用的工具。
- **type**: 固定为 'function'。
- **function**: 函数声明对象。

### FunctionDeclaration (函数声明)
- **格式**: `Object { name: string, description: string, parameters: any }`
- **name**: 函数名称。
- **description**: 函数描述，告诉模型这个函数是做什么的。
- **parameters**: 函数参数的 JSON Schema 定义。

**JSON 示例**:
```json
{
  "type": "function",
  "function": {
    "name": "getWeather",
    "description": "获取指定城市的天气信息",
    "parameters": {
      "type": "object",
      "properties": {
        "city": {
          "type": "string",
          "description": "城市名称"
        }
      },
      "required": ["city"]
    }
  }
}
```

---

## 7. 请求参数 (Request Parameters)

### temperature (温度)
- **格式**: `number`
- **说明**: 控制输出的随机性。
- **推荐值**:
  - 代码生成/数学解题: 0.0
  - 数据抽取/分析: 1.0
  - 通用对话: 1.3
  - 翻译: 1.3
  - 创意类写作/诗歌创作: 1.5

### top_p
- **格式**: `number`
- **说明**: 核采样参数，控制输出的多样性。

### max_tokens
- **格式**: `number`
- **说明**: 最大输出 token 数。
- **默认值**: deepseek-chat 默认 4K，最大 8K; deepseek-reasoner 默认 32K，最大 64K。

### response_format (响应格式)
- **格式**: `Object { type: 'text' | 'json_object' }`
- **说明**: 控制响应格式。
- **type**: 'text' 为纯文本，'json_object' 为 JSON 格式。

**JSON 示例**:
```json
{ "response_format": { "type": "json_object" }
```

---

## 8. 完整的 TypeScript Interface

在您的 `deepseek_call.ts` 中，为了覆盖所有情况，最完整的类型定义如下：

```typescript
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: any;
}

export interface Tool {
  type: 'function';
  function: FunctionDeclaration;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface DeepSeekRequest {
  messages: Message[];
  model?: string;
  tools?: Tool[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface Choice {
  index: number;
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}
```

这就是 DeepSeek API 的全部真相。
