# OneBot 11 API TypeScript 详细调用指南

本文档是 OneBot 11 协议的完整 TypeScript 开发指南，包含详细的类型定义、API 调用示例、事件处理、错误处理和实际应用场景。

## 目录

- [环境准备](#环境准备)
- [核心类型系统](#核心类型系统)
- [WebSocket 连接管理](#websocket-连接管理)
- [消息 API 详解](#消息-api-详解)
- [群管理 API 详解](#群管理-api-详解)
- [好友 API 详解](#好友-api-详解)
- [信息查询 API 详解](#信息查询-api-详解)
- [系统 API 详解](#系统-api-详解)
- [事件系统详解](#事件系统详解)
- [消息段构造器](#消息段构造器)
- [完整机器人框架](#完整机器人框架)
- [常见场景示例](#常见场景示例)
- [错误处理与重试](#错误处理与重试)
- [性能优化](#性能优化)

---

## 环境准备

### 安装依赖

```bash
npm install ws @types/ws
npm install -D typescript
```

### tsconfig.json 配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 核心类型系统

### 基础类型定义

```typescript
// ==================== 基础类型 ====================

/** 消息类型：字符串格式或数组格式 */
export type Message = string | MessageSegment[];

/** 消息段类型 */
export interface MessageSegment {
  type: string;
  data: Record<string, string | number | boolean | undefined>;
}

/** API 请求结构 */
export interface ApiRequest<T = any> {
  action: string;
  params?: T;
  echo?: string | number;
}

/** API 响应状态 */
export type ApiStatus = 'ok' | 'failed' | 'async';

/** API 响应结构 */
export interface ApiResponse<T = any> {
  status: ApiStatus;
  retcode: number;
  data: T;
  echo?: string | number;
  msg?: string;
  wording?: string;
}

/** 响应回调函数类型 */
export type ResponseCallback<T = any> = (response: ApiResponse<T>) => void;

// ==================== 用户相关类型 ====================

/** 性别类型 */
export type Sex = 'male' | 'female' | 'unknown';

/** 群角色类型 */
export type GroupRole = 'owner' | 'admin' | 'member';

/** 发送者信息 */
export interface Sender {
  user_id: number;
  nickname: string;
  sex?: Sex;
  age?: number;
  card?: string;
  area?: string;
  level?: string;
  role?: GroupRole;
  title?: string;
}

/** 陌生人信息 */
export interface StrangerInfo {
  user_id: number;
  nickname: string;
  sex: Sex;
  age: number;
}

/** 好友信息 */
export interface FriendInfo {
  user_id: number;
  nickname: string;
  remark: string;
}

/** 匿名信息 */
export interface Anonymous {
  id: number;
  name: string;
  flag: string;
}

// ==================== 群组相关类型 ====================

/** 群信息 */
export interface GroupInfo {
  group_id: number;
  group_name: string;
  member_count: number;
  max_member_count: number;
}

/** 群成员信息 */
export interface GroupMemberInfo {
  group_id: number;
  user_id: number;
  nickname: string;
  card: string;
  sex: Sex;
  age: number;
  area: string;
  join_time: number;
  last_sent_time: number;
  level: string;
  role: GroupRole;
  unfriendly: boolean;
  title: string;
  title_expire_time: number;
  card_changeable: boolean;
  /** 禁言到期时间 */
  shut_up_timestamp?: number;
}

/** 群荣誉类型 */
export type HonorType = 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all';

/** 群荣誉用户 */
export interface HonorUser {
  user_id: number;
  nickname: string;
  avatar: string;
  description?: string;
}

/** 当前龙王 */
export interface CurrentTalkative {
  user_id: number;
  nickname: string;
  avatar: string;
  day_count: number;
}

/** 群荣誉信息 */
export interface GroupHonorInfo {
  group_id: number;
  current_talkative?: CurrentTalkative;
  talkative_list?: HonorUser[];
  performer_list?: HonorUser[];
  legend_list?: HonorUser[];
  strong_newbie_list?: HonorUser[];
  emotion_list?: HonorUser[];
}

/** 群文件信息 */
export interface GroupFile {
  id: string;
  name: string;
  size: number;
  busid: number;
}

// ==================== 消息相关类型 ====================

/** 消息类型 */
export type MessageType = 'private' | 'group';

/** 私聊消息子类型 */
export type PrivateSubType = 'friend' | 'group' | 'other';

/** 群消息子类型 */
export type GroupSubType = 'normal' | 'anonymous' | 'notice';

/** 消息信息 */
export interface MessageInfo {
  time: number;
  message_type: MessageType;
  message_id: number;
  real_id: number;
  sender: Sender;
  message: Message;
}

// ==================== 系统相关类型 ====================

/** 登录号信息 */
export interface LoginInfo {
  user_id: number;
  nickname: string;
}

/** 版本信息 */
export interface VersionInfo {
  app_name: string;
  app_version: string;
  protocol_version: string;
  [key: string]: any;
}

/** 运行状态 */
export interface StatusInfo {
  online: boolean | null;
  good: boolean;
  [key: string]: any;
}

/** 凭证信息 */
export interface Credentials {
  cookies: string;
  csrf_token: number;
}

/** 语音/图片文件信息 */
export interface FileInfo {
  file: string;
}

/** 是否可以发送 */
export interface CanSend {
  yes: boolean;
}

// ==================== 请求相关类型 ====================

/** 请求类型 */
export type RequestType = 'friend' | 'group';

/** 群请求子类型 */
export type GroupRequestSubType = 'add' | 'invite';

// ==================== 配置类型 ====================

/** OneBot 客户端配置 */
export interface OneBotConfig {
  /** WebSocket 地址 */
  url: string;
  /** 访问令牌（可选） */
  accessToken?: string;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 请求超时时间（毫秒） */
  requestTimeout?: number;
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
}

/** 默认配置 */
export const DEFAULT_CONFIG: Required<Omit<OneBotConfig, 'url' | 'accessToken'>> = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  requestTimeout: 30000,
  heartbeatInterval: 30000,
};
```

---

## WebSocket 连接管理

### 连接管理器类

```typescript
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import {
  OneBotConfig,
  DEFAULT_CONFIG,
  ApiRequest,
  ApiResponse,
  ResponseCallback
} from './types';

/** 连接状态 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  CLOSED = 'closed',
}

/** WebSocket 连接管理器 */
export class ConnectionManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly config: Required<OneBotConfig>;

  constructor(config: OneBotConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** 获取当前连接状态 */
  getState(): ConnectionState {
    return this.state;
  }

  /** 是否已连接 */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && 
           this.ws?.readyState === WebSocket.OPEN;
  }

  /** 建立连接 */
  connect(): void {
    if (this.state === ConnectionState.CONNECTING || 
        this.state === ConnectionState.CONNECTED) {
      return;
    }

    this.state = ConnectionState.CONNECTING;
    this.emit('stateChange', this.state);

    const headers: Record<string, string> = {};
    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    try {
      this.ws = new WebSocket(this.config.url, { headers });
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /** 断开连接 */
  disconnect(): void {
    this.state = ConnectionState.CLOSED;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.emit('stateChange', this.state);
    this.emit('disconnect');
  }

  /** 发送数据 */
  send(data: string | object): boolean {
    if (!this.isConnected()) {
      this.emit('error', new Error('WebSocket not connected'));
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws!.send(message);
      return true;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  /** 设置事件处理器 */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      this.state = ConnectionState.CONNECTED;
      this.reconnectAttempts = 0;
      this.emit('stateChange', this.state);
      this.emit('connect');
      this.startHeartbeat();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('message', message);
      } catch (error) {
        this.emit('error', new Error(`Failed to parse message: ${error}`));
      }
    });

    this.ws.on('close', (code: number, reason: string) => {
      this.clearTimers();
      
      if (this.state !== ConnectionState.CLOSED) {
        this.state = ConnectionState.DISCONNECTED;
        this.emit('stateChange', this.state);
        this.emit('disconnect', code, reason);
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (error: Error) => {
      this.handleError(error);
    });

    this.ws.on('ping', () => {
      this.ws?.pong();
    });

    this.ws.on('pong', () => {
      this.emit('pong');
    });
  }

  /** 处理错误 */
  private handleError(error: Error): void {
    this.emit('error', error);
    
    if (this.state === ConnectionState.CONNECTING) {
      this.state = ConnectionState.DISCONNECTED;
      this.emit('stateChange', this.state);
      this.scheduleReconnect();
    }
  }

  /** 安排重连 */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.state = ConnectionState.RECONNECTING;
    this.emit('stateChange', this.state);

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.config.reconnectInterval);
  }

  /** 启动心跳 */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.ws!.ping();
      }
    }, this.config.heartbeatInterval);
  }

  /** 清除定时器 */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
```

---

## 消息 API 详解

### 消息 API 类

```typescript
import { ConnectionManager } from './connection';
import {
  Message,
  MessageSegment,
  ApiResponse,
  MessageInfo
} from './types';

/** 发送消息参数 */
export interface SendPrivateMsgParams {
  user_id: number;
  message: Message;
  auto_escape?: boolean;
}

export interface SendGroupMsgParams {
  group_id: number;
  message: Message;
  auto_escape?: boolean;
}

export interface SendMsgParams {
  message_type?: 'private' | 'group';
  user_id?: number;
  group_id?: number;
  message: Message;
  auto_escape?: boolean;
}

/** 发送消息响应 */
export interface SendMsgResponse {
  message_id: number;
}

/** 消息 API */
export class MessageApi {
  constructor(
    private connection: ConnectionManager,
    private callApi: <T>(action: string, params?: any, timeout?: number) => Promise<ApiResponse<T>>
  ) {}

  /**
   * 发送私聊消息
   * @param userId 对方 QQ 号
   * @param message 消息内容
   * @param autoEscape 是否作为纯文本发送（不解析 CQ 码）
   */
  async sendPrivateMsg(
    userId: number,
    message: Message,
    autoEscape: boolean = false
  ): Promise<number> {
    const response = await this.callApi<SendMsgResponse>('send_private_msg', {
      user_id: userId,
      message,
      auto_escape: autoEscape
    });
    
    if (response.status !== 'ok') {
      throw new Error(`发送私聊消息失败: ${response.wording || response.msg}`);
    }
    
    return response.data.message_id;
  }

  /**
   * 发送群消息
   * @param groupId 群号
   * @param message 消息内容
   * @param autoEscape 是否作为纯文本发送
   */
  async sendGroupMsg(
    groupId: number,
    message: Message,
    autoEscape: boolean = false
  ): Promise<number> {
    const response = await this.callApi<SendMsgResponse>('send_group_msg', {
      group_id: groupId,
      message,
      auto_escape: autoEscape
    });
    
    if (response.status !== 'ok') {
      throw new Error(`发送群消息失败: ${response.wording || response.msg}`);
    }
    
    return response.data.message_id;
  }

  /**
   * 发送消息（自动判断类型）
   * @param message 消息内容
   * @param options 发送选项
   */
  async sendMsg(
    message: Message,
    options: {
      user_id?: number;
      group_id?: number;
      message_type?: 'private' | 'group';
    },
    autoEscape: boolean = false
  ): Promise<number> {
    const response = await this.callApi<SendMsgResponse>('send_msg', {
      message,
      ...options,
      auto_escape: autoEscape
    });
    
    if (response.status !== 'ok') {
      throw new Error(`发送消息失败: ${response.wording || response.msg}`);
    }
    
    return response.data.message_id;
  }

  /**
   * 撤回消息
   * @param messageId 消息 ID
   */
  async deleteMsg(messageId: number): Promise<void> {
    const response = await this.callApi('delete_msg', {
      message_id: messageId
    });
    
    if (response.status !== 'ok') {
      throw new Error(`撤回消息失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 获取消息
   * @param messageId 消息 ID
   */
  async getMsg(messageId: number): Promise<MessageInfo> {
    const response = await this.callApi<MessageInfo>('get_msg', {
      message_id: messageId
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取消息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取合并转发消息
   * @param id 合并转发 ID
   */
  async getForwardMsg(id: string): Promise<MessageSegment[]> {
    const response = await this.callApi<{ message: MessageSegment[] }>('get_forward_msg', {
      id
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取转发消息失败: ${response.wording || response.msg}`);
    }
    
    return response.data.message;
  }

  /**
   * 发送好友赞
   * @param userId QQ 号
   * @param times 赞的次数（每天最多 10 次）
   */
  async sendLike(userId: number, times: number = 1): Promise<void> {
    const response = await this.callApi('send_like', {
      user_id: userId,
      times: Math.min(times, 10)
    });
    
    if (response.status !== 'ok') {
      throw new Error(`发送赞失败: ${response.wording || response.msg}`);
    }
  }

  // ==================== 便捷方法 ====================

  /**
   * 回复私聊消息
   * @param event 私聊消息事件
   * @param message 回复内容
   */
  async replyPrivate(event: { user_id: number }, message: Message): Promise<number> {
    return this.sendPrivateMsg(event.user_id, message);
  }

  /**
   * 回复群消息
   * @param event 群消息事件
   * @param message 回复内容
   * @param atSender 是否 @ 发送者
   */
  async replyGroup(
    event: { group_id: number; user_id: number },
    message: Message,
    atSender: boolean = false
  ): Promise<number> {
    const msg: Message = atSender
      ? [{ type: 'at', data: { qq: String(event.user_id) } }, { type: 'text', data: { text: ' ' } }, ...(Array.isArray(message) ? message : [{ type: 'text', data: { text: message } }])]
      : message;
    
    return this.sendGroupMsg(event.group_id, msg);
  }

  /**
   * 发送图文消息
   * @param target 目标（私聊为 user_id，群聊为 group_id）
   * @param text 文本内容
   * @param imageUrl 图片 URL
   * @param isGroup 是否为群聊
   */
  async sendImageWithText(
    target: number,
    text: string,
    imageUrl: string,
    isGroup: boolean = false
  ): Promise<number> {
    const message: MessageSegment[] = [
      { type: 'text', data: { text } },
      { type: 'image', data: { file: imageUrl } }
    ];

    if (isGroup) {
      return this.sendGroupMsg(target, message);
    } else {
      return this.sendPrivateMsg(target, message);
    }
  }
}
```

---

## 群管理 API 详解

```typescript
import { ConnectionManager } from './connection';
import { ApiResponse, GroupMemberInfo, Anonymous } from './types';

/** 群管理 API */
export class GroupApi {
  constructor(
    private connection: ConnectionManager,
    private callApi: <T>(action: string, params?: any, timeout?: number) => Promise<ApiResponse<T>>
  ) {}

  /**
   * 群组踢人
   * @param groupId 群号
   * @param userId 要踢的 QQ 号
   * @param rejectAddRequest 是否拒绝此人后续加群请求
   */
  async kickMember(
    groupId: number,
    userId: number,
    rejectAddRequest: boolean = false
  ): Promise<void> {
    const response = await this.callApi('set_group_kick', {
      group_id: groupId,
      user_id: userId,
      reject_add_request: rejectAddRequest
    });
    
    if (response.status !== 'ok') {
      throw new Error(`踢人失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 群组单人禁言
   * @param groupId 群号
   * @param userId 要禁言的 QQ 号
   * @param duration 禁言时长（秒），0 表示取消禁言
   */
  async banMember(
    groupId: number,
    userId: number,
    duration: number = 30 * 60
  ): Promise<void> {
    const response = await this.callApi('set_group_ban', {
      group_id: groupId,
      user_id: userId,
      duration
    });
    
    if (response.status !== 'ok') {
      throw new Error(`禁言失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 取消禁言
   * @param groupId 群号
   * @param userId QQ 号
   */
  async liftBan(groupId: number, userId: number): Promise<void> {
    return this.banMember(groupId, userId, 0);
  }

  /**
   * 群组匿名用户禁言
   * @param groupId 群号
   * @param flag 匿名用户 flag 或 Anonymous 对象
   * @param duration 禁言时长
   */
  async banAnonymous(
    groupId: number,
    flag: string | Anonymous,
    duration: number = 30 * 60
  ): Promise<void> {
    const params: any = {
      group_id: groupId,
      duration
    };

    if (typeof flag === 'string') {
      params.flag = flag;
    } else {
      params.anonymous = flag;
    }

    const response = await this.callApi('set_group_anonymous_ban', params);
    
    if (response.status !== 'ok') {
      throw new Error(`匿名禁言失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 群组全员禁言
   * @param groupId 群号
   * @param enable 是否禁言
   */
  async setWholeBan(groupId: number, enable: boolean = true): Promise<void> {
    const response = await this.callApi('set_group_whole_ban', {
      group_id: groupId,
      enable
    });
    
    if (response.status !== 'ok') {
      throw new Error(`全员禁言失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 群组设置管理员
   * @param groupId 群号
   * @param userId QQ 号
   * @param enable true 为设置，false 为取消
   */
  async setAdmin(
    groupId: number,
    userId: number,
    enable: boolean = true
  ): Promise<void> {
    const response = await this.callApi('set_group_admin', {
      group_id: groupId,
      user_id: userId,
      enable
    });
    
    if (response.status !== 'ok') {
      throw new Error(`设置管理员失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 群组匿名设置
   * @param groupId 群号
   * @param enable 是否允许匿名聊天
   */
  async setAnonymous(groupId: number, enable: boolean = true): Promise<void> {
    const response = await this.callApi('set_group_anonymous', {
      group_id: groupId,
      enable
    });
    
    if (response.status !== 'ok') {
      throw new Error(`匿名设置失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 设置群名片
   * @param groupId 群号
   * @param userId QQ 号
   * @param card 群名片内容，空字符串表示删除
   */
  async setCard(groupId: number, userId: number, card: string = ''): Promise<void> {
    const response = await this.callApi('set_group_card', {
      group_id: groupId,
      user_id: userId,
      card
    });
    
    if (response.status !== 'ok') {
      throw new Error(`设置群名片失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 设置群名
   * @param groupId 群号
   * @param groupName 新群名
   */
  async setName(groupId: number, groupName: string): Promise<void> {
    const response = await this.callApi('set_group_name', {
      group_id: groupId,
      group_name: groupName
    });
    
    if (response.status !== 'ok') {
      throw new Error(`设置群名失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 退出群组
   * @param groupId 群号
   * @param isDismiss 是否解散（需要是群主）
   */
  async leave(groupId: number, isDismiss: boolean = false): Promise<void> {
    const response = await this.callApi('set_group_leave', {
      group_id: groupId,
      is_dismiss: isDismiss
    });
    
    if (response.status !== 'ok') {
      throw new Error(`退出群组失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 设置群组专属头衔
   * @param groupId 群号
   * @param userId QQ 号
   * @param specialTitle 专属头衔，空字符串表示删除
   * @param duration 有效期（秒），-1 表示永久
   */
  async setSpecialTitle(
    groupId: number,
    userId: number,
    specialTitle: string = '',
    duration: number = -1
  ): Promise<void> {
    const response = await this.callApi('set_group_special_title', {
      group_id: groupId,
      user_id: userId,
      special_title: specialTitle,
      duration
    });
    
    if (response.status !== 'ok') {
      throw new Error(`设置专属头衔失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 处理加群请求/邀请
   * @param flag 请求 flag
   * @param subType 请求类型（add 或 invite）
   * @param approve 是否同意
   * @param reason 拒绝理由
   */
  async handleAddRequest(
    flag: string,
    subType: 'add' | 'invite',
    approve: boolean = true,
    reason: string = ''
  ): Promise<void> {
    const response = await this.callApi('set_group_add_request', {
      flag,
      sub_type: subType,
      approve,
      reason
    });
    
    if (response.status !== 'ok') {
      throw new Error(`处理加群请求失败: ${response.wording || response.msg}`);
    }
  }

  // ==================== 查询方法 ====================

  /**
   * 获取群成员信息
   * @param groupId 群号
   * @param userId QQ 号
   * @param noCache 是否不使用缓存
   */
  async getMemberInfo(
    groupId: number,
    userId: number,
    noCache: boolean = false
  ): Promise<GroupMemberInfo> {
    const response = await this.callApi<GroupMemberInfo>('get_group_member_info', {
      group_id: groupId,
      user_id: userId,
      no_cache: noCache
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取群成员信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取群成员列表
   * @param groupId 群号
   */
  async getMemberList(groupId: number): Promise<GroupMemberInfo[]> {
    const response = await this.callApi<GroupMemberInfo[]>('get_group_member_list', {
      group_id: groupId
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取群成员列表失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取群荣誉信息
   * @param groupId 群号
   * @param type 荣誉类型
   */
  async getHonorInfo(
    groupId: number,
    type: 'talkative' | 'performer' | 'legend' | 'strong_newbie' | 'emotion' | 'all' = 'all'
  ): Promise<any> {
    const response = await this.callApi('get_group_honor_info', {
      group_id: groupId,
      type
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取群荣誉信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  // ==================== 便捷方法 ====================

  /**
   * 禁言全体成员（除了管理员和群主）
   * @param groupId 群号
   * @param duration 禁言时长
   */
  async banAllMembers(groupId: number, duration: number = 60): Promise<void> {
    const members = await this.getMemberList(groupId);
    
    for (const member of members) {
      if (member.role === 'member') {
        await this.banMember(groupId, member.user_id, duration);
      }
    }
  }

  /**
   * 检查用户是否为管理员
   * @param groupId 群号
   * @param userId QQ 号
   */
  async isAdmin(groupId: number, userId: number): Promise<boolean> {
    try {
      const info = await this.getMemberInfo(groupId, userId);
      return info.role === 'admin' || info.role === 'owner';
    } catch {
      return false;
    }
  }

  /**
   * 检查用户是否为群主
   * @param groupId 群号
   * @param userId QQ 号
   */
  async isOwner(groupId: number, userId: number): Promise<boolean> {
    try {
      const info = await this.getMemberInfo(groupId, userId);
      return info.role === 'owner';
    } catch {
      return false;
    }
  }
}
```

---

## 好友 API 详解

```typescript
import { ConnectionManager } from './connection';
import { ApiResponse, FriendInfo, StrangerInfo } from './types';

/** 好友 API */
export class FriendApi {
  constructor(
    private connection: ConnectionManager,
    private callApi: <T>(action: string, params?: any, timeout?: number) => Promise<ApiResponse<T>>
  ) {}

  /**
   * 处理加好友请求
   * @param flag 请求 flag
   * @param approve 是否同意
   * @param remark 添加后的备注名
   */
  async handleAddRequest(
    flag: string,
    approve: boolean = true,
    remark: string = ''
  ): Promise<void> {
    const response = await this.callApi('set_friend_add_request', {
      flag,
      approve,
      remark
    });
    
    if (response.status !== 'ok') {
      throw new Error(`处理好友请求失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 获取陌生人信息
   * @param userId QQ 号
   * @param noCache 是否不使用缓存
   */
  async getStrangerInfo(
    userId: number,
    noCache: boolean = false
  ): Promise<StrangerInfo> {
    const response = await this.callApi<StrangerInfo>('get_stranger_info', {
      user_id: userId,
      no_cache: noCache
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取陌生人信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取好友列表
   */
  async getFriendList(): Promise<FriendInfo[]> {
    const response = await this.callApi<FriendInfo[]>('get_friend_list');
    
    if (response.status !== 'ok') {
      throw new Error(`获取好友列表失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 检查是否为好友
   * @param userId QQ 号
   */
  async isFriend(userId: number): Promise<boolean> {
    try {
      const friends = await this.getFriendList();
      return friends.some(f => f.user_id === userId);
    } catch {
      return false;
    }
  }
}
```

---

## 信息查询 API 详解

```typescript
import { ConnectionManager } from './connection';
import {
  ApiResponse,
  LoginInfo,
  GroupInfo,
  GroupHonorInfo,
  HonorType
} from './types';

/** 信息查询 API */
export class InfoApi {
  constructor(
    private connection: ConnectionManager,
    private callApi: <T>(action: string, params?: any, timeout?: number) => Promise<ApiResponse<T>>
  ) {}

  /**
   * 获取登录号信息
   */
  async getLoginInfo(): Promise<LoginInfo> {
    const response = await this.callApi<LoginInfo>('get_login_info');
    
    if (response.status !== 'ok') {
      throw new Error(`获取登录信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取群信息
   * @param groupId 群号
   * @param noCache 是否不使用缓存
   */
  async getGroupInfo(groupId: number, noCache: boolean = false): Promise<GroupInfo> {
    const response = await this.callApi<GroupInfo>('get_group_info', {
      group_id: groupId,
      no_cache: noCache
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取群信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取群列表
   */
  async getGroupList(): Promise<GroupInfo[]> {
    const response = await this.callApi<GroupInfo[]>('get_group_list');
    
    if (response.status !== 'ok') {
      throw new Error(`获取群列表失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取群荣誉信息
   * @param groupId 群号
   * @param type 荣誉类型
   */
  async getGroupHonorInfo(
    groupId: number,
    type: HonorType = 'all'
  ): Promise<GroupHonorInfo> {
    const response = await this.callApi<GroupHonorInfo>('get_group_honor_info', {
      group_id: groupId,
      type
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取群荣誉信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }
}
```

---

## 系统 API 详解

```typescript
import { ConnectionManager } from './connection';
import {
  ApiResponse,
  VersionInfo,
  StatusInfo,
  Credentials,
  CanSend,
  FileInfo
} from './types';

/** 系统 API */
export class SystemApi {
  constructor(
    private connection: ConnectionManager,
    private callApi: <T>(action: string, params?: any, timeout?: number) => Promise<ApiResponse<T>>
  ) {}

  /**
   * 获取 Cookies
   * @param domain 域名
   */
  async getCookies(domain: string = ''): Promise<string> {
    const response = await this.callApi<{ cookies: string }>('get_cookies', {
      domain
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取 Cookies 失败: ${response.wording || response.msg}`);
    }
    
    return response.data.cookies;
  }

  /**
   * 获取 CSRF Token
   */
  async getCsrfToken(): Promise<number> {
    const response = await this.callApi<{ token: number }>('get_csrf_token');
    
    if (response.status !== 'ok') {
      throw new Error(`获取 CSRF Token 失败: ${response.wording || response.msg}`);
    }
    
    return response.data.token;
  }

  /**
   * 获取 QQ 相关接口凭证
   * @param domain 域名
   */
  async getCredentials(domain: string = ''): Promise<Credentials> {
    const response = await this.callApi<Credentials>('get_credentials', {
      domain
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取凭证失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取语音
   * @param file 语音文件名
   * @param outFormat 输出格式
   */
  async getRecord(
    file: string,
    outFormat: 'mp3' | 'amr' | 'wma' | 'm4a' | 'spx' | 'ogg' | 'wav' | 'flac' = 'mp3'
  ): Promise<string> {
    const response = await this.callApi<FileInfo>('get_record', {
      file,
      out_format: outFormat
    });
    
    if (response.status !== 'ok') {
      throw new Error(`获取语音失败: ${response.wording || response.msg}`);
    }
    
    return response.data.file;
  }

  /**
   * 获取图片
   * @param file 图片文件名
   */
  async getImage(file: string): Promise<string> {
    const response = await this.callApi<FileInfo>('get_image', { file });
    
    if (response.status !== 'ok') {
      throw new Error(`获取图片失败: ${response.wording || response.msg}`);
    }
    
    return response.data.file;
  }

  /**
   * 检查是否可以发送图片
   */
  async canSendImage(): Promise<boolean> {
    const response = await this.callApi<CanSend>('can_send_image');
    return response.status === 'ok' && response.data.yes;
  }

  /**
   * 检查是否可以发送语音
   */
  async canSendRecord(): Promise<boolean> {
    const response = await this.callApi<CanSend>('can_send_record');
    return response.status === 'ok' && response.data.yes;
  }

  /**
   * 获取运行状态
   */
  async getStatus(): Promise<StatusInfo> {
    const response = await this.callApi<StatusInfo>('get_status');
    
    if (response.status !== 'ok') {
      throw new Error(`获取状态失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 获取版本信息
   */
  async getVersionInfo(): Promise<VersionInfo> {
    const response = await this.callApi<VersionInfo>('get_version_info');
    
    if (response.status !== 'ok') {
      throw new Error(`获取版本信息失败: ${response.wording || response.msg}`);
    }
    
    return response.data;
  }

  /**
   * 重启 OneBot 实现
   * @param delay 延迟毫秒数
   */
  async restart(delay: number = 0): Promise<void> {
    const response = await this.callApi('set_restart', { delay });
    
    if (response.status !== 'async') {
      throw new Error(`重启失败: ${response.wording || response.msg}`);
    }
  }

  /**
   * 清理缓存
   */
  async cleanCache(): Promise<void> {
    const response = await this.callApi('clean_cache');
    
    if (response.status !== 'ok') {
      throw new Error(`清理缓存失败: ${response.wording || response.msg}`);
    }
  }
}
```
```

---

---

## 事件系统详解

### 事件类型定义

```typescript
/** 基础事件 */
export interface BaseEvent {
  time: number;
  self_id: number;
  post_type: 'message' | 'notice' | 'request' | 'meta_event';
}

/** 消息事件 */
export interface MessageEvent extends BaseEvent {
  post_type: 'message';
  message_id: number;
  user_id: number;
  message: Message;
  raw_message: string;
  font: number;
  sender: Sender;
}

/** 私聊消息事件 */
export interface PrivateMessageEvent extends MessageEvent {
  message_type: 'private';
  sub_type: 'friend' | 'group' | 'other';
}

/** 群消息事件 */
export interface GroupMessageEvent extends MessageEvent {
  message_type: 'group';
  sub_type: 'normal' | 'anonymous' | 'notice';
  group_id: number;
  anonymous: Anonymous | null;
}

/** 通知事件 */
export interface NoticeEvent extends BaseEvent {
  post_type: 'notice';
  notice_type: string;
}

/** 群文件上传 */
export interface GroupUploadNotice extends NoticeEvent {
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

/** 群管理员变动 */
export interface GroupAdminNotice extends NoticeEvent {
  notice_type: 'group_admin';
  sub_type: 'set' | 'unset';
  group_id: number;
  user_id: number;
}

/** 群成员减少 */
export interface GroupDecreaseNotice extends NoticeEvent {
  notice_type: 'group_decrease';
  sub_type: 'leave' | 'kick' | 'kick_me';
  group_id: number;
  operator_id: number;
  user_id: number;
}

/** 群成员增加 */
export interface GroupIncreaseNotice extends NoticeEvent {
  notice_type: 'group_increase';
  sub_type: 'approve' | 'invite';
  group_id: number;
  operator_id: number;
  user_id: number;
}

/** 群禁言 */
export interface GroupBanNotice extends NoticeEvent {
  notice_type: 'group_ban';
  sub_type: 'ban' | 'lift_ban';
  group_id: number;
  operator_id: number;
  user_id: number;
  duration: number;
}

/** 好友添加 */
export interface FriendAddNotice extends NoticeEvent {
  notice_type: 'friend_add';
  user_id: number;
}

/** 消息撤回 */
export interface GroupRecallNotice extends NoticeEvent {
  notice_type: 'group_recall';
  group_id: number;
  user_id: number;
  operator_id: number;
  message_id: number;
}

export interface FriendRecallNotice extends NoticeEvent {
  notice_type: 'friend_recall';
  user_id: number;
  message_id: number;
}

/** 群内戳一戳 */
export interface GroupPokeNotice extends NoticeEvent {
  notice_type: 'notify';
  sub_type: 'poke';
  group_id: number;
  user_id: number;
  target_id: number;
}

/** 请求事件 */
export interface RequestEvent extends BaseEvent {
  post_type: 'request';
  request_type: 'friend' | 'group';
}

/** 好友请求 */
export interface FriendRequestEvent extends RequestEvent {
  request_type: 'friend';
  user_id: number;
  comment: string;
  flag: string;
}

/** 群请求 */
export interface GroupRequestEvent extends RequestEvent {
  request_type: 'group';
  sub_type: 'add' | 'invite';
  group_id: number;
  user_id: number;
  comment: string;
  flag: string;
}

/** 元事件 */
export interface MetaEvent extends BaseEvent {
  post_type: 'meta_event';
  meta_event_type: 'lifecycle' | 'heartbeat';
}

/** 生命周期 */
export interface LifecycleMetaEvent extends MetaEvent {
  meta_event_type: 'lifecycle';
  sub_type: 'enable' | 'disable' | 'connect';
}

/** 心跳 */
export interface HeartbeatMetaEvent extends MetaEvent {
  meta_event_type: 'heartbeat';
  status: StatusInfo;
  interval: number;
}

/** 所有事件类型 */
export type AllEvents =
  | PrivateMessageEvent
  | GroupMessageEvent
  | GroupUploadNotice
  | GroupAdminNotice
  | GroupDecreaseNotice
  | GroupIncreaseNotice
  | GroupBanNotice
  | FriendAddNotice
  | GroupRecallNotice
  | FriendRecallNotice
  | GroupPokeNotice
  | FriendRequestEvent
  | GroupRequestEvent
  | LifecycleMetaEvent
  | HeartbeatMetaEvent;
```

### 事件处理器

```typescript
import { EventEmitter } from 'events';
import { ConnectionManager } from './connection';
import { AllEvents, PrivateMessageEvent, GroupMessageEvent } from './types';

/** 事件处理器 */
export class EventHandler extends EventEmitter {
  constructor(private connection: ConnectionManager) {
    super();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.connection.on('message', (data: any) => {
      if (data.post_type) {
        this.handleEvent(data as AllEvents);
      }
    });
  }

  private handleEvent(event: AllEvents): void {
    // 发射通用事件
    this.emit('event', event);
    this.emit(event.post_type, event);

    // 根据事件类型发射具体事件
    switch (event.post_type) {
      case 'message':
        this.handleMessageEvent(event as PrivateMessageEvent | GroupMessageEvent);
        break;
      case 'notice':
        this.handleNoticeEvent(event);
        break;
      case 'request':
        this.handleRequestEvent(event);
        break;
      case 'meta_event':
        this.handleMetaEvent(event);
        break;
    }
  }

  private handleMessageEvent(event: PrivateMessageEvent | GroupMessageEvent): void {
    this.emit('message', event);

    if (event.message_type === 'private') {
      this.emit('private.message', event);
      this.emit(`private.${event.sub_type}`, event);
    } else {
      this.emit('group.message', event);
      this.emit(`group.${event.sub_type}`, event);
    }
  }

  private handleNoticeEvent(event: any): void {
    this.emit('notice', event);
    this.emit(`notice.${event.notice_type}`, event);

    if (event.sub_type) {
      this.emit(`notice.${event.notice_type}.${event.sub_type}`, event);
    }
  }

  private handleRequestEvent(event: any): void {
    this.emit('request', event);
    this.emit(`request.${event.request_type}`, event);

    if (event.sub_type) {
      this.emit(`request.${event.request_type}.${event.sub_type}`, event);
    }
  }

  private handleMetaEvent(event: any): void {
    this.emit('meta', event);
    this.emit(`meta.${event.meta_event_type}`, event);
  }
}
```

---

## 消息段构造器

```typescript
import { MessageSegment } from './types';

/** 消息段构造器 */
export class MessageBuilder {
  private segments: MessageSegment[] = [];

  /** 添加纯文本 */
  text(content: string): this {
    this.segments.push({
      type: 'text',
      data: { text: content }
    });
    return this;
  }

  /** 添加表情 */
  face(id: number): this {
    this.segments.push({
      type: 'face',
      data: { id: String(id) }
    });
    return this;
  }

  /** 添加图片 */
  image(file: string, options?: {
    type?: 'flash';
    cache?: boolean;
    proxy?: boolean;
    timeout?: number;
  }): this {
    const data: Record<string, string> = { file };
    if (options?.type) data.type = options.type;
    if (options?.cache !== undefined) data.cache = String(options.cache);
    if (options?.proxy !== undefined) data.proxy = String(options.proxy);
    if (options?.timeout) data.timeout = String(options.timeout);

    this.segments.push({ type: 'image', data });
    return this;
  }

  /** 添加语音 */
  record(file: string, magic: boolean = false): this {
    this.segments.push({
      type: 'record',
      data: {
        file,
        magic: String(magic)
      }
    });
    return this;
  }

  /** 添加视频 */
  video(file: string): this {
    this.segments.push({
      type: 'video',
      data: { file }
    });
    return this;
  }

  /** @某人 */
  at(qq: number | 'all'): this {
    this.segments.push({
      type: 'at',
      data: { qq: String(qq) }
    });
    return this;
  }

  /** 回复消息 */
  reply(messageId: number): this {
    this.segments.push({
      type: 'reply',
      data: { id: String(messageId) }
    });
    return this;
  }

  /** 猜拳 */
  rps(): this {
    this.segments.push({ type: 'rps', data: {} });
    return this;
  }

  /** 掷骰子 */
  dice(): this {
    this.segments.push({ type: 'dice', data: {} });
    return this;
  }

  /** 戳一戳 */
  poke(qq: number): this {
    this.segments.push({
      type: 'poke',
      data: { qq: String(qq) }
    });
    return this;
  }

  /** 分享链接 */
  share(url: string, title: string, options?: {
    content?: string;
    image?: string;
  }): this {
    const data: Record<string, string> = { url, title };
    if (options?.content) data.content = options.content;
    if (options?.image) data.image = options.image;

    this.segments.push({ type: 'share', data });
    return this;
  }

  /** 音乐分享 */
  music(type: 'qq' | '163' | 'xm', id: string): this;
  music(type: 'custom', data: {
    url: string;
    audio: string;
    title: string;
    content?: string;
    image?: string;
  }): this;
  music(type: string, idOrData: string | object): this {
    if (type === 'custom' && typeof idOrData === 'object') {
      this.segments.push({
        type: 'music',
        data: { type: 'custom', ...idOrData }
      });
    } else {
      this.segments.push({
        type: 'music',
        data: { type, id: idOrData as string }
      });
    }
    return this;
  }

  /** 换行 */
  newline(): this {
    return this.text('\n');
  }

  /** 添加空格 */
  space(count: number = 1): this {
    return this.text(' '.repeat(count));
  }

  /** 获取构建的消息 */
  build(): MessageSegment[] {
    return [...this.segments];
  }

  /** 清空 */
  clear(): this {
    this.segments = [];
    return this;
  }

  /** 静态工厂方法 */
  static create(): MessageBuilder {
    return new MessageBuilder();
  }

  /** 快速创建文本消息 */
  static text(content: string): MessageSegment[] {
    return [{ type: 'text', data: { text: content } }];
  }

  /** 快速创建图片消息 */
  static image(file: string): MessageSegment[] {
    return [{ type: 'image', data: { file } }];
  }

  /** 快速创建 @ 消息 */
  static at(qq: number | 'all', text?: string): MessageSegment[] {
    const builder = new MessageBuilder().at(qq);
    if (text) builder.text(text);
    return builder.build();
  }
}

/** 便捷函数 */
export const msg = MessageBuilder.create;
```

---

## 完整机器人框架

```typescript
import { EventEmitter } from 'events';
import { ConnectionManager, ConnectionState } from './connection';
import { MessageApi } from './api/message';
import { GroupApi } from './api/group';
import { FriendApi } from './api/friend';
import { InfoApi } from './api/info';
import { SystemApi } from './api/system';
import { EventHandler } from './event';
import { MessageBuilder } from './message-builder';
import {
  OneBotConfig,
  ApiRequest,
  ApiResponse,
  AllEvents,
  PrivateMessageEvent,
  GroupMessageEvent,
  Message
} from './types';

/** OneBot 客户端 */
export class OneBotClient extends EventEmitter {
  private connection: ConnectionManager;
  private eventHandler: EventHandler;
  private requestMap: Map<string, { resolve: Function; reject: Function; timer: NodeJS.Timeout }> = new Map();
  private requestId = 0;

  // API 模块
  public readonly message: MessageApi;
  public readonly group: GroupApi;
  public readonly friend: FriendApi;
  public readonly info: InfoApi;
  public readonly system: SystemApi;

  constructor(private config: OneBotConfig) {
    super();

    // 初始化连接管理器
    this.connection = new ConnectionManager(config);
    this.setupConnectionListeners();

    // 初始化事件处理器
    this.eventHandler = new EventHandler(this.connection);
    this.setupEventListeners();

    // 初始化 API 模块
    this.message = new MessageApi(this.connection, this.callApi.bind(this));
    this.group = new GroupApi(this.connection, this.callApi.bind(this));
    this.friend = new FriendApi(this.connection, this.callApi.bind(this));
    this.info = new InfoApi(this.connection, this.callApi.bind(this));
    this.system = new SystemApi(this.connection, this.callApi.bind(this));
  }

  /** 获取连接状态 */
  get state(): ConnectionState {
    return this.connection.getState();
  }

  /** 是否已连接 */
  get isConnected(): boolean {
    return this.connection.isConnected();
  }

  /** 连接到 OneBot */
  connect(): void {
    this.connection.connect();
  }

  /** 断开连接 */
  disconnect(): void {
    this.connection.disconnect();
    this.clearPendingRequests();
  }

  /** 重新连接 */
  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  /** 创建消息构建器 */
  builder(): MessageBuilder {
    return MessageBuilder.create();
  }

  /** 通用 API 调用 */
  async callApi<T = any>(action: string, params?: any, timeout?: number): Promise<ApiResponse<T>> {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const echo = `${action}_${++this.requestId}_${Date.now()}`;
    const request: ApiRequest = { action, params, echo };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requestMap.delete(echo);
        reject(new Error(`Request timeout: ${action}`));
      }, timeout || this.config.requestTimeout || 30000);

      this.requestMap.set(echo, { resolve, reject, timer });
      this.connection.send(request);
    });
  }

  /** 快速发送私聊消息 */
  async sendPrivateMsg(userId: number, message: Message): Promise<number> {
    return this.message.sendPrivateMsg(userId, message);
  }

  /** 快速发送群消息 */
  async sendGroupMsg(groupId: number, message: Message): Promise<number> {
    return this.message.sendGroupMsg(groupId, message);
  }

  /** 回复消息 */
  async reply(event: PrivateMessageEvent | GroupMessageEvent, message: Message, atSender: boolean = false): Promise<number> {
    if (event.message_type === 'private') {
      return this.sendPrivateMsg(event.user_id, message);
    } else {
      return this.sendGroupMsg(event.group_id, atSender
        ? this.builder().at(event.user_id).text(' ').build().concat(
            Array.isArray(message) ? message : [{ type: 'text', data: { text: message } }]
          )
        : message
      );
    }
  }

  /** 监听事件 */
  onEvent<T extends AllEvents>(event: string, listener: (event: T) => void): this {
    this.eventHandler.on(event, listener);
    return this;
  }

  /** 监听消息 */
  onMessage(listener: (event: PrivateMessageEvent | GroupMessageEvent) => void): this {
    return this.onEvent('message', listener);
  }

  /** 监听私聊消息 */
  onPrivateMessage(listener: (event: PrivateMessageEvent) => void): this {
    return this.onEvent('private.message', listener);
  }

  /** 监听群消息 */
  onGroupMessage(listener: (event: GroupMessageEvent) => void): this {
    return this.onEvent('group.message', listener);
  }

  /** 设置连接监听器 */
  private setupConnectionListeners(): void {
    this.connection.on('connect', () => {
      this.emit('connect');
    });

    this.connection.on('disconnect', (code, reason) => {
      this.clearPendingRequests();
      this.emit('disconnect', code, reason);
    });

    this.connection.on('error', (error) => {
      this.emit('error', error);
    });

    this.connection.on('message', (data) => {
      this.handleResponse(data);
    });
  }

  /** 设置事件监听器 */
  private setupEventListeners(): void {
    this.eventHandler.on('event', (event) => {
      this.emit('event', event);
    });
  }

  /** 处理 API 响应 */
  private handleResponse(data: any): void {
    if (data.echo && this.requestMap.has(String(data.echo))) {
      const { resolve, timer } = this.requestMap.get(String(data.echo))!;
      clearTimeout(timer);
      this.requestMap.delete(String(data.echo));
      resolve(data);
    }
  }

  /** 清除待处理的请求 */
  private clearPendingRequests(): void {
    for (const { reject, timer } of this.requestMap.values()) {
      clearTimeout(timer);
      reject(new Error('Connection closed'));
    }
    this.requestMap.clear();
  }
}

export default OneBotClient;
```

---

## 常见场景示例

### 1. 基础机器人

```typescript
import { OneBotClient } from './onebot-client';

const bot = new OneBotClient({
  url: 'ws://127.0.0.1:3001',
  accessToken: 'your_token'
});

// 连接成功
bot.on('connect', () => {
  console.log('Bot 已连接!');
});

// 监听所有消息
bot.onMessage(async (event) => {
  console.log(`收到消息: ${event.raw_message}`);
});

// 监听私聊消息
bot.onPrivateMessage(async (event) => {
  if (event.raw_message === '你好') {
    await bot.reply(event, '你好！有什么可以帮助你的吗？');
  }
});

// 监听群消息
bot.onGroupMessage(async (event) => {
  if (event.raw_message === '测试') {
    await bot.reply(event, '测试成功！', true); // true = @发送者
  }
});

bot.connect();
```

### 2. 复读机机器人

```typescript
bot.onGroupMessage(async (event) => {
  // 忽略自己的消息
  if (event.sender.user_id === bot.info.self_id) return;

  // 复读
  await bot.reply(event, event.message);
});
```

### 3. 群管机器人

```typescript
bot.onGroupMessage(async (event) => {
  const { group_id, user_id, raw_message } = event;

  // 禁言命令
  if (raw_message.startsWith('禁言 ')) {
    // 检查权限
    const isAdmin = await bot.group.isAdmin(group_id, user_id);
    if (!isAdmin) {
      await bot.reply(event, '你没有权限使用此命令');
      return;
    }

    const targetId = parseInt(raw_message.split(' ')[1]);
    const duration = parseInt(raw_message.split(' ')[2]) || 10;

    await bot.group.banMember(group_id, targetId, duration * 60);
    await bot.reply(event, `已禁言 ${targetId} ${duration} 分钟`);
  }

  // 踢人命令
  if (raw_message.startsWith('踢出 ')) {
    const isOwner = await bot.group.isOwner(group_id, user_id);
    if (!isOwner) {
      await bot.reply(event, '只有群主可以使用此命令');
      return;
    }

    const targetId = parseInt(raw_message.split(' ')[1]);
    await bot.group.kickMember(group_id, targetId);
    await bot.reply(event, `已将 ${targetId} 移出群聊`);
  }
});
```

### 4. 欢迎新成员

```typescript
bot.onEvent('notice.group_increase', async (event) => {
  const { group_id, user_id } = event;

  await bot.sendGroupMsg(group_id, [
    { type: 'at', data: { qq: String(user_id) } },
    { type: 'text', data: { text: ' 欢迎加入本群！请遵守群规~' } }
  ]);
});
```

### 5. 关键词回复

```typescript
const keywords = new Map([
  ['帮助', '可用命令：\n1. 天气 - 查询天气\n2. 时间 - 查询时间'],
  ['时间', () => `当前时间：${new Date().toLocaleString()}`],
]);

bot.onMessage(async (event) => {
  const text = event.raw_message;
  const response = keywords.get(text);

  if (response) {
    const message = typeof response === 'function' ? response() : response;
    await bot.reply(event, message);
  }
});
```

### 6. 图片发送

```typescript
bot.onPrivateMessage(async (event) => {
  if (event.raw_message === '图片') {
    // 发送网络图片
    await bot.sendPrivateMsg(event.user_id, [
      { type: 'text', data: { text: '这是网络图片：' } },
      { type: 'image', data: { file: 'https://example.com/image.jpg' } }
    ]);

    // 或使用消息构建器
    const msg = bot.builder()
      .text('这是本地图片：')
      .image('file:///C:/path/to/image.png')
      .build();

    await bot.sendPrivateMsg(event.user_id, msg);
  }
});
```

---

## 错误处理与重试

```typescript
import { OneBotClient } from './onebot-client';

class RobustBot {
  private bot: OneBotClient;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(config: any) {
    this.bot = new OneBotClient(config);
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    this.bot.on('disconnect', () => {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Reconnecting... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.bot.connect(), 5000);
      } else {
        console.error('Max retries reached');
      }
    });

    this.bot.on('connect', () => {
      this.retryCount = 0;
    });
  }

  async safeSend(groupId: number, message: any): Promise<void> {
    try {
      await this.bot.sendGroupMsg(groupId, message);
    } catch (error) {
      console.error('Send failed:', error);
      // 可以在这里实现重试逻辑
    }
  }
}
```

---

## 性能优化

```typescript
/** 消息队列 */
class MessageQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private interval: number;

  constructor(interval: number = 1000) {
    this.interval = interval;
  }

  add(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.running) {
      this.process();
    }
  }

  private async process(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Task failed:', error);
        }
        await this.delay(this.interval);
      }
    }
    this.running = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用
const queue = new MessageQueue(500); // 500ms 间隔

bot.onGroupMessage((event) => {
  queue.add(async () => {
    await bot.reply(event, '处理完成');
  });
});
```

---

## 附录：返回码说明

| retcode | 说明 |
|---------|------|
| 0 | 成功 |
| 1400 | 请求参数错误 |
| 1401 | 鉴权失败 |
| 1403 | 权限不足 |
| 1404 | API 不存在 |

---

*文档基于 OneBot 11 标准编写*