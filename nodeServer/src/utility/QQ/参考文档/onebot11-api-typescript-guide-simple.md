# OneBot 11 API TypeScript 快速上手指南

本文档提供 OneBot 11 协议的 TypeScript 快速上手指南，包含最常用的 API 和示例。

## 目录

- [快速开始](#快速开始)
- [基础连接](#基础连接)
- [消息 API](#消息-api)
- [群管理 API](#群管理-api)
- [信息查询 API](#信息查询-api)
- [事件处理](#事件处理)
- [消息段](#消息段)
- [常见示例](#常见示例)

---

## 快速开始

### 安装依赖

```bash
npm install ws @types/ws
```

### 最简单的机器人

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3001/api');

ws.on('open', () => {
  console.log('已连接');
  
  // 发送消息
  ws.send(JSON.stringify({
    action: 'send_group_msg',
    params: {
      group_id: 123456789,
      message: '你好！'
    }
  }));
});

ws.on('message', (data) => {
  console.log('收到响应:', JSON.parse(data.toString()));
});
```

---

## 基础连接

### 连接到 Philia

```typescript
// API 端点（调用 API）
const apiWs = new WebSocket('ws://127.0.0.1:3001/api');

// 事件端点（接收消息事件）
const eventWs = new WebSocket('ws://127.0.0.1:3001/event');

// 或使用 / 端点（同时支持 API 和事件）
const ws = new WebSocket('ws://127.0.0.1:3001/');
```

### 带鉴权的连接

```typescript
const ws = new WebSocket('ws://127.0.0.1:3001/api', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
});
```

---

## 消息 API

### 发送私聊消息

```typescript
function sendPrivateMsg(ws: WebSocket, userId: number, message: string | object[]): void {
  ws.send(JSON.stringify({
    action: 'send_private_msg',
    params: {
      user_id: userId,
      message: message
    }
  }));
}

// 使用
sendPrivateMsg(ws, 123456789, '你好');
sendPrivateMsg(ws, 123456789, [
  { type: 'text', data: { text: '你好' } },
  { type: 'image', data: { file: 'http://example.com/pic.jpg' } }
]);
```

### 发送群消息

```typescript
function sendGroupMsg(ws: WebSocket, groupId: number, message: string | object[]): void {
  ws.send(JSON.stringify({
    action: 'send_group_msg',
    params: {
      group_id: groupId,
      message: message
    }
  }));
}

// 使用
sendGroupMsg(ws, 987654321, '大家好！');
```

### 撤回消息

```typescript
function deleteMsg(ws: WebSocket, messageId: number): void {
  ws.send(JSON.stringify({
    action: 'delete_msg',
    params: {
      message_id: messageId
    }
  }));
}
```

### 获取消息

```typescript
function getMsg(ws: WebSocket, messageId: number): void {
  ws.send(JSON.stringify({
    action: 'get_msg',
    params: {
      message_id: messageId
    }
  }));
}
```

### 发送好友赞

```typescript
function sendLike(ws: WebSocket, userId: number, times: number = 1): void {
  ws.send(JSON.stringify({
    action: 'send_like',
    params: {
      user_id: userId,
      times: Math.min(times, 10) // 每天最多10次
    }
  }));
}
```

---

## 群管理 API

### 踢人

```typescript
function kickMember(ws: WebSocket, groupId: number, userId: number): void {
  ws.send(JSON.stringify({
    action: 'set_group_kick',
    params: {
      group_id: groupId,
      user_id: userId
    }
  }));
}
```

### 禁言

```typescript
function banMember(ws: WebSocket, groupId: number, userId: number, duration: number = 30 * 60): void {
  ws.send(JSON.stringify({
    action: 'set_group_ban',
    params: {
      group_id: groupId,
      user_id: userId,
      duration: duration // 秒，0表示取消禁言
    }
  }));
}
```

### 取消禁言

```typescript
function liftBan(ws: WebSocket, groupId: number, userId: number): void {
  banMember(ws, groupId, userId, 0);
}
```

### 全员禁言

```typescript
function setWholeBan(ws: WebSocket, groupId: number, enable: boolean = true): void {
  ws.send(JSON.stringify({
    action: 'set_group_whole_ban',
    params: {
      group_id: groupId,
      enable: enable
    }
  }));
}
```

### 设置管理员

```typescript
function setAdmin(ws: WebSocket, groupId: number, userId: number, enable: boolean = true): void {
  ws.send(JSON.stringify({
    action: 'set_group_admin',
    params: {
      group_id: groupId,
      user_id: userId,
      enable: enable
    }
  }));
}
```

### 设置群名片

```typescript
function setCard(ws: WebSocket, groupId: number, userId: number, card: string): void {
  ws.send(JSON.stringify({
    action: 'set_group_card',
    params: {
      group_id: groupId,
      user_id: userId,
      card: card
    }
  }));
}
```

### 设置群名

```typescript
function setGroupName(ws: WebSocket, groupId: number, groupName: string): void {
  ws.send(JSON.stringify({
    action: 'set_group_name',
    params: {
      group_id: groupId,
      group_name: groupName
    }
  }));
}
```

### 退出群组

```typescript
function leaveGroup(ws: WebSocket, groupId: number, isDismiss: boolean = false): void {
  ws.send(JSON.stringify({
    action: 'set_group_leave',
    params: {
      group_id: groupId,
      is_dismiss: isDismiss // true表示解散（需要是群主）
    }
  }));
}
```

### 处理加群请求

```typescript
function handleGroupAddRequest(ws: WebSocket, flag: string, approve: boolean = true): void {
  ws.send(JSON.stringify({
    action: 'set_group_add_request',
    params: {
      flag: flag,
      approve: approve
    }
  }));
}
```

---

## 信息查询 API

### 获取登录号信息

```typescript
function getLoginInfo(ws: WebSocket): void {
  ws.send(JSON.stringify({
    action: 'get_login_info'
  }));
}
```

### 获取好友列表

```typescript
function getFriendList(ws: WebSocket): void {
  ws.send(JSON.stringify({
    action: 'get_friend_list'
  }));
}
```

### 获取群列表

```typescript
function getGroupList(ws: WebSocket): void {
  ws.send(JSON.stringify({
    action: 'get_group_list'
  }));
}
```

### 获取群信息

```typescript
function getGroupInfo(ws: WebSocket, groupId: number): void {
  ws.send(JSON.stringify({
    action: 'get_group_info',
    params: {
      group_id: groupId
    }
  }));
}
```

### 获取群成员信息

```typescript
function getMemberInfo(ws: WebSocket, groupId: number, userId: number): void {
  ws.send(JSON.stringify({
    action: 'get_group_member_info',
    params: {
      group_id: groupId,
      user_id: userId
    }
  }));
}
```

### 获取群成员列表

```typescript
function getMemberList(ws: WebSocket, groupId: number): void {
  ws.send(JSON.stringify({
    action: 'get_group_member_list',
    params: {
      group_id: groupId
    }
  }));
}
```

### 获取陌生人信息

```typescript
function getStrangerInfo(ws: WebSocket, userId: number): void {
  ws.send(JSON.stringify({
    action: 'get_stranger_info',
    params: {
      user_id: userId
    }
  }));
}
```

---

## 事件处理

### 连接到事件端点

```typescript
const eventWs = new WebSocket('ws://127.0.0.1:3001/event');

eventWs.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  console.log('收到事件:', event);
  
  // 处理不同类型的事件
  if (event.post_type === 'message') {
    handleMessage(event);
  } else if (event.post_type === 'notice') {
    handleNotice(event);
  } else if (event.post_type === 'request') {
    handleRequest(event);
  }
});
```

### 处理私聊消息

```typescript
function handleMessage(event: any): void {
  if (event.message_type === 'private') {
    console.log(`私聊消息 from ${event.user_id}: ${event.raw_message}`);
    
    // 回复
    eventWs.send(JSON.stringify({
      action: 'send_private_msg',
      params: {
        user_id: event.user_id,
        message: `收到: ${event.raw_message}`
      }
    }));
  } else if (event.message_type === 'group') {
    console.log(`群消息 from ${event.user_id} in ${event.group_id}: ${event.raw_message}`);
  }
}
```

### 处理通知事件

```typescript
function handleNotice(event: any): void {
  if (event.notice_type === 'group_increase') {
    console.log(`新成员加入: ${event.user_id}`);
    
    // 欢迎新成员
    eventWs.send(JSON.stringify({
      action: 'send_group_msg',
      params: {
        group_id: event.group_id,
        message: [
          { type: 'at', data: { qq: String(event.user_id) } },
          { type: 'text', data: { text: ' 欢迎加入！' } }
        ]
      }
    }));
  } else if (event.notice_type === 'group_ban') {
    console.log(`群禁言事件: ${event.user_id}`);
  }
}
```

### 处理请求事件

```typescript
function handleRequest(event: any): void {
  if (event.request_type === 'friend') {
    console.log(`好友请求: ${event.user_id}, 备注: ${event.comment}`);
    
    // 自动同意好友请求
    eventWs.send(JSON.stringify({
      action: 'set_friend_add_request',
      params: {
        flag: event.flag,
        approve: true
      }
    }));
  } else if (event.request_type === 'group') {
    console.log(`加群请求: ${event.user_id}`);
  }
}
```

---

## 消息段

### 纯文本

```typescript
const text = '你好';
// 或
const textSegment = { type: 'text', data: { text: '你好' } };
```

### 图片

```typescript
const image = { type: 'image', data: { file: 'http://example.com/pic.jpg' } };
// 或本地图片
const localImage = { type: 'image', data: { file: 'file:///C:/path/to/image.png' } };
// 或 Base64
const base64Image = { type: 'image', data: { file: 'base64://...' } };
```

### @某人

```typescript
const at = { type: 'at', data: { qq: '123456789' } };
// @全体
const atAll = { type: 'at', data: { qq: 'all' } };
```

### 表情

```typescript
const face = { type: 'face', data: { id: '123' } };
```

### 语音

```typescript
const record = { type: 'record', data: { file: 'http://example.com/voice.mp3' } };
```

### 视频

```typescript
const video = { type: 'video', data: { file: 'http://example.com/video.mp4' } };
```

### 回复

```typescript
const reply = { type: 'reply', data: { id: '123456' } };
```

### 分享链接

```typescript
const share = {
  type: 'share',
  data: {
    url: 'https://example.com',
    title: '标题',
    content: '内容',
    image: 'https://example.com/thumb.jpg'
  }
};
```

### 音乐分享

```typescript
// QQ音乐
const qqMusic = { type: 'music', data: { type: 'qq', id: '123456' } };
// 自定义音乐
const customMusic = {
  type: 'music',
  data: {
    type: 'custom',
    url: 'https://example.com/music.mp3',
    audio: 'https://example.com/audio.mp3',
    title: '音乐标题',
    image: 'https://example.com/cover.jpg'
  }
};
```

### 组合消息

```typescript
const message = [
  { type: 'text', data: { text: '你好 ' } },
  { type: 'at', data: { qq: '123456' } },
  { type: 'text', data: { text: '，这是一张图片：' } },
  { type: 'image', data: { file: 'http://example.com/pic.jpg' } }
];
```

---

## 常见示例

### 1. 简单复读机

```typescript
const ws = new WebSocket('ws://127.0.0.1:3001/');

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'message' && event.message_type === 'group') {
    // 复读
    ws.send(JSON.stringify({
      action: 'send_group_msg',
      params: {
        group_id: event.group_id,
        message: event.message
      }
    }));
  }
});
```

### 2. 关键词回复

```typescript
const keywords = {
  '你好': '你好！有什么可以帮助你的吗？',
  '时间': () => `当前时间：${new Date().toLocaleString()}`,
  '帮助': '可用命令：\n1. 天气 - 查询天气\n2. 时间 - 查询时间'
};

ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'message') {
    const text = event.raw_message;
    const response = keywords[text];
    
    if (response) {
      const message = typeof response === 'function' ? response() : response;
      
      ws.send(JSON.stringify({
        action: event.message_type === 'private' ? 'send_private_msg' : 'send_group_msg',
        params: {
          user_id: event.user_id,
          group_id: event.group_id,
          message: message
        }
      }));
    }
  }
});
```

### 3. 欢迎新成员

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'notice' && event.notice_type === 'group_increase') {
    ws.send(JSON.stringify({
      action: 'send_group_msg',
      params: {
        group_id: event.group_id,
        message: [
          { type: 'at', data: { qq: String(event.user_id) } },
          { type: 'text', data: { text: ' 欢迎加入本群！' } }
        ]
      }
    }));
  }
});
```

### 4. 群管命令

```typescript
ws.on('message', async (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'message' && event.message_type === 'group') {
    const { group_id, user_id, raw_message } = event;
    
    // 禁言命令：禁言 123456 10
    if (raw_message.startsWith('禁言 ')) {
      const targetId = parseInt(raw_message.split(' ')[1]);
      const duration = parseInt(raw_message.split(' ')[2]) || 10;
      
      ws.send(JSON.stringify({
        action: 'set_group_ban',
        params: {
          group_id: group_id,
          user_id: targetId,
          duration: duration * 60
        }
      }));
    }
    
    // 踢人命令：踢出 123456
    if (raw_message.startsWith('踢出 ')) {
      const targetId = parseInt(raw_message.split(' ')[1]);
      
      ws.send(JSON.stringify({
        action: 'set_group_kick',
        params: {
          group_id: group_id,
          user_id: targetId
        }
      }));
    }
  }
});
```

### 5. 自动同意好友请求

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'request' && event.request_type === 'friend') {
    ws.send(JSON.stringify({
      action: 'set_friend_add_request',
      params: {
        flag: event.flag,
        approve: true,
        remark: '自动添加'
      }
    }));
  }
});
```

### 6. 发送图片

```typescript
// 发送网络图片
ws.send(JSON.stringify({
  action: 'send_group_msg',
  params: {
    group_id: 123456789,
    message: [
      { type: 'text', data: { text: '看这张图片：' } },
      { type: 'image', data: { file: 'https://example.com/pic.jpg' } }
    ]
  }
}));

// 发送本地图片
ws.send(JSON.stringify({
  action: 'send_private_msg',
  params: {
    user_id: 123456789,
    message: { type: 'image', data: { file: 'file:///C:/path/to/image.png' } }
  }
}));
```

### 7. 获取群成员信息并回复

```typescript
ws.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  if (event.post_type === 'message' && event.raw_message === '我的信息') {
    // 获取成员信息
    ws.send(JSON.stringify({
      action: 'get_group_member_info',
      params: {
        group_id: event.group_id,
        user_id: event.user_id
      },
      echo: `info_${event.user_id}`
    }));
  }
});

// 处理响应
ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  
  if (response.echo && response.echo.toString().startsWith('info_')) {
    const info = response.data;
    ws.send(JSON.stringify({
      action: 'send_group_msg',
      params: {
        group_id: info.group_id,
        message: `你的昵称：${info.nickname}\n群名片：${info.card}\n等级：${info.level}`
      }
    }));
  }
});
```

---

## API 响应格式

所有 API 调用都会返回以下格式的响应：

```typescript
{
  status: 'ok' | 'failed' | 'async',
  retcode: number,
  data: any,
  echo?: string | number
}
```

### 返回码说明

| retcode | 说明 |
|---------|------|
| 0 | 成功 |
| 1400 | 请求参数错误 |
| 1401 | 鉴权失败 |
| 1403 | 权限不足 |
| 1404 | API 不存在 |

---

## 完整示例：简单机器人

```typescript
import WebSocket from 'ws';

const API_URL = 'ws://127.0.0.1:3001';
const apiWs = new WebSocket(`${API_URL}/api`);
const eventWs = new WebSocket(`${API_URL}/event`);

// API 连接成功
apiWs.on('open', () => {
  console.log('API 连接成功');
});

// 事件连接成功
eventWs.on('open', () => {
  console.log('事件连接成功');
});

// 处理事件
eventWs.on('message', (data) => {
  const event = JSON.parse(data.toString());
  
  // 处理消息
  if (event.post_type === 'message') {
    handleMessage(event);
  }
});

// 处理消息
function handleMessage(event: any): void {
  const { message_type, user_id, group_id, raw_message } = event;
  
  // 私聊消息
  if (message_type === 'private') {
    if (raw_message === '你好') {
      apiWs.send(JSON.stringify({
        action: 'send_private_msg',
        params: {
          user_id: user_id,
          message: '你好！有什么可以帮助你的吗？'
        }
      }));
    }
  }
  // 群消息
  else if (message_type === 'group') {
    if (raw_message === '测试') {
      apiWs.send(JSON.stringify({
        action: 'send_group_msg',
        params: {
          group_id: group_id,
          message: [
            { type: 'at', data: { qq: String(user_id) } },
            { type: 'text', data: { text: ' 测试成功！' } }
          ]
        }
      }));
    }
  }
}

// 错误处理
apiWs.on('error', (err) => console.error('API 错误:', err));
eventWs.on('error', (err) => console.error('事件错误:', err));
```

---

*文档基于 OneBot 11 标准编写*
