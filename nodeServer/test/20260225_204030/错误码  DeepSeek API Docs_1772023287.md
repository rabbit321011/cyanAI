# 错误码 | DeepSeek API Docs

Source: https://api-docs.deepseek.com/zh-cn/quick_start/error_codes
Date: 2026-02-25 20:41:27

---

错误码 | DeepSeek API Docs


[跳到主要内容](#__docusaurus_skipToContent_fallback)

[![DeepSeek API 文档 Logo](https://cdn.deepseek.com/platform/favicon.png)

**DeepSeek API 文档**](/zh-cn/)

[中文（中国）](#)

* [English](/quick_start/error_codes)
* [中文（中国）](/zh-cn/quick_start/error_codes)

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
* 错误码

# 错误码

您在调用 DeepSeek API 时，可能会遇到以下错误。这里列出了相关错误的原因及其解决方法。

| 错误码 | 描述 |
| --- | --- |
| 400 - 格式错误 | **原因**：请求体格式错误   **解决方法**：请根据错误信息提示修改请求体 |
| 401 - 认证失败 | **原因**：API key 错误，认证失败   **解决方法**：请检查您的 API key 是否正确，如没有 API key，请先 [创建 API key](https://platform.deepseek.com/api_keys) |
| 402 - 余额不足 | **原因**：账号余额不足   **解决方法**：请确认账户余额，并前往 [充值](https://platform.deepseek.com//top_up) 页面进行充值 |
| 422 - 参数错误 | **原因**：请求体参数错误   **解决方法**：请根据错误信息提示修改相关参数 |
| 429 - 请求速率达到上限 | **原因**：请求速率（TPM 或 RPM）达到上限   **解决方法**：请合理规划您的请求速率。 |
| 500 - 服务器故障 | **原因**：服务器内部故障   **解决方法**：请等待后重试。若问题一直存在，请联系我们解决 |
| 503 - 服务器繁忙 | **原因**：服务器负载过高   **解决方法**：请稍后重试您的请求 |

[上一页

限速](/zh-cn/quick_start/rate_limit)[下一页

DeepSeek V3.2 正式版：强化 Agent 能力，融入思考推理](/zh-cn/news/news251201)

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