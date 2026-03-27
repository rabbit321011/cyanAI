# cyanAI 项目架构报告

> 生成日期: 2026-03-27

## 1. 项目概述

cyanAI 是一个 AI Agent 系统，专为持久化使用而设计，具备虚拟上下文管理和事件记忆存储功能。核心特性包括：

- **虚拟上下文 (main-virtual)**: 主 Agent 进程，使用基于事件的记忆系统和记忆强度衰减
- **抽象树**: 基于 JSON 文件的知识树结构
- **工具执行系统**: 可执行的函数调用框架
- **事件存储/检索**: 基于 RAG 的聊天历史存储和检索
- **QQ 集成**: 通过 WebSocket (OneBot 协议) 实现

---

## 2. 目录结构

### 2.1 后端 (nodeServer)

```
nodeServer/
├── src/
│   ├── app.ts                           # Express 服务器入口 (端口 3000)
│   ├── component/                       # 核心业务逻辑组件
│   │   ├── abstract_tree/               # 抽象知识树结构
│   │   │   ├── base_functions/
│   │   │   │   ├── file_operator.ts     # 文件操作
│   │   │   │   └── locate.ts            # 定位功能
│   │   │   ├── data_structure/
│   │   │   │   └── abstruct_tree_types.ts
│   │   │   └── designs/
│   │   ├── events/                      # 事件管理
│   │   │   ├── event_loader.ts          # 加载历史事件(带权重)
│   │   │   └── event_saver.ts           # 保存事件
│   │   ├── process/                     # 核心对话处理
│   │   │   ├── main_virtual.ts          # 主虚拟 AI (核心引擎, 1200+ 行)
│   │   │   └── tool_process.ts          # 工具执行系统
│   │   ├── route/
│   │   │   └── command.ts               # 命令路由
│   │   ├── theory/                      # 理论(信念/持久化)系统
│   │   │   ├── data_structure/
│   │   │   │   └── theory_types.ts
│   │   │   └── theory.ts
│   │   └── tools/                       # 工具定义
│   │       ├── main-virtual-speak/      # 说话工具
│   │       └── any-example/
│   ├── controllers/                     # Express 路由处理器
│   │   ├── agent.controller.ts
│   │   └── cyan.controller.ts
│   ├── routes/                          # 路由定义
│   │   ├── agent.route.ts
│   │   └── cyan.route.ts
│   ├── services/                        # 业务逻辑
│   │   ├── agent.service.ts
│   │   └── cyan.service.ts
│   ├── types/                           # TypeScript 类型定义
│   │   ├── agent.types.ts
│   │   ├── data/
│   │   │   └── data.type.ts             # MemoryState 类
│   │   ├── process/
│   │   │   └── process.type.ts          # 消息类型定义
│   │   └── web/
│   │       └── web.type.ts
│   ├── utility/                         # 工具函数
│   │   ├── LLM_call/                    # DeepSeek & Gemini API 调用
│   │   ├── QQ/                          # QQ WebSocket 连接
│   │   ├── file_operation/              # INI 配置读写
│   │   ├── error_type/                  # 错误处理
│   │   ├── key_system/                  # API 密钥管理
│   │   ├── RAG/                         # RAG 检索
│   │   ├── usage/                       # 用量统计
│   │   └── reranker/                    # 重排序
│   ├── core_datas/                      # 提示词、系统数据
│   └── dataBase/                        # 持久化存储
│       ├── events/                      # 事件存储
│       ├── event_summary/               # 事件摘要
│       ├── abstruct_tree/               # 抽象树存储
│       └── user_keys/                   # 用户密钥
├── library_source.ini                   # 配置文件
└── package.json
```

### 2.2 前端 (VUE)

```
VUE/
├── src/
│   ├── main.ts                          # Vue 应用入口
│   ├── App.vue                          # 根组件
│   ├── components/
│   │   ├── types/
│   │   │   └── types.ts                 # MessageItem 接口
│   │   ├── store/
│   │   │   └── globalState.ts           # 全局状态管理
│   │   ├── ContextShow.vue              # 聊天上下文显示
│   │   ├── InputBox.vue                 # 用户输入组件
│   │   └── ...
│   └── assets/
├── index.html
├── vite.config.ts
└── package.json
```

---

## 3. 核心数据结构

### 3.1 消息结构 (Message)

**定义文件**: `src/types/process/process.type.ts`

```typescript
interface inlineData {
  mimeType: string;
  data: string;  // base64 字符串,无前缀
}

interface functionCall {
  name: string;
  args: { [key: string]: any };
  thoughtSignature?: string;
}

interface functionResponse {
  name: string;
  response: { [key: string]: any };
}

interface Message {
  current: string;           // 去除时间戳/说话人后的原始文本
  role_type: string;         // "user" 或 "model"
  role: string;              // 说话人名称
  time: string;              // CyanTime 格式时间戳
  file: string[];            // 附件文件(完整路径)
  inline: inlineData[];      // 内联数据(图片等)
  toolsCalls: functionCall[];
  toolsResponse: functionResponse[];
}
```

### 3.2 记忆状态 (MemoryState)

**定义文件**: `src/types/data/data.type.ts`

```typescript
interface weight_key {
  weight: number;
  key: string;
}

class memory_status {
  public last_day: string = "";
  public session_uid: string = "";
  public S: number = 0.2;    // 记忆稳定性
  public a: number = 15;     // 增益系数

  // 获取记忆留存强度 R
  // 公式: R = S * (1 + a * e^(-D) * (1 - R_prev))
  get_R(now_day: string): number { ... }

  // 记忆巩固和复习函数
  consolidate(now_day: string, now_session_uid: string, D?: number): boolean { ... }
}
```

### 3.3 虚拟上下文整体状态 (total_status)

**定义文件**: `src/component/process/main_virtual.ts`

```typescript
// 工作区条目
interface workspace_ent {
  index: string;        // "ws" + 数字
  current: string;      // 文件路径或文件内容
}

// 对象实体当前状态
interface object_ent_current {
  state: MemoryState;
  last_time: number;    // 最后提及的轮次
  text: string;
}

// 对象实体
interface object_ent {
  name: string;
  current: object_ent_current[];
}

// 关系实体当前状态
interface relative_ent_current {
  state: MemoryState;
  last_time: number;
  text: string;
}

// 关系实体
interface relative_ent {
  start: string;
  target: string;
  current: relative_ent_current[];
}

// 拉取信息
interface pulled_ent {
  index: string;        // "pi" + 数字
  current: string;      // 完整文件路径
}

// 步骤进度
interface step_ent {
  index: string;        // "sp" + 数字
  status: string;       // "pending", "processing", "completed"
  current: string;
}

// 整体状态
interface total_status {
  system: {
    main_prompt: string;              // 静态系统提示词
    character_reference: string;      // 静态角色参考
    events: string;                   // 事件历史字符串
    workspace: workspace_ent[];
    object_network: {
      objects: object_ent[];
      relative: relative_ent[];
    };
    pulled_info: pulled_ent[];
    step_progress: step_ent[];
  };
  context: Message[];                 // 对话消息数组
}
```

### 3.4 抽象树节点 (abstruct_node)

**定义文件**: `src/component/abstract_tree/data_structure/abstruct_tree_types.ts`

```typescript
interface abstruct_node {
  id: string;                       // 唯一标识符
  parent_node_id: string;
  parent_theory_id: string[];
  subnodes_id: string[];
}

// 回指解析节点
interface extra_anaphora_node {
  id: string | string[];            // 单个或多个
  relation: string;                 // self, sub, undefine_self, parent,
                                    // underfine_parent, multiple_candidate
}
```

### 3.5 理论系统类型 (Theory Types)

**定义文件**: `src/component/theory/data_structure/theory_types.ts`

```typescript
// 动情点 (Erogenous Point)
interface erogenous_point {
  name: string;                     // 激活词
  uid: string;                      // get_id 生成
  parents: weight_key;              // key 的 key 是 theory uid
  source_activation: number[];      // 数组长度10 - 最近10次激活
  final_activation: number;         // 衰减后的最终值
}

// 理论
interface theory {
  name: string;
  uid: string;
  sub_erogenous_point: string[];
  activation_threshold: number;           // 0-1, 触发 memory_less 操作
  activation_threshold_correction: number; // 修正值
}

// 构建理论 (继承 theory)
interface build_theory extends theory {
  sub_struct_uid: string;
  text: string;
  base_theory_uid: string[];
}

// 结构理论
interface struct_theory extends theory {
  parent_build_uid: string;
  sub_persuade_uid: string[];
  text: string;
  base_theory_uid: string[];
}

// 说服理论
interface persuade_theory extends theory {
  parent_struct_uid: string;
  text: string;
  base_theory_uid: string[];
}
```

### 3.6 内容单元 (content_unit)

**定义文件**: `src/component/process/main_virtual.ts`

```typescript
interface part_unit {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
  functionCall?: { name: string; args: any };
  functionResponse?: { name: string; response: any };
  executableCode?: { language: 'PYTHON' | string; code: string };
  codeExecutionResult?: { outcome: string; output: string };
  thoughtSignature?: string;
}

interface content_unit {
  role: string;           // "user" 或 "model"
  parts: part_unit[];
}
```

---

## 4. 核心组件

### 4.1 主虚拟 AI (main_virtual.ts)

**文件**: `src/component/process/main_virtual.ts`

**核心功能**:
- `getCoreStateForFile()` - 加载/维护持久化状态
- `addMessageFromString()` - 添加消息到对话
- `sendAll()` - 主 LLM 交互循环:
  - 构建系统提示词
  - 从事件、工作区、对象网络构建上下文
  - 图片摘要处理
  - 函数调用处理循环
  - 空响应时 API 密钥轮换
  - 重试逻辑与 thoughtSignature 验证
- `sendUserMessage()` - 用户消息处理
- `finish_event()` - 事件摘要压缩
- `memoryless_talk()` - 无上下文查询测试

**栈管理**:
- `status_stack` - 主状态快照管理
- `temp_stack` - 浮动栈用于上下文接管
- `temp_stack_takeover_start/end()` - 上下文切换

### 4.2 工具执行器 (tool_process.ts)

**文件**: `src/component/process/tool_process.ts`

```typescript
async function excuteTool(
  tool_name: string,
  requirement: string,
  wait_mode: boolean = true
): Promise<string>
```

**执行模式**:
- 等待模式(默认): 同步返回结果
- 非等待模式: 返回 task_id, 异步执行结果存储在 `core_datas/tool_responses`

**上下文模式**:
- Full (未实现)
- Half (未实现)
- Pure (当前支持): 仅工具特定提示词 + 需求

### 4.3 事件系统

**文件**:
- `src/component/events/event_loader.ts`
- `src/component/events/event_saver.ts`

**加载器逻辑**:
- 扫描 `.ent` 文件
- 计算重要性权重
- 返回按权重排序的前 100 个事件
- 格式: `{source: LinesP, current: string}`

**权重计算**:
```
weight = R * 10 * Im * Tw

其中:
- R = 记忆留存强度
- Im = 重要性分数
- Tw = 时间权重 (时间衰减因子)
  - < 3 天: Tw = 1
  - < 7 天: Tw = 0.6
  - < 30 天: Tw = 0.3
  - < 365 天: Tw = 0.1
```

**保存器逻辑**:
- 保存对话上下文到事件文件
- 调用 LLM 生成 event_summary 和 importance score
- 存储到事件文件夹,带元数据

### 4.4 抽象树结构

- **格式**: JSON 存储在文件夹中,文件夹名 = 节点 ID
- **文件位置**: `dataBase/abstruct_tree/root`
- **每个节点**: JSON 文件 + 子节点子目录
- **回指解析**: 使用 extra_anaphora_node 跟踪关系

### 4.5 工具定义

**工具目录**: `src/component/tools/`

每个工具文件夹包含:
- `config.ini` - 配置 (model_type, model_name, context_mode, max_turns)
- `prompt.txt` - 系统提示词
- `break_prompt.txt` - 轮次超限提示词
- `function.json` - 工具函数定义
- `functionServer/` - 实现文件 (functionName.ts 包含 execute())
- `auto_reply.txt` - 未调用函数时的自动回复
- `upload/` - 执行结果存储

---

## 5. API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/cyan/exit` | GET | 健康检查 |
| `/api/cyan/send` | POST | 发送消息,获取 AI 响应 |
| `/api/cyan/closeEvent` | POST | 结束当前聊天事件 |
| `/api/agent/*` | * | Agent 聊天端点 |

---

## 6. 配置文件

### library_source.ini

**位置**: `nodeServer/library_source.ini`

包含:
- `[LLM]` - API 密钥 (google_api_key, deepseek_api_sky)
- `[QQ]` - WebSocket 路径
- `[PATH]` - 各种路径配置

---

## 7. 记忆衰减算法

**公式**:
```
S = S * (1 + a * e^(-D) * (1 - R))

其中:
- S: 记忆稳定性
- a: 增益系数 (默认 15)
- D: 自上次提及以来的时间距离
- R: 上次记忆留存强度
```

---

## 8. 数据流

1. 用户消息 → InputBox → API 端点
2. API → Agent controller → cyan.controller
3. Controller → main_virtual.ts 处理
4. 事件加载,加权,追加到上下文
5. LLM 调用 (Gemini/DeepSeek)
6. 工具调用通过 tool_process.ts 执行
7. 响应存储到状态文件
8. 前端获取并显示

---

## 9. 关键文件索引

| 用途 | 文件 |
|------|------|
| 核心引擎 | main_virtual.ts, tool_process.ts |
| 状态管理 | data.type.ts (memory_status) |
| 事件系统 | event_loader.ts, event_saver.ts |
| 类型定义 | process.type.ts, agent.types.ts |
| API 入口 | app.ts |
| 前端入口 | VUE/main.ts, ContextShow.vue, InputBox.vue |

---

## 10. 技术栈

- **后端**: Express + TypeScript (CommonJS)
- **前端**: Vue 3 + TypeScript + Vite + Naive UI
- **AI 模型**: Google Gemini, DeepSeek
- **消息协议**: OneBot (WebSocket)
- **存储**: JSON 文件 + 内存
- **模板渲染**: Marked + KaTeX (前端)