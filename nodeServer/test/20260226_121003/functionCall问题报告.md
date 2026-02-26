# FunctionCall 问题报告

## 问题描述

在使用 Google Gemini API 进行 functionCall 时，遇到以下错误：

```
Function call is missing a thought_signature in functionCall parts. This is required for tools to work correctly, and missing thought_signature may lead to degraded model performance. Additional data, function call `default_api:any-example` , position 2. Please refer to `https://***.dev/***/***/***` for more details.
```

## 已知事实

### 1. 代码结构

- **main_virtual.ts**：核心业务逻辑文件，处理对话上下文和工具调用
- **google_call.ts**：封装 Google Gemini API 调用逻辑
- **main.json**：存储工具定义，作为 tools 输入来源

### 2. 已实现的功能

1. **工具配置读取**：成功读取 main.json 中的工具定义
2. **functionCall 处理**：能够接收模型的函数调用请求
3. **工具执行**：能够执行工具并返回结果
4. **thought_signature 支持**：
   - 在 functionCall 接口中添加了 thought_signature 字段
   - 在构建 functionCall 时设置了默认值：`调用了${工具名称}`

### 3. 测试结果

- **工具配置**：成功读取，包含 any-example 工具
- **函数调用**：模型能够正确调用 any-example 工具
- **工具执行**：工具执行成功，返回了执行结果
- **请求结构**：构建的请求包含了 thought_signature 字段

### 4. 完整请求结构

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "^默认用户名:20260226_183844:test"
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "functionCall": {
            "name": "any-example",
            "args": {
              "requirement_text": "开始测试",
              "wait_mode": false
            },
            "thought_signature": "调用了any-example"
          }
        }
      ]
    },
    {
      "role": "function",
      "parts": [
        {
          "functionResponse": {
            "name": "any-example",
            "response": {
              "result": "该工具已经在执行,执行完成后你将会收到提醒。任务序号:430424604785900"
            }
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 2000
  },
  "tools": [
    {
      "functionDeclarations": [
        {
          "name": "any-example",
          "description": "这个工具会检测functionCall功能是否正常,其是通过测试functionCall的子功能test_function是否正常来运行的",
          "parameters": {
            "type": "object",
            "properties": {
              "requirement_text": {
                "type": "string",
                "description": "用自然语言描述你的需求,在这个工具里，你说：开始测试。就行"
              },
              "wait_mode": {
                "type": "boolean",
                "description": "如果该参数为true,那么就会阻断当前对话,等待执行完成再返回结果,如果为false,就不阻断当前对话,在执行结束后再弹出执行结果"
              }
            },
            "required": [
              "requirement_text"
            ]
          }
        }
      ]
    }
  ]
}
```

## 尝试过的解决方案

1. **添加 thought_signature 字段**：
   - 在 functionCall 接口中添加了 thought_signature 字段
   - 在构建 functionCall 时设置了默认值

2. **类型检查**：
   - 确保所有相关接口都正确定义了 thought_signature 字段
   - 检查了 part_unit 接口的定义

3. **调试信息**：
   - 添加了详细的调试日志，跟踪请求构建过程
   - 验证了 thought_signature 字段确实被添加到了请求中

## 可能的原因

1. **API 版本差异**：可能使用的 Google Gemini API 版本对 thought_signature 有特殊要求

2. **工具名称格式**：错误信息中提到 `default_api:any-example`，可能需要使用特定的命名空间格式

3. **类型转换问题**：
   - 使用的自定义 `content_unit` 类型可能与 Google Gemini API 期望的类型不完全匹配
   - 可能存在类型转换导致 thought_signature 被忽略的情况

4. **API 文档理解**：可能对 Google Gemini API 的 functionCall 格式理解有误

## 参考文件

1. **E:\MyProject\cyanAI\nodeServer\test\20260226_121003\Google Gemini格式最详细文档.md**：Google Gemini API 的函数调用格式文档

2. **E:\MyProject\cyanAI\nodeServer\src\utility\LLM_call\google_call.ts**：封装 Google Gemini API 调用的核心文件

3. **E:\MyProject\cyanAI\nodeServer\src\component\process\main_virtual.ts**：处理对话上下文和工具调用的核心业务逻辑文件

4. **E:\MyProject\cyanAI\nodeServer\src\component\erogenous_zone\main_virtual\main.json**：工具定义文件

5. **E:\MyProject\cyanAI\nodeServer\src\types\process\process.type.ts**：类型定义文件

## 建议的解决方案

1. **检查 API 版本**：确保使用的 Google Gemini API 版本支持 thought_signature 字段

2. **尝试命名空间格式**：
   - 在工具名称前添加 `default_api:` 前缀
   - 例如：将 `any-example` 改为 `default_api:any-example`

3. **类型转换**：
   - 确保 `content_unit` 和 `part_unit` 类型与 Google Gemini API 期望的类型完全匹配
   - 检查 `callGoogleLLM` 函数中的类型处理逻辑

4. **API 文档验证**：
   - 仔细阅读 Google Gemini API 的官方文档，确保 functionCall 格式正确
   - 特别关注 thought_signature 字段的要求

5. **调试工具**：
   - 使用网络抓包工具（如 Fiddler 或 Chrome 开发者工具）查看实际发送的 HTTP 请求
   - 验证 thought_signature 字段是否真的被发送到了服务器
