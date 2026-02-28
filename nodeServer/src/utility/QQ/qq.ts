import WebSocket from 'ws';
import { readIni } from '../file_operation/read_ini';
import { get_busy, sendUserMessage } from '../../component/process/main_virtual';
import fs from 'fs';
import path from 'path';

interface FriendInfo {
    name: string;
    qq_num: string;
}

interface WaitQueueItem {
    qq_num: string;
    qq_name: string;
    text: string;
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
                handleEvent(event);
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

function handleEvent(event: any): void {
    if (event.post_type === 'message' && event.message_type === 'private') {
        const qq_num = String(event.user_id);
        const qq_name = event.sender?.nickname || qq_num;
        const message = event.raw_message || '';
        
        if (event.message && Array.isArray(event.message)) {
            const hasText = event.message.some((seg: any) => seg.type === 'text');
            if (!hasText) {
                return;
            }
        }
        
        QQtrackTextExecute(qq_num, qq_name, message);
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

export function QQtrackTextExecute(qq_num: string, qq_name: string, qq_text: string): string {
    const busy = get_busy();
    
    if (busy) {
        wait_queue.push({ qq_num, qq_name, text: qq_text });
        return "SUCCESS:消息已加入等待队列";
    } else {
        const message = `QQ联系人:${qq_name}(${qq_num})发来了消息:${qq_text}`;
        sendUserMessage(message, 'system').catch((error) => {
            console.error('发送消息到main_virtual失败:', error);
        });
        return "SUCCESS:消息已发送";
    }
}

export function QQidleSignal(): string {
    const busy = get_busy();
    
    if (busy) {
        console.log('QQidleSignal: busy状态为true，这是错误的');
        return "ERROR:错误的busy状态";
    }
    
    if (wait_queue.length === 0) {
        return "SUCCESS:等待队列为空";
    }
    
    const messageParts: string[] = [];
    
    for (const item of wait_queue) {
        messageParts.push(`QQ联系人:${item.qq_name}(${item.qq_num})发送了消息:"${item.text}"`);
    }
    
    const combinedMessage = messageParts.join('\n');
    wait_queue = [];
    
    sendUserMessage(combinedMessage, 'system').catch((error) => {
        console.error('QQidleSignal发送消息失败:', error);
    });
    
    return "SUCCESS:等待队列已处理";
}
