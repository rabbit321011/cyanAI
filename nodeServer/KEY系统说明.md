# QQ 用户额度 KEY 系统说明

## 实现概述

为 cyanAI 添加了 QQ 用户额度验证功能，用户需要绑定 KEY 才能使用 AI 服务。

## 架构设计

### 数据存储

```
dataBase/user_keys/
├── keys.json         # 所有 KEY 记录
├── bindings.json     # QQ 号到 KEY 的绑定关系
├── blacklist.json    # 黑名单
└── admin_key.json    # 管理员 KEY 配置
```

### 核心模块

1. **key_types.ts** - 类型定义
   - `KeyPermission`: 权限组 (`admin`, `op`, `user`, `visitor`)
   - `QuotaValue`: 额度类型 (正整数 或 `inf`)
   - `KeyRecord`: KEY 记录结构
   - `QqKeyBinding`: QQ-KEY 绑定关系

2. **key_manager.ts** - 核心业务逻辑
   - `verifyQqKey(qqNum)`: 验证 QQ 号的 KEY
   - `createKey(...)`: 创建新 KEY
   - `checkKey(key)`: 查询 KEY 信息
   - `bindKeyToQq(qqNum, key)`: 绑定 KEY 到 QQ
   - `unbindKeyFromQq(qqNum)`: 解除绑定

### 与现有代码集成

1. **command.ts** - 扩展命令处理
   - `^command creatkey <额度> <权限组>`: 创建 KEY（需要 op 权限）
   - `^command checkkey [KEY]`: 查询 KEY 信息
   - `^command bindkey <KEY>`: 绑定 KEY
   - `^command unbindkey`: 解除绑定

2. **qq.ts** - 消息验证
   - 收到消息时先验证 KEY
   - 无 KEY 或额度用尽则提示用户
   - 命令消息（^command 开头）无需 KEY

## 使用流程

### 管理员操作

1. **获取管理员 KEY**
   - 默认管理员 KEY: `admin_master_key`
   - 存储在 `dataBase/user_keys/admin_key.json`

2. **创建用户 KEY**
   ```
   ^command creatkey 100 user
   ```
   - 额度: 正整数或 `inf`（无限）
   - 权限组: `admin`, `op`, `user`, `visitor`

### 用户操作

1. **绑定 KEY**
   ```
   ^command bindkey ABC12345
   ```

2. **查询 KEY 信息**
   ```
   ^command checkkey
   ```
   或
   ```
   ^command checkkey ABC12345
   ```

3. **解除绑定**
   ```
   ^command unbindkey
   ```

## 额度逻辑

- **绑定时扣除**: 用户绑定 KEY 时，额度减 1
- **KEY 复用**: 同一 KEY 可绑定多个 QQ（每个绑定都扣额度）
- **无限额度**: `inf` 表示无限次使用
- **额度不足**: 提示 "KEY 额度已用尽"

## 验证时机

- 非命令消息（普通聊天）在进入处理队列前验证
- 命令消息（^command 开头）直接执行，不验证 KEY
- 繁忙时进入等待队列，等待时也需验证 KEY

## 权限说明

| 权限组 | 可以使用 creatkey | 说明 |
|--------|------------------|------|
| admin  | ✓ | 管理员 |
| op     | ✓ | 操作员 |
| user   | ✗ | 普通用户 |
| visitor| ✗ | 访客 |

## 待完善功能

黑名单功能已实现但未暴露命令接口：
- `addToBlacklist(qqNum, reason, blockedBy)` - 加入黑名单
- 可后续添加 `^command blacklist` 相关命令