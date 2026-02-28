# OneBot 11 API TypeScript 调用指南

本文档详细说明如何使用 TypeScript/JavaScript 通过 WebSocket 调用 OneBot 11 协议的所有 API。

## 目录

- [基础连接](#基础连接)
- [类型定义](#类型定义)
- [消息相关 API](#消息相关-api)
- [群管理 API](#群管理-api)
- [好友 API](#好友-api)
- [信息获取 API](#信息获取-api)
- [其他 API](#其他-api)
- [事件处理](#事件处理)
- [消息段类型](#消息段类型)

---

## 基础连接

### WebSocket 连接

```typescript
import WebSocket from 'ws';

// 连接到 Philia 的 WebSocket 服务器
const ws = new WebSocket('ws://127.0.0.1:3001/api');

ws.on('open', () => {
  console.log('已连接到 OneBot 实现');
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  console.log('收到响应:', response);
});

ws.on('error', (err) => {
  console.error('连接错误:', err);
});
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

## 类型定义

### 基础类型

```typescript
// 消息类型（字符串或数组格式）
type Message = string | MessageSegment[];

// 消息段
interface MessageSegment {
  type: string;
  data: Record<string, string | number | boolean>;
}

// API 请求结构
interface ApiRequest<T = any> {
  action: string;
  params?: T;
  echo?: string | number;
}

// API 响应结构
interface ApiResponse<T = any> {
  status: 'ok' | 'failed' | 'async';
  retcode: number;
  data: T;
  echo?: string | number;
}

// 发送者信息
interface Sender {
  user_id: number;
  nickname: string;
  sex?: 'male' | 'female' | 'unknown';
  age?: number;
  card?: string;
  area?: string;
  level?: string;
  role?: 'owner' | 'admin' | 'member';
  title?: string;
}

// 匿名信息
interface Anonymous {
  id: number;
  name: string;
  flag: string;
}
```

### 事件类型

```typescript
// 基础事件
interface BaseEvent {
  time: number;
  self_id: number;
  post_type: 'message' | 'notice' | 'request' | 'meta_event';
}

// 私聊消息事件
interface PrivateMessageEvent extends BaseEvent {
  post_type: 'message';
  message_type: 'private';
  sub_type: 'friend' | 'group' | 'other';
  message_id: number;
  user_id: number;
  message: Message;
  raw_message: string;
  font: number;
  sender: Sender;
}

// 群消息事件
interface GroupMessageEvent extends BaseEvent {
  post_type: 'message';
  message_type: 'group';
  sub_type: 'normal' | 'anonymous' | 'notice';
  message_id: number;
  group_id: number;
  user_id: number;
  anonymous: Anonymous | null;
  message: Message;
  raw_message: string;
  font: number;
  sender: Sender;
}
```

---

## 消息相关 API

### 1. 发送私聊消息 - `send_private_msg`

```typescript
interface SendPrivateMsgParams {
  user_id: number;
  message: Message;
  auto_escape?: boolean;
}

interface SendPrivateMsgResponse {
  message_id: number;
}

// 调用示例
function sendPrivateMsg(
  ws: WebSocket,
  userId: number,
  message: Message,
  echo?: string
): void {
  const request: ApiRequest<SendPrivateMsgParams> = {
    action: 'send_private_msg',
    params: {
      user_id: userId,
      message: message,
      auto_escape: false
    },
    echo: echo || `send_private_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}

// 使用示例
sendPrivateMsg(ws, 123456789, '你好！');
sendPrivateMsg(ws, 123456789, [
  { type: 'text', data: { text: '你好 ' } },
  { type: 'at', data: { qq: '123456' } }
]);
```

### 2. 发送群消息 - `send_group_msg`

```typescript
interface SendGroupMsgParams {
  group_id: number;
  message: Message;
  auto_escape?: boolean;
}

interface SendGroupMsgResponse {
  message_id: number;
}

// 调用示例
function sendGroupMsg(
  ws: WebSocket,
  groupId: number,
  message: Message,
  echo?: string
): void {
  const request: ApiRequest<SendGroupMsgParams> = {
    action: 'send_group_msg',
    params: {
      group_id: groupId,
      message: message,
      auto_escape: false
    },
    echo: echo || `send_group_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}

// 使用示例
sendGroupMsg(ws, 987654321, '大家好！');
```

### 3. 发送消息 - `send_msg`

```typescript
interface SendMsgParams {
  message_type?: 'private' | 'group';
  user_id?: number;
  group_id?: number;
  message: Message;
  auto_escape?: boolean;
}

// 调用示例
function sendMsg(
  ws: WebSocket,
  message: Message,
  options: { user_id?: number; group_id?: number; message_type?: 'private' | 'group' },
  echo?: string
): void {
  const request: ApiRequest<SendMsgParams> = {
    action: 'send_msg',
    params: {
      message: message,
      ...options
    },
    echo: echo || `send_msg_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}

// 使用示例
sendMsg(ws, '自动判断类型的消息', { user_id: 123456789 });
sendMsg(ws, '自动判断类型的消息', { group_id: 987654321 });
```

### 4. 撤回消息 - `delete_msg`

```typescript
interface DeleteMsgParams {
  message_id: number;
}

// 调用示例
function deleteMsg(ws: WebSocket, messageId: number, echo?: string): void {
  const request: ApiRequest<DeleteMsgParams> = {
    action: 'delete_msg',
    params: {
      message_id: messageId
    },
    echo: echo || `delete_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}

// 使用示例
deleteMsg(ws, 123456);
```

### 5. 获取消息 - `get_msg`

```typescript
interface GetMsgParams {
  message_id: number;
}

interface GetMsgResponse {
  time: number;
  message_type: 'private' | 'group';
  message_id: number;
  real_id: number;
  sender: Sender;
  message: Message;
}

// 调用示例
function getMsg(ws: WebSocket, messageId: number, echo?: string): void {
  const request: ApiRequest<GetMsgParams> = {
    action: 'get_msg',
    params: {
      message_id: messageId
    },
    echo: echo || `get_msg_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 6. 获取合并转发消息 - `get_forward_msg`

```typescript
interface GetForwardMsgParams {
  id: string;
}

interface GetForwardMsgResponse {
  message: MessageSegment[];
}

// 调用示例
function getForwardMsg(ws: WebSocket, id: string, echo?: string): void {
  const request: ApiRequest<GetForwardMsgParams> = {
    action: 'get_forward_msg',
    params: { id },
    echo: echo || `forward_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 7. 发送好友赞 - `send_like`

```typescript
interface SendLikeParams {
  user_id: number;
  times?: number;
}

// 调用示例
function sendLike(ws: WebSocket, userId: number, times: number = 1, echo?: string): void {
  const request: ApiRequest<SendLikeParams> = {
    action: 'send_like',
    params: {
      user_id: userId,
      times: Math.min(times, 10) // 每天最多10次
    },
    echo: echo || `like_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

---

## 群管理 API

### 1. 群组踢人 - `set_group_kick`

```typescript
interface SetGroupKickParams {
  group_id: number;
  user_id: number;
  reject_add_request?: boolean;
}

// 调用示例
function setGroupKick(
  ws: WebSocket,
  groupId: number,
  userId: number,
  rejectAddRequest: boolean = false,
  echo?: string
): void {
  const request: ApiRequest<SetGroupKickParams> = {
    action: 'set_group_kick',
    params: {
      group_id: groupId,
      user_id: userId,
      reject_add_request: rejectAddRequest
    },
    echo: echo || `kick_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 2. 群组单人禁言 - `set_group_ban`

```typescript
interface SetGroupBanParams {
  group_id: number;
  user_id: number;
  duration?: number;
}

// 调用示例
function setGroupBan(
  ws: WebSocket,
  groupId: number,
  userId: number,
  duration: number = 30 * 60, // 默认30分钟
  echo?: string
): void {
  const request: ApiRequest<SetGroupBanParams> = {
    action: 'set_group_ban',
    params: {
      group_id: groupId,
      user_id: userId,
      duration: duration // 单位秒，0表示取消禁言
    },
    echo: echo || `ban_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}

// 取消禁言
function liftGroupBan(ws: WebSocket, groupId: number, userId: number, echo?: string): void {
  setGroupBan(ws, groupId, userId, 0, echo);
}
```

### 3. 群组匿名用户禁言 - `set_group_anonymous_ban`

```typescript
interface SetGroupAnonymousBanParams {
  group_id: number;
  anonymous?: Anonymous;
  anonymous_flag?: string;
  flag?: string;
  duration?: number;
}

// 调用示例
function setGroupAnonymousBan(
  ws: WebSocket,
  groupId: number,
  flag: string | Anonymous,
  duration: number = 30 * 60,
  echo?: string
): void {
  const params: SetGroupAnonymousBanParams = {
    group_id: groupId,
    duration: duration
  };

  if (typeof flag === 'string') {
    params.flag = flag;
  } else {
    params.anonymous = flag;
  }

  const request: ApiRequest<SetGroupAnonymousBanParams> = {
    action: 'set_group_anonymous_ban',
    params,
    echo: echo || `anon_ban_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 4. 群组全员禁言 - `set_group_whole_ban`

```typescript
interface SetGroupWholeBanParams {
  group_id: number;
  enable?: boolean;
}

// 调用示例
function setGroupWholeBan(
  ws: WebSocket,
  groupId: number,
  enable: boolean = true,
  echo?: string
): void {
  const request: ApiRequest<SetGroupWholeBanParams> = {
    action: 'set_group_whole_ban',
    params: {
      group_id: groupId,
      enable: enable
    },
    echo: echo || `whole_ban_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 5. 群组设置管理员 - `set_group_admin`

```typescript
interface SetGroupAdminParams {
  group_id: number;
  user_id: number;
  enable?: boolean;
}

// 调用示例
function setGroupAdmin(
  ws: WebSocket,
  groupId: number,
  userId: number,
  enable: boolean = true,
  echo?: string
): void {
  const request: ApiRequest<SetGroupAdminParams> = {
    action: 'set_group_admin',
    params: {
      group_id: groupId,
      user_id: userId,
      enable: enable
    },
    echo: echo || `admin_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 6. 群组匿名设置 - `set_group_anonymous`

```typescript
interface SetGroupAnonymousParams {
  group_id: number;
  enable?: boolean;
}

// 调用示例
function setGroupAnonymous(
  ws: WebSocket,
  groupId: number,
  enable: boolean = true,
  echo?: string
): void {
  const request: ApiRequest<SetGroupAnonymousParams> = {
    action: 'set_group_anonymous',
    params: {
      group_id: groupId,
      enable: enable
    },
    echo: echo || `anonymous_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 7. 设置群名片 - `set_group_card`

```typescript
interface SetGroupCardParams {
  group_id: number;
  user_id: number;
  card?: string;
}

// 调用示例
function setGroupCard(
  ws: WebSocket,
  groupId: number,
  userId: number,
  card: string = '',
  echo?: string
): void {
  const request: ApiRequest<SetGroupCardParams> = {
    action: 'set_group_card',
    params: {
      group_id: groupId,
      user_id: userId,
      card: card // 空字符串表示删除群名片
    },
    echo: echo || `card_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 8. 设置群名 - `set_group_name`

```typescript
interface SetGroupNameParams {
  group_id: number;
  group_name: string;
}

// 调用示例
function setGroupName(
  ws: WebSocket,
  groupId: number,
  groupName: string,
  echo?: string
): void {
  const request: ApiRequest<SetGroupNameParams> = {
    action: 'set_group_name',
    params: {
      group_id: groupId,
      group_name: groupName
    },
    echo: echo || `group_name_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 9. 退出群组 - `set_group_leave`

```typescript
interface SetGroupLeaveParams {
  group_id: number;
  is_dismiss?: boolean;
}

// 调用示例
function setGroupLeave(
  ws: WebSocket,
  groupId: number,
  isDismiss: boolean = false,
  echo?: string
): void {
  const request: ApiRequest<SetGroupLeaveParams> = {
    action: 'set_group_leave',
    params: {
      group_id: groupId,
      is_dismiss: isDismiss // true表示解散群组（需要是群主）
    },
    echo: echo || `leave_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 10. 设置群组专属头衔 - `set_group_special_title`

```typescript
interface SetGroupSpecialTitleParams {
  group_id: number;
  user_id: number;
  special_title?: string;
  duration?: number;
}

// 调用示例
function setGroupSpecialTitle(
  ws: WebSocket,
  groupId: number,
  userId: number,
  specialTitle: string = '',
  duration: number = -1, // -1表示永久
  echo?: string
): void {
  const request: ApiRequest<SetGroupSpecialTitleParams> = {
    action: 'set_group_special_title',
    params: {
      group_id: groupId,
      user_id: userId,
      special_title: specialTitle,
      duration: duration
    },
    echo: echo || `title_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 11. 处理加群请求/邀请 - `set_group_add_request`

```typescript
interface SetGroupAddRequestParams {
  flag: string;
  sub_type?: 'add' | 'invite';
  type?: 'add' | 'invite';
  approve?: boolean;
  reason?: string;
}

// 调用示例
function setGroupAddRequest(
  ws: WebSocket,
  flag: string,
  subType: 'add' | 'invite',
  approve: boolean = true,
  reason: string = '',
  echo?: string
): void {
  const request: ApiRequest<SetGroupAddRequestParams> = {
    action: 'set_group_add_request',
    params: {
      flag: flag,
      sub_type: subType,
      approve: approve,
      reason: reason // 拒绝时的理由
    },
    echo: echo || `group_request_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

---

## 好友 API

### 1. 处理加好友请求 - `set_friend_add_request`

```typescript
interface SetFriendAddRequestParams {
  flag: string;
  approve?: boolean;
  remark?: string;
}

// 调用示例
function setFriendAddRequest(
  ws: WebSocket,
  flag: string,
  approve: boolean = true,
  remark: string = '',
  echo?: string
): void {
  const request: ApiRequest<SetFriendAddRequestParams> = {
    action: 'set_friend_add_request',
    params: {
      flag: flag,
      approve: approve,
      remark: remark // 添加后的备注名
    },
    echo: echo || `friend_request_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

---

## 信息获取 API

### 1. 获取登录号信息 - `get_login_info`

```typescript
interface GetLoginInfoResponse {
  user_id: number;
  nickname: string;
}

// 调用示例
function getLoginInfo(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_login_info',
    echo: echo || `login_info_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 2. 获取陌生人信息 - `get_stranger_info`

```typescript
interface GetStrangerInfoParams {
  user_id: number;
  no_cache?: boolean;
}

interface GetStrangerInfoResponse {
  user_id: number;
  nickname: string;
  sex: 'male' | 'female' | 'unknown';
  age: number;
}

// 调用示例
function getStrangerInfo(
  ws: WebSocket,
  userId: number,
  noCache: boolean = false,
  echo?: string
): void {
  const request: ApiRequest<GetStrangerInfoParams> = {
    action: 'get_stranger_info',
    params: {
      user_id: userId,
      no_cache: noCache
    },
    echo: echo || `stranger_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 3. 获取好友列表 - `get_friend_list`

```typescript
interface FriendInfo {
  user_id: number;
  nickname: string;
  remark: string;
}

// 调用示例
function getFriendList(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_friend_list',
    echo: echo || `friend_list_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 4. 获取群信息 - `get_group_info`

```typescript
interface GetGroupInfoParams {
  group_id: number;
  no_cache?: boolean;
}

interface GetGroupInfoResponse {
  group_id: number;
  group_name: string;
  member_count: number;
  max_member_count: number;
}

// 调用示例
function getGroupInfo(
  ws: WebSocket,
  groupId: number,
  noCache: boolean = false,
  echo?: string
): void {
  const request: ApiRequest<GetGroupInfoParams> = {
    action: 'get_group_info',
    params: {
      group_id: groupId,
      no_cache: noCache
    },
    echo: echo || `group_info_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 5. 获取群列表 - `get_group_list`

```typescript
// 调用示例
function getGroupList(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_group_list',
    echo: echo || `group_list_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 6. 获取群成员信息 - `get_group_member_info`

```typescript
interface GetGroupMemberInfoParams {
  group_id: number;
  user_id: number;
  no_cache?: boolean;
}

interface GetGroupMemberInfoResponse {
  group_id: number;
  user_id: number;
  nickname: string;
  card: string;
  sex: 'male' | 'female' | 'unknown';
  age: number;
  area: string;
  join_time: number;
  last_sent_time: number;
  level: string;
  role: 'owner' | 'admin' | 'member';
  unfriendly: boolean;
  title: string;
  title_expire_time: number;
  card_changeable: boolean;
}

// 调用示例
function getGroupMemberInfo(
  ws: WebSocket,
  groupId: number,
  userId: number,
  noCache: boolean = false,
  echo?: string
): void {
  const request: ApiRequest<GetGroupMemberInfoParams> = {
    action: 'get_group_member_info',
    params: {
      group_id: groupId,
      user_id: userId,
      no_cache: noCache
    },
    echo: echo || `member_info_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 7. 获取群成员列表 - `get_group_member_list`

```typescript
interface GetGroupMemberListParams {
  group_id: number;
}

// 调用示例
function getGroupMemberList(
  ws: WebSocket,
  groupId: number,
  echo?: string
): void {
  const request: ApiRequest<GetGroupMemberListParams> = {
    action: 'get_group_member_list',
    params: {
      group_id: groupId
    },
    echo: echo || `member_list_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 8. 获取群荣誉信息 - `get_group_honor_info`

```typescript
interface GetGroupHonorInfoParams {
  group_id: number;
  type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all';
}

interface HonorUser {
  user_id: number;
  nickname: string;
  avatar: string;
  description?: string;
}

interface CurrentTalkative {
  user_id: number;
  nickname: string;
  avatar: string;
  day_count: number;
}

interface GetGroupHonorInfoResponse {
  group_id: number;
  current_talkative?: CurrentTalkative;
  talkative_list?: HonorUser[];
  performer_list?: HonorUser[];
  legend_list?: HonorUser[];
  strong_newbie_list?: HonorUser[];
  emotion_list?: HonorUser[];
}

// 调用示例
function getGroupHonorInfo(
  ws: WebSocket,
  groupId: number,
  type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all' = 'all',
  echo?: string
): void {
  const request: ApiRequest<GetGroupHonorInfoParams> = {
    action: 'get_group_honor_info',
    params: {
      group_id: groupId,
      type: type
    },
    echo: echo || `honor_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

---

## 其他 API

### 1. 获取 Cookies - `get_cookies`

```typescript
interface GetCookiesParams {
  domain?: string;
}

interface GetCookiesResponse {
  cookies: string;
}

// 调用示例
function getCookies(ws: WebSocket, domain: string = '', echo?: string): void {
  const request: ApiRequest<GetCookiesParams> = {
    action: 'get_cookies',
    params: { domain },
    echo: echo || `cookies_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 2. 获取 CSRF Token - `get_csrf_token`

```typescript
interface GetCsrfTokenResponse {
  token: number;
}

// 调用示例
function getCsrfToken(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_csrf_token',
    echo: echo || `csrf_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 3. 获取 QQ 相关接口凭证 - `get_credentials`

```typescript
interface GetCredentialsParams {
  domain?: string;
}

interface GetCredentialsResponse {
  cookies: string;
  csrf_token: number;
}

// 调用示例
function getCredentials(ws: WebSocket, domain: string = '', echo?: string): void {
  const request: ApiRequest<GetCredentialsParams> = {
    action: 'get_credentials',
    params: { domain },
    echo: echo || `credentials_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 4. 获取语音 - `get_record`

```typescript
interface GetRecordParams {
  file: string;
  out_format: 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac';
}

interface GetRecordResponse {
  file: string;
}

// 调用示例
function getRecord(
  ws: WebSocket,
  file: string,
  outFormat: 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac' = 'mp3',
  echo?: string
): void {
  const request: ApiRequest<GetRecordParams> = {
    action: 'get_record',
    params: {
      file: file,
      out_format: outFormat
    },
    echo: echo || `record_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 5. 获取图片 - `get_image`

```typescript
interface GetImageParams {
  file: string;
}

interface GetImageResponse {
  file: string;
}

// 调用示例
function getImage(ws: WebSocket, file: string, echo?: string): void {
  const request: ApiRequest<GetImageParams> = {
    action: 'get_image',
    params: { file },
    echo: echo || `image_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 6. 检查是否可以发送图片 - `can_send_image`

```typescript
interface CanSendImageResponse {
  yes: boolean;
}

// 调用示例
function canSendImage(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'can_send_image',
    echo: echo || `can_image_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 7. 检查是否可以发送语音 - `can_send_record`

```typescript
interface CanSendRecordResponse {
  yes: boolean;
}

// 调用示例
function canSendRecord(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'can_send_record',
    echo: echo || `can_record_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 8. 获取运行状态 - `get_status`

```typescript
interface GetStatusResponse {
  online: boolean | null;
  good: boolean;
  // 其他字段由 OneBot 实现自行定义
}

// 调用示例
function getStatus(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_status',
    echo: echo || `status_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 9. 获取版本信息 - `get_version_info`

```typescript
interface GetVersionInfoResponse {
  app_name: string;
  app_version: string;
  protocol_version: string;
  // 其他字段由 OneBot 实现自行定义
}

// 调用示例
function getVersionInfo(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'get_version_info',
    echo: echo || `version_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 10. 重启 OneBot 实现 - `set_restart`

```typescript
interface SetRestartParams {
  delay?: number;
}

// 调用示例
function setRestart(ws: WebSocket, delay: number = 0, echo?: string): void {
  const request: ApiRequest<SetRestartParams> = {
    action: 'set_restart',
    params: { delay },
    echo: echo || `restart_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

### 11. 清理缓存 - `clean_cache`

```typescript
// 调用示例
function cleanCache(ws: WebSocket, echo?: string): void {
  const request: ApiRequest = {
    action: 'clean_cache',
    echo: echo || `clean_${Date.now()}`
  };
  ws.send(JSON.stringify(request));
}
```

---

## 事件处理

### 连接到事件端点

```typescript
const eventWs = new WebSocket('ws://127.0.0.1:3001/event');

eventWs.on('message', (data) => {
  const event = JSON.parse(data.toString()) as BaseEvent;
  
  switch (event.post_type) {
    case 'message':
      handleMessageEvent(event as PrivateMessageEvent | GroupMessageEvent);
      break;
    case 'notice':
      handleNoticeEvent(event);
      break;
    case 'request':
      handleRequestEvent(event);
      break;
    case 'meta_event':
      handleMetaEvent(event);
      break;
  }
});
```

### 消息事件处理

```typescript
function handleMessageEvent(event: PrivateMessageEvent | GroupMessageEvent): void {
  if (event.message_type === 'private') {
    console.log(`私聊消息 from ${event.user_id}: ${event.raw_message}`);
    // 处理私聊消息...
  } else {
    console.log(`群消息 from ${event.user_id} in ${event.group_id}: ${event.raw_message}`);
    // 处理群消息...
  }
}
```

### 通知事件处理

```typescript
interface GroupUploadNotice {
  post_type: 'notice';
  notice_type: 'group_upload';
  group_id: number;
  user_id: number;
  file: {
    id: string;
    name: string;
    size: number;
    busid: number;
  };
}

interface GroupAdminNotice {
  post_type: 'notice';
  notice_type: 'group_admin';
  sub_type: 'set' | 'unset';
  group_id: number;
  user_id: number;
}

// 其他通知事件类型...
```

---

## 消息段类型

### 纯文本

```typescript
const textSegment: MessageSegment = {
  type: 'text',
  data: { text: '纯文本内容' }
};
```

### QQ 表情

```typescript
const faceSegment: MessageSegment = {
  type: 'face',
  data: { id: '123' }
};
```

### 图片

```typescript
const imageSegment: MessageSegment = {
  type: 'image',
  data: {
    file: 'http://example.com/pic.jpg',
    // 或 file: 'file:///C:/path/to/image.png'
    // 或 file: 'base64://...'
    type: 'flash', // 可选：flash 表示闪照
    cache: '1',
    proxy: '1',
    timeout: '30'
  }
};
```

### 语音

```typescript
const recordSegment: MessageSegment = {
  type: 'record',
  data: {
    file: 'http://example.com/voice.mp3',
    magic: '0' // 1 表示变声
  }
};
```

### 短视频

```typescript
const videoSegment: MessageSegment = {
  type: 'video',
  data: {
    file: 'http://example.com/video.mp4'
  }
};
```

### @某人

```typescript
const atSegment: MessageSegment = {
  type: 'at',
  data: { qq: '123456789' } // 'all' 表示@全体成员
};
```

### 回复

```typescript
const replySegment: MessageSegment = {
  type: 'reply',
  data: { id: '123456' } // 要回复的消息ID
};
```

### 猜拳魔法表情

```typescript
const rpsSegment: MessageSegment = {
  type: 'rps',
  data: {}
};
```

### 掷骰子魔法表情

```typescript
const diceSegment: MessageSegment = {
  type: 'dice',
  data: {}
};
```

### 戳一戳

```typescript
const pokeSegment: MessageSegment = {
  type: 'poke',
  data: { qq: '123456789' }
};
```

### 链接分享

```typescript
const shareSegment: MessageSegment = {
  type: 'share',
  data: {
    url: 'https://example.com',
    title: '标题',
    content: '内容描述',
    image: 'https://example.com/thumb.jpg'
  }
};
```

### 音乐分享

```typescript
const musicSegment: MessageSegment = {
  type: 'music',
  data: {
    type: 'qq', // qq, 163, xm, custom
    id: '123456'
  }
};

// 自定义音乐
const customMusicSegment: MessageSegment = {
  type: 'music',
  data: {
    type: 'custom',
    url: 'https://example.com/music.mp3',
    audio: 'https://example.com/audio.mp3',
    title: '音乐标题',
    content: '音乐描述',
    image: 'https://example.com/cover.jpg'
  }
};
```

---

## 完整示例：机器人框架

```typescript
import WebSocket from 'ws';
import EventEmitter from 'events';

class OneBotClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiWs: WebSocket | null = null;
  private requestCallbacks: Map<string, (data: any) => void> = new Map();

  constructor(private url: string, private token?: string) {
    super();
  }

  connect(): void {
    // 连接事件端点
    this.ws = new WebSocket(`${this.url}/event`, {
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
    });

    this.ws.on('open', () => this.emit('connect'));
    this.ws.on('message', (data) => this.handleEvent(JSON.parse(data.toString())));
    this.ws.on('error', (err) => this.emit('error', err));
    this.ws.on('close', () => this.emit('disconnect'));

    // 连接 API 端点
    this.apiWs = new WebSocket(`${this.url}/api`, {
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
    });

    this.apiWs.on('message', (data) => this.handleResponse(JSON.parse(data.toString())));
  }

  private handleEvent(event: any): void {
    this.emit('event', event);
    this.emit(event.post_type, event);
  }

  private handleResponse(response: ApiResponse): void {
    if (response.echo && this.requestCallbacks.has(String(response.echo))) {
      const callback = this.requestCallbacks.get(String(response.echo));
      callback?.(response);
      this.requestCallbacks.delete(String(response.echo));
    }
  }

  callApi<T = any>(action: string, params?: any): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!this.apiWs || this.apiWs.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const echo = `${action}_${Date.now()}_${Math.random()}`;
      const request: ApiRequest = { action, params, echo };

      this.requestCallbacks.set(echo, resolve);
      this.apiWs.send(JSON.stringify(request));

      // 超时处理
      setTimeout(() => {
        if (this.requestCallbacks.has(echo)) {
          this.requestCallbacks.delete(echo);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  // 便捷方法
  sendPrivateMsg(userId: number, message: Message) {
    return this.callApi('send_private_msg', { user_id: userId, message });
  }

  sendGroupMsg(groupId: number, message: Message) {
    return this.callApi('send_group_msg', { group_id: groupId, message });
  }

  deleteMsg(messageId: number) {
    return this.callApi('delete_msg', { message_id: messageId });
  }

  getMsg(messageId: number) {
    return this.callApi('get_msg', { message_id: messageId });
  }

  getLoginInfo() {
    return this.callApi('get_login_info');
  }

  getFriendList() {
    return this.callApi('get_friend_list');
  }

  getGroupList() {
    return this.callApi('get_group_list');
  }

  getGroupInfo(groupId: number) {
    return this.callApi('get_group_info', { group_id: groupId });
  }

  getGroupMemberList(groupId: number) {
    return this.callApi('get_group_member_list', { group_id: groupId });
  }

  setGroupBan(groupId: number, userId: number, duration: number = 30 * 60) {
    return this.callApi('set_group_ban', { group_id: groupId, user_id: userId, duration });
  }

  setGroupKick(groupId: number, userId: number, rejectAddRequest: boolean = false) {
    return this.callApi('set_group_kick', { group_id: groupId, user_id: userId, reject_add_request: rejectAddRequest });
  }
}

// 使用示例
const bot = new OneBotClient('ws://127.0.0.1:3001', 'your_token');

bot.on('connect', () => {
  console.log('Bot connected!');
});

bot.on('message', async (event) => {
  if (event.message_type === 'private') {
    await bot.sendPrivateMsg(event.user_id, `收到: ${event.raw_message}`);
  } else if (event.message_type === 'group') {
    if (event.raw_message === '测试') {
      await bot.sendGroupMsg(event.group_id, '测试成功！');
    }
  }
});

bot.connect();
```

---

## 附录：返回码说明

| retcode | 说明 |
|---------|------|
| 0 | 成功 |
| 1400 | 请求参数错误 (对应 HTTP 400) |
| 1401 | 鉴权失败 (对应 HTTP 401) |
| 1403 | 权限不足 (对应 HTTP 403) |
| 1404 | API 不存在 (对应 HTTP 404) |

---

*文档基于 OneBot 11 标准编写*
