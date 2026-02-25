# 首次调用 API | DeepSeek API Docs

Source: https://api-docs.deepseek.com/zh-cn/
Date: 2026-02-25 20:40:25

---

首次调用 API | DeepSeek API Docs


[跳到主要内容](#__docusaurus_skipToContent_fallback)

[![DeepSeek API 文档 Logo](https://cdn.deepseek.com/platform/favicon.png)

**DeepSeek API 文档**](/zh-cn/)

[中文（中国）](#)

* [English](/)
* [中文（中国）](/zh-cn/)

[DeepSeek Platform](https://platform.deepseek.com/)

* [快速开始](#)

  + [首次调用 API](/zh-cn/)
  + [模型 & 价格](/zh-cn/quick_start/pricing)
  + [Temperature 设置](/zh-cn/quick_start/parameter_settings)
  + [Token 用量计算](/zh-cn/quick_start/token_usage)
  + [限速](/zh-cn/quick_start/rate_limit)
  + [错误码](/zh-cn/quick_start/error_codes)
* [新闻](#)

  + [DeepSeek-V3.2 正式版发布 2025/12/01](/zh-cn/news/news251201)
  + [DeepSeek-V3.2-Exp 发布 2025/09/29](/zh-cn/news/news250929)
  + [DeepSeek V3.1 更新 2025/09/22](/zh-cn/news/news250922)
  + [DeepSeek V3.1 发布 2025/08/21](/zh-cn/news/news250821)
  + [DeepSeek-R1-0528 发布 2025/05/28](/zh-cn/news/news250528)
  + [DeepSeek-V3-0324 发布 2025/03/25](/zh-cn/news/news250325)
  + [DeepSeek-R1 发布 2025/01/20](/zh-cn/news/news250120)
  + [DeepSeek APP 发布 2025/01/15](/zh-cn/news/news250115)
  + [DeepSeek-V3 发布 2024/12/26](/zh-cn/news/news1226)
  + [DeepSeek-V2.5-1210 发布 2024/12/10](/zh-cn/news/news1210)
  + [DeepSeek-R1-Lite 发布 2024/11/20](/zh-cn/news/news1120)
  + [DeepSeek-V2.5 发布 2024/09/05](/zh-cn/news/news0905)
  + [API 上线硬盘缓存 2024/08/02](/zh-cn/news/news0802)
  + [API 升级新功能 2024/07/25](/zh-cn/news/news0725)
* [API 文档](#)
* [API 指南](#)

  + [思考模式](/zh-cn/guides/thinking_mode)
  + [多轮对话](/zh-cn/guides/multi_round_chat)
  + [对话前缀续写（Beta）](/zh-cn/guides/chat_prefix_completion)
  + [FIM 补全（Beta）](/zh-cn/guides/fim_completion)
  + [JSON Output](/zh-cn/guides/json_mode)
  + [Tool Calls](/zh-cn/guides/tool_calls)
  + [上下文硬盘缓存](/zh-cn/guides/kv_cache)
  + [Anthropic API](/zh-cn/guides/anthropic_api)
* [其它资源](#)

  + [实用集成](https://github.com/deepseek-ai/awesome-deepseek-integration/tree/main)
  + [API 服务状态](https://status.deepseek.com/)
* [常见问题](/zh-cn/faq)
* [更新日志](/zh-cn/updates)

* 快速开始
* 首次调用 API

# 首次调用 API

DeepSeek API 使用与 OpenAI 兼容的 API 格式，通过修改配置，您可以使用 OpenAI SDK 来访问 DeepSeek API，或使用与 OpenAI API 兼容的软件。

| PARAM | VALUE |
| --- | --- |
| base\_url \* | `https://api.deepseek.com` |
| api\_key | apply for an [API key](https://platform.deepseek.com/api_keys) |

\* 出于与 OpenAI 兼容考虑，您也可以将 `base_url` 设置为 `https://api.deepseek.com/v1` 来使用，但注意，此处 `v1` 与模型版本无关。

\* **`deepseek-chat` 和 `deepseek-reasoner` 对应模型版本不变，为 DeepSeek-V3.2 (128K 上下文长度)，与 APP/WEB 版不同。**`deepseek-chat` 对应 DeepSeek-V3.2 的**非思考模式**，`deepseek-reasoner` 对应 DeepSeek-V3.2 的**思考模式**。

## 调用对话 API[​](#调用对话-api "调用对话 API的直接链接")

在创建 API key 之后，你可以使用以下样例脚本的来访问 DeepSeek API。样例为非流式输出，您可以将 stream 设置为 true 来使用流式输出。

* curl
* python
* nodejs

```
curl https://api.deepseek.com/chat/completions \  
  -H "Content-Type: application/json" \  
  -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \  
  -d '{  
        "model": "deepseek-chat",  
        "messages": [  
          {"role": "system", "content": "You are a helpful assistant."},  
          {"role": "user", "content": "Hello!"}  
        ],  
        "stream": false  
      }'
```

[下一页

模型 & 价格](/zh-cn/quick_start/pricing)

* [调用对话 API](#调用对话-api)

微信公众号

* ![WeChat QRcode](https://cdn.deepseek.com/official_account.jpg)

社区

* [邮箱](mailto:api-service@deepseek.com)
* [Discord](https://discord.gg/Tc7c45Zzu5)
* [Twitter](https://twitter.com/deepseek_ai)

更多

* [GitHub](https://github.com/deepseek-ai)

Copyright © 2025 DeepSeek, Inc.

⏳ Sending...