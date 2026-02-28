# cyanAI

一个为长久化使用设计的 AI Agent 项目。

## 项目简介

cyanAI 是一个具备持久记忆和上下文管理能力的 AI Agent 系统。通过虚拟上下文机制，能够在长时间对话中保持连贯性，并支持事件记忆存储与检索。

## 核心特性

- **虚拟上下文管理** - 动态维护对话上下文，支持自动压缩和重要信息保留
- **事件记忆系统** - 持久化存储对话事件，支持按时间检索
- **工具调用** - 支持多种工具扩展，包括 TTS 语音合成、QQ 消息发送等
- **多模型支持** - 支持 Deepseek 和 Google Gemini API
- **QQ 集成** - 通过 OneBot 协议连接 QQ，实现消息监听与自动回复

## 项目结构

```
cyanAI/
├── nodeServer/          # 后端服务 (Express + TypeScript)
│   ├── src/
│   │   ├── component/   # 核心组件
│   │   │   ├── erogenous_zone/  # 虚拟上下文配置
│   │   │   ├── events/          # 事件加载与保存
│   │   │   ├── process/         # 核心处理逻辑
│   │   │   └── tools/           # 工具模块
│   │   ├── controllers/  # 控制器
│   │   ├── routes/       # 路由定义
│   │   ├── services/     # 业务逻辑
│   │   └── utility/      # 工具函数
│   ├── core_datas/       # 核心数据文件
│   ├── dataBase/         # 数据存储目录
│   └── api_docs/         # API 文档
│
├── VUE/                  # 前端界面 (Vue 3 + TypeScript)
│   ├── src/
│   │   ├── components/   # Vue 组件
│   │   └── App.vue       # 主应用
│   └── package.json
│
└── designs/              # 设计文档
    └── sourceThinking/   # 架构设计思路
```

## 技术栈

### 后端
- Node.js + Express
- TypeScript
- WebSocket (QQ 连接)
- Zod (数据验证)

### 前端
- Vue 3
- TypeScript
- Naive UI
- Marked + KaTeX (Markdown 渲染)

## 快速开始

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖

```bash
# 后端
cd nodeServer
pnpm install

# 前端
cd VUE
pnpm install
```

### 配置

1. 在 `nodeServer/` 目录下创建 `library_source.ini`，配置 API 密钥：

```ini
[LLM]
Deepseek_apiKey=your_deepseek_api_key
Google_apiKey=your_google_api_key

[QQ]
QQ_wsPath=ws://127.0.0.1:4286
```

### 启动服务

```bash
# 启动后端服务
cd nodeServer
pnpm dev

# 启动前端开发服务器
cd VUE
pnpm dev
```

后端服务运行在 `http://localhost:3000`

## API 接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/cyan/exit` | GET | 检测服务状态 |
| `/api/cyan/send` | POST | 发送消息并获取回复 |
| `/api/cyan/closeEvent` | POST | 结束当前对话事件 |

详细 API 文档见 [nodeServer/api_docs/cyan_api.md](nodeServer/api_docs/cyan_api.md)

## 设计文档

详细的设计思路和架构说明见 [designs/](designs/) 目录：

- [虚拟上下文设计](designs/sourceThinking/main-modules/main-virtual/virtual_context.md)
- [RAG 检索设计](designs/sourceThinking/RAG/RAGsource.md)
- [工具使用规范](designs/sourceThinking/tools/)

## License

MIT
