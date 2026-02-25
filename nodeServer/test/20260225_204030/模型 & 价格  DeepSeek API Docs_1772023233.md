# 模型 & 价格 | DeepSeek API Docs

Source: https://api-docs.deepseek.com/zh-cn/quick_start/pricing
Date: 2026-02-25 20:40:33

---

模型 & 价格 | DeepSeek API Docs


[跳到主要内容](#__docusaurus_skipToContent_fallback)

[![DeepSeek API 文档 Logo](https://cdn.deepseek.com/platform/favicon.png)

**DeepSeek API 文档**](/zh-cn/)

[中文（中国）](#)

* [English](/quick_start/pricing)
* [中文（中国）](/zh-cn/quick_start/pricing)

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
* 模型 & 价格

# 模型 & 价格

下表所列模型价格以“百万 tokens”为单位。Token 是模型用来表示自然语言文本的的最小单位，可以是一个词、一个数字或一个标点符号等。我们将根据模型输入和输出的总 token 数进行计量计费。

---

## 模型细节[​](#模型细节 "模型细节的直接链接")

注意：**`deepseek-chat` 和 `deepseek-reasoner` 对应模型版本不变，为 DeepSeek-V3.2 (128K 上下文长度)，与 APP/WEB 版不同。**

**|  |  |  |  |
| --- | --- | --- | --- |
| 模型 | | deepseek-chat | deepseek-reasoner |
| BASE URL | | <https://api.deepseek.com> | |
| 模型版本 | | DeepSeek-V3.2 （非思考模式） | DeepSeek-V3.2 （思考模式） |
| 上下文长度 | | 128K | |
| 输出长度 | | 默认 4K，最大 8K | 默认 32K，最大 64K |
| 功能 | [Json Output](/zh-cn/guides/json_mode) | 支持 | 支持 |
| [Tool Calls](/zh-cn/guides/tool_calls) | 支持 | 支持 |
| [对话前缀续写（Beta）](/zh-cn/guides/chat_prefix_completion) | 支持 | 支持 |
| [FIM 补全（Beta）](/zh-cn/guides/fim_completion) | 支持 | 不支持 |
| 价格 | 百万tokens输入（缓存命中） | 0.2元 | |
| 百万tokens输入（缓存未命中） | 2元 | |
| 百万tokens输出 | 3元 | |**

---

## 扣费规则[​](#扣费规则 "扣费规则的直接链接")

扣减费用 = token 消耗量 × 模型单价，对应的费用将直接从充值余额或赠送余额中进行扣减。
当充值余额与赠送余额同时存在时，优先扣减赠送余额。

产品价格可能发生变动，DeepSeek 保留修改价格的权利。请您依据实际用量按需充值，定期查看此页面以获知最新价格信息。

[上一页

首次调用 API](/zh-cn/)[下一页

Temperature 设置](/zh-cn/quick_start/parameter_settings)

* [模型细节](#模型细节)
* [扣费规则](#扣费规则)

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