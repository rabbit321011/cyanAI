# deepseek_call.ts 使用说明

## 概述
`deepseek_call.ts` 是用于调用 DeepSeek API 的 TypeScript 模块，基于 OpenAI 兼容格式，支持对话、工具调用、JSON 输出等功能。

## 主要功能

### 1. callDeepSeekLLM - 发送请求到 DeepSeek API

**函数签名：**
```typescript
async function callDeepSeekLLM(
  request: DeepSeekRequest,
  apiKey: string,
  model: string = 'deepseek-chat',
  baseUrl: string = 'https://api.deepseek.com'
): Promise<EasyDeepSeekResponse>
```

**参数说明：**
- `request`: 请求对象，包含消息、工具、配置等
- `apiKey`: API 密钥
- `model`: 模型名称，默认 'deepseek-chat'
- `baseUrl`: API 基础 URL，默认官方地址

**返回值：**
```typescript
{
  text: string;                    // 模型回复的文本
  functionCalls?: Array<{          // 工具调用数组（如果有）
    name: string;
    args: any;
  }>;
  usage?: Usage;                  // Token 使用情况
  rawResponse?: any;              // 原始响应数据
}
```

**使用示例：**
```typescript
import { callDeepSeekLLM, DeepSeekRequest } from './deepseek_call';

const request: DeepSeekRequest = {
  messages: [
    {
      role: 'system',
      content: '你是一个资深的程序员'
    },
    {
      role: 'user',
      content: '解释一下 TypeScript 的泛型'
    }
  ],
  temperature: 1.3
};

const response = await callDeepSeekLLM(
  request,
  'your-api-key',
  'deepseek-chat',
  'https://api.deepseek.com'
);

console.log(response.text);
console.log('Token 使用：', response.usage);
```

**支持的功能：**
- ✅ 文本对话
- ✅ 多轮对话
- ✅ System Prompt（系统提示）
- ✅ 工具调用（Tool Calls）
- ✅ JSON 输出模式
- ✅ 返回 Token 使用统计

---

### 2. getAvailableModels - 获取可用模型列表

**函数签名：**
```typescript
async function getAvailableModels(
  apiKey: string,
  baseUrl: string
): Promise<string[]>
```

**使用示例：**
```typescript
const models = await getAvailableModels(
  'your-api-key',
  'https://api.deepseek.com'
);

console.log('可用模型：', models);
```

---

## 请求参数详解

### messages - 消息数组

```typescript
{
  messages: [
    {
      role: 'system',
      content: '你是一个友好的助手'
    },
    {
      role: 'user',
      content: '你好！'
    },
    {
      role: 'assistant',
      content: '你好！有什么我可以帮助你的吗？'
    },
    {
      role: 'user',
      content: '今天天气怎么样？'
    }
  ]
}
```

**支持的角色：**
- `system` - 系统提示，设置助手行为
- `user` - 用户消息
- `assistant` - 助手回复
- `tool` - 工具执行结果

---

### tools - 工具声明

```typescript
{
  tools: [
    {
      type: 'function',
      function: {
        name: 'getWeather',
        description: '获取指定城市的天气信息',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: '城市名称'
            }
          },
          required: ['city']
        }
      }
    }
  ]
}
```

---

### temperature - 温度参数

控制输出的随机性：
- `0.0` - 代码生成/数学解题
- `1.0` - 数据抽取/分析
- `1.3` - 通用对话
- `1.5` - 创意类写作/诗歌创作

---

### response_format - 响应格式

```typescript
{
  response_format: {
    type: 'json_object'  // 或 'text'
  }
}
```

---

## Token 使用统计

响应中包含详细的 Token 使用信息：

```typescript
{
  usage: {
    prompt_tokens: 33,              // 输入 Token
    completion_tokens: 183,         // 输出 Token
    total_tokens: 216,              // 总计 Token
    prompt_cache_hit_tokens?: 100,   // 缓存命中 Token
    prompt_cache_miss_tokens?: 233    // 缓存未命中 Token
  }
}
```

---

## 常用模型

- `deepseek-chat` - DeepSeek-V3.2 非思考模式（128K 上下文）
- `deepseek-reasoner` - DeepSeek-V3.2 思考模式（128K 上下文）

**输出长度：**
- `deepseek-chat`: 默认 4K，最大 8K
- `deepseek-reasoner`: 默认 32K，最大 64K

---

## 工具调用完整示例

```typescript
import { callDeepSeekLLM, DeepSeekRequest } from './deepseek_call';

async function toolCallExample() {
  const request: DeepSeekRequest = {
    messages: [
      {
        role: 'user',
        content: '北京今天天气怎么样？'
      }
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'getWeather',
          description: '获取指定城市的天气信息',
          parameters: {
            type: 'object',
            properties: {
              city: {
                type: 'string',
                description: '城市名称'
              }
            },
            required: ['city']
          }
        }
      }
    ]
  };

  const response = await callDeepSeekLLM(
    request,
    'your-api-key',
    'deepseek-chat'
  );

  if (response.functionCalls) {
    for (const call of response.functionCalls) {
      console.log('调用函数：', call.name);
      console.log('参数：', call.args);
      
      // 执行函数
      const result = await executeFunction(call.name, call.args);
      
      // 将结果返回给模型
      const followUpRequest: DeepSeekRequest = {
        messages: [
          ...request.messages,
          {
            role: 'assistant',
            content: null,
            tool_calls: response.rawResponse.choices[0].message.tool_calls
          },
          {
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: response.rawResponse.choices[0].message.tool_calls[0].id
          }
        ]
      };
      
      const finalResponse = await callDeepSeekLLM(
        followUpRequest,
        'your-api-key',
        'deepseek-chat'
      );
      
      console.log('最终回复：', finalResponse.text);
    }
  } else {
    console.log('回复：', response.text);
  }
}

toolCallExample();
```

---

## JSON 输出示例

```typescript
const request: DeepSeekRequest = {
  messages: [
    {
      role: 'system',
      content: '你是一个数据提取助手，请以 JSON 格式返回结果'
    },
    {
      role: 'user',
      content: '从以下文本中提取人名和年龄：张三今年25岁，李四30岁'
    }
  ],
  response_format: {
    type: 'json_object'
  }
};

const response = await callDeepSeekLLM(request, apiKey);
console.log(response.text);
// 输出：{"people":[{"name":"张三","age":25},{"name":"李四","age":30}]}
```

---

## 注意事项

1. **API Key 安全**：不要将 API Key 提交到代码仓库
2. **错误处理**：所有函数都会抛出错误，需要使用 try-catch 捕获
3. **URL 清理**：baseUrl 会自动清理末尾的 `/v1` 或 `/`
4. **流式输出**：当前版本不支持流式输出，stream 固定为 false
5. **参数验证**：确保工具的 parameters 符合 JSON Schema 规范

---

## 完整示例

```typescript
import { callDeepSeekLLM, DeepSeekRequest } from './deepseek_call';

async function main() {
  try {
    const request: DeepSeekRequest = {
      messages: [
        {
          role: 'system',
          content: '你是一个资深的程序员，请用幽默的语气回答'
        },
        {
          role: 'user',
          content: 'TypeScript 中的 Interface 和 Type 有什么区别？'
        }
      ],
      temperature: 1.3
    };

    const response = await callDeepSeekLLM(
      request,
      'your-api-key',
      'deepseek-chat',
      'https://api.deepseek.com'
    );

    console.log('回复：', response.text);
    console.log('Token 使用：', response.usage);
  } catch (error) {
    console.error('请求失败：', error);
  }
}

main();
```

---

## 与 Google API 的区别

| 特性 | Google API | DeepSeek API |
|------|-----------|--------------|
| 消息格式 | `contents: [{role, parts}]` | `messages: [{role, content}]` |
| System Prompt | `systemInstruction` 字段 | `messages` 中的 `system` 角色 |
| 工具调用 | `functionCall` | `tool_calls` |
| Token 统计 | `usageMetadata` | `usage` |
| 多模态 | 支持 | 不支持 |
| 代码执行 | 支持 | 不支持 |
