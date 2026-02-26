# google_call.ts 使用说明

## 概述
`google_call.ts` 是用于调用 Google Gemini API 的 TypeScript 模块，支持多模态、函数调用等功能。

## 主要功能

### 1. callGoogleLLM - 发送请求到 Gemini API

**函数签名：**
```typescript
async function callGoogleLLM(
  request: EasyGeminiRequest,
  apiKey: string,
  model: string = 'gemini-2.0-flash',
  baseUrl: string = 'https://generativelanguage.googleapis.com'
): Promise<EasyGeminiResponse>
```

**参数说明：**
- `request`: 请求对象，包含对话内容、系统提示、工具等
- `apiKey`: API 密钥
- `model`: 模型名称，默认 'gemini-2.0-flash'
- `baseUrl`: API 基础 URL，默认官方地址

**返回值：**
```typescript
{
  text: string;                    // 模型回复的文本
  functionCalls?: Array<{          // 工具调用数组（如果有）
    name: string;
    args: any;
  }>;
  rawResponse?: any;              // 原始响应数据
}
```

**使用示例：**
```typescript
import { callGoogleLLM, EasyGeminiRequest } from './google_call';

const request: EasyGeminiRequest = {
  systemInstruction: "你是一个友好的助手",
  contents: [
    {
      role: 'user',
      parts: [
        { text: "你好！" }
      ]
    }
  ]
};

const response = await callGoogleLLM(
  request,
  'your-api-key',
  'gemini-3-flash-preview',
  'https://www.chataiapi.com/v1'
);

console.log(response.text);
```

**支持的功能：**
- ✅ 文本对话
- ✅ 多轮对话
- ✅ System Prompt（系统提示）
- ✅ 工具调用（Function Calling）
- ✅ 多模态（图片、音频、视频等）
- ✅ 代码执行
- ✅ 自动显示 Token 使用情况和成本

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
  'https://www.chataiapi.com/v1'
);

console.log('可用模型：', models);
```

---

### 3. getTokenUsage - 获取 API Key 余额和使用情况

**函数签名：**
```typescript
async function getTokenUsage(
  apiKey: string,
  baseUrl: string
): Promise<TokenUsageResponse>
```

**返回值：**
```typescript
{
  code: boolean;
  message: string;
  data?: {
    total_granted: number;      // 授予总量
    total_used: number;         // 已使用额度
    total_available: number;      // 可用剩余额度
    unlimited_quota: boolean;     // 是否无限额度
    expires_at: number;         // 过期时间
  };
}
```

**使用示例：**
```typescript
const usage = await getTokenUsage(
  'your-api-key',
  'https://www.chataiapi.com/v1'
);

console.log('可用剩余:', usage.data?.total_available);
```

---

## Token 使用情况显示

每次调用 `callGoogleLLM` 时，会自动显示 Token 使用情况和成本：

```
💾 Token 使用情况:
  输入 Token: 21(￥0.000006)
  输出 Token: 20(￥0.000005)
  总计 Token: 201(￥0.000054)
```

**计算规则：**
- 600 美元 = 300,000,000 tokens
- 600 美元 = 80 人民币
- 自动计算每次请求的成本

---

## 常用模型

- `gemini-3-flash-preview` - 快速响应模型
- `gemini-3-pro-preview` - 专业模型
- `gemini-2.5-flash` - 快速模型
- `gemini-2.5-pro` - 专业模型

---

## 注意事项

1. **API Key 安全**：不要将 API Key 提交到代码仓库
2. **错误处理**：所有函数都会抛出错误，需要使用 try-catch 捕获
3. **URL 清理**：baseUrl 会自动清理末尾的 `/v1` 或 `/`
4. **安全设置**：默认关闭所有安全过滤，可根据需要调整

---

## 完整示例

```typescript
import { callGoogleLLM, EasyGeminiRequest } from './google_call';

async function main() {
  try {
    const request: EasyGeminiRequest = {
      systemInstruction: "你是一个资深的程序员",
      contents: [
        {
          role: 'user',
          parts: [
            { text: "解释一下 TypeScript 的泛型" }
          ]
        }
      ]
    };

    const response = await callGoogleLLM(
      request,
      'your-api-key',
      'gemini-3-flash-preview',
      'https://www.chataiapi.com/v1'
    );

    console.log('回复：', response.text);
  } catch (error) {
    console.error('请求失败：', error);
  }
}

main();
```
