# 限速 | DeepSeek API Docs

Source: https://api-docs.deepseek.com/zh-cn/quick_start/rate_limit
Date: 2026-02-25 20:41:05

---

限速 | DeepSeek API Docs


[跳到主要内容](#__docusaurus_skipToContent_fallback)

[![DeepSeek API 文档 Logo](https://cdn.deepseek.com/platform/favicon.png)

**DeepSeek API 文档**](/zh-cn/)

[中文（中国）](#)

* [English](/quick_start/rate_limit)
* [中文（中国）](/zh-cn/quick_start/rate_limit)

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
* 限速

# 限速

DeepSeek API **不限制用户并发量**，我们会尽力保证您所有请求的服务质量。

但请注意，当我们的服务器承受高流量压力时，您的请求发出后，可能需要等待一段时间才能获取服务器的响应。在这段时间里，您的 HTTP 请求会保持连接，并持续收到如下格式的返回内容：

* 非流式请求：持续返回空行
* 流式请求：持续返回 SSE keep-alive 注释（`: keep-alive`）

这些内容不影响 OpenAI SDK 对响应的 JSON body 的解析。如果您在自己解析 HTTP 响应，请注意处理这些空行或注释。

如果 10 分钟后，请求仍未开始推理，服务器将关闭连接。

[上一页

Token 用量计算](/zh-cn/quick_start/token_usage)[下一页

错误码](/zh-cn/quick_start/error_codes)

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