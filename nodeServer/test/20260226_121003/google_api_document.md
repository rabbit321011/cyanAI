

## 1. 基础端点与鉴权

* **生成内容 (POST)**：`https://你的newapi服务器地址/v1beta/models/{model}:generateContent`
* **流式生成 (POST)**：`https://你的newapi服务器地址/v1beta/models/{model}:streamGenerateContent`
* **鉴权方式**：在请求的 URL 参数中追加 `?key=$NEWAPI_API_KEY`。
* **路径参数**：`model` 为必填项，格式为 `models/{model}`，例如 `models/gemini-2.0-flash`。

---

## 2. 请求体 (Request Body) 全景结构

### 2.1 核心内容载荷：`contents` (必填)

该字段是一个数组，包含了当前对话的历史记录和最新请求。

* **`role`** (可选)：内容的生产者，支持 `user`（用户）、`model`（模型）、`function`（函数）或 `tool`（工具）。
* **`parts`** (必填)：构成单个消息的有序内容片段数组。支持以下片段类型：
* `text`：纯文本内容。
* `inlineData`：内联媒体字节数据，需包含 `mimeType`（MIME类型）和 `data`（base64编码的媒体数据）。
* `fileData`：上传文件的 URI 引用，需包含 `mimeType` 和 `fileUri`。
* `functionCall` / `functionResponse`：用于请求或响应函数调用的数据。
* `executableCode` / `codeExecutionResult`：包含要执行的代码（如 Python）及代码执行的结果输出。



### 2.2 系统指令与缓存：`systemInstruction` & `cachedContent`

* **`systemInstruction`**：开发者设置的系统指令（System Prompt），格式为一个 `Content` 对象，目前仅支持文本。
* **`cachedContent`**：指定缓存内容的名称（格式：`cachedContents/{cachedContent}`），用于将已缓存内容作为预测上下文以节省 Token。

### 2.3 高级配置：`generationConfig`

该对象用于精细控制模型生成输出的行为。

* **基础参数**：
* `temperature` [0.0, 2.0]：控制输出随机性。
* `topP` / `topK`：控制抽样的累计概率和候选数量。
* `maxOutputTokens`：生成的 Token 数量上限。
* `stopSequences`：停止生成的字符序列集（最多5个）。
* `seed`、`presencePenalty`、`frequencyPenalty`：用于解码种子、存在性惩罚和频率惩罚。


* **结构化与 JSON 输出**：
* `responseMimeType`：强制输出格式，如 `text/plain`、`application/json` 或 `text/x.enum`。
* `responseSchema`：严格定义 JSON 响应的结构（支持定义 TYPE, properties, required, enum, format 等）。


* **进阶模式配置**：
* `responseModalities`：请求的响应模式，如 `TEXT`, `IMAGE`, `AUDIO`。
* `thinkingConfig`：思考功能配置。可设置 `includeThoughts` (是否包含思考过程) 和 `thinkingBudget` (想法 Token 预算)。
* `speechConfig`：语音生成配置。可定义 `languageCode` (如 `zh-CN`, `en-US` 等)、单音色 (`prebuiltVoiceConfig`) 或多音色输出 (`multiSpeakerVoiceConfig`)。
* `responseLogprobs` / `logprobs`：开启并设置导出的顶部 logprob 结果数量。
* `mediaResolution`：指定媒体分辨率，支持 `MEDIA_RESOLUTION_LOW` (64 tokens), `MEDIUM` (256 tokens), `HIGH`。



### 2.4 工具扩展：`tools` & `toolConfig`

赋予模型调用外部能力或执行代码的权限。

* **`tools` 数组**：
* `functionDeclarations`：声明可用函数，包含 `name` (函数名)、`description` (描述) 和 `parameters` (JSON Schema 格式的参数结构)。
* `codeExecution`：传入空对象 `{}` 即可启用模型生成并执行 Python 代码的功能。


* **`toolConfig` 工具配置**：
* `functionCallingConfig`：控制函数调用策略。`mode` 枚举值包括 `AUTO` (模型自动决定)、`ANY` (必须调用)、`NONE` (禁止调用)。支持通过 `allowedFunctionNames` 限制特定函数。



### 2.5 多模态输入限制说明

当处理图像、音频、视频或 PDF 时，API 接受多种 MIME 类型。
**重要限制**：对于音频、视频和 PDF 的处理，目前仅支持通过 `inline_data` 以 base64 方式上传，不支持 `file_data.file_uri` 或 File API。

### 2.6 安全设置：`safetySettings`

用于屏蔽不安全内容，由一系列类别和阈值规则构成。

* **`category` (安全类别)**：如骚扰 (`HARM_CATEGORY_HARASSMENT`)、仇恨言论 (`HARM_CATEGORY_HATE_SPEECH`)、露骨色情 (`HARM_CATEGORY_SEXUALLY_EXPLICIT`)、危险内容 (`HARM_CATEGORY_DANGEROUS_CONTENT`)、破坏公民诚信 (`HARM_CATEGORY_CIVIC_INTEGRITY`) 等。
* **`threshold` (屏蔽阈值)**：如 `BLOCK_LOW_AND_ABOVE` (屏蔽低概率及以上)、`BLOCK_ONLY_HIGH` (仅屏蔽高风险)、`BLOCK_NONE` (允许所有) 或 `OFF` (完全关闭过滤器)。

---

## 3. 响应体 (Response Body) 深度解析

API 返回 `GenerateContentResponse` 对象，包含了生成内容、安全过滤状态及用量统计。

### 3.1 候选回答：`candidates`

模型生成的候选列表。每个 Candidate 对象包含：

* **`content`**：最终生成的内容，结构与请求中的 `contents` 对象一致。
* **`finishReason`**：停止生成的原因。关键枚举包括：`STOP` (自然停止)、`MAX_TOKENS` (达到上限)、`SAFETY` (触发安全拦截)、`BLOCKLIST` (触碰黑名单)、`PROHIBITED_CONTENT` (禁止内容)、`MALFORMED_FUNCTION_CALL` (函数调用无效) 等。
* **`safetyRatings`**：针对生成内容的具体安全评分（概率评估分为 `NEGLIGIBLE`, `LOW`, `MEDIUM`, `HIGH`），以及是否因此被屏蔽 (`blocked`)。
* **`citationMetadata`**：引用元数据，包含归因于特定来源的起始/结束索引和 `uri`。
* **`groundingMetadata` / `groundingAttributions**`：接地功能数据。当模型联网或检索数据时，提供从网络 (`webSearchQueries`, `searchEntryPoint`) 或特定来源检索到的支持块 (`groundingChunks`) 及置信度分数。
* **`logprobsResult` & `avgLogprobs**`：如果开启了 Logprobs，此处返回候选令牌的对数似然度得分。
* **`urlRetrievalMetadata`**：与网址情境检索工具相关的检索状态（如 `URL_RETRIEVAL_STATUS_SUCCESS`）。

### 3.2 提示反馈与计费元数据

* **`promptFeedback`**：记录输入提示词是否因为 `SAFETY`, `BLOCKLIST` 等原因被直接拦截。
* **`usageMetadata`**：提供详尽的 Token 消耗统计。包含：
* `promptTokenCount` (提示词)、`candidatesTokenCount` (生成词)、`totalTokenCount` (总计)。
* `cachedContentTokenCount` (缓存部分)、`toolUsePromptTokenCount` (工具使用)、`thoughtsTokenCount` (思考模型想法)。
* 以及按模态 (TEXT, IMAGE 等) 细分的 Token 详情清单。


* **`modelVersion`**：实际处理请求的模型版本。

---

## 4. 常见错误处理排查 (Error Handling)

API 返回的错误包含 `code`, `message`, `status` 及详细的 `details` 数组。

* **400 (`INVALID_ARGUMENT`)**：请求参数无效或格式错误（例如缺少必需的 `contents` 或 JSON Schema 结构不合法）。
* **400 (`FAILED_PRECONDITION`)**：请求的前置条件不满足。
* **401 (`UNAUTHENTICATED`)**：API 密钥无效、缺失或已过期。
* **403 (`PERMISSION_DENIED`)**：权限不足或配额已用完。
* **404 (`NOT_FOUND`)**：指定的模型名称或资源路径不存在。
* **413 (`PAYLOAD_TOO_LARGE`)**：请求体太大（例如放入了过大的多模态 Base64 数据）。
* **429 (`RESOURCE_EXHAUSTED`)**：请求频率超限或配额不足。
* **500 / 503 / 504**：代表服务器内部错误、服务暂时不可用或请求超时 (`DEADLINE_EXCEEDED`)，建议实施带退避机制的重试策略。

