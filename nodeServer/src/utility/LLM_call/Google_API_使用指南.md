# Google Gemini API 使用指南

## 1. 基础类型
gemini-3.1-pro-preview
gemini-2.0-flash
gemini-2.5-flash
gemini-2.5-pro
gemini-3-pro-preview
gemini-3-flash-preview
### text (纯文本)
- **格式**: `string`
- **说明**: 最常用的类型。包含用户输入的提示词，或者模型生成的自然语言回复。

**JSON 示例**:
```json
{ "text": "帮我写一段 TypeScript 代码" }
```

---

## 2. 多模态媒体类型

### inlineData (内联数据 - 最常用)
- **格式**: `Object { mimeType: string, data: string }`
- **说明**: 直接把图片、音频、视频、PDF 等文件，转成 Base64 编码后随请求一起发送。
- **mimeType**: 必须精准指定（如 `image/jpeg`, `audio/mp3`, `application/pdf`）
- **data**: 纯 Base64 字符串（注意：不能包含 `data:image/jpeg;base64,` 这种前缀）

**JSON 示例**:
```json
{ "inlineData": { "mimeType": "image/png", "data": "iVBORw0KGgoAAAANSUhEUg..." } }
```

### fileData (文件引用 - 用于超大文件)
- **格式**: `Object { mimeType: string, fileUri: string }`
- **说明**: 如果文件太大（比如 1GB 的视频），不能转成 Base64 放在请求体里。需要先通过 Google 的 File API 传到谷歌服务器，拿到一个 URI，然后在这里引用。
  > **注**: 如果是走中转 API，有些中转平台可能不支持这个字段。

**JSON 示例**:
```json
{ "fileData": { "mimeType": "video/mp4", "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/xxxx" } }
```

---

## 3. 函数调用类型 (Function Calling / Tools)

### functionCall (模型发出指令)
- **格式**: `Object { name: string, args: object }`
- **说明**: 这是模型发给您的数据。当模型决定调用您提供的工具时，它不会返回 text，而是返回这个对象。
- **name**: 模型决定调用的函数名
- **args**: 模型从用户的话语中提取出来的、符合您预设规范的 JSON 参数

**JSON 示例**:
```json
{ "functionCall": { "name": "getWeather", "args": { "city": "Beijing" } } }
```

### functionResponse (您返回执行结果)
- **格式**: `Object { name: string, response: object }`
- **说明**: 这是您发给模型的数据。当您在后端（Express）执行完 `getWeather` 函数后，您把拿到的真实天气数据包装成这个对象，发回给模型。
- **name**: 您刚才执行的函数名
- **response**: 您查询到的结果，必须是一个 JSON Object

**JSON 示例**:
```json
{ "functionResponse": { "name": "getWeather", "response": { "temperature": "25℃", "condition": "Sunny" } } }
```

---

## 4. 代码执行类型 (高级功能)

这是 Gemini 比较特色的功能，当您在 tools 里开启了代码执行权限（`codeExecution`）时才会出现。

### executableCode (模型写的代码)
- **格式**: `Object { language: string, code: string }`
- **说明**: 模型遇到复杂数学题时，它自己写出了一段 Python 代码准备运行。

**JSON 示例**:
```json
{ "executableCode": { "language": "PYTHON", "code": "print(100 * 25)" } }
```

### codeExecutionResult (代码运行结果)
- **格式**: `Object { outcome: string, output: string }`
- **说明**: 紧跟在 `executableCode` 之后返回，表示谷歌的沙盒环境执行那段 Python 代码后得到的结果。

**JSON 示例**:
```json
{ "codeExecutionResult": { "outcome": "OUTCOME_OK", "output": "2500\n" } }
```

---

## 💻 总结：完整的 TypeScript Interface

在您的 `google_call.ts` 中，为了覆盖所有情况，最完整的 `Part` 接口应该是这样的：

```typescript
export interface Part {
  text?: string;

  inlineData?: {
    mimeType: string;
    data: string;
  };

  fileData?: {
    mimeType: string;
    fileUri: string;
  };

  functionCall?: {
    name: string;
    args: any;
  };

  functionResponse?: {
    name: string;
    response: any;
  };

  executableCode?: {
    language: 'PYTHON' | string;
    code: string;
  };

  codeExecutionResult?: {
    outcome: 'OUTCOME_OK' | 'OUTCOME_FAILED' | string;
    output: string;
  };
}
```

这就是 Part 的全部真相。
