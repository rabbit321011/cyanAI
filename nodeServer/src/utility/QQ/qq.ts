import WebSocket from 'ws';
import { readIni } from '../file_operation/read_ini';
import { get_busy, addQueueMessage, sendAll } from '../../component/process/main_virtual';
import { isCommandMessage, runCommand } from '../../component/route/command';
import { inlineData } from '../../types/process/process.type';
import { verifyQqKey, deductKeyQuota } from '../key_system/key_manager';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface FriendInfo {
    name: string;
    qq_num: string;
}

interface MessagePart {
    type: 'text' | 'image';
    content: string;  // 文本内容或图片占位符
    inline?: inlineData;  // 只有 type 为 'image' 时存在
}

interface WaitQueueItem {
    qq_num: string;
    qq_name: string;
    parts: MessagePart[];  // 保持原始顺序的消息部分
}

let apiWs: WebSocket | null = null;
let eventWs: WebSocket | null = null;
let isConnected: boolean = false;
let reconnectAttempts: number = 0;
const maxReconnectAttempts: number = 3;

let wait_queue: WaitQueueItem[] = [];

let pendingRequests: Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map();
let requestId: number = 0;

function getWsPath(): string {
    return readIni(path.join(__dirname, '../../../library_source.ini'), 'QQ_wsPath');
}

export function getNapcatConnectionStatus(): { api: boolean; event: boolean; connected: boolean } {
    return {
        api: apiWs !== null && apiWs.readyState === WebSocket.OPEN,
        event: eventWs !== null && eventWs.readyState === WebSocket.OPEN,
        connected: isConnected
    };
}

function connectApi(): Promise<string> {
    return new Promise((resolve) => {
        const wsPath = getWsPath();
        apiWs = new WebSocket(`${wsPath}/api`);
        
        apiWs.on('open', () => {
            console.log('QQ API WebSocket 已连接');
            reconnectAttempts = 0;
            resolve('SUCCESS:API连接成功');
        });
        
        apiWs.on('message', (data: WebSocket.RawData) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.echo !== undefined && pendingRequests.has(response.echo)) {
                    const pending = pendingRequests.get(response.echo);
                    pendingRequests.delete(response.echo);
                    if (pending) {
                        pending.resolve(response);
                    }
                }
            } catch (error) {
                console.error('解析API响应失败:', error);
            }
        });
        
        apiWs.on('error', (error: Error) => {
            console.error('QQ API WebSocket 错误:', error);
        });
        
        apiWs.on('close', () => {
            console.log('QQ API WebSocket 已断开');
            apiWs = null;
        });
    });
}

function connectEvent(): Promise<string> {
    return new Promise((resolve) => {
        const wsPath = getWsPath();
        eventWs = new WebSocket(`${wsPath}/event`);
        
        eventWs.on('open', () => {
            console.log('QQ Event WebSocket 已连接');
            reconnectAttempts = 0;
            resolve('SUCCESS:Event连接成功');
        });
        
        eventWs.on('message', (data: WebSocket.RawData) => {
            try {
                const event = JSON.parse(data.toString());
                handleEvent(event).catch((error) => {
                    console.error('处理事件失败:', error);
                });
            } catch (error) {
                console.error('解析事件失败:', error);
            }
        });
        
        eventWs.on('error', (error: Error) => {
            console.error('QQ Event WebSocket 错误:', error);
        });
        
        eventWs.on('close', () => {
            console.log('QQ Event WebSocket 已断开');
            eventWs = null;
        });
    });
}

async function handleEvent(event: any): Promise<void> {
    if (event.post_type === 'message' && event.message_type === 'private') {
        const qq_num = String(event.user_id);
        const qq_name = event.sender?.nickname || qq_num;
        
        const parts: MessagePart[] = [];
        
        if (event.message && Array.isArray(event.message)) {
            for (const seg of event.message) {
                if (seg.type === 'text') {
                    const text = seg.data?.text || '';
                    if (text) {
                        parts.push({
                            type: 'text',
                            content: text
                        });
                    }
                } else if (seg.type === 'image') {
                    const imageUrl = seg.data?.url;
                    if (imageUrl) {
                        try {
                            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                            
                            // 检查图片大小（限制 5MB）
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            if (response.data.length > maxSize) {
                                console.error('图片太大:', response.data.length, 'bytes');
                                parts.push({
                                    type: 'text',
                                    content: '[图片太大，无法处理]'
                                });
                                continue;
                            }
                            
                            const base64 = Buffer.from(response.data, 'binary').toString('base64');
                            
                            // 检测 MIME 类型
                            let mimeType = 'image/jpeg';
                            const magic = Buffer.from(response.data.slice(0, 4));
                            if (magic[0] === 0x89 && magic[1] === 0x50) {
                                mimeType = 'image/png';
                            } else if (magic[0] === 0x47 && magic[1] === 0x49) {
                                mimeType = 'image/gif';
                            } else if (magic[0] === 0x52 && magic[1] === 0x49) {
                                mimeType = 'image/webp';
                            }
                            
                            parts.push({
                                type: 'image',
                                content: '[图片]',
                                inline: {
                                    mimeType: mimeType,
                                    data: base64
                                }
                            });
                        } catch (error) {
                            console.error('下载图片失败:', error);
                            parts.push({
                                type: 'text',
                                content: '[图片下载失败]'
                            });
                        }
                    }
                }
            }
        }
        
        if (parts.length > 0) {
            await QQtrackTextExecute(qq_num, qq_name, parts);
        }
    }
}

async function sendApiRequest(action: string, params: any): Promise<any> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return { status: 'failed', retcode: -1, data: null };
    }
    
    return new Promise((resolve) => {
        const id = ++requestId;
        pendingRequests.set(id, { resolve, reject: resolve });
        
        const request = {
            action: action,
            params: params,
            echo: id
        };
        
        apiWs!.send(JSON.stringify(request));
        
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                resolve({ status: 'failed', retcode: -2, data: null });
            }
        }, 10000);
    });
}

export async function QQsendMessage(qq_num: string, text: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: text
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:消息发送成功";
        } else {
            return `ERROR:消息发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送消息时发生错误:${error.message}`;
    }
}

export async function QQgetFriend(): Promise<FriendInfo[] | string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    try {
        const response = await sendApiRequest('get_friend_list', {});
        
        if (response.status === 'ok' && Array.isArray(response.data)) {
            const friends: FriendInfo[] = response.data.map((friend: any) => ({
                name: friend.nickname || friend.remark || '',
                qq_num: String(friend.user_id)
            }));
            return friends;
        } else {
            return `ERROR:获取好友列表失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:获取好友列表时发生错误:${error.message}`;
    }
}

export async function QQsendImg(qq_num: string, file_path: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    if (!fs.existsSync(file_path)) {
        return `ERROR:文件不存在:${file_path}`;
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'image', data: { file: `file:///${file_path.replace(/\\/g, '/')}` } }
            ]
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:图片发送成功";
        } else {
            return `ERROR:图片发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送图片时发生错误:${error.message}`;
    }
}

export async function QQsendAudio(qq_num: string, file_path: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    if (!fs.existsSync(file_path)) {
        return `ERROR:文件不存在:${file_path}`;
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'record', data: { file: `file:///${file_path.replace(/\\/g, '/')}` } }
            ]
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:语音发送成功";
        } else {
            return `ERROR:语音发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送语音时发生错误:${error.message}`;
    }
}

export async function QQtrackRestart(): Promise<string> {
    reconnectAttempts = 0;
    
    const attemptReconnect = async (): Promise<string> => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('QQ WebSocket 重连失败，已达最大重试次数');
            return "ERROR:重连失败，已达最大重试次数";
        }
        
        reconnectAttempts++;
        console.log(`QQ WebSocket 尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
        
        try {
            const apiResult = await connectApi();
            const eventResult = await connectEvent();
            
            if (apiResult.startsWith('SUCCESS') && eventResult.startsWith('SUCCESS')) {
                isConnected = true;
                return "SUCCESS:重启监听服务成功";
            } else {
                return await attemptReconnect();
            }
        } catch (error: any) {
            console.error('QQ WebSocket 重连错误:', error);
            return await attemptReconnect();
        }
    };
    
    return await attemptReconnect();
}

/**
 * 发送提示消息让用户绑定KEY
 */
async function sendKeyPrompt(qq_num: string): Promise<void> {
    const promptText = `你需要输入KEY来使用 cyanAI\n\n使用方法：\n1. 联系管理员获取KEY\n2. 发送 "^command bindkey 你的KEY" 绑定\n\n查询KEY信息发送 "^command checkkey 你的KEY"`;
    await QQsendMessage(qq_num, promptText);
}

export async function QQtrackTextExecute(qq_num: string, qq_name: string, parts: MessagePart[]): Promise<string> {
    // 构建消息文本，保持原始顺序
    let messageText = '';
    const inlines: inlineData[] = [];

    for (const part of parts) {
        if (part.type === 'text') {
            messageText += part.content;
        } else if (part.type === 'image' && part.inline) {
            messageText += part.content;
            inlines.push(part.inline);
        }
    }

    // 检查是否为命令消息，命令不需要KEY验证
    const isCommand = isCommandMessage(messageText, qq_num);

    // 非命令消息需要验证KEY并扣除额度
    if (!isCommand) {
        const verifyResult = verifyQqKey(qq_num);
        if (!verifyResult.valid) {
            // KEY验证失败，发送提示并拒绝处理
            await sendKeyPrompt(qq_num);
            return `SUCCESS:KEY验证失败，已发送提示 - ${verifyResult.error}`;
        }

        // 扣除KEY额度
        if (verifyResult.key) {
            const deductResult = deductKeyQuota(verifyResult.key.key);
            if (!deductResult.success) {
                await QQsendMessage(qq_num, `KEY额度扣除失败: ${deductResult.error}`);
                return `SUCCESS:KEY额度扣除失败 - ${deductResult.error}`;
            }
        }
    }

    const busy = get_busy();

    if (busy) {
        wait_queue.push({ qq_num, qq_name, parts });
        return "SUCCESS:消息已加入等待队列";
    } else {
        // 检查原始文本是否包含命令
        if (isCommand) {
            // 命令消息，传递QQ号以便执行需要QQ号的操作
            const commandResult = runCommand(messageText, qq_num, inlines, qq_name);
            if (commandResult.stop) {
                // 如果 stop 为 true，根据返回内容决定是否发送回复
                const responseText = commandResult.datas;
                if (responseText && !responseText.includes('事件已结束')) {
                    await QQsendMessage(qq_num, responseText);
                }
                return "SUCCESS:消息被命令拦截";
            }
            // 使用处理后的数据继续处理
            messageText = commandResult.datas;
        }
        
        let message: string;
        if (messageText && inlines.length > 0) {
            // 文本 + 图片
            message = `QQ联系人:${qq_name}(${qq_num})发来了消息:${messageText}`;
        } else if (messageText) {
            // 纯文本
            message = `QQ联系人:${qq_name}(${qq_num})发来了消息:${messageText}`;
        } else if (inlines.length > 0) {
            // 纯图片
            message = `QQ联系人:${qq_name}(${qq_num})发来了图片`;
        } else {
            // 空消息（不应该发生）
            message = `QQ联系人:${qq_name}(${qq_num})发来了空消息`;
        }
        
        addQueueMessage(message, 'system', [], inlines);
        sendAll().catch((error: any) => {
            console.error('发送消息到main_virtual失败:', error);
        });
        return "SUCCESS:消息已发送";
    }
}

export async function QQidleSignal(): Promise<string> {
    const busy = get_busy();

    if (busy) {
        console.log('QQidleSignal: busy状态为true，这是错误的');
        return "ERROR:错误的busy状态";
    }

    if (wait_queue.length === 0) {
        return "SUCCESS:等待队列为空";
    }

    for (const item of wait_queue) {
        // 构建消息文本，保持原始顺序
        let messageText = '';
        const inlines: inlineData[] = [];

        for (const part of item.parts) {
            if (part.type === 'text') {
                messageText += part.content;
            } else if (part.type === 'image' && part.inline) {
                messageText += part.content;
                inlines.push(part.inline);
            }
        }

        // 检查是否为命令消息
        const isCommand = isCommandMessage(messageText, item.qq_num);

        // 非命令消息需要验证KEY
        if (!isCommand) {
            const verifyResult = verifyQqKey(item.qq_num);
            if (!verifyResult.valid) {
                // KEY验证失败，发送提示并跳过
                await sendKeyPrompt(item.qq_num);
                console.log(`[KEY验证] QQ ${item.qq_num} 验证失败: ${verifyResult.error}`);
                continue;
            }
        }

        // 检查原始文本是否包含命令
        if (isCommand) {
            // 命令消息，传递QQ号
            const commandResult = runCommand(messageText, item.qq_num, inlines, item.qq_name);
            if (commandResult.stop) {
                // 如果 stop 为 true，根据返回内容决定是否发送回复
                const responseText = commandResult.datas;
                if (responseText && !responseText.includes('事件已结束')) {
                    await QQsendMessage(item.qq_num, responseText);
                }
                continue;
            }
            // 使用处理后的数据继续处理
            messageText = commandResult.datas;
        }
        
        let message: string;
        if (messageText && inlines.length > 0) {
            // 文本 + 图片
            message = `QQ联系人:${item.qq_name}(${item.qq_num})发送了消息:"${messageText}"`;
        } else if (messageText) {
            // 纯文本
            message = `QQ联系人:${item.qq_name}(${item.qq_num})发送了消息:"${messageText}"`;
        } else if (inlines.length > 0) {
            // 纯图片
            message = `QQ联系人:${item.qq_name}(${item.qq_num})发送了图片`;
        } else {
            // 空消息（不应该发生）
            message = `QQ联系人:${item.qq_name}(${item.qq_num})发送了空消息`;
        }
        
        addQueueMessage(message, 'system', [], inlines);
    }
    
    wait_queue = [];
    
    sendAll().catch((error: any) => {
        console.error('QQidleSignal发送消息失败:', error);
    });
    
    return "SUCCESS:等待队列已处理";
}

export interface StagedMessage {
    text: string;
    inlines: inlineData[];
}

export async function sendStagedMessages(qqNum: string, qqName: string, messages: StagedMessage[]): Promise<string> {
    if (messages.length === 0) {
        return "SUCCESS:暂存区为空";
    }

    const busy = get_busy();

    if (busy) {
        for (const msg of messages) {
            const parts: MessagePart[] = [];
            if (msg.text) {
                parts.push({ type: 'text', content: msg.text });
            }
            for (const inline of msg.inlines) {
                parts.push({ type: 'image', content: '[图片]', inline });
            }
            wait_queue.push({ qq_num: qqNum, qq_name: qqName, parts });
        }
        return "SUCCESS:消息已加入等待队列";
    } else {
        for (const msg of messages) {
            let message: string;
            if (msg.text && msg.inlines.length > 0) {
                message = `QQ联系人:${qqName}(${qqNum})发来了消息:${msg.text}`;
            } else if (msg.text) {
                message = `QQ联系人:${qqName}(${qqNum})发来了消息:${msg.text}`;
            } else if (msg.inlines.length > 0) {
                message = `QQ联系人:${qqName}(${qqNum})发来了图片`;
            } else {
                continue;
            }
            addQueueMessage(message, 'system', [], msg.inlines);
        }
        sendAll().catch((error: any) => {
            console.error('sendStagedMessages发送消息失败:', error);
        });
        return "SUCCESS:暂存消息已发送";
    }
}
